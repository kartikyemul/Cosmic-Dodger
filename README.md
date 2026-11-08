# Cosmic Dodger: Neon Gravity

A small arcade game that runs fully in the browser. No backend, no accounts, no database.
Fly home through the solar system, from Neptune past every planet to Earth, and dodge everything on the way.

```bash
npm install
npm run dev
```

Controls: mouse, touch or arrow keys / WASD. Esc pauses, M mutes.
Best score, your tag and your top 5 runs are saved on your device only.

Built with Vite, TypeScript, HTML5 Canvas and Tailwind CSS.
Sound is made with the Web Audio API, so there are no asset files.

Run the logic tests with `npm test`.

Testing shortcut in dev: `?journey=40&god` makes the trip 40 seconds long and stops you dying.

## Customising

Open the Hangar from the start, pause or result screens to pick a ship, a colour and a theme.
Ships and colours unlock by reaching planets. Festive themes switch on by date (or pick one yourself).
Moving festival dates live in `src/game/themes.ts`, add next year's before they pass.

## Daily Run and sharing

The Daily Run uses today's date as a seed, so everyone gets the same rock schedule that day (rocks aimed at you still lean toward where you are).
Your daily best and streak are saved on your device. After a run, Share makes a picture card with your score and opens the share sheet on a phone, or saves the image on a computer.
Rocks that slip past very close throw sparks and make a small tick.
