"""Preprocessing helpers for transaction data."""


def preprocess_transactions(transactions: list[dict]) -> list[dict]:
    """Clean fields and normalize simple values before ML analysis."""
    processed_transactions = []

    for transaction in transactions:
        cleaned_transaction = transaction.copy()
        cleaned_transaction["country"] = str(transaction.get("country", "Unknown")).title()
        cleaned_transaction["transaction_type"] = str(
            transaction.get("transaction_type", "transfer")
        ).lower()
        cleaned_transaction["amount"] = round(float(transaction.get("amount", 0)), 2)
        processed_transactions.append(cleaned_transaction)

    return processed_transactions
