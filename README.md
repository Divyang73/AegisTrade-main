# AegisTrade

AegisTrade is a professional-style educational trading simulator. It combines a PostgreSQL-native matching engine, a FastAPI gateway, a real-time market clock, algorithmic bots, and a dark TradingView-style frontend.

This repository is currently configured as a single-user teaching/demo platform. The current human trader is represented by the fixed actor `human-user`, while `market-maker`, `algo-sma`, and `algo-rsi` act as built-in system participants. The architecture is already structured so future multi-user support can be added without redesigning the data model.

## What This Project Does Today

- Streams preloaded historical market data as live ticks.
- Lets the human trader place market and limit orders.
- Routes every order into PostgreSQL for matching and execution.
- Runs algorithmic bots that place trades automatically.
- Shows live trading, portfolio data, bot statistics, and a global UTC date/time clock in the browser.

## Tech Stack

- PostgreSQL 15+
- Python 3.11+
- FastAPI + asyncpg
- Next.js 15 + React 19
- lightweight-charts for price visualization

## Repository Layout

- `database/schema.sql` creates tables, constraints, and indexes.
- `database/procedures.sql` creates the `process_order` stored procedure and seeds demo users.
- `database/import_historical_data.sql` loads the historical CSV into PostgreSQL.
- `backend/` contains the API, market streamer, and account bootstrap logic.
- `bots/` contains the trading bots.
- `frontend/` contains the UI.

## Quick Start

### 1. Create the database

Create a PostgreSQL database named `aegistrade`, or use your own database name and update `DATABASE_URL` accordingly.

```bash
createdb aegistrade
psql -d aegistrade -f database/schema.sql
psql -d aegistrade -f database/procedures.sql
psql -d aegistrade -f database/import_historical_data.sql
```

If `master_historical_data.csv` is in a different location, update the `COPY` path in `database/import_historical_data.sql` first.

### 2. Start the backend

From the repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/aegistrade"
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will:

- connect to PostgreSQL through `asyncpg`
- seed the `market-maker` account for the demo
- start the background simulation clock
- expose REST and WebSocket endpoints

### 3. Start the frontend

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

### 4. Start backend + all bots at once (recommended)

From the repository root:

```bash
chmod +x start_all.sh
./start_all.sh
```

This starts:

- backend (`backend.main:app`)
- market maker (`bots/market_maker.py`)
- SMA (`bots/algo_sma.py`)
- RSI (`bots/algo_rsi.py`)
- EMA (`bots/algo_ema.py`)
- Bollinger (`bots/algo_bollinger.py`)
- MACD (`bots/algo_macd.py`)
- Donchian (`bots/algo_donchian.py`)
- ROC (`bots/algo_roc.py`)

Logs are written to `logs/*.log`.

### 5. Start bots manually (optional)

Open extra terminals if you want the simulation to trade automatically.

#### Market maker

```bash
source .venv/bin/activate
python bots/market_maker.py
```

#### SMA bot

```bash
source .venv/bin/activate
python bots/algo_sma.py
```

#### RSI bot

```bash
source .venv/bin/activate
python bots/algo_rsi.py
```

#### EMA bot

```bash
source .venv/bin/activate
python bots/algo_ema.py
```

#### Bollinger bot

```bash
source .venv/bin/activate
python bots/algo_bollinger.py
```

#### MACD bot

```bash
source .venv/bin/activate
python bots/algo_macd.py
```

#### Donchian bot

```bash
source .venv/bin/activate
python bots/algo_donchian.py
```

#### ROC bot

```bash
source .venv/bin/activate
python bots/algo_roc.py
```

The bots connect to `ws://localhost:8000/ws/market` and submit orders to `http://localhost:8000/api/orders`.

## Environment Variables

- `DATABASE_URL` controls the PostgreSQL connection string used by the backend.
- `NEXT_PUBLIC_API_URL` controls the browser-facing API base URL.
- `SIMULATION_INTERVAL_SECONDS` controls the market tick rate.
- `MARKET_MAKER_CASH` controls the bootstrap cash for the liquidity bot.
- `MARKET_MAKER_INVENTORY` controls the bootstrap inventory for the liquidity bot.
- `MARKET_MAKER_ORDER_QTY` controls how many shares the market maker posts per quote.
- `ALGO_USER_ID` controls the SMA bot user id.
- `ALGO_SYMBOL` controls the SMA bot symbol.
- `ALGO_ORDER_QTY` controls the SMA bot order size.
- `ALGO_RSI_USER_ID` controls the RSI bot user id.
- `ALGO_RSI_SYMBOL` controls the RSI bot symbol.
- `ALGO_RSI_ORDER_QTY` controls the RSI bot order size.
- `ALGO_RSI_WINDOW` controls the RSI lookback window.
- `ALGO_EMA_USER_ID`, `ALGO_EMA_SYMBOL`, `ALGO_EMA_ORDER_QTY`, `ALGO_EMA_FAST_WINDOW`, and `ALGO_EMA_SLOW_WINDOW` control EMA behavior.
- `ALGO_BOLLINGER_USER_ID`, `ALGO_BOLLINGER_SYMBOL`, `ALGO_BOLLINGER_ORDER_QTY`, `ALGO_BOLLINGER_WINDOW`, and `ALGO_BOLLINGER_STD` control Bollinger behavior.
- `ALGO_MACD_USER_ID`, `ALGO_MACD_SYMBOL`, `ALGO_MACD_ORDER_QTY`, `ALGO_MACD_FAST_WINDOW`, `ALGO_MACD_SLOW_WINDOW`, and `ALGO_MACD_SIGNAL_WINDOW` control MACD behavior.
- `ALGO_DONCHIAN_USER_ID`, `ALGO_DONCHIAN_SYMBOL`, `ALGO_DONCHIAN_ORDER_QTY`, and `ALGO_DONCHIAN_WINDOW` control Donchian behavior.
- `ALGO_ROC_USER_ID`, `ALGO_ROC_SYMBOL`, `ALGO_ROC_ORDER_QTY`, `ALGO_ROC_WINDOW`, `ALGO_ROC_BUY_THRESHOLD`, and `ALGO_ROC_SELL_THRESHOLD` control ROC behavior.

## System Architecture

Frontend (Next.js)
→ Backend (FastAPI)
→ PostgreSQL (matching engine, procedures, analytics)

The practical data flow is:

1. Historical bars are loaded into PostgreSQL.
2. The backend market streamer emits one tick at a time.
3. Bots listen to the market stream and submit orders.
4. FastAPI forwards orders directly to `CALL process_order(...)`.
5. PostgreSQL matches orders, updates wallets and positions, and logs trades.
6. The frontend renders trading and analytics views from the database.

## Current Scope

This is intentionally a single-user educational platform for now.

- Human trading is represented by `human-user`.
- Algorithmic participants are built-in demo actors, not authenticated customers.
- The UI is designed for learning and demonstration, not production account management.
- The code already uses `user_id` as the main key, so multi-user support can be added later.

## Implemented Today

- PostgreSQL-backed order matching
- Market and limit orders
- Portfolio retrieval
- Algorithm statistics for all live strategies (`algo-sma`, `algo-rsi`, `algo-ema`, `algo-bollinger`, `algo-macd`, `algo-donchian`, `algo-roc`)
- Recent trades feed
- Order book aggregation
- Historical market charting
- Market maker + SMA/RSI/EMA/Bollinger/MACD/Donchian/ROC bots
- Global UTC clock in the header with current date and time
- Dark trading and analytics dashboards

## Future Implementation Roadmap

This is the roadmap for the next phase of the project.

### Phase 1: Per-algorithm detail pages

Target route: `/algorithms/{algo_name}`

Each page should show:

- live trades
- current positions
- order activity
- realized and unrealized PnL
- win rate
- Sharpe ratio where feasible
- total trades
- average trade size
- drawdown
- equity curve
- chart overlays for the strategy

### Phase 2: Learning pages

Target route: `/learn/{algo_name}`

Each learning page should explain:

- the concept in plain language
- the technical logic and math
- when the strategy works
- when it fails
- real-world usage
- a visual diagram
- a sample walkthrough

The first learning pages should cover:

- SMA crossover
- RSI
- mean reversion / pairs trading
- optional momentum or breakout strategies later

### Phase 3: Stronger analytics and leaderboard

- Add a PostgreSQL materialized view for leaderboard reads.
- Surface total executed trades, cash balance, equity, and ranking.
- Add a leaderboard page in the frontend.
- Expand strategy stats to include richer performance metrics.

### Phase 4: Database scaling

- Partition `historical_data` by time so large market datasets stay fast.
- Keep the current import flow compatible with partitioned storage.
- Make sure queries only scan the partitions they need.

### Phase 5: Safer backend execution

- Add deadlock retry handling around trade submission.
- Add LISTEN/NOTIFY for real-time trade and order events.
- Keep WebSocket market streaming, but make event delivery more robust.
- Preserve transaction safety and row-level locking in the matching engine.

### Phase 6: Platform polish

- Add a smoother navigation flow between trading, algorithms, and learning.
- Keep the UI minimal, dark, and professional.
- Use progressive disclosure so the interface stays readable.
- Add optional notifications for fills and strategy signals.

## Useful API Endpoints

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
