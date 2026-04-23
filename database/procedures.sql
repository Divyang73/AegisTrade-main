CREATE OR REPLACE PROCEDURE process_order(
    IN p_user_id VARCHAR,
    IN p_symbol VARCHAR,
    IN p_side VARCHAR,
    IN p_type VARCHAR,
    IN p_price NUMERIC,
    IN p_quantity INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id UUID := gen_random_uuid();
    v_side VARCHAR := lower(p_side);
    v_type VARCHAR := lower(p_type);
    v_remaining INT := p_quantity;
    v_filled INT := 0;
    v_trade_qty INT;
    v_trade_price NUMERIC(18, 6);
    v_match orders%ROWTYPE;
    v_buyer_id VARCHAR;
    v_seller_id VARCHAR;
    v_buyer_cash NUMERIC(20, 2);
    v_seller_cash NUMERIC(20, 2);
    v_buyer_qty INT;
    v_seller_qty INT;
    v_cost NUMERIC(20, 2);
    v_final_status VARCHAR(16);
BEGIN
    IF v_side NOT IN ('buy', 'sell') THEN
        RAISE EXCEPTION 'Unsupported side: %', p_side;
    END IF;

    IF v_type NOT IN ('market', 'limit') THEN
        RAISE EXCEPTION 'Unsupported order type: %', p_type;
    END IF;

    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        RAISE EXCEPTION 'Quantity must be positive';
    END IF;

    IF v_type = 'limit' AND (p_price IS NULL OR p_price <= 0) THEN
        RAISE EXCEPTION 'Limit orders require a positive price';
    END IF;

    INSERT INTO users (user_id, is_bot)
    VALUES (
        p_user_id,
        CASE WHEN p_user_id IN ('algo-sma', 'algo-rsi', 'algo-ema', 'algo-bollinger', 'algo-macd', 'algo-donchian', 'algo-roc', 'algo-pairs', 'market-maker') THEN TRUE ELSE FALSE END
    )
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO wallets (user_id, cash_balance)
    VALUES (p_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO orders (
        id,
        user_id,
        symbol,
        side,
        order_type,
        price,
        quantity,
        filled_quantity,
        status,
        "timestamp"
    )
    VALUES (
        v_order_id,
        p_user_id,
        p_symbol,
        v_side,
        v_type,
        p_price,
        p_quantity,
        0,
        'open',
        CURRENT_TIMESTAMP
    );

    IF v_side = 'buy' THEN
        LOOP
            EXIT WHEN v_remaining <= 0;

            SELECT o.*
            INTO v_match
            FROM orders o
            WHERE o.symbol = p_symbol
              AND o.side = 'sell'
              AND o.status IN ('open', 'partial')
              AND o.quantity > o.filled_quantity
              AND (
                    v_type = 'market'
                    OR o.order_type = 'market'
                    OR (v_type = 'limit' AND o.order_type = 'limit' AND o.price <= p_price)
              )
            ORDER BY
                CASE WHEN o.order_type = 'market' THEN 0 ELSE 1 END,
                o.price ASC NULLS FIRST,
                o."timestamp" ASC,
                o.id ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED;

            EXIT WHEN NOT FOUND;

            v_trade_qty := LEAST(v_remaining, v_match.quantity - v_match.filled_quantity);
            v_trade_price := COALESCE(v_match.price, p_price);
            v_buyer_id := p_user_id;
            v_seller_id := v_match.user_id;

            INSERT INTO wallets (user_id, cash_balance)
            VALUES (v_seller_id, 0)
            ON CONFLICT (user_id) DO NOTHING;

            INSERT INTO positions (user_id, symbol, quantity)
            VALUES (v_buyer_id, p_symbol, 0)
            ON CONFLICT (user_id, symbol) DO NOTHING;

            INSERT INTO positions (user_id, symbol, quantity)
            VALUES (v_seller_id, p_symbol, 0)
            ON CONFLICT (user_id, symbol) DO NOTHING;

            PERFORM 1
            FROM wallets
            WHERE user_id IN (v_buyer_id, v_seller_id)
            ORDER BY user_id
            FOR UPDATE;

            PERFORM 1
            FROM positions
            WHERE user_id IN (v_buyer_id, v_seller_id)
              AND symbol = p_symbol
            ORDER BY user_id
            FOR UPDATE;

            SELECT cash_balance INTO v_buyer_cash
            FROM wallets
            WHERE user_id = v_buyer_id;

            SELECT cash_balance INTO v_seller_cash
            FROM wallets
            WHERE user_id = v_seller_id;

            SELECT quantity INTO v_buyer_qty
            FROM positions
            WHERE user_id = v_buyer_id
              AND symbol = p_symbol;

            SELECT quantity INTO v_seller_qty
            FROM positions
            WHERE user_id = v_seller_id
              AND symbol = p_symbol;

            v_cost := ROUND(v_trade_qty * v_trade_price, 2);

            IF v_buyer_cash < v_cost THEN
                RAISE EXCEPTION 'Buyer % has insufficient cash for % % at %', v_buyer_id, v_trade_qty, p_symbol, v_trade_price;
            END IF;

            IF v_seller_qty < v_trade_qty THEN
                RAISE EXCEPTION 'Seller % has insufficient position for % %', v_seller_id, v_trade_qty, p_symbol;
            END IF;

            UPDATE wallets
            SET cash_balance = cash_balance - v_cost
            WHERE user_id = v_buyer_id;

            UPDATE wallets
            SET cash_balance = cash_balance + v_cost
            WHERE user_id = v_seller_id;

            UPDATE positions
            SET quantity = quantity + v_trade_qty
            WHERE user_id = v_buyer_id
              AND symbol = p_symbol;

            UPDATE positions
            SET quantity = quantity - v_trade_qty
            WHERE user_id = v_seller_id
              AND symbol = p_symbol;

            INSERT INTO trades (
                id,
                buyer_id,
                seller_id,
                symbol,
                price,
                quantity,
                "timestamp"
            )
            VALUES (
                gen_random_uuid(),
                v_buyer_id,
                v_seller_id,
                p_symbol,
                v_trade_price,
                v_trade_qty,
                CURRENT_TIMESTAMP
            );

            UPDATE orders
            SET filled_quantity = filled_quantity + v_trade_qty,
                status = CASE
                    WHEN filled_quantity + v_trade_qty >= quantity THEN 'filled'
                    ELSE 'partial'
                END
            WHERE id = v_match.id;

            v_remaining := v_remaining - v_trade_qty;
            v_filled := v_filled + v_trade_qty;
        END LOOP;

        IF v_type = 'limit' AND v_remaining > 0 THEN
            v_final_status := CASE WHEN v_filled > 0 THEN 'partial' ELSE 'open' END;
        ELSIF v_remaining = 0 THEN
            v_final_status := 'filled';
        ELSE
            v_final_status := CASE WHEN v_filled > 0 THEN 'partial' ELSE 'cancelled' END;
        END IF;
    ELSE
        LOOP
            EXIT WHEN v_remaining <= 0;

            SELECT o.*
            INTO v_match
            FROM orders o
            WHERE o.symbol = p_symbol
              AND o.side = 'buy'
              AND o.status IN ('open', 'partial')
              AND o.quantity > o.filled_quantity
              AND (
                    v_type = 'market'
                    OR o.order_type = 'market'
                    OR (v_type = 'limit' AND o.order_type = 'limit' AND o.price >= p_price)
              )
            ORDER BY
                CASE WHEN o.order_type = 'market' THEN 0 ELSE 1 END,
                o.price DESC NULLS LAST,
                o."timestamp" ASC,
                o.id ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED;

            EXIT WHEN NOT FOUND;

            v_trade_qty := LEAST(v_remaining, v_match.quantity - v_match.filled_quantity);
            v_trade_price := COALESCE(v_match.price, p_price);
            v_buyer_id := v_match.user_id;
            v_seller_id := p_user_id;

            INSERT INTO wallets (user_id, cash_balance)
            VALUES (v_buyer_id, 0)
            ON CONFLICT (user_id) DO NOTHING;

            INSERT INTO positions (user_id, symbol, quantity)
            VALUES (v_buyer_id, p_symbol, 0)
            ON CONFLICT (user_id, symbol) DO NOTHING;

            INSERT INTO positions (user_id, symbol, quantity)
            VALUES (v_seller_id, p_symbol, 0)
            ON CONFLICT (user_id, symbol) DO NOTHING;

            PERFORM 1
            FROM wallets
            WHERE user_id IN (v_buyer_id, v_seller_id)
            ORDER BY user_id
            FOR UPDATE;

            PERFORM 1
            FROM positions
            WHERE user_id IN (v_buyer_id, v_seller_id)
              AND symbol = p_symbol
            ORDER BY user_id
            FOR UPDATE;

            SELECT cash_balance INTO v_buyer_cash
            FROM wallets
            WHERE user_id = v_buyer_id;

            SELECT cash_balance INTO v_seller_cash
            FROM wallets
            WHERE user_id = v_seller_id;

            SELECT quantity INTO v_buyer_qty
            FROM positions
            WHERE user_id = v_buyer_id
              AND symbol = p_symbol;

            SELECT quantity INTO v_seller_qty
            FROM positions
            WHERE user_id = v_seller_id
              AND symbol = p_symbol;

            v_cost := ROUND(v_trade_qty * v_trade_price, 2);

            IF v_buyer_cash < v_cost THEN
                RAISE EXCEPTION 'Buyer % has insufficient cash for % % at %', v_buyer_id, v_trade_qty, p_symbol, v_trade_price;
            END IF;

            IF v_seller_qty < v_trade_qty THEN
                RAISE EXCEPTION 'Seller % has insufficient position for % %', v_seller_id, v_trade_qty, p_symbol;
            END IF;

            UPDATE wallets
            SET cash_balance = cash_balance - v_cost
            WHERE user_id = v_buyer_id;

            UPDATE wallets
            SET cash_balance = cash_balance + v_cost
            WHERE user_id = v_seller_id;

            UPDATE positions
            SET quantity = quantity + v_trade_qty
            WHERE user_id = v_buyer_id
              AND symbol = p_symbol;

            UPDATE positions
            SET quantity = quantity - v_trade_qty
            WHERE user_id = v_seller_id
              AND symbol = p_symbol;

            INSERT INTO trades (
                id,
                buyer_id,
                seller_id,
                symbol,
                price,
                quantity,
                "timestamp"
            )
            VALUES (
                gen_random_uuid(),
                v_buyer_id,
                v_seller_id,
                p_symbol,
                v_trade_price,
                v_trade_qty,
                CURRENT_TIMESTAMP
            );

            UPDATE orders
            SET filled_quantity = filled_quantity + v_trade_qty,
                status = CASE
                    WHEN filled_quantity + v_trade_qty >= quantity THEN 'filled'
                    ELSE 'partial'
                END
            WHERE id = v_match.id;

            v_remaining := v_remaining - v_trade_qty;
            v_filled := v_filled + v_trade_qty;
        END LOOP;

        IF v_type = 'limit' AND v_remaining > 0 THEN
            v_final_status := CASE WHEN v_filled > 0 THEN 'partial' ELSE 'open' END;
        ELSIF v_remaining = 0 THEN
            v_final_status := 'filled';
        ELSE
            v_final_status := CASE WHEN v_filled > 0 THEN 'partial' ELSE 'cancelled' END;
        END IF;
    END IF;

    UPDATE orders
    SET filled_quantity = v_filled,
        status = v_final_status
    WHERE id = v_order_id;

    COMMIT;
END;
$$;

INSERT INTO users (user_id, is_bot) VALUES
    ('human-user', FALSE),
    ('algo-sma', TRUE),
    ('algo-rsi', TRUE),
    ('algo-ema', TRUE),
    ('algo-bollinger', TRUE),
    ('algo-macd', TRUE),
    ('algo-donchian', TRUE),
    ('algo-roc', TRUE),
    ('algo-pairs', TRUE)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO wallets (user_id, cash_balance) VALUES
    ('human-user', 100000),
    ('algo-sma', 100000),
    ('algo-rsi', 100000),
    ('algo-ema', 100000),
    ('algo-bollinger', 100000),
    ('algo-macd', 100000),
    ('algo-donchian', 100000),
    ('algo-roc', 100000),
    ('algo-pairs', 100000)
ON CONFLICT (user_id) DO UPDATE
SET cash_balance = EXCLUDED.cash_balance;
