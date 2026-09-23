# MyKolkata 

MyKolkata is a production-ready application for exploring Kolkata, sponsored by <img src="../frontend/public/anakin.png" alt="Anakin" height="20" align="absmiddle" />.


## Technical docs:

The production frontend lives in **[`frontend/`](frontend/)**.

## Quick Start

```bash
cd frontend
put .env.local in frontend/
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

```bash
npm install
npm run dev
```


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


## License

**Proprietary — All Rights Reserved**

The source code in this repository is publicly viewable but is **not open source**.

You may inspect the code for personal/reference purposes, but you may not copy,
modify, redistribute, sublicense, publish, or create derivative works from it
without explicit written permission from the copyright holder.

See [LICENSE](../LICENSE) for the full terms.

© 2026 Rajarshi Datta. All rights reserved.
