# Mac CS 2030 — start here

The class site: a board of clickable polaroid profiles, a class profile of survey charts, an About page, and a `/join` form that feeds both. It is a Next.js app hosted on Vercel, with data in MongoDB.

Repository: https://github.com/calcishard/mac-cs-2030
Live site: https://mac-cs-2030.vercel.app

## Main files

| What you want to change | File |
| --- | --- |
| Survey questions, answer options, chart titles, and which charts each class profile chapter shows | `lib/survey.ts` |
| Form field limits and the name/email rules | `lib/join-rules.ts`, validated by `lib/join-schema.ts` |
| The join form, its live polaroid preview, and the success animation | `components/join/` |
| Home page: board, profile dialog, charts, About text | `components/home.tsx` |
| Dragging and throwing polaroids | `components/draggable-slot.tsx` |
| The admin review page | `components/admin.tsx`, `app/admin/page.tsx` |
| Database connection and document shapes | `lib/server/mongo.ts` |
| Layout, colours, fonts, and responsive styles | `app/globals.css` |
| Browser title and description | `app/layout.tsx` |

## How people get on the board

1. A classmate fills in `/join` with their full Mac email, their polaroid card (or opts out of the board), and the class profile questions.
2. The submission is saved as **pending**. Each email can submit once; the form says so if the email is already used.
3. An admin signs in at `/admin`, checks the email (non-`@mcmaster.ca` addresses are flagged), and approves or deletes it. Deleting frees the email to submit again.
4. Approved cards appear on the board. Approved answers count toward the charts, which appear once there are 10 approved responses. Answers picked by fewer than 3 people are merged into "Something else" so no one stands out.

Whoever adds a polaroid can edit or delete it later at `/join/edit`. The browser that submitted it keeps a secret edit token; from any other browser, they type their Mac email and get a one-time edit link by email (through Resend, see below). That is the only email the site ever sends. The board uses a separate random ID for each person, so emails never appear publicly.

## Email: Resend

Edit links go out through https://resend.com. The free plan (3,000 emails a month, 100 a day) is plenty, but it only delivers to real inboxes from a domain you have verified; the test sender `onboarding@resend.dev` only reaches the Resend account owner, and `mac-cs-2030.vercel.app` can’t be verified because its DNS isn’t ours.

1. Sign up, then under **Domains → Add domain** enter a domain you control (a subdomain like `mail.example.ca` is fine).
2. Add the DNS records Resend shows at your registrar and wait for the domain to say **Verified**.
3. Under **API Keys**, create a key with sending access and put it in `RESEND_API_KEY`.
4. Set `EMAIL_FROM` to an address on that domain. It doesn’t need a mailbox behind it.

Each address can be sent a link at most once every two minutes, and a link works once and expires after 30 minutes.

## Database: MongoDB Atlas

1. Create a free cluster at https://cloud.mongodb.com.
2. Under **Database Access**, add a database user with a password.
3. Under **Network Access**, allow `0.0.0.0/0`. Vercel's servers don't have fixed IP addresses.
4. Click **Connect → Drivers** and copy the connection string, filling in the user's password.

The app creates its `submissions` and `photos` collections and indexes on first use. Photos are shrunk in the browser to under 1 MB (usually a few hundred KB) and stored in the `photos` collection.

## Environment variables

| Name | What it is |
| --- | --- |
| `MONGODB_URI` | The Atlas connection string |
| `ADMIN_PASSWORD` | The password for `/admin` |
| `MONGODB_DB` | Optional database name; defaults to `mac-cs-2030` |
| `RESEND_API_KEY` | Resend API key, for emailing edit links. Without it, `/join/edit` says edit links aren’t set up |
| `EMAIL_FROM` | The sender, like `mac cs ’30 <hello@example.ca>`. The domain must be verified in Resend |

- Copy `.env.example` to `.env.local` (ignored by Git), fill it in, and restart `pnpm dev`.
- On Vercel, add them under **Project → Settings → Environment Variables**, then redeploy.

## Run locally

Use Node.js 22.13.0 or newer and pnpm 11.25.0, matching `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:3000. Checks:

```sh
node --test tests/*.test.mjs
pnpm lint
pnpm build
```

## Deploy

Vercel builds the site from GitHub. Pull requests get a preview deployment, and merging into `main` updates https://mac-cs-2030.vercel.app. Make sure both environment variables are set for Preview and Production first.

## Images and fonts

The campus photo on the About page is credited to Mathew Ingram under CC BY 2.0. The desk, camera, and hiking photos in `public/photos/` are CC0 samples. Font licence files are in `public/fonts/`; starter and vendor licences are preserved in the source tree.
