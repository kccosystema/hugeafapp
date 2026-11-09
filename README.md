# HugeAF — Fitness PWA

An installable fitness app built from the Claude design canvas (`Fitness app dashboard design.zip`).
Dark brand · hot-pink accent (`#FF2E93`) · Saira Condensed + Archivo type.

## Run it

```bash
npm install
npm run dev      # local dev at http://localhost:3080
npm run build    # production build -> dist/ (manifest + service worker + offline cache)
npm run preview  # preview the production build
```

## What's built

| Screen | Route | Status |
| --- | --- | --- |
| **Home dashboard** | `/` | ✅ Full — hero, stats, programs, challenges, browse, form guide, blog, supplements |
| **Workout Tracker** | `/workout` | ✅ Full — live set logging (weight × reps), running volume/sets, timer, finish + summary |
| Exercises | `/exercises` | 🔲 Stub |
| Programs | `/programs` | 🔲 Stub |
| Progress | `/progress` | 🔲 Stub |
| Blog / Supplements | `/blog`, `/supplements` | 🔲 Stub |

The **Log set (+)** button in the bottom nav and **Start workout** on the hero both open the live tracker.

## PWA

- Installable (Add to Home Screen) with name **HugeAF**, standalone display, branded icons.
- Service worker pre-caches the app + photos for offline use (`vite-plugin-pwa`).
- The faux iOS status bar auto-hides once installed.

## Where things live

- `src/screens/` — Home, Workout, Stub
- `src/components/` — BottomNav, StatusBar
- `src/data/workout.js` — seed data (today's session, programs, challenges, stats). Swap this for a real API/store later.
- `src/index.css` — brand design tokens (`--accent`, `--surface`, fonts) as CSS variables.
- `public/assets/` — photos from the design. `public/icons/` — PWA icons (regenerate from `icon.svg`).

## Next steps

- Persist workouts (localStorage or a backend) instead of in-memory seed data.
- Build out the Exercises / Programs / Progress screens (designs exist in the original canvas).
- Deploy to Vercel: `vite build` output in `dist/` is a static site.
