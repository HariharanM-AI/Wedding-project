# Ananya & Karthik — A Beautiful Beginning

A scroll-controlled wedding film rendered in a web application. One fixed viewport stage composes nine overlapping scenes from original transparent illustration layers. There is no conventional page-section layout or navigation bar.

## Scrolling through the invitation

Scroll or swipe to move forward and backward through the scenes. Normal browser keyboard scrolling (Space, arrows, Page Up/Down, Home/End) remains available. The monogram links back to the opening. The invitation has no video controls, automatic playback, timeline slider or full-screen toggle.

## Edit the invitation

Sample names, copy, event details and motion ranges are in `app/page.tsx`. Layout and responsive framing are in `app/globals.css`. Metadata is in `app/layout.tsx`. Update `public/ananya-karthik-wedding.ics` whenever the event details change. Its four event timestamps use UTC, corresponding to IST in the invitation.

Original transparent artwork is under `public/art`; supporting generated photography is in `public/images`. Architecture is an artistic Chola-inspired visualization, not documentary imagery of a named landmark. All names, dates, people and venues are demonstration content.

## Development

React, TypeScript and Vinext. Use the project lockfile when installing dependencies. `pnpm dev` starts development; `pnpm build` creates production output. The managed preview and publishing helpers use `.openai/hosting.json`.

## Accessibility

Native scrolling, keyboard-accessible controls, visible focus, meaningful alternatives, focus-trapped event dialogs, and inactive-scene focus protection. Reduced-motion preferences remove entrance travel and scene interpolation. Calendar downloads work without submitting any information.

See `DESIGN-NOTES.md` for the reference choreography and original artwork direction. Font licenses are included under `public/fonts`.

## Motion refinement

Wheel movement eases into the scene over a 190 ms time constant; touch keeps a shorter 80 ms response and native momentum. Only active and approaching scenes are animated or promoted for compositing. Unchanged style/accessibility values are cached, animation frames stop when the scene settles, and no scroll position is stored in React state. Background tabs suspend animation work. The celebration frame keeps a subtle continuous drift as its cards move sideways.

The opening includes two optimized original raster assets: clouds drifting behind the names and four small jade-and-gold butterflies. Their wings and flight paths animate with transforms. Pointer movement provides a small depth response; touch has a gentle temporary response without blocking scrolling. Independent flutter and drift rest while scrolling, when the whole atmosphere instead follows the scene; they resume when scrolling settles. They also pause outside the intro and respect reduced-motion preferences.
