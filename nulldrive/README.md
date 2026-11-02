# NULLDRIVE: Overclock

A playable prototype of a fictional neon street race, built on the Slipstream design system. The Neo-Kyoto Night GP is Season 02 · Neon Monsoon. Prototype by Hartzell Design.

NULLDRIVE, Hartzell, and every driver, car, and time in this folder are fictional.

## Play

No build step is required. Serve the repository root and open `nulldrive/game-ui/` (the committed pages are what GitHub Pages will host at `/prototype/nulldrive/game-ui/`).

Flow: main menu → car select → 3-lap race → results. Esc pauses. Race again, the garage, and the main menu are on the results screen.

Your best lap is saved in `localStorage`, per car.

## Controls

| Input | Action |
| --- | --- |
| W / ↑ | Accelerate |
| S / ↓ | Brake (hold with steering to kick the car into a drift) |
| A D / ← → | Steer |
| Shift or Space | Overclock. Drains the nitro meter; it recharges, faster while you are drafting |
| Esc or P | Pause |
| ↑ ↓ Enter | Menu |
| ← → Enter, Esc | Browse cars, race, back |

A gamepad works too: left stick steers, right trigger accelerates, left trigger brakes, and A or the right bumper fires overclock.

Add `?bot` to the game URL to watch an AI drive your car through the same race.

## Cars

You are HARTZ. The car you do not pick is driven by a rival:

| Car | Driver | Feel |
| --- | --- | --- |
| KAGE R-7 | VEX | Precise, high grip |
| SERAPH GT | KAIZEN | Long-legged, big nitro reserve |
| MERIDIAN X | ORIN-9 | Quick, happiest sideways, nitro charges while drifting |
| OBSIDIAN V12 | HALCYON | Highest top speed, slow to turn in |

The other three run the racing line with a little weave and a light rubber-band so a lonely leader does not vanish. Laps only count when you pass the gates in order. Cutting the infield does not. Pointed the wrong way, the HUD says so.

## Structure

Slipstream sources (tokens, type, HUD components) live next to `build.py`:

- `shared.css`, `shared.js` — design tokens and the live HUD (`SD.hud`, gauge, nitro, lap timer, minimap, damage, toasts)
- `root.html`, `library.html`, `game-ui.html`, `case-study.html` — page sources with `<!--@NAV-->` / `/*@CSS*/` / `/*@JS*/` placeholders

`python3 build.py` inlines those into the pages that are actually served:

- `index.html` — Slipstream hub
- `library/` — design library
- `game-ui/` — the playable race
- `case-study/` — how the HUD evolves across five fictional releases

`game-ui/race.js` is the three.js circuit, arcade physics, and rival AI. It is loaded as an ES module from a CDN import map and is not passed through `build.py`, so edits to it show up on refresh. The race HUD is the same Slipstream components as the library.

The track is a closed street circuit (long front straight, esses, a chicane, and a tighter corner). Walls stop you. The runoff slows you down. Hitting a wall or a rival costs speed and marks the damage diagram.
