\copy historical_data("timestamp", symbol, open, high, low, close, volume) FROM 'master_historical_data.csv' WITH (FORMAT csv, HEADER true);
