"""Anomaly detection module for suspicious transaction discovery."""

import math

from sklearn.ensemble import IsolationForest


HIGH_RISK_COUNTRIES = {"Nigeria", "Uae"}


def _build_feature_matrix(transactions: list[dict]) -> list[list[float]]:
    """Convert transaction records into numeric features."""
    features = []
    for transaction in transactions:
        amount = float(transaction.get("amount", 0))
        country_score = 1 if transaction.get("country") in HIGH_RISK_COUNTRIES else 0
        transfer_score = 1 if transaction.get("transaction_type") == "withdrawal" else 0
        features.append([amount, country_score, transfer_score, math.log1p(amount)])
    return features


def detect_anomalies(transactions: list[dict]) -> list[int]:
    """Return anomaly predictions where -1 means suspicious."""
    if not transactions:
        return []

    features = _build_feature_matrix(transactions)

    if len(transactions) < 5:
        predictions = []
        for transaction in transactions:
            amount = float(transaction.get("amount", 0))
            risky_country = transaction.get("country") in HIGH_RISK_COUNTRIES
            predictions.append(-1 if amount > 10000 or risky_country else 1)
        return predictions

    model = IsolationForest(contamination=0.2, random_state=42)
    model.fit(features)
    return model.predict(features).tolist()
