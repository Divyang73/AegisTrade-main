# AegisTrade

AegisTrade is an educational trading simulator with a PostgreSQL-native matching engine, a FastAPI backend, browser dashboards, and background bot clients.

## What You Need

- PostgreSQL 15 or newer
- Python 3.11 or newer
- Node.js 20 or newer
- `psql` available in your shell

## Project Layout

- `database/schema.sql` creates the schema
- `database/procedures.sql` creates the `process_order` stored procedure and seed users
- `database/import_historical_data.sql` loads the CSV into `historical_data`
- `backend/` contains the FastAPI API and market streamer
- `bots/` contains the background trading bots
- `frontend/` contains the Next.js App Router UI

## 1. Create The Database

Create a database named `aegistrade`, or use any name you want and set `DATABASE_URL` accordingly.

```bash
createdb aegistrade
psql -d aegistrade -f database/schema.sql
psql -d aegistrade -f database/procedures.sql
psql -d aegistrade -f database/import_historical_data.sql
```

If your CSV file is in a different location, edit the `COPY` path in `database/import_historical_data.sql` before running it.

## 2. Start The Backend

From the repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/aegistrade"
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will:

- connect to PostgreSQL with `asyncpg`
- seed the `market-maker` account with capital and inventory for the live demo
- start the background simulation clock
- expose the REST and WebSocket endpoints

## 3. Start The Frontend

Open a second terminal:

```bash
cd frontend
npm install
export NEXT_PUBLIC_API_URL="http://localhost:8000"
npm run dev
```

Then open:

- `http://localhost:3000/trading`
- `http://localhost:3000/algorithms`

## 4. Start The Bots

Open two more terminals if you want the background simulation to trade automatically.

### Market Maker

```bash
source .venv/bin/activate
python bots/market_maker.py
```

### SMA Bot

```bash
source .venv/bin/activate
python bots/algo_sma.py
```

### RSI Bot

```bash
source .venv/bin/activate
python bots/algo_rsi.py
```

The bots connect to `ws://localhost:8000/ws/market` and submit orders to `http://localhost:8000/api/orders`.

## 5. Recommended Start Order

1. Load the database schema and historical CSV.
2. Start the FastAPI backend.
3. Start the Next.js frontend.
4. Start the bots in separate terminals.
5. Open the trading dashboard and let the simulation warm up for a few seconds.

## 6. Useful API Endpoints

- `POST /api/orders`
- `GET /api/portfolio/{user_id}`
- `GET /api/algo-stats`
- `GET /api/trades/recent`
- `GET /api/orderbook/{symbol}`
- `GET /api/market/history?symbol=AAPL&limit=180`
- `WS /ws/market`

## Notes

- The matching engine lives inside PostgreSQL through `CALL process_order(...)`.
- The UI does not do in-memory matching.
- The backend seeds `market-maker` automatically on startup so the liquidity bot can trade immediately.
- If you change the database credentials, update `DATABASE_URL` before starting the backend.
