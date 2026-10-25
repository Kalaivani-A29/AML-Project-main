"""Risk scoring logic for AML decisions."""

STANDARD_SAFE_LIMIT = 100000
PREMIUM_SAFE_LIMIT = 1000000
AVERAGE_MULTIPLIER_THRESHOLD = 3


def get_user_safe_limit(user_type: str) -> int:
    """Return the amount threshold allowed for a user's profile."""
    normalized_type = str(user_type or "standard").strip().lower()
    if normalized_type == "premium":
        return PREMIUM_SAFE_LIMIT
    return STANDARD_SAFE_LIMIT


def calculate_average_transaction(history: list[dict]) -> float:
    """Calculate the user's average transaction amount from existing history."""
    amounts = [float(tx.get("amount", 0)) for tx in history if float(tx.get("amount", 0)) > 0]
    if not amounts:
        return 0.0
    return sum(amounts) / len(amounts)


def evaluate_transaction_limits(transaction: dict, user_profile: dict | None = None) -> dict:
    """Evaluate profile-based limits for a single transaction."""
    profile = user_profile or {}
    history = profile.get("transactions", [])
    average_amount = calculate_average_transaction(history)
    safe_limit = get_user_safe_limit(profile.get("user_type", "standard"))
    amount = float(transaction.get("amount", 0))

    exceeds_profile_limit = amount > safe_limit
    exceeds_average_limit = average_amount > 0 and amount > (average_amount * AVERAGE_MULTIPLIER_THRESHOLD)

    return {
        "safe_limit": safe_limit,
        "average_transaction": round(average_amount, 2),
        "exceeds_profile_limit": exceeds_profile_limit,
        "exceeds_average_limit": exceeds_average_limit,
    }


def calculate_risk_score(transaction: dict, prediction: int, user_profile: dict | None = None) -> int:
    """Combine dynamic limits, rule checks, and anomaly results into a risk score."""
    score = 10
    amount = float(transaction.get("amount", 0))
    limit_check = evaluate_transaction_limits(transaction, user_profile)

    if amount > 10000:
        score += 10
    elif amount > 5000:
        score += 5

    if transaction.get("country") in {"Nigeria", "Uae", "UAE"}:
        score += 15

    if transaction.get("transaction_type") == "withdrawal":
        score += 10

    if limit_check["exceeds_profile_limit"]:
        score += 45

    if limit_check["exceeds_average_limit"]:
        score += 35

    if prediction == -1:
        score += 15

    return min(score, 100)


def score_transactions(
    transactions: list[dict],
    predictions: list[int],
    user_profile: dict | None = None,
) -> list[dict]:
    """Attach risk scores, statuses, and dynamic limit context to transactions."""
    scored_transactions = []

    for transaction, prediction in zip(transactions, predictions):
        enriched = transaction.copy()
        enriched["anomaly_prediction"] = int(prediction)

        limit_check = evaluate_transaction_limits(enriched, user_profile)
        risk_score = calculate_risk_score(enriched, prediction, user_profile)
        is_suspicious = (
            limit_check["exceeds_profile_limit"]
            or limit_check["exceeds_average_limit"]
            or risk_score >= 70
        )

        enriched["safe_limit"] = limit_check["safe_limit"]
        enriched["average_transaction"] = limit_check["average_transaction"]
        enriched["status"] = "Suspicious" if is_suspicious else "Safe"
        enriched["risk_score"] = risk_score
        enriched["is_suspicious"] = is_suspicious
        scored_transactions.append(enriched)

    return scored_transactions
