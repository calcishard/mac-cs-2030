# Mac CS 2030 — start here

This is the source for the version 2 photo-board redesign: clickable Polaroid profiles, a separate class-profile survey tab, and an About page.

Live site: https://mac-cs-2030.jasontran2134.chatgpt.site
Intended GitHub repository: https://github.com/calcishard/mac-cs-2030
Source commit: 43f8d6d3ecbb53156d85961cfab03a0ea8de842b

## Upload this source to GitHub yourself

This is an alternative if the ChatGPT GitHub connection still cannot access your repository. This archive has not itself been uploaded to GitHub.

1. Extract the ZIP. The source is inside the `mac-cs-2030` folder.
2. With Git installed, clone your GitHub repository into a separate folder:

   ```sh
   git clone https://github.com/calcishard/mac-cs-2030.git mac-cs-2030-github
   ```

3. Copy the **contents** of the extracted `mac-cs-2030` folder into `mac-cs-2030-github`. Include the dotfiles such as `.gitignore`, `.npmrc`, and the `.openai` folder. Keep the clone's `.git` folder. The source ZIP contains no `.git` folder. If your GitHub repository already contains work beyond its initial README, review any file conflicts before replacing files.
4. Open a terminal in `mac-cs-2030-github`, then run:

   ```sh
   git add .
   git diff --cached --stat
   git commit -m "Add Mac CS 2030 class website"
   git push origin HEAD
   ```

Git may ask you to authenticate to your GitHub account. If it asks for an author name/email, configure those with your own details. This uploads the source; it does not deploy the website or change the repository's visibility. Later GitHub changes will not automatically update the existing hosted site.

## Main files

| What you want to change | File |
| --- | --- |
| Names, bios, interests, and profile photos | `lib/class-profile.ts`, in `people` |
| Survey questions and chart values | `lib/class-profile.ts`, in `chapters` |
| Shared sample response total, page text, and profile dialog | `app/page.tsx` |
| Layout, colours, fonts, and responsive styles | `app/globals.css` |
| Browser title and description | `app/layout.tsx` |
| Images | `public/` and `public/photos/` |

## Add a classmate

In `lib/class-profile.ts`, copy an existing object in the `people` array, give it a unique `id`, and replace the name, initials, tagline, bio, project, offline interests, and short `note`.

Put their photo in `public/photos/`, then use a path starting at `/photos/`:

```ts
photo: "/photos/jason.jpg",
photoAlt: "Jason outdoors on campus",
photoPosition: "50% 40%",
```

`photoPosition` sets the CSS crop position. Keep all required fields in the object, including `color`, `ink`, and `interest`. Without a `photo`, the card displays initials. The layout switches to extra rows when there are more than six people. Keep at least one person in the array; the current profile dialog expects a non-empty list.

The current UI identifies every profile as a fictional sample. Once you have real submitted profiles, update the sample labels and the About-page explanation in `app/page.tsx` accurately. If real and sample profiles are mixed, add a per-profile sample flag before removing labels globally.

The current UI does not store personal website links: the dialog says no personal site has been added. A link field and rendered anchor would need to be added to support those links.

## Add survey data

The `chapters` array contains the sample questions, bar labels/counts, featured statistics, and donut-chart counts.

The current demo uses `const sampleTotal = 48` near the top of `app/page.tsx`. Update that total together with the counts. The bar questions currently assume one answer per respondent, so their counts should sum to the total. Featured and donut counts must be between zero and the total.

If individual questions have different response totals, add question-specific denominators before displaying those results. The current demo does not model missing answers or multiple-choice questions with multiple selections.

Sample notices and some question wording also live in `app/page.tsx`. Keep sample notices until the results are real, then describe the real survey dates and response counts. Co-op is a placeholder page.

There is no submission form, database-backed editor, CSV importer, or automatic Google Forms sync in this version. Adding data means editing the source and republishing it.

## Run locally

Use Node.js 22.13.0 or newer and pnpm 11.25.0, matching `package.json`.

From the extracted project directory:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the local URL printed by the dev server. To check a production build:

```sh
pnpm build
```

Dependencies are not included in this ZIP. A downloaded checkout defaults to the portable runtime; local-only runtime state and build output are excluded. The original starter's `README.md` contains more framework information. The project is a Vinext/React/TypeScript app, so uploading it as-is to GitHub Pages does not host the application.

## Images and fonts

Photo attribution appears in the site's About tab. Retain those credits while using the bundled photos. The desk, camera, and hiking sample photos are CC0; the campus photo is credited to Mathew Ingram under CC BY 2.0. Font licence files are in `public/fonts/`; starter and vendor licences are preserved in the source tree.

This ZIP includes source and assets from the published redesign, plus this guide. It excludes credentials, installed dependencies, Git metadata, and generated build output.
