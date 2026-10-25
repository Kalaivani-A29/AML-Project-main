"""KYC validation helpers for the AML mini project."""

import re


def validate_kyc_form(payload: dict) -> dict:
    """Perform simple validation checks on KYC form data."""
    full_name = str(payload.get("full_name", "")).strip()
    email = str(payload.get("email", "")).strip()
    government_id = str(payload.get("government_id", "")).strip()

    if len(full_name) < 3:
        return {"success": False, "message": "Full name must contain at least 3 characters."}

    if not re.match(r"^[^@]+@[^@]+\.[^@]+$", email):
        return {"success": False, "message": "Please enter a valid email address."}

    if len(government_id) < 6:
        return {"success": False, "message": "Government ID must be at least 6 characters long."}

    return {"success": True, "message": "KYC verification passed for demo validation."}
