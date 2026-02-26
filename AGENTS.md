# AGENTS.md

## Cursor Cloud specific instructions

This is a Socket.IO real-time chat application with two services (no root `package.json`):

| Service | Directory | Dev Command | Port |
|---------|-----------|-------------|------|
| Backend (Express + Socket.IO) | `server/` | `npm run dev` (nodemon) | 5000 |
| Frontend (React + Tailwind) | `client/` | `npm start` | 3000 |

### Running the app

- **Start the server first** — the client dynamically loads `socket.io.js` from the server via a `<script>` tag, so the server must be running before the client can connect.
- Server: `cd server && npm run dev` (uses nodemon for hot reload)
- Client: `cd client && BROWSER=none npm start` (CRA dev server, use `BROWSER=none` to suppress auto-open)

### Lint / Test / Build

- **Lint**: `cd client && npx eslint src/` (ESLint configured via `react-app` preset in `package.json`)
- **Test**: `cd client && CI=true npm test -- --passWithNoTests` (no test files exist currently; `--passWithNoTests` avoids exit code 1)
- **Build**: `cd client && npm run build`
- Server has no lint/test setup beyond `echo "No tests specified"`.

### Environment variables

- `PORT` — server port (default: `5000`)
- `CLIENT_ORIGIN` — CORS origin for the server (default: `*`)
- `REACT_APP_SOCKET_URL` — client's WebSocket target (default: `http://localhost:5000`)

### Notes

- No database or external services required — all state is in-memory.
- The server has no `package-lock.json`; only the client has one.
