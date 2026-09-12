import { z } from "zod";
import { EMAIL_PATTERN, LIMITS, NAME_PATTERN, PHOTO_POSITION_PATTERN, normalizeEmail, normalizeMultiline } from "@/lib/join-rules";
import { questions } from "@/lib/survey";

// Required: the email, and, for a card on the board, a name and photo. Everything else is optional.

export const emailSchema = z
  .string()
  .transform(normalizeEmail)
  .pipe(z.string().max(254, "that email is too long.").regex(EMAIL_PATTERN, "enter your full mac email."));

/** Blank optional text is stored as absent rather than as an empty string. */
const optionalText = (max: number) =>
  z.string().trim().max(max, `keep it under ${max} characters.`).optional().transform(value => value || undefined);

/** Like optionalText, but line breaks are kept so a bio can have paragraphs. */
const optionalMultilineText = (max: number) =>
  z.string().transform(normalizeMultiline).pipe(z.string().max(max, `keep it under ${max} characters.`))
    .optional().transform(value => value || undefined);

export const cardSchema = z.object({
  name: z.string().trim().min(1, "add your name.").regex(NAME_PATTERN, "first name and last initial, like Jason T."),
  note: optionalText(LIMITS.note),
  tagline: optionalText(LIMITS.tagline),
  bio: optionalMultilineText(LIMITS.bio),
  project: optionalText(LIMITS.project),
  interests: z.array(z.string().trim().min(1).max(LIMITS.interest))
    .max(LIMITS.interestsMax, `${LIMITS.interestsMax} max.`)
    .default([]),
  photoPosition: z.string().regex(PHOTO_POSITION_PATTERN),
});

/** Every class profile question can be skipped, but an answer must be one of its options. */
export const answersSchema = z.object(Object.fromEntries(questions.map(question => [
  question.id,
  z.enum(question.options.map(option => option.value) as [string, ...string[]]).optional(),
]))).default({});

export const submissionSchema = z.discriminatedUnion("showOnBoard", [
  z.object({ email: emailSchema, showOnBoard: z.literal(true), card: cardSchema, answers: answersSchema }),
  z.object({ email: emailSchema, showOnBoard: z.literal(false), answers: answersSchema }),
]);
