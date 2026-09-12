"use client";

import { useEffect, useRef, useState } from "react";
import type { Person } from "@/lib/class-profile";
import { nextCardDelay, rotatePerson } from "@/lib/people-board";

function preloadPhoto(person: Person): Promise<void> {
  const photo = person.photo;
  if (!photo) return Promise.resolve();
  return new Promise(resolve => {
    const image = new Image();
    const finish = () => {
      window.clearTimeout(timeout);
      image.onload = null;
      image.onerror = null;
      resolve();
    };
    const timeout = window.setTimeout(finish, 2000);
    image.onload = finish;
    image.onerror = finish;
    image.src = photo;
    if (image.complete) finish();
  });
}

export const BOARD_SIZE = 6;

export function useRotatingPeople(people: readonly Person[], paused: boolean) {
  // The first server and client renders agree; randomness begins in the timers.
  const [cards, setCards] = useState(() => people.slice(0, BOARD_SIZE).map(person => ({ person, revision: 0 })));
  const currentCards = useRef(cards);

  useEffect(() => {
    // Only the explicit pause button stops rotation. UI interactions and
    // section changes do not reset or cancel the independent card timers.
    // When everyone already fits on the board there is no one to bring in, so nothing rotates.
    if (paused || people.length <= BOARD_SIZE) return;
    let cancelled = false;
    let changing = false;
    const timers: number[] = [];

    function schedule(slot: number) {
      timers[slot] = window.setTimeout(() => void change(slot), nextCardDelay());
    }

    async function change(slot: number) {
      if (cancelled) return;
      if (changing) {
        schedule(slot);
        return;
      }
      // Serialize only the image-loading/commit step so two timers cannot choose
      // the same incoming person. Each slot still owns its independent delay.
      changing = true;
      const before = currentCards.current;
      const next = rotatePerson(people, before.map(card => card.person), slot);
      await Promise.all(next.filter((person, i) => person.id !== before[i].person.id).map(preloadPhoto));
      if (!cancelled) {
        const updated = next.map((person, i) => ({
          person,
          revision: before[i].revision + Number(person.id !== before[i].person.id),
        }));
        currentCards.current = updated;
        setCards(updated);
      }
      changing = false;
      if (!cancelled) schedule(slot);
    }

    currentCards.current.forEach((_, slot) => schedule(slot));
    return () => {
      cancelled = true;
      timers.forEach(timer => window.clearTimeout(timer));
    };
  }, [people, paused]);

  return { cards };
}
