# AegisTrade

AegisTrade is a financial engine designed to simulate the core mechanics of a modern stock exchange. It emphasizes high-speed order processing and deterministic settlement so students can study exchange internals, concurrency control, and transaction durability.

What this project does
- Simulates live market ticks from historical data and streams them to bots and a frontend UI.
- Accepts buy and sell orders from bots and the UI and routes them into the database for matching and execution.
- Implements a database-native matching engine and provides observability for strategy metrics and system state.

Primary objectives (course brief)
- High-speed order processing with price-time priority matching.
- Dual-layer persistence and durability for performance-sensitive workflows.
- Adaptive liquidity: dynamic spread adjustment responsive to market volatility.
- Race-condition prevention and deterministic settlement with ACID guarantees.

Scope and current implementation
- Matching engine: core order matching and trade settlement are implemented inside PostgreSQL stored procedures. Orders are matched by price and time priority.
- Persistence: the current implementation uses PostgreSQL as the single, durable source of truth. The course brief mentioned a dual-layer approach (Redis + PostgreSQL); this repository focuses on a single durable layer (PostgreSQL) and achieves safety and determinism through transaction design and locking.
- Adaptive liquidity: a market-maker component adjusts quoted spreads based on recent price volatility.
- Telemetry and observability: the backend records trades, positions, and runtime telemetry; the frontend exposes dashboards for algorithms, strategies, and system health.

DBMS concepts used and why
- Row-level locking (`FOR UPDATE` / `FOR UPDATE SKIP LOCKED`): prevents double-matching and allows safe concurrent order processing without application-level race conditions.
- Atomic transactions (ACID): trade matching, wallet updates, and position changes occur in a single transaction to ensure consistency and durability.
- Deterministic stored procedures: core matching logic is executed in the database to reduce network round-trips and to centralize concurrency control.
- Indexing and query tuning: appropriate indexes are used to make orderbook and historical lookups efficient.

Common problems encountered and how they were solved
- Race conditions when processing concurrent orders: solved by using row-level locks and performing matching inside a single stored procedure so that the database enforces serializability of conflicting operations.
- State synchronization between volatile runtime data and persistent storage: solved by writing final trade and wallet changes to PostgreSQL immediately in the matching transaction, keeping the persistent state authoritative.
- Ensuring deterministic outcomes for grading and analysis: by centralizing matching logic in stored procedures, the same set of inputs produces reproducible results.

How the objectives map to implementation
- High-speed matching: implemented via stored procedures calling efficient indexed queries and using `FOR UPDATE SKIP LOCKED` to iterate book entries without contention.
- Durability and correctness: PostgreSQL is the source of truth; every trade is logged to the `trades` table within the committing transaction.
- Adaptive liquidity: market-maker logic consumes recent price history and computes a volatility estimate used to widen or tighten quoted spreads.

Quick start (development)
1. Install prerequisite software: PostgreSQL 15+, Python 3.11+, Node.js (for frontend).

2. Create and prepare the database
```bash
createdb aegistrade
psql -d aegistrade -f database/schema.sql
psql -d aegistrade -f database/procedures.sql
psql -d aegistrade -f database/import_historical_data.sql
```

3. Backend (API + simulator)
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/aegistrade"
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

4. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

5. Open the app in your browser
- Trading: `http://localhost:3000/trading`
- Algorithms: `http://localhost:3000/algorithms`


