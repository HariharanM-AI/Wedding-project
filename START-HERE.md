# Start here — Ananya & Karthik invitation

This archive contains the latest scrolling-only invitation, including the smooth animation engine, clouds, butterflies, all photographs, illustrated layers, fonts, font licenses, calendar, reusable components, configuration, and dependency lockfile.

## Run the application

Use Node.js 22.13 or newer and pnpm 11.25.0 (the version recorded in package.json).

Open a terminal in this folder, then run:

```sh
corepack enable
corepack prepare pnpm@11.25.0 --activate
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:5173 in your browser. Installation needs internet access to download the declared dependencies. If pnpm is already installed at the required version, skip the first two commands.

For a production build:

```sh
pnpm build
```

This project uses React, TypeScript and Vinext, with Cloudflare-compatible build configuration. No external image URLs or secret API keys are needed for the invitation.

## Where to edit

- app/page.tsx — wedding content, scroll animation, interactive opening, event dialogs.
- app/globals.css — colors, typography, scene layout, cloud and butterfly motion, responsive styles.
- app/layout.tsx — page title and metadata.
- public/art/ — optimized transparent temple, gateway, couple, arch, landscape, cloud and butterfly artwork used by the app.
- public/images/ — all four wedding/travel photographs used by the app.
- public/fonts/ — every self-hosted font file and its license.
- public/ananya-karthik-wedding.ics — downloadable four-event calendar.
- design-assets/originals/ — all seven available full-resolution PNG illustration originals, in addition to the production assets.
- README.md and DESIGN-NOTES.md — implementation and choreography notes.
- FILE-MANIFEST.json — archive inventory and SHA-256 checksums.

The invitation uses normal scrolling and swiping. Video playback controls and autoplay have been removed. Names, dates and venue details are demonstration content.

All project source and runtime assets are included. Dependencies are restored with pnpm; installed node_modules, Git history, generated builds, temporary previews and cache files are omitted.

Source revision: abe2a287458a76321d75df80c9cad1d164110d90
