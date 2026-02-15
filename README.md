# Icon Animator ✦

A visual tool for creating animated SVG icons with [`motion/react`](https://motion.dev) code output.

## What It Does

1. **Paste an SVG** — grab any icon from [lucide.dev](https://lucide.dev/icons), Heroicons, or any SVG source
2. **Animate visually** — select individual elements, drag to move, adjust rotation/scale/opacity, set easing and timing
3. **Copy the React component** — get a ready-to-use `motion/react` component with hover animations

No design tool needed. No manual keyframe writing. Just paste → tweak → copy.

## Features

- Per-element animation controls (translate, rotate, scale, opacity)
- Drag-to-move on the canvas
- Wrap-around animation mode
- Frame/border settings for the icon container
- Animation presets (Bounce, Shake, Pulse, Fade In)
- Scalable preview (24px–256px)
- Clean `motion/react` code export with `forwardRef` and imperative API

## Getting Started

```bash
# Clone the repo
git clone https://github.com/itshover/icon-animator.git
cd icon-animator

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and pick a version to start animating.

## Versioned Releases

Each major iteration of the editor lives at its own route:

| Route | Description     |
| ----- | --------------- |
| `/v1` | Initial release |

The landing page (`/`) links to all available versions.

## Tech Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript)
- [Tailwind CSS](https://tailwindcss.com) for styling
- Pure React for the editor — no runtime animation dependencies
- [`motion/react`](https://motion.dev) only in the *generated output code*

## Credits

Inspired by [itshover.com](https://itshover.com) ([GitHub](https://github.com/itshover/itshover)).

## License

[MIT](LICENSE)
