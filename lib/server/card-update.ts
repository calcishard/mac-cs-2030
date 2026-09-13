import type { UpdateFilter } from "mongodb";
import type { z } from "zod";
import type { cardSchema } from "@/lib/join-schema";
import type { SubmissionDoc } from "@/lib/server/mongo";

type CardText = Omit<z.infer<typeof cardSchema>, "photoPosition">;

const OPTIONAL_CARD_FIELDS = ["note", "tagline", "bio", "project"] as const;

/** Saves a card's words, plus any other fields. Blanked optional fields are removed, matching how the join form stores them. */
export function cardUpdate(card: CardText, extra: Partial<SubmissionDoc> = {}): UpdateFilter<SubmissionDoc> {
  const set: Partial<SubmissionDoc> = { ...extra, name: card.name, interests: card.interests };
  const unset: Partial<Record<keyof SubmissionDoc, "">> = {};
  for (const key of OPTIONAL_CARD_FIELDS) {
    const value = card[key];
    if (value) set[key] = value;
    else unset[key] = "";
  }
  return { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) };
}
