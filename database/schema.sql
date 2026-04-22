CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR PRIMARY KEY,
    is_bot BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS wallets (
    user_id VARCHAR PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    cash_balance NUMERIC(20, 2) NOT NULL DEFAULT 0,
    CONSTRAINT check_positive_balance CHECK (cash_balance >= 0)
);

CREATE TABLE IF NOT EXISTS positions (
    user_id VARCHAR NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    symbol VARCHAR NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    CONSTRAINT check_positive_qty CHECK (quantity >= 0),
    PRIMARY KEY (user_id, symbol)
);

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    symbol VARCHAR NOT NULL,
    side VARCHAR(4) NOT NULL,
    order_type VARCHAR(6) NOT NULL,
    price NUMERIC(18, 6),
    quantity INT NOT NULL,
    filled_quantity INT NOT NULL DEFAULT 0,
    status VARCHAR(16) NOT NULL DEFAULT 'open',
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_orders_side CHECK (side IN ('buy', 'sell')),
    CONSTRAINT check_orders_type CHECK (order_type IN ('market', 'limit')),
    CONSTRAINT check_orders_status CHECK (status IN ('open', 'partial', 'filled', 'cancelled')),
    CONSTRAINT check_order_quantity CHECK (quantity > 0),
    CONSTRAINT check_filled_quantity CHECK (filled_quantity >= 0 AND filled_quantity <= quantity),
    CONSTRAINT check_limit_price CHECK (order_type = 'market' OR price IS NOT NULL),
    CONSTRAINT check_limit_price_positive CHECK (order_type = 'market' OR price > 0)
);

CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id VARCHAR NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    seller_id VARCHAR NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    symbol VARCHAR NOT NULL,
    price NUMERIC(18, 6) NOT NULL,
    quantity INT NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_trade_price_positive CHECK (price > 0),
    CONSTRAINT check_trade_quantity_positive CHECK (quantity > 0)
);

CREATE TABLE IF NOT EXISTS historical_data (
    "timestamp" TIMESTAMPTZ NOT NULL,
    symbol VARCHAR NOT NULL,
    open NUMERIC(18, 6) NOT NULL,
    high NUMERIC(18, 6) NOT NULL,
    low NUMERIC(18, 6) NOT NULL,
    close NUMERIC(18, 6) NOT NULL,
    volume BIGINT NOT NULL,
    CONSTRAINT check_historical_volume CHECK (volume >= 0),
    PRIMARY KEY (symbol, "timestamp")
);

CREATE INDEX IF NOT EXISTS idx_orders_match_book
    ON orders (symbol, side, status, order_type, price, "timestamp", id)
    WHERE status IN ('open', 'partial');

CREATE INDEX IF NOT EXISTS idx_trades_symbol_timestamp
    ON trades (symbol, "timestamp" DESC);
