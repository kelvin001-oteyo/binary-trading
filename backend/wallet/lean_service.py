import hashlib
import hmac
import os
import requests


LEAN_BASE_URL = os.environ.get(
    "LEAN_BASE_URL",
    "https://sandbox.leantech.me",
)
LEAN_APP_TOKEN = os.environ.get("LEAN_APP_TOKEN", "")
LEAN_WEBHOOK_SECRET = os.environ.get(
    "LEAN_WEBHOOK_SECRET", ""
)


def create_customer(app_user_id):
    url = f"{LEAN_BASE_URL}/customers/v1/"
    payload = {"app_user_id": str(app_user_id)}

    try:
        response = requests.post(
            url,
            json=payload,
            headers=_headers(),
            timeout=20,
        )
    except requests.RequestException as exc:
        return None, f"Network error: {exc}"

    if response.status_code not in (200, 201):
        token_len = len(LEAN_APP_TOKEN)
        return None, (
            f"HTTP {response.status_code} | "
            f"token_len={token_len} | "
            f"body={response.text[:200]}"
        )
    # ... rest


def create_customer(app_user_id):
    """
    Create a Lean customer for the given app_user_id.
    Returns (customer_id, error_message).
    """
    url = f"{LEAN_BASE_URL}/customers/v1/"

    payload = {"app_user_id": str(app_user_id)}

    try:
        response = requests.post(
            url,
            json=payload,
            headers=_headers(),
            timeout=20,
        )
    except requests.RequestException as exc:
        return None, f"Network error: {exc}"

    if response.status_code not in (200, 201):
        return None, (
            f"HTTP {response.status_code}: "
            f"{response.text[:500]}"
        )

    data = response.json()
    customer_id = data.get("customer_id")

    if not customer_id:
        return None, f"No customer_id in Lean response: {data}"

    return customer_id, None


def create_payment_intent(
    customer_id,
    amount_aed,
    payment_destination_id,
    description="Deposit",
):
    """
    Create a Lean payment intent for the given customer.
    amount_aed is a float in AED (e.g. 500.00).
    Returns (payment_intent_id, error_message).
    """
    url = f"{LEAN_BASE_URL}/payments/v1/intents"

    description = (description or "Deposit")[:12]

    payload = {
        "customer_id": customer_id,
        "amount": float(amount_aed),
        "currency": "AED",
        "payment_destination_id": payment_destination_id,
        "description": description,
        "purpose_code": "FIS",
    }

    try:
        response = requests.post(
            url,
            json=payload,
            headers=_headers(),
            timeout=20,
        )
    except requests.RequestException as exc:
        return None, f"Network error: {exc}"

    if response.status_code not in (200, 201):
        return None, (
            f"HTTP {response.status_code}: "
            f"{response.text[:500]}"
        )

    data = response.json()
    intent_id = data.get("payment_intent_id")

    if not intent_id:
        return None, f"No payment_intent_id in response: {data}"

    return intent_id, None


def verify_webhook_signature(raw_body, signature_header):
    """
    Verify a Lean webhook using the Webhook Secret.
    raw_body: bytes of the exact request body received.
    signature_header: value of the 'lean-signature' header.
    Returns True if valid.
    """
    if not signature_header or not LEAN_WEBHOOK_SECRET:
        return False

    if not signature_header.startswith("sha512="):
        return False

    received = signature_header.split("=", 1)[1]

    computed = hmac.new(
        LEAN_WEBHOOK_SECRET.encode("utf-8"),
        raw_body,
        hashlib.sha512,
    ).hexdigest()

    return hmac.compare_digest(computed, received)