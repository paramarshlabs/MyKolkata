# MyKolkata

MyKolkata is a production-ready Next.js application for exploring Kolkata.

The production frontend lives in **[`frontend/`](frontend/)**.

## Quick Start

```bash
cd frontend
cp .env.example .env.local
```

Fill in the required environment variables for Clerk, PostgreSQL, and Ola Maps, then install dependencies and start the development server:

```bash
npm install
npm run dev
```

You can also run the application from the repository root:

```bash
npm run dev
npm run build
npm test
```

## Tech Stack

* **Next.js 16** — App Router
* **React 19** + **TypeScript**
* **Tailwind CSS 4** — with custom brand tokens
* **Clerk** — authentication
* **Prisma** + **PostgreSQL** — database and persistence
* **Ola Maps** — location and "Near You" functionality

## Project Structure

```text
.
├── frontend/
│   ├── app/                 # App Router routes and API handlers
│   ├── components/          # UI, layout, explore, and providers
│   ├── lib/                 # Database, catalogue, and places domain logic
│   ├── prisma/              # Prisma schema and database configuration
│   ├── scripts/             # Utility and database scripts
│   ├── public/              # Static assets
│   ├── styles/              # Global styles and brand tokens
│   └── tests/               # Domain, catalogue, and map contract tests
│
└── design/                  # Brand and design references
```

## Environment Variables

Create `frontend/.env.local` from the provided example:

```bash
cp frontend/.env.example frontend/.env.local
```

Configure the required credentials for:

* Clerk authentication
* PostgreSQL / Prisma
* Ola Maps

## Available Scripts

Run these commands from `frontend/`:

| Command           | Description                                          |
| ----------------- | ---------------------------------------------------- |
| `npm run dev`     | Start the development server                         |
| `npm run build`   | Generate Prisma client and create a production build |
| `npm start`       | Serve the production build                           |
| `npm test`        | Run domain, catalogue, and map contract tests        |
| `npm run db:push` | Push the Prisma schema to the database               |
| `npm run db:seed` | Seed the catalogue tables                            |

## Development

Start the development server with:

```bash
npm run dev
```

Then open the local application in your browser.

For database setup:

```bash
npm run db:push
npm run db:seed
```

For a production build:

```bash
npm run build
npm start
```
