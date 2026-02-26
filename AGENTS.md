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

See `server/.env.example` for all server env vars. Key ones:

- `ENCRYPTION_KEY` — **required** — 64 hex chars (32 bytes) for AES-256-GCM field encryption. Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `MONGO_URI` — MongoDB connection string (default: `mongodb://admin:chatpass123@localhost:27017/chat_app?authSource=admin`)
- `JWT_SECRET` — JWT signing secret
- `PORT` — server port (default: `5000`)
- `CLIENT_ORIGIN` — CORS origin (default: `*`)
- `REACT_APP_SOCKET_URL` — client's WebSocket target (default: `http://localhost:5000`)

### MongoDB

- MongoDB 7 runs via Docker: `sudo docker start mongodb` (container already created).
- If the container doesn't exist, create it: `sudo docker run -d --name mongodb -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=chatpass123 mongo:7`
- Docker daemon must be running first: `sudo dockerd &>/tmp/dockerd.log &`
- User data is encrypted at the application level (AES-256-GCM for email/displayName, bcrypt for passwords). See `server/crypto.js` and `server/models/User.js`.

### Notes

- Chat messages remain in-memory (not persisted to DB).
- User API: `POST /api/users/register`, `POST /api/users/login`, `GET /api/users/me` (auth), `GET /api/users`.
