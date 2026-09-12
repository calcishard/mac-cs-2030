import { sql } from "drizzle-orm";
import { blob, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { SurveyAnswers } from "../lib/survey";

/** One row per email. The email itself is never sent to visitors. */
export const submissions = sqliteTable("submissions", {
  email: text("email").primaryKey(),
  /** The ID visitors see, so the board never exposes emails. */
  publicId: text("public_id").notNull().unique(),
  status: text("status", { enum: ["pending", "approved"] }).notNull().default("pending"),
  showOnBoard: integer("show_on_board", { mode: "boolean" }).notNull(),
  // Card fields are empty when someone opts out of the board.
  name: text("name"),
  note: text("note"),
  tagline: text("tagline"),
  bio: text("bio"),
  project: text("project"),
  interests: text("interests", { mode: "json" }).$type<string[]>(),
  photoId: text("photo_id"),
  photoPosition: text("photo_position"),
  answers: text("answers", { mode: "json" }).$type<SurveyAnswers>().notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  approvedAt: text("approved_at"),
}, table => [index("submissions_status_idx").on(table.status)]);

/** Photos live apart from submissions so listing submissions never loads image bytes. */
export const photos = sqliteTable("photos", {
  id: text("id").primaryKey(),
  contentType: text("content_type").notNull(),
  data: blob("data", { mode: "buffer" }).notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
