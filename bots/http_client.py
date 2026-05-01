from __future__ import annotations

from typing import Any

import requests


DEFAULT_TIMEOUT = 10

_session = requests.Session()
_session.trust_env = False  # Avoid proxying localhost calls via env vars.


def post(url: str, json: dict[str, Any], timeout: int = DEFAULT_TIMEOUT) -> requests.Response:
    return _session.post(url, json=json, timeout=timeout)


def get(url: str, timeout: int = DEFAULT_TIMEOUT) -> requests.Response:
    return _session.get(url, timeout=timeout)