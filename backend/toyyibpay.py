"""Toyyibpay payment gateway integration.

Docs: https://toyyibpay.com/apireference/

Flow:
1. createBill -> get billCode
2. Redirect buyer to https://toyyibpay.com/<billCode>
3. Buyer pays via FPX/card
4. Toyyibpay POST callback to our return_url with status_id (1=success)
5. We verify by GET getBillTransactions to double-check status
"""
import os
import logging
from typing import Optional, List, Dict, Any
import httpx

log = logging.getLogger(__name__)

TOYYIBPAY_BASE_URL = os.getenv("TOYYIBPAY_BASE_URL", "https://toyyibpay.com").rstrip("/")
TOYYIBPAY_SECRET_KEY = os.getenv("TOYYIBPAY_SECRET_KEY", "").strip()
TOYYIBPAY_CATEGORY_CODE = os.getenv("TOYYIBPAY_CATEGORY_CODE", "").strip()
TOYYIBPAY_SANDBOX = os.getenv("TOYYIBPAY_SANDBOX", "false").lower() == "true"

if TOYYIBPAY_SANDBOX:
    TOYYIBPAY_BASE_URL = "https://dev.toyyibpay.com"


def is_configured() -> bool:
    return bool(TOYYIBPAY_SECRET_KEY and TOYYIBPAY_CATEGORY_CODE)


def create_bill(
    *,
    name: str,
    description: str,
    amount_rm: float,
    customer_email: str,
    customer_name: str,
    customer_phone: str,
    return_url: str,
    callback_url: str,
    external_ref: str,
) -> Dict[str, Any]:
    """Create a Toyyibpay bill. Returns dict with billCode + payment_url.

    amount_rm: ringgit (will be converted to sen)
    external_ref: our internal order ID — sent back via callback
    """
    if not is_configured():
        raise RuntimeError("Toyyibpay not configured")

    amount_sen = int(round(amount_rm * 100))

    payload = {
        "userSecretKey": TOYYIBPAY_SECRET_KEY,
        "categoryCode": TOYYIBPAY_CATEGORY_CODE,
        "billName": name[:30],  # max 30 chars
        "billDescription": description[:100],  # max 100 chars
        "billPriceSetting": 1,  # 1=fixed
        "billPayorInfo": 1,  # 1=request payer info
        "billAmount": str(amount_sen),
        "billReturnUrl": return_url,
        "billCallbackUrl": callback_url,
        "billExternalReferenceNo": external_ref,
        "billTo": customer_name[:30],
        "billEmail": customer_email,
        "billPhone": customer_phone or "0000000000",
        "billPaymentChannel": "0",  # 0=FPX+Card
        "billContentEmail": f"Terima kasih sokong OhMaiShoot. Order: {external_ref}",
        "billChargeToCustomer": 1,  # 1=charge transaction fee to customer
    }

    url = f"{TOYYIBPAY_BASE_URL}/index.php/api/createBill"
    try:
        r = httpx.post(url, data=payload, timeout=20.0)
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        log.exception("Toyyibpay createBill failed")
        raise RuntimeError(f"Toyyibpay error: {e}")

    # Response is a list with one dict: [{"BillCode": "abc123"}]
    if isinstance(data, list) and data and "BillCode" in data[0]:
        bill_code = data[0]["BillCode"]
        return {
            "bill_code": bill_code,
            "payment_url": f"{TOYYIBPAY_BASE_URL}/{bill_code}",
        }
    raise RuntimeError(f"Unexpected Toyyibpay response: {data}")


def get_bill_transactions(bill_code: str) -> List[Dict[str, Any]]:
    """Fetch transactions for a bill. Used to verify payment status server-side."""
    if not is_configured():
        raise RuntimeError("Toyyibpay not configured")

    url = f"{TOYYIBPAY_BASE_URL}/index.php/api/getBillTransactions"
    payload = {
        "userSecretKey": TOYYIBPAY_SECRET_KEY,
        "billCode": bill_code,
    }
    try:
        r = httpx.post(url, data=payload, timeout=15.0)
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        log.exception("Toyyibpay getBillTransactions failed")
        raise RuntimeError(f"Toyyibpay verify error: {e}")

    if isinstance(data, list):
        return data
    return []


def is_paid(bill_code: str) -> bool:
    """Returns True if any successful transaction exists for the bill."""
    txs = get_bill_transactions(bill_code)
    for t in txs:
        # billpaymentStatus: 1=success, 2=pending, 3=fail
        status = str(t.get("billpaymentStatus", "")).strip()
        if status == "1":
            return True
    return False
