# Plaffing Prototype

Small Phaser prototype for a 2D side-scrolling platform shooter in the browser.

## Tech choice

- Phaser 3 + Arcade Physics
- Single-page setup (`index.html` + `game.js`) for fast iteration

This keeps the project very easy to run while still giving solid physics, collision,
camera control, particle effects, and a clean path to add more systems later.

## Run

1. Open a terminal in this folder.
2. Start a local static server:
   - Python: `python -m http.server 8080`
   - Node: `npx serve .`
3. Open `http://localhost:8080` in Chrome.

## Controls

- Move: `A/D` or arrow keys
- Jump: `Space`, `W`, or `Up`
- Aim: mouse
- Shoot: hold left mouse button

## Included now

- Smooth movement with acceleration, drag, jump buffer, and coyote time
- Mouse aim + rapid fire bullets
- Timed kill-streak combo system with score multipliers and milestone feedback
- Floating balloons you can pop for random powerups (heal, rapid-fire boost, shield)
- Platform collisions and camera follow
- Procedural pixel-style player and environment textures
- Multi-layer parallax background
- Simple particle effects for muzzle and impact
