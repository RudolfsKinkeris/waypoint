# bootcamp-app

Minimal full-stack skeleton: an Express API in `server/` and a React (Vite) client in `client/`.

## First-time setup

```
npm run install:all
```

## Run everything (server + client) with one command

```
npm run dev
```

- Server runs on http://localhost:3001
- Client runs on http://localhost:5173 and proxies `/api` requests to the server

Open http://localhost:5173 in your browser — you should see a page that says
"Hello from the server!", fetched live from the Express API.

## Project layout

```
server/       Express API (entry point: server/index.js)
client/       React app (source in client/src/)
```

Add new routes in `server/index.js` and new UI in `client/src/App.jsx` as you build out
each session's features.
