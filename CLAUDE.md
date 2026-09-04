# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Dharmi Ice Cream & Kulfi — a point-of-sale web app for a small ice cream shop. Orders are saved directly to a Google Sheet via the Sheets API v4. No database, no build step, no framework.

## Running Locally

```bash
cp .env.example .env   # fill in real Google credentials
node server.js
```

App runs at `http://localhost:3000`. No build required — plain HTML/CSS/JS served statically.

## Environment Variables (required)

| Variable | Description |
|---|---|
| `GOOGLE_CLIENT_EMAIL` | Service account email |
| `GOOGLE_PRIVATE_KEY` | Service account private key (newlines as `\n`) |
| `GOOGLE_SHEET_ID` | Full Google Sheets URL or just the spreadsheet ID |

## Architecture

**Two distinct runtime environments share the same API handler files:**

1. **Local dev** — `server.js` (plain Node `http` module) routes `/api/*` to `api/<name>.js` handlers. It clears `require.cache` on each request so file changes reflect without restart. It wraps `res` in a `fakeRes` shim that matches Vercel's response API.

2. **Production** — Vercel serverless functions. `vercel.json` routes `/api/*` → `api/$1` and everything else → `public/$1`. Each `api/*.js` file exports a single async `handler(req, res)` function — this is the Vercel function signature.

**The shim in `server.js` is the compatibility layer.** API handlers must only use: `res.status(n)`, `res.json(data)`, `res.setHeader(k,v)`, `res.end()`. Don't use Express-specific methods.

**Google Sheets as the database:** All order data lives in `Sheet1` with columns `[OrderId, DateTime, Items, Total]`. Order IDs auto-increment from 101 by reading the last row. Items are stored as `"Category: Name xQty"` strings (e.g. `"Kulfi: Kaju Anjir x2, Ice Cream: Jamun x1"`). The category prefix disambiguates duplicate item names across categories.

**Frontend is vanilla JS, no bundler.** `public/app.js` loads `menu.json` at startup and manages all state in module-level vars (`menu`, `order`, `activeCategory`). All DOM manipulation is direct innerHTML — no virtual DOM.

## Pages

| File | Purpose |
|---|---|
| `public/index.html` + `app.js` | POS — add items, place orders |
| `public/orders.html` | View/edit/delete past orders |
| `public/analytics.html` | Sales analytics |
| `public/profit.html` | Day-wise profit & margin analysis |

## Menu Data

`public/menu.json` — static JSON array. Each item has `id`, `name`, `price`, `purchasePrice`, `category`. Categories: `Kulfi`, `Ice Cream`, `Lassi`. To add/change items, edit this file directly.

## API Endpoints

All handlers in `api/`. Each file exports one async function.

| Route | File | Method |
|---|---|---|
| `/api/order` | `order.js` | POST — place new order |
| `/api/orders` | `orders.js` | GET — fetch all orders (newest first) |
| `/api/update-order` | `update-order.js` | POST — edit existing order |
| `/api/delete-order` | `delete-order.js` | POST — delete order row |

Adding a new API endpoint = create `api/<name>.js` exporting `async function handler(req, res)`. It works on both local and Vercel automatically.
