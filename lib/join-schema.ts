import { z } from "zod";
import { EMAIL_PATTERN, LIMITS, NAME_PATTERN, PHOTO_POSITION_PATTERN, normalizeEmail } from "@/lib/join-rules";
import { questions } from "@/lib/survey";

export const emailSchema = z
  .string()
  .transform(normalizeEmail)
  .pipe(z.string().max(254, "that email is too long.").regex(EMAIL_PATTERN, "enter your full mac email."));

const shortText = (what: string, max: number) =>
  z.string().trim().min(1, `add ${what}.`).max(max, `keep it under ${max} characters.`);

export const cardSchema = z.object({
  name: z.string().trim().regex(NAME_PATTERN, "first name and last initial, like Jason T."),
  note: shortText("a little note", LIMITS.note),
  tagline: shortText("a tagline", LIMITS.tagline),
  bio: z.string().trim()
    .min(LIMITS.bioMin, "write a little more.")
    .max(LIMITS.bio, `keep it under ${LIMITS.bio} characters.`),
  project: shortText("what you’re working on", LIMITS.project),
  interests: z.array(z.string().trim().min(1).max(LIMITS.interest))
    .min(LIMITS.interestsMin, `add at least ${LIMITS.interestsMin}.`)
    .max(LIMITS.interestsMax, `${LIMITS.interestsMax} max.`),
  photoPosition: z.string().regex(PHOTO_POSITION_PATTERN),
});

export const answersSchema = z.object(Object.fromEntries(questions.map(question => [
  question.id,
  z.enum(question.options.map(option => option.value) as [string, ...string[]], {
    errorMap: () => ({ message: "pick one." }),
  }),
])));

export const submissionSchema = z.discriminatedUnion("showOnBoard", [
  z.object({ email: emailSchema, showOnBoard: z.literal(true), card: cardSchema, answers: answersSchema }),
  z.object({ email: emailSchema, showOnBoard: z.literal(false), answers: answersSchema }),
]);
