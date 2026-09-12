type IdentifiedPerson = { id: string; name: string };

function normalizeName(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[.'’]/g, "").trim().replace(/\s+/g, " ");
}

/** Keep every matching record: names are searchable labels, IDs are identities. */
export function searchPeople<T extends IdentifiedPerson>(people: readonly T[], query: string): T[] {
  const words = normalizeName(query).split(" ").filter(Boolean);
  if (!words.length) return [];
  return people.filter(person => {
    const name = normalizeName(person.name);
    return words.every(word => name.includes(word));
  });
}

export function nextCardDelay(random = Math.random) {
  return 7000 + Math.floor(random() * 6000);
}

/** Change one slot without duplicating someone already on the board. */
export function rotatePerson<T extends IdentifiedPerson>(
  people: readonly T[], visible: readonly T[], slot: number, random = Math.random,
): T[] {
  const next = [...visible];
  if (!visible[slot] || people.length < 2) return next;
  const shown = new Set(visible.map(person => person.id));
  const available = people.filter(person => !shown.has(person.id));
  if (available.length) {
    next[slot] = available[Math.floor(random() * available.length)];
  } else if (visible.length > 1) {
    // With six or fewer people, swap two positions instead of repeating a person.
    const alternatives = visible.map((_, index) => index).filter(index => index !== slot);
    const other = alternatives[Math.floor(random() * alternatives.length)];
    [next[slot], next[other]] = [next[other], next[slot]];
  }
  return next;
}
