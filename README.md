# aegistrade

aegistrade is a dbms course project that simulates a small stock exchange for learning. it uses a postgres-native matching engine, a fastapi gateway, a real-time market streamer, and a next.js trading ui.

## what it is

- single-user teaching platform with a fixed human actor and built-in bots
- deterministic order matching and settlement inside postgresql (no redis)
- adaptive market maker quotes based on rolling volatility (deterministic, not ml)

## what works now

- market + limit orders, order book aggregation, and trade ledger
- portfolio and equity view for the human trader
- live market ticks from historical data
- algorithmic bots (sma, rsi, ema, bollinger, macd, donchian, roc, market maker)
- strategy metrics, tooltips, and learning pages
- websocket feeds for ticks and recent trades

## how it works (short)

1. historical bars live in postgresql and are streamed as ticks.
2. bots and the ui submit orders to fastapi.
3. fastapi calls the `process_order` stored procedure.
4. postgresql matches orders with row-level locks for atomic, race-free execution.
5. trades, positions, and wallets are updated in a single transaction.
6. the ui reads state and metrics from the database.

## persistence and consistency

- durable layer: postgresql tables for orders, trades, positions, wallets, and history
- runtime layer: backend keeps a small in-memory state for streaming ticks and telemetry, then syncs results to postgresql on every tick
- no redis or cache invalidation: postgresql is the source of truth

## tech stack

- postgresql 15+
- python 3.11+, fastapi, asyncpg
- next.js 15, react 19, lightweight-charts

## quick start

### 1. create the database

create a postgresql database named `aegistrade`, or use your own name and update `DATABASE_URL` accordingly.

```bash
createdb aegistrade
psql -d aegistrade -f database/schema.sql
psql -d aegistrade -f database/procedures.sql
psql -d aegistrade -f database/import_historical_data.sql
```

if `master_historical_data.csv` is in a different location, update the `COPY` path in `database/import_historical_data.sql` first.

### 2. start the backend

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/aegistrade"
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. start the frontend

```bash
cd frontend
npm install
export NEXT_PUBLIC_API_URL="http://localhost:8000"
npm run dev
```

then open:

- `http://localhost:3000/trading`
- `http://localhost:3000/algorithms`

### 4. start bots manually (optional)

```bash
source .venv/bin/activate
python bots/market_maker.py
```

repeat with any of the other bot files (e.g. `bots/algo_sma.py`, `bots/algo_rsi.py`).
