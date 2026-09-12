# About-page developer credits

The About tab's “made by” section credits Jason Tran and Naman Sonawane. It uses the same paper frames, Caveat lettering, and maroon colour as the rest of the site.

Names and portrait paths live in `lib/developers.ts`. The credits use their own small data file, so they appear even when the class board has no approved submissions or MongoDB is unavailable.

## Add the photos

1. Create `public/developers/` and add the two portraits as `jason-tran.jpg` and `naman-sonawane.jpg`.
2. In `lib/developers.ts`, uncomment each person's `photo` line. Use a different extension there if the uploaded file is a PNG or WebP.
3. Save and refresh locally, or commit the photos and the data change to deploy them.

For a different crop, add `photoPosition: "50% 35%"` to that developer's object. Photos are cropped to fit their frames. Initials appear until a photo is configured, and also if its file cannot load.

To add another developer, add a record with a unique `id`, their display `name`, and an optional `photo` path. The cards wrap when needed. Keep the section compact to suit the About page's existing desktop layout.

The component is `components/about-developers.tsx`; its styles are scoped in `components/about-developers.module.css`.
