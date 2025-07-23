# Backend API

## Setup

1. `cp .env.example .env` → fill in your values  
2. `npm install`  
3. `npm run dev`  (development)  
4. `npm start`    (production)

## Project Structure

- **src/** — source code  
  - **config/** — DB & env setup  
  - **controllers/** — route handlers  
  - **models/** — Mongoose schemas  
  - **routes/** — Express routers  
  - **middleware/** — auth, validation, errors  
  - **services/** — external integrations (email, etc.)  
  - **utils/** — helpers, standard responses  
  - **index.js** — app bootstrap

- **tests/** — Jest + Supertest  

## Scripts

- `npm run dev` — start with nodemon  
- `npm test`    — run unit & integration tests  
- `npm run lint`/`format` — ESLint + Prettier  

