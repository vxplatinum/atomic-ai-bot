# Test shops

Example websites that embed the Atomic AI Bot widget. They are **not** started by Docker Compose. Use them to see how a static page, a React app, and a Node.js app connect to the product.

Create **three different bots** in the dashboard first (one domain per shop). Paste each bot’s API token into that shop’s embed snippet **before** you start it. The same token on two sites will fail domain validation.

| Shop | Origin to register | Where to paste the token |
|---|---|---|
| Static | `127.0.0.1:5500` (or the host:port you actually serve) | `static-site/index.html` — `data-api-key` |
| React | `localhost:5174` | `react/index.html` — `data-api-key` |
| Node | `localhost:3000` | `node/views/partials/bot-widget.ejs` — `data-api-key` |

The platform services (backend `:8000`, widget `:8080`) must already be running.

## Static site

Any static server. Live Server example:

```bash
# from this folder — serve static-site so the page origin matches the bot domain
npx --yes serve static-site -l 5500
```

Open `http://127.0.0.1:5500`.

## React

```bash
cd react && npm install && npm run dev
```

Open `http://localhost:5174`.

## Node.js

```bash
cd node && npm install && npm start
```

Open `http://localhost:3000`.
