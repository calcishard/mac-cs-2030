"use client";

import { useEffect, useRef, type CSSProperties, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";

const DRAG_THRESHOLD = 4;      // px before a press becomes a drag
const RESTITUTION = 0.55;      // share of speed kept after hitting an edge
const FRICTION = 6;            // exponential slowdown per second; a throw travels about speed / FRICTION px
const MAX_SPEED = 2600;        // px/s
const REST_SPEED = 16;         // px/s
const VELOCITY_WINDOW = 90;    // ms of pointer history used for a throw
const STALE_RELEASE = 60;      // ms without movement before a release counts as a drop
const SWING = 140;             // px/s of sideways speed per degree of swing
// The board fills the window without scrolling here, so touch can drag cards.
const FIXED_LAYOUT = "(min-width: 801px) and (min-height: 600px)";

let topLayer = 20;

type Bounds = { minX: number; maxX: number; minY: number; maxY: number };
type Sample = { t: number; x: number; y: number };
type Gesture = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: boolean;
  bounds: Bounds;
  samples: Sample[];
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const swingFor = (vx: number) => clamp(vx / SWING, -14, 14);

/** Offsets the slot can reach before its edges meet the window's. */
function viewportBounds(node: HTMLElement, x: number, y: number): Bounds {
  const rect = node.getBoundingClientRect();
  const { clientWidth, clientHeight } = document.documentElement;
  return { minX: x - rect.left, maxX: x + clientWidth - rect.right, minY: y - rect.top, maxY: y + clientHeight - rect.bottom };
}

/** Like viewportBounds, but a card that starts partly off screen is never pulled further in than where it began. */
function dragBounds(node: HTMLElement, x: number, y: number): Bounds {
  const bounds = viewportBounds(node, x, y);
  return { minX: Math.min(bounds.minX, x), maxX: Math.max(bounds.maxX, x), minY: Math.min(bounds.minY, y), maxY: Math.max(bounds.maxY, y) };
}

/** Past an edge, a card follows the pointer at a third of the distance. */
function resist(value: number, min: number, max: number) {
  if (value < min) return min + (value - min) / 3;
  if (value > max) return max + (value - max) / 3;
  return value;
}

function velocityOf(samples: Sample[]) {
  const first = samples[0];
  const last = samples[samples.length - 1];
  const seconds = (last.t - first.t) / 1000;
  return seconds > 0 ? { vx: (last.x - first.x) / seconds, vy: (last.y - first.y) / seconds } : { vx: 0, vy: 0 };
}

/** One frame on one axis: bounce when crossing an edge, ease back when released past one. */
function stepAxis(position: number, velocity: number, min: number, max: number, dt: number): [number, number] {
  if (position < min) return [position + (min - position) * Math.min(1, dt * 14), Math.max(velocity, 0)];
  if (position > max) return [position + (max - position) * Math.min(1, dt * 14), Math.min(velocity, 0)];
  const next = position + velocity * dt;
  if (next < min) return [min, Math.abs(velocity) * RESTITUTION];
  if (next > max) return [max, -Math.abs(velocity) * RESTITUTION];
  return [next, velocity];
}

/** A board slot that can be picked up, thrown, and bounced off the window edges. */
export function DraggableSlot({ className, style, children }: { className: string; style?: CSSProperties; children: ReactNode }) {
  const node = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const swing = useMotionValue(0);
  const rotate = useSpring(swing, { stiffness: 260, damping: 18 });
  const reduceMotion = useReducedMotion();
  const gesture = useRef<Gesture | null>(null);
  const flight = useRef(0);
  const justDragged = useRef(false);

  useEffect(() => {
    // Keep thrown cards reachable when the fixed-height board shrinks. Cards that were never
    // moved stay put, and scrolling layouts are left alone (mobile toolbars resize the window).
    function keepInView() {
      if (!node.current || gesture.current || (x.get() === 0 && y.get() === 0)) return;
      if (!window.matchMedia(FIXED_LAYOUT).matches) return;
      cancelAnimationFrame(flight.current);
      const bounds = viewportBounds(node.current, x.get(), y.get());
      x.set(clamp(x.get(), bounds.minX, bounds.maxX));
      y.set(clamp(y.get(), bounds.minY, bounds.maxY));
      swing.set(0);
    }
    const frames = flight;
    window.addEventListener("resize", keepInView);
    return () => {
      window.removeEventListener("resize", keepInView);
      cancelAnimationFrame(frames.current);
    };
  }, [x, y, swing]);

  function fly(vx: number, vy: number, bounds: Bounds) {
    if (reduceMotion) {
      x.set(clamp(x.get(), bounds.minX, bounds.maxX));
      y.set(clamp(y.get(), bounds.minY, bounds.maxY));
      swing.set(0);
      return;
    }
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      const [nextX, nextVx] = stepAxis(x.get(), vx, bounds.minX, bounds.maxX, dt);
      const [nextY, nextVy] = stepAxis(y.get(), vy, bounds.minY, bounds.maxY, dt);
      const decay = Math.exp(-FRICTION * dt);
      vx = nextVx * decay;
      vy = nextVy * decay;
      x.set(nextX);
      y.set(nextY);
      swing.set(swingFor(vx));
      const inside = nextX >= bounds.minX - 0.5 && nextX <= bounds.maxX + 0.5
        && nextY >= bounds.minY - 0.5 && nextY <= bounds.maxY + 0.5;
      if (inside && Math.hypot(vx, vy) < REST_SPEED) swing.set(0);
      else flight.current = requestAnimationFrame(frame);
    };
    flight.current = requestAnimationFrame(frame);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !node.current) return;
    if (event.pointerType === "touch" && !window.matchMedia(FIXED_LAYOUT).matches) return;
    cancelAnimationFrame(flight.current);
    gesture.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: x.get(),
      originY: y.get(),
      moved: false,
      bounds: dragBounds(node.current, x.get(), y.get()),
      samples: [{ t: event.timeStamp, x: event.clientX, y: event.clientY }],
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = gesture.current;
    if (!drag || drag.pointerId !== event.pointerId || !node.current) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      drag.moved = true;
      // Capture only once it is a drag, so a plain click still reaches the card.
      node.current.setPointerCapture(event.pointerId);
      node.current.dataset.dragging = "";
      node.current.style.zIndex = String(++topLayer);
    }
    x.set(resist(drag.originX + dx, drag.bounds.minX, drag.bounds.maxX));
    y.set(resist(drag.originY + dy, drag.bounds.minY, drag.bounds.maxY));
    drag.samples.push({ t: event.timeStamp, x: event.clientX, y: event.clientY });
    while (drag.samples.length > 2 && event.timeStamp - drag.samples[0].t > VELOCITY_WINDOW) drag.samples.shift();
    swing.set(swingFor(velocityOf(drag.samples).vx));
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    const drag = gesture.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    gesture.current = null;
    if (!drag.moved || !node.current) return;
    delete node.current.dataset.dragging;
    if (node.current.hasPointerCapture(event.pointerId)) node.current.releasePointerCapture(event.pointerId);
    // The click that follows a drag must not open the profile.
    justDragged.current = true;
    window.setTimeout(() => { justDragged.current = false; }, 0);

    const last = drag.samples[drag.samples.length - 1];
    const dropped = event.type === "pointercancel" || event.timeStamp - last.t > STALE_RELEASE;
    let { vx, vy } = dropped ? { vx: 0, vy: 0 } : velocityOf(drag.samples);
    const speed = Math.hypot(vx, vy);
    if (speed > MAX_SPEED) {
      vx *= MAX_SPEED / speed;
      vy *= MAX_SPEED / speed;
    }
    fly(vx, vy, drag.bounds);
  }

  function handleClickCapture(event: MouseEvent<HTMLDivElement>) {
    if (!justDragged.current) return;
    event.preventDefault();
    event.stopPropagation();
  }

  return <motion.div ref={node} className={className} style={{ ...style, x, y, rotate }}
    onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}
    onPointerUp={handlePointerEnd} onPointerCancel={handlePointerEnd} onClickCapture={handleClickCapture}>
    {children}
  </motion.div>;
}
