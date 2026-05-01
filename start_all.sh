#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ -f .env ]; then
  echo "Loading .env"
  set -o allexport
  # shellcheck disable=SC1091
  source .env
  set +o allexport
else
  echo ".env not found in $SCRIPT_DIR"
fi

mkdir -p logs

if [ -x .venv/bin/python ]; then
  PYTHON_BIN=".venv/bin/python"
else
  PYTHON_BIN="$(command -v python3 || command -v python)"
fi

if [ -x .venv/bin/uvicorn ]; then
  UVICORN_CMD=(".venv/bin/uvicorn")
elif command -v uvicorn >/dev/null 2>&1; then
  UVICORN_CMD=("uvicorn")
else
  UVICORN_CMD=("$PYTHON_BIN" "-m" "uvicorn")
fi

echo "Starting backend..."
nohup "${UVICORN_CMD[@]}" backend.main:app --host 0.0.0.0 --port 8000 --reload > logs/backend.log 2>&1 &
echo "backend PID: $!"

sleep 1

echo "Starting bots..."
bots=(
  "market_maker"
  "algo_sma"
  "algo_rsi"
  "algo_ema"
  "algo_bollinger"
  "algo_macd"
  "algo_donchian"
  "algo_roc"
)

for bot in "${bots[@]}"; do
  nohup "$PYTHON_BIN" "bots/${bot}.py" > "logs/${bot}.log" 2>&1 &
  echo "${bot} PID: $!"
done

echo "All processes started. Logs are under $SCRIPT_DIR/logs"

exit 0
