# Cosmic Dodger: Neon Gravity

```bash
npm install
cp .env.example .env.local   # optional until step 4
npm run dev
```

Structure
- `src/game/`       engine, physics, input, canvas rendering (palette.ts reads CSS tokens)
- `src/components/` glass UI: start screen, HUD, game-over, ambient light
- `src/services/`   Supabase client, leaderboard, audio
- `src/style.css`   all design tokens (Tailwind v4 `@theme`) and glass utilities
