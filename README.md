# Emoji Match

A real-time 2-player emoji matching game. Both players pick an emoji — if they match, they win. Build a streak by winning consecutive rounds.

**Play it:** https://nick-nijland.github.io/emoji-game/

## How to play

1. Player 1 opens the app and creates a room — they get a 4-digit code
2. Player 2 opens the app on their device and enters the code to join
3. Each round, both players are shown the same 4 random emojis and pick one simultaneously
4. If both picked the same emoji, the streak goes up — if not, it resets

## Stack

- **Frontend** — Angular (signals, standalone components), hosted on GitHub Pages
- **Backend** — Node.js + Express + Socket.IO, hosted on Render
- **Emojis** — full Unicode emoji set via `unicode-emoji-json` (~1900 emojis)

## Running locally

**Start the backend** (port 3000):
```bash
cd server
npm install
npm start
```

**Start the frontend** (port 4200):
```bash
npm install
npm start
```

Open `http://localhost:4200` on two devices (or two browser tabs) and start playing.
