# Name search and rotating polaroids

The landing page shows up to six people. The search in the upper-right corner searches the entire `people` array in `lib/class-profile.ts`, including people who are not currently on the board. Choosing a result opens that person's profile. Arrow keys, Enter, Escape, and the clear button work through the existing combobox component.

Search ignores letter case, extra spaces, periods, apostrophes, and common accent marks. First names, surnames, and partial names work. Every matching record remains in the results, even when two people have exactly the same name. Each result also shows its photo and tagline.

## Adding people

Keep each person's `id` unique; `name` does not need to be unique. For example, two classmates may both have `name: "Alex Chen"` while using IDs `"alex-chen-1"` and `"alex-chen-2"`. Keep the other existing profile fields when adding a record. The current data file is a source-code array, so adding people still requires saving that file and rebuilding the site.

## Rotation

- Each card gets its own random delay between 4 and 9 seconds. A fresh delay is selected after each change.
- With more than six people, the changing card brings in someone who is not already visible. With six or fewer, two cards swap places so one person never occupies two slots. A single profile stays still.
- The changing card flashes briefly, then the white overlay fades away over 900 ms. Incoming photos are preloaded; slow images can add a short delay.
- Rotation continues while a card is hovered or keyboard-focused, the search is being used, a profile is open, or another site section is selected. The open profile stays on the person you selected while the board changes behind it.
- Only the pause button beside search stops rotation until resumed. Pausing also cancels any pending card replacement; a flash already on screen finishes fading.
- The operating system's reduced-motion setting suppresses the flash animation through CSS; the people continue rotating and the pause button stays available.
- The app does not pause when the browser tab is hidden, although browsers can slow or suspend background timers themselves.

To adjust timing, edit `nextCardDelay` in `lib/people-board.ts`. To adjust the flash/fade, edit `.polaroid-flash` and `@keyframes polaroid-flash-reveal` in `app/globals.css`.

## Checks

Run the focused search and selection checks using the project's supported Node version:

```sh
node --experimental-strip-types --test tests/people-board.test.mjs
```

For a manual check, hover or keyboard-focus a card and wait for several changes. Keep typing in search or leave its results open; rotation should continue. Open a profile and confirm that its details stay on the selected person while the board changes behind it. Close it; focus should return to the trigger or search. Pause with the button, interact with search and switch site sections, and confirm the cards stay still until you press Resume. Try the search at a narrow window width.
