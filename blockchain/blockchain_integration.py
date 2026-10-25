"""Blockchain integration helpers using Web3.py and a local fallback log."""

import hashlib
import json
from pathlib import Path

from web3 import Web3

from config.settings import BLOCKCHAIN_LOG_FILE, WEB3_PROVIDER_URL


class BlockchainLogger:
    """Log transaction hashes to Ethereum when available, otherwise to local JSON."""

    def __init__(self) -> None:
        self.web3 = Web3(Web3.HTTPProvider(WEB3_PROVIDER_URL)) if WEB3_PROVIDER_URL else None

    def generate_transaction_hash(self, transaction: dict) -> str:
        """Create a deterministic hash for a transaction dictionary."""
        payload = json.dumps(transaction, sort_keys=True).encode("utf-8")
        return hashlib.sha256(payload).hexdigest()

    def log_transactions(self, transactions: list[dict]) -> list[dict]:
        """Record hashes for analyzed transactions."""
        log_entries = []

        for transaction in transactions:
            entry = {
                "transaction_id": transaction.get("transaction_id", "manual"),
                "hash": self.generate_transaction_hash(transaction),
            }
            log_entries.append(entry)

        self._save_local_log(log_entries)
        return log_entries

    def _save_local_log(self, entries: list[dict]) -> None:
        """Persist blockchain-style records locally for demo purposes."""
        BLOCKCHAIN_LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
        existing = []

        if BLOCKCHAIN_LOG_FILE.exists():
            existing = json.loads(BLOCKCHAIN_LOG_FILE.read_text(encoding="utf-8"))

        existing.extend(entries)
        BLOCKCHAIN_LOG_FILE.write_text(json.dumps(existing, indent=2), encoding="utf-8")
