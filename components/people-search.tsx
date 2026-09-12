"use client";

import { useRef, useState } from "react";
import { Search } from "lucide-react";
import {
  Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList,
} from "@/components/ui/combobox";
import type { Person } from "@/lib/class-profile";
import { searchPeople } from "@/lib/people-board";

type Props = {
  people: readonly Person[];
  onSelect: (person: Person, input: HTMLInputElement | null) => void;
};

export function PeopleSearch({ people, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const matches = searchPeople(people, query);

  return <div className="people-search">
    <Combobox<Person>
      items={matches}
      filter={null}
      value={null}
      inputValue={query}
      open={open && !!query.trim()}
      onOpenChange={setOpen}
      onInputValueChange={(value, details) => {
        // Selection opens the profile; it must not reopen the name dropdown.
        if (details.reason === "item-press") return;
        setQuery(value);
        setOpen(!!value.trim());
      }}
      itemToStringLabel={person => person.name}
      itemToStringValue={person => person.id}
      isItemEqualToValue={(a, b) => a.id === b.id}
      onValueChange={person => {
        if (!person) return;
        setOpen(false);
        setQuery("");
        onSelect(person, input.current);
      }}
    >
      <ComboboxInput
        ref={input}
        className="people-search-field"
        aria-label="Search classmates by name"
        placeholder="find someone…"
        showTrigger={false}
        showClear={!!query}
        autoComplete="off"
      >
        <Search className="people-search-icon" size={16} aria-hidden="true" />
      </ComboboxInput>
      <ComboboxContent className="people-search-results" align="end">
        {matches.length > 0 && <p className="people-search-count">{matches.length} {matches.length === 1 ? "person" : "people"}</p>}
        <ComboboxEmpty className="people-search-empty">No one found. Try another name.</ComboboxEmpty>
        <ComboboxList>
          {(person: Person) => <ComboboxItem key={person.id} value={person} className="people-search-result">
            <span className="search-avatar" style={{ background: person.color, color: person.ink }} aria-hidden="true">
              {person.photo ? <img src={person.photo} alt="" width="40" height="44" style={{ objectPosition: person.photoPosition || "center" }} /> : person.initials}
            </span>
            <span className="search-person-copy"><strong>{person.name}</strong><span>{person.tagline}</span></span>
          </ComboboxItem>}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  </div>;
}
