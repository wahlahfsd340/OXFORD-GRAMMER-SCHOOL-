# Oxford Grammar School - MERN (MongoDB + Express + React + Node)

## Pehli dafa (local)

1. Node 18+ aur MongoDB chahiye. MongoDB Atlas (free) ya local. Atlas ka connection string `MONGODB_URI` mein.
2. `cd server && npm install && cp .env.example .env` (.env mein MONGODB_URI, JWT_SECRET, ANTHROPIC_API_KEY bharein) phir `npm run dev`
3. Doosre terminal: `cd client && npm install && npm run dev` > http://localhost:5173
   Admin: /login (admin / Change@123) > Dashboard > Change password.

## Live (.com / .site) - ek hi server

`cd client && npm run build` phir `cd ../server && npm start` (Express `client/dist` bhi serve karta hai). Render/Railway/VPS par `server` folder deploy karein, env variables wahan set karein, domain connect karein. Database Atlas mein hai, is liye data restart par nahi jata.

## Vercel

Project root se `npm install` aur `npm run build` chalayein. Vercel par project root deploy karein; Express backend `/api` routes serve karega aur React build `public/` se serve hoga. Vercel project ke Production Environment Variables mein `MONGODB_URI` (MongoDB Atlas connection string), `JWT_SECRET` (lamba random secret), aur `ADMIN_PASS` (admin ka initial password) set karna zaroori hai. `ANTHROPIC_API_KEY` optional hai; is ke baghair website ka AI chat fallback response deta hai. Secrets chat ya source code mein na rakhein.

## Kahan se badlein

Naam, phone, timings, holiday, AI notes: Dashboard > School settings. Classes: `server/defaults.js`. Rang: `client/src/style.css`. Urdu alfaz: `client/src/lang_ur.json`.
