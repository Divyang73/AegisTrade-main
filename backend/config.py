from __future__ import annotations

import os
from dataclasses import dataclass, field


def _parse_list(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


@dataclass(slots=True)
class Settings:
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/aegistrade",
    )

    cors_origins: list[str] = field(
        default_factory=lambda: _parse_list(
            os.getenv(
                "CORS_ORIGINS",
                "http://localhost:3000,http://127.0.0.1:3000",
            )
        )
    )

    simulation_interval_seconds: float = float(
        os.getenv("SIMULATION_INTERVAL_SECONDS", "1.0")
    )

    bootstrap_market_maker_cash: float = float(
        os.getenv("MARKET_MAKER_CASH", "1000000")
    )

    bootstrap_market_maker_inventory: int = int(
        os.getenv("MARKET_MAKER_INVENTORY", "10000")
    )


settings = Settings()