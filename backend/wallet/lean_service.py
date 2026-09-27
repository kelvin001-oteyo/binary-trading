
import hashlib
import hmac
import os
import time

import requests


# ============================================================
# LEAN CONFIGURATION
# ============================================================

LEAN_BASE_URL = os.environ.get(
    "LEAN_BASE_URL",
    "https://sandbox.leantech.me",
).strip().rstrip("/")

LEAN_AUTH_URL = os.environ.get(
    "LEAN_AUTH_URL",
    "https://auth.sandbox.leantech.me",
).strip().rstrip("/")

LEAN_CLIENT_ID = os.environ.get(
    "LEAN_CLIENT_ID",
    "",
).strip()

LEAN_CLIENT_SECRET = os.environ.get(
    "LEAN_CLIENT_SECRET",
    "",
).strip()

LEAN_WEBHOOK_SECRET = os.environ.get(
    "LEAN_WEBHOOK_SECRET",
    "",
).strip()


# ============================================================
# TOKEN CACHE
# ============================================================

_token_cache = {
    "access_token": None,
    "expires_at": 0,
}


# ============================================================
# GET LEAN API ACCESS TOKEN
# ============================================================

def _get_access_token():
    now = time.time()

    # Reuse an existing token when it still has enough time left.
    if (
        _token_cache["access_token"]
        and _token_cache["expires_at"] > now + 30
    ):
        return _token_cache["access_token"]

    # --------------------------------------------------------
    # Validate required configuration before contacting Lean.
    # --------------------------------------------------------

    if not LEAN_CLIENT_ID:
        raise RuntimeError(
            "Lean configuration error: LEAN_CLIENT_ID is missing."
        )

    if not LEAN_CLIENT_SECRET:
        raise RuntimeError(
            "Lean configuration error: LEAN_CLIENT_SECRET is missing."
        )

    url = f"{LEAN_AUTH_URL}/oauth2/token"

    payload = {
        "client_id": LEAN_CLIENT_ID,
        "client_secret": LEAN_CLIENT_SECRET,
        "grant_type": "client_credentials",
        "scope": "api",
    }

    try:
        response = requests.post(
            url,
            data=payload,
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
            },
            timeout=20,
        )

    except requests.RequestException as exc:
        raise RuntimeError(
            f"Lean Auth network error: {exc}"
        )

    # --------------------------------------------------------
    # Lean authentication failed.
    # --------------------------------------------------------

    if response.status_code != 200:
        error_body = response.text[:1000]

        raise RuntimeError(
            f"Lean Auth HTTP {response.status_code}: {error_body}"
        )

    try:
        data = response.json()
    except ValueError:
        raise RuntimeError(
            f"Lean Auth returned invalid JSON: "
            f"{response.text[:500]}"
        )

    token = data.get("access_token")

    if not token:
        raise RuntimeError(
            f"Lean Auth response does not contain access_token: {data}"
        )

    expires_in = int(data.get("expires_in", 3600))

    _token_cache["access_token"] = token
    _token_cache["expires_at"] = now + expires_in

    return token


# ============================================================
# COMMON LEAN API HEADERS
# ============================================================

def _headers():
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {_get_access_token()}",
    }


# ============================================================
# CREATE LEAN CUSTOMER
# ============================================================

def create_customer(app_user_id):
    if not app_user_id:
        return None, "app_user_id is required."

    url = f"{LEAN_BASE_URL}/customers/v1/"

    payload = {
        "app_user_id": str(app_user_id),
    }

    try:
        response = requests.post(
            url,
            json=payload,
            headers=_headers(),
            timeout=20,
        )

    except RuntimeError as exc:
        return None, str(exc)

    except requests.RequestException as exc:
        return None, f"Lean API network error: {exc}"

    if response.status_code not in (200, 201):
        return None, (
            f"Lean Customer HTTP {response.status_code}: "
            f"{response.text[:1000]}"
        )

    try:
        data = response.json()
    except ValueError:
        return None, (
            f"Lean Customer returned invalid JSON: "
            f"{response.text[:500]}"
        )

    customer_id = data.get("customer_id")

    if not customer_id:
        return None, (
            f"Lean Customer response does not contain "
            f"customer_id: {data}"
        )

    return customer_id, None


# ============================================================
# CREATE PAYMENT INTENT
# ============================================================

def create_payment_intent(
    customer_id,
    amount_aed,
    payment_destination_id,
    description="Deposit",
):
    if not customer_id:
        return None, "customer_id is required."

    if not payment_destination_id:
        return None, "payment_destination_id is required."

    try:
        amount = float(amount_aed)
    except (TypeError, ValueError):
        return None, "amount_aed must be a valid number."

    if amount <= 0:
        return None, "amount_aed must be greater than zero."

    url = f"{LEAN_BASE_URL}/payments/v1/intents"

    description = (description or "Deposit")[:12]

    payload = {
        "customer_id": customer_id,
        "amount": amount,
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

    except RuntimeError as exc:
        return None, str(exc)

    except requests.RequestException as exc:
        return None, f"Lean API network error: {exc}"

    if response.status_code not in (200, 201):
        return None, (
            f"Lean Payment HTTP {response.status_code}: "
            f"{response.text[:1000]}"
        )

    try:
        data = response.json()
    except ValueError:
        return None, (
            f"Lean Payment returned invalid JSON: "
            f"{response.text[:500]}"
        )

    intent_id = data.get("payment_intent_id")

    if not intent_id:
        return None, (
            f"Lean Payment response does not contain "
            f"payment_intent_id: {data}"
        )

    return intent_id, None


# ============================================================
# VERIFY LEAN WEBHOOK SIGNATURE
# ============================================================

def verify_webhook_signature(raw_body, signature_header):
    if not signature_header:
        return False

    if not LEAN_WEBHOOK_SECRET:
        return False

    if not signature_header.startswith("sha512="):
        return False

    received = signature_header.split("=", 1)[1]

    computed = hmac.new(
        LEAN_WEBHOOK_SECRET.encode("utf-8"),
        raw_body,
        hashlib.sha512,
    ).hexdigest()

    return hmac.compare_digest(
        computed,
        received,
    )
