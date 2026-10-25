"""Data pipeline for generating, preprocessing, and storing transactions."""

import json
import random
from datetime import datetime
from pathlib import Path

from config.settings import PROCESSED_DATA_FILE
from data_engineering.preprocessing import preprocess_transactions


def simulate_blockchain_transactions(sample_size: int = 25) -> list[dict]:
    """Generate student-friendly blockchain transaction samples."""
    countries = ["India", "USA", "UAE", "Singapore", "Nigeria"]
    transaction_types = ["transfer", "swap", "deposit", "withdrawal"]
    transactions = []

    for index in range(sample_size):
        amount = round(random.uniform(50, 25000), 2)
        transactions.append(
            {
                "transaction_id": f"TXN-{index + 1:04d}",
                "sender": f"wallet_{random.randint(1000, 9999)}",
                "receiver": f"wallet_{random.randint(1000, 9999)}",
                "amount": amount,
                "country": random.choice(countries),
                "transaction_type": random.choice(transaction_types),
                "timestamp": datetime.utcnow().isoformat(),
            }
        )

    return transactions


def save_processed_transactions(transactions: list[dict]) -> None:
    """Store processed transaction results in a local JSON file."""
    PROCESSED_DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with PROCESSED_DATA_FILE.open("w", encoding="utf-8") as file:
        json.dump(transactions, file, indent=2)


def load_processed_transactions() -> list[dict]:
    """Load processed transactions if they exist."""
    if not PROCESSED_DATA_FILE.exists():
        return []

    with PROCESSED_DATA_FILE.open("r", encoding="utf-8") as file:
        return json.load(file)


def run_pipeline(sample_size: int = 25) -> list[dict]:
    """Run the complete data engineering flow for the project."""
    raw_transactions = simulate_blockchain_transactions(sample_size)
    processed_transactions = preprocess_transactions(raw_transactions)
    save_processed_transactions(processed_transactions)
    return processed_transactions
