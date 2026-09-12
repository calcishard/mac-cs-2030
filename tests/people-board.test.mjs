import assert from "node:assert/strict";
import test from "node:test";
import { nextCardDelay, rotatePerson, searchPeople } from "../lib/people-board.ts";

const people = [
  { id: "alex-1", name: "Alex Chen" },
  { id: "alex-2", name: "Alex Chen" },
  { id: "alex-3", name: "Alex Patel" },
  { id: "elodie", name: "Élodie Chen" },
  { id: "maya", name: "Maya P." },
  { id: "sam", name: "Sam R." },
  { id: "priya", name: "Priya S." },
  { id: "noah", name: "Noah L." },
];

test("search returns every matching record, including identical full names", () => {
  assert.deepEqual(searchPeople(people, "Alex Chen").map(p => p.id), ["alex-1", "alex-2"]);
  assert.equal(searchPeople(people, "alex").length, 3);
});

test("search handles partial names, spaces, case, initials, and accents", () => {
  assert.deepEqual(searchPeople(people, "  CHEN   ELODIE ").map(p => p.id), ["elodie"]);
  assert.deepEqual(searchPeople(people, "may p").map(p => p.id), ["maya"]);
  assert.deepEqual(searchPeople(people, "does not exist"), []);
  assert.deepEqual(searchPeople(people, "   "), []);
});

test("a larger class changes only the requested slot, using someone off the board", () => {
  const original = people.slice(0, 6);
  const next = rotatePerson(people, original, 2, () => 0.9);
  assert.equal(next.length, 6);
  assert.equal(next[2].id, "noah");
  assert.equal(new Set(next.map(p => p.id)).size, 6);
  assert.deepEqual(next.filter((_, i) => i !== 2), original.filter((_, i) => i !== 2));
  assert.equal(original[2].id, "alex-3");
});

test("six profiles swap positions without duplicating a person", () => {
  const original = people.slice(0, 6);
  const next = rotatePerson(original, original, 0, () => 0.5);
  assert.notEqual(next[0].id, original[0].id);
  assert.equal(next.filter((p, i) => p.id !== original[i].id).length, 2);
  assert.deepEqual(next.map(p => p.id).sort(), original.map(p => p.id).sort());
});

test("repeated changes keep six unique people and reach the full class", () => {
  let seed = 17;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const roster = Array.from({ length: 30 }, (_, i) => ({ id: String(i), name: "Same name" }));
  let visible = roster.slice(0, 6);
  const seen = new Set(visible.map(p => p.id));
  for (let i = 0; i < 300; i++) {
    const slot = i % 6;
    const previous = visible[slot].id;
    visible = rotatePerson(roster, visible, slot, random);
    assert.equal(visible.length, 6);
    assert.equal(new Set(visible.map(p => p.id)).size, 6);
    assert.notEqual(visible[slot].id, previous);
    visible.forEach(p => seen.add(p.id));
  }
  assert.equal(seen.size, roster.length);
});

test("empty and one-person rosters remain usable", () => {
  assert.deepEqual(rotatePerson([], [], 0), []);
  assert.deepEqual(rotatePerson(people.slice(0, 1), people.slice(0, 1), 0), people.slice(0, 1));
});

test("random delays stay in the requested staggered range", () => {
  const delays = [0, 0.15, 0.35, 0.6, 0.8, 0.9999].map(value => nextCardDelay(() => value));
  assert.ok(delays.every(delay => delay >= 7000 && delay < 13000));
  assert.equal(new Set(delays).size, 6);
});
