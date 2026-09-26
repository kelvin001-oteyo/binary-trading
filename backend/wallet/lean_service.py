import hashlib
import hmac
import os
import time

import requests


LEAN_BASE_URL = os.environ.get(
    "LEAN_BASE_URL",
    "https://sandbox.leantech.me",
)
LEAN_AUTH_URL = os.environ.get(
    "LEAN_AUTH_URL",
    "https://auth.sandbox.leantech.me",
)
LEAN_CLIENT_ID = os.environ.get(
    "LEAN_CLIENT_ID", ""
).strip()
LEAN_CLIENT_SECRET = os.environ.get(
    "LEAN_CLIENT_SECRET", ""
).strip()
LEAN_WEBHOOK_SECRET = os.environ.get(
    "LEAN_WEBHOOK_SECRET", ""
).strip()

# Simple in-memory token cache
_token_cache = {
    "access_token": None,
    "expires_at": 0,
}

        response = requests.post(
            url,
            data={
                "grant_type": "client_credentials",
                "client_id": LEAN_CLIENT_ID,
                "client_secret": LEAN_CLIENT_SECRET,
                "scope": "api",
            },
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
            },
            timeout=20,
        
        )
    except requests.RequestException as exc:
        raise RuntimeError(f"Auth network error: {exc}")

    if response.status_code != 200:
        raise RuntimeError(
            f"Auth HTTP {response.status_code}: "
            f"{response.text[:300]}"
        )

    data = response.json()
    token = data.get("access_token")

    if not token:
        raise RuntimeError(f"No access_token in auth response: {data}")

    expires_in = int(data.get("expires_in", 3600))

    _token_cache["access_token"] = token
    _token_cache["expires_at"] = now + expires_in

    return token


def _headers():
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {_get_access_token()}",
    }


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
    except RuntimeError as exc:
        return None, str(exc)
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
        return None, f"No customer_id in response: {data}"

    return customer_id, None


def create_payment_intent(
    customer_id,
    amount_aed,
    payment_destination_id,
    description="Deposit",
):
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
    except RuntimeError as exc:
        return None, str(exc)
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