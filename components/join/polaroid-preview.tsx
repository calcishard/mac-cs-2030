"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { ImagePlus, LoaderCircle } from "lucide-react";

export type PhotoPosition = { x: number; y: number };

type Props = {
  name: string;
  note: string;
  photoUrl?: string;
  position: PhotoPosition;
  onPositionChange: (position: PhotoPosition) => void;
  onPickPhoto: () => void;
  hidden: boolean;
  busy: boolean;
};

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));
const develop = { duration: 1.8, ease: [0.16, 1, 0.3, 1] } as const;
const nudges: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

/** The same polaroid as the board, updating as the form is filled in. */
export function PolaroidPreview({ name, note, photoUrl, position, onPositionChange, onPickPhoto, hidden, busy }: Props) {
  const reduceMotion = useReducedMotion();
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotateX = useSpring(tiltX, { stiffness: 160, damping: 16 });
  const rotateY = useSpring(tiltY, { stiffness: 160, damping: 16 });
  const drag = useRef<{ id: number; x: number; y: number; start: PhotoPosition; width: number; height: number } | null>(null);
  const [repositioning, setRepositioning] = useState(false);

  function tilt(event: PointerEvent<HTMLDivElement>) {
    if (reduceMotion || drag.current || event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    tiltY.set(((event.clientX - rect.left) / rect.width - 0.5) * 16);
    tiltX.set(((event.clientY - rect.top) / rect.height - 0.5) * -16);
  }

  function resetTilt() {
    tiltX.set(0);
    tiltY.set(0);
  }

  function startReposition(event: PointerEvent<HTMLSpanElement>) {
    if (!photoUrl || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = event.currentTarget.getBoundingClientRect();
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, start: position, width: rect.width, height: rect.height };
    setRepositioning(true);
    resetTilt();
  }

  function reposition(event: PointerEvent<HTMLSpanElement>) {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    // Dragging right shows more of the left side, as if sliding the print itself.
    onPositionChange({
      x: clampPercent(current.start.x - (event.clientX - current.x) / current.width * 120),
      y: clampPercent(current.start.y - (event.clientY - current.y) / current.height * 120),
    });
  }

  function endReposition(event: PointerEvent<HTMLSpanElement>) {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    setRepositioning(false);
  }

  function nudge(event: KeyboardEvent<HTMLSpanElement>) {
    const direction = nudges[event.key];
    if (!direction) return;
    event.preventDefault();
    const step = event.shiftKey ? 10 : 3;
    onPositionChange({ x: clampPercent(position.x + direction[0] * step), y: clampPercent(position.y + direction[1] * step) });
  }

  return <motion.div className="preview-tilt" style={{ rotateX, rotateY, transformPerspective: 900 }} onPointerMove={tilt} onPointerLeave={resetTilt}>
    <div className="polaroid join-polaroid" data-hidden={hidden}>
      {photoUrl
        ? <span className="photo-window" data-repositionable="" data-active={repositioning || undefined}
            tabIndex={0} role="group" aria-roledescription="photo position"
            aria-label="Your photo. Drag it, or use the arrow keys, to choose what shows in the frame."
            onPointerDown={startReposition} onPointerMove={reposition} onPointerUp={endReposition} onPointerCancel={endReposition} onKeyDown={nudge}>
            <motion.img key={photoUrl} src={photoUrl} alt="" draggable={false}
              style={{ objectPosition: `${position.x}% ${position.y}%` }}
              initial={{ filter: "blur(16px) sepia(0.9) brightness(1.7)", opacity: 0.35, scale: 1.08 }}
              animate={{ filter: "blur(0px) sepia(0) brightness(1)", opacity: 1, scale: 1 }}
              transition={develop} />
            <motion.span key={`flash-${photoUrl}`} className="develop-flash" aria-hidden="true"
              initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.9, ease: develop.ease }} />
          </span>
        : <span className="photo-window">
            <button type="button" className="photo-empty" onClick={onPickPhoto} disabled={busy} tabIndex={-1}>
              {busy ? <LoaderCircle className="join-spinner" size={22} aria-hidden="true" /> : <ImagePlus size={22} aria-hidden="true" />}
              <span>{busy ? "developing…" : "add a photo"}</span>
            </button>
          </span>}
      <span className="photo-caption">
        <span className={name ? "photo-name" : "photo-name photo-placeholder"}>{(name || "your name").toLowerCase()}</span>
      </span>
      <span className={note ? "photo-note" : "photo-note photo-placeholder"}>{note || "your little note"}</span>
      <AnimatePresence>
        {hidden && <motion.span className="preview-hidden-stamp" initial={{ opacity: 0, scale: 1.7 }} animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.2 }} transition={{ type: "spring", stiffness: 420, damping: 20 }}>not on the board</motion.span>}
      </AnimatePresence>
    </div>
  </motion.div>;
}
