# Mac CS 2030 — start here

The class site: a board of clickable polaroid profiles, a class profile of survey charts, an About page, and a `/join` form that feeds both.

Repository: https://github.com/calcishard/mac-cs-2030

## Main files

| What you want to change | File |
| --- | --- |
| Survey questions, answer options, chart titles, and which charts each tab shows | `lib/survey.ts` |
| Form field limits and the name/email rules | `lib/join-rules.ts`, validated by `lib/join-schema.ts` |
| The join form, its live polaroid preview, and the success animation | `components/join/` |
| Home page: board, profile dialog, charts, About text | `components/home.tsx` |
| Dragging and throwing polaroids | `components/draggable-slot.tsx` |
| The admin review page | `components/admin.tsx`, `app/admin/page.tsx` |
| Database tables | `db/schema.ts`, with migrations in `drizzle/` |
| Layout, colours, fonts, and responsive styles | `app/globals.css` |
| Browser title and description | `app/layout.tsx` |

## How people get on the board

1. A classmate fills in `/join` with their full Mac email, their polaroid card (or opts out of the board), and the class profile questions.
2. The submission is saved as **pending**. Each email can submit once; the form says so if the email is already used.
3. An admin signs in at `/admin`, checks the email (non-`@mcmaster.ca` addresses are flagged), and approves or deletes it. Deleting frees the email to submit again.
4. Approved cards appear on the board. Approved answers count toward the charts, which appear once there are 10 approved responses. Answers picked by fewer than 3 people are merged into "Something else" so no one stands out.

Emails are never sent to visitors; the board uses a separate random ID for each person.

## Admin password

The admin page is locked with the `ADMIN_PASSWORD` secret.

- Locally, it lives in `.dev.vars` (ignored by Git). Restart the dev server after changing it.
- In production, set it once with `pnpm wrangler secret put ADMIN_PASSWORD`.

## Database

The site uses Cloudflare D1 (SQLite). Photos are shrunk in the browser to about 300 KB and stored in the `photos` table.

After changing `db/schema.ts`:

```sh
pnpm db:generate        # writes a new SQL migration into drizzle/
pnpm db:migrate:local   # applies it to the local preview database
```

`pnpm deploy` applies pending migrations to the live database before deploying.

## Run locally

Use Node.js 22.13.0 or newer and pnpm 11.25.0, matching `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm db:migrate:local
pnpm dev
```

Open the local URL printed by the dev server. Checks:

```sh
node --test tests/*.test.mjs
pnpm lint
pnpm build
```

## Deploy to Cloudflare

`wrangler.jsonc` holds the Worker name and the D1 binding. Sign in once with `pnpm wrangler login`, then:

```sh
pnpm deploy
```

## Images and fonts

The campus photo on the About page is credited to Mathew Ingram under CC BY 2.0. The desk, camera, and hiking photos in `public/photos/` are CC0 samples. Font licence files are in `public/fonts/`; starter and vendor licences are preserved in the source tree.
