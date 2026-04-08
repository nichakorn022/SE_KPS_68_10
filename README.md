# Teactive

## Running (local)

- Backend API: `node server/server.js` (default `http://localhost:3001`)
- Frontend dev (with `/api` proxy): `npm run dev`
- Build + single-server preview: `npm run build` then `node server/server.js` and open `http://localhost:3001`

## Railway Deploy

This repo is prepared to deploy to Railway as a single service via the included `Dockerfile`.

Railway setup:

- Create a new service from this GitHub repo.
- Railway will detect the `Dockerfile` automatically.
- No custom build command is required.
- No custom start command is required.

Required environment variables:

- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`

Optional environment variables used by the app:

- `FRONTEND_URL`
- `EMAIL_USER`
- `EMAIL_PASS`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_BASE_URL`

Notes:

- The backend serves the built Vite app from `dist/`, so frontend and API run together in one Railway service.
- Uploaded files in `server/uploads` are not persistent on Railway. Use object storage for long-term file retention.
- If you provision MySQL on Railway, map its connection values into the `DB_*` variables above.

## Frontend Environment

- `VITE_API_BASE_URL` defaults to `/api`
- `VITE_API_ORIGIN` can be left empty when frontend and backend are served from the same Railway domain

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
