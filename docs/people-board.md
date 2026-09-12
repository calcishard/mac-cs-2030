# The polaroid board

The landing page shows up to six approved classmates. Empty slots show an "add yours" card that links to `/join`. The search in the upper-right corner searches every approved classmate, including people who are not currently on the board. Choosing a result opens that person's profile. Arrow keys, Enter, Escape, and the clear button work through the existing combobox component.

Search ignores letter case, extra spaces, periods, apostrophes, and common accent marks. First names, surnames, and partial names work. Every matching record remains in the results, even when two people have exactly the same name. Each result also shows its photo and tagline.

## Where people come from

People come from approved submissions in the database, shuffled on each page load. See `START_HERE.md` for the join and approval flow. Names do not need to be unique; each person has their own random ID.

## Rotation

- Cards only rotate when there are more than six approved people. With six or fewer, everyone is already on the board, so the cards stay still and the pause button is disabled.
- Each card gets its own random delay between 7 and 13 seconds. A fresh delay is selected after each change. The changing card brings in someone who is not already visible.
- The changing card starts under a soft white wash that fades away over 1.4 s. Incoming photos are preloaded; slow images can add a short delay.
- Rotation continues while a card is hovered or keyboard-focused, the search is being used, a profile is open, or another site section is selected. The open profile stays on the person you selected while the board changes behind it.
- Only the pause button beside search stops rotation until resumed. Pausing also cancels any pending card replacement; a flash already on screen finishes fading.
- The operating system's reduced-motion setting suppresses the flash animation through CSS; the people continue rotating and the pause button stays available.

To adjust timing, edit `nextCardDelay` in `lib/people-board.ts`. To adjust the flash/fade, edit `.polaroid-flash` and `@keyframes polaroid-flash-reveal` in `app/globals.css`.

## Dragging

- Cards land on the board one after another when the page opens.
- Any card can be picked up and thrown. It slows down quickly and bounces off the window edges. A plain click still opens the profile; a drag does not.
- The last card moved sits on top. Positions reset when the page reloads.
- Mouse and pen can always drag. Touch drags only on the full-window layout (at least 801 × 600 px); on smaller screens touch scrolls the page instead.
- With reduced motion turned on, a thrown card simply stops where it is dropped.

To tune the feel, edit the constants at the top of `components/draggable-slot.tsx` (`FRICTION`, `RESTITUTION`, `MAX_SPEED`).

## Checks

```sh
node --test tests/*.test.mjs
```

For a manual check, hover or keyboard-focus a card and wait for several changes. Open a profile and confirm that its details stay on the selected person while the board changes behind it. Close it; focus should return to the trigger or search. Throw a card at each window edge and confirm no scrollbars appear. Try the search at a narrow window width.
