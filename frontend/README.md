# ApplicationBoard frontend

React + Vite app for the FastAPI backend in `../backend`.

## Run it

1. Start the backend on port 8000:

   ```bash
   cd backend
   uv run fastapi dev main.py
   ```

2. In a second terminal, start the frontend:

   ```bash
   cd frontend
   npm install      # first time only
   npm run dev
   ```

3. Open http://localhost:5173.

During development, Vite forwards every `/api/...` request to `http://localhost:8000`, so the browser treats the API as the same site. That's what lets the login cookie work with no extra setup.

## Other commands

| Command | What it does |
| --- | --- |
| `npm test` | Runs the Vitest unit tests for `src/lib` |
| `npm run lint` | Runs ESLint |
| `npm run build` | Builds a production bundle into `dist/` |

## Layout

- `src/lib/`: the API helper and pure logic (query strings, status colours, dropdown matching, validation, link safety), each with a `*.test.js` beside it.
- `src/components/`: one file per screen or piece of UI. `Dashboard.jsx` owns all server data and refetches everything after each change.
- `src/styles.css`: every style, with the colour tokens at the top.
