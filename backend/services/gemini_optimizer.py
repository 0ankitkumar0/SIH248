import json
import logging
import os
import re
from typing import Any, Dict

import requests
from models.schemas import OptimizeInput

logger = logging.getLogger("uvicorn.error")

_GEMINI_BASE_URL = "https://generativelanguage.googleapis.com"
_DEFAULT_MODEL = "gemini-2.0-flash"
_DEFAULT_API_VERSION = "v1beta"

_PROMPT_TEMPLATE = (
    "You are an expert rail logistics optimizer for Indian steel plants. "
    "Given the following JSON payload describing customer orders, stockyard "
    "availability, loading point capacities, rake/wagon data, cost model, and "
    "operational constraints, produce an optimized daily rake formation plan.\n\n"
    "Return a strict JSON object with the keys: plan (array of rake summaries), "
    "totals (object with totalCost, beforeCost, savings, savingsPercent), "
    "cost_by_destination (object), utilization (array of rake utilization objects), "
    "dispatch_schedule (array), matrix (object mapping material to wagon type availability), "
    "suggestions (array of recommendation objects), and unfulfilled_orders (array).\n\n"
    "Each plan entry must include rake_id, wagon_type, loading_point, destinations "
    "(string or array), materials (object material->tonnage), total_tonnage, total_cost, "
    "dispatch_date, fill_percent, meets_min_size (boolean).\n"
    "All numeric fields should be numbers (not strings).\n"
    "Do not include markdown, comments, or additional text—respond with JSON only.\n\n"
    "Input JSON:\n{payload}\n"
)


class GeminiOptimizerError(RuntimeError):
    """Raised when Gemini optimization fails."""


def _build_request_body(request: OptimizeInput) -> Dict[str, Any]:
    payload = request.dict()
    prompt = _PROMPT_TEMPLATE.format(payload=json.dumps(payload, ensure_ascii=False))
    return {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"text": prompt},
                ],
            }
        ]
    }


def _extract_response(data: Dict[str, Any]) -> Dict[str, Any]:
    candidates = data.get("candidates") or []
    if not candidates:
        raise GeminiOptimizerError("Gemini response missing candidates.")

    parts = candidates[0].get("content", {}).get("parts", [])
    if not parts:
        raise GeminiOptimizerError("Gemini response missing content parts.")

    text = parts[0].get("text")
    if not text:
        raise GeminiOptimizerError("Gemini response empty.")

    cleaned_text = _strip_markdown_wrappers(text)
    try:
        payload = json.loads(cleaned_text)
    except json.JSONDecodeError as exc:
        logger.exception("Gemini response not valid JSON: %s", text)
        raise GeminiOptimizerError("Gemini response not valid JSON.") from exc

    for key in [
        "plan",
        "totals",
        "cost_by_destination",
        "utilization",
        "dispatch_schedule",
        "matrix",
        "suggestions",
        "unfulfilled_orders",
    ]:
        if key not in payload:
            raise GeminiOptimizerError(f"Gemini response missing key '{key}'.")

    return payload


def _strip_markdown_wrappers(raw_text: str) -> str:
    # Gemini occasionally wraps JSON in code fences; this removes them while keeping the core object
    text = raw_text.strip()
    fence = re.search(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL | re.IGNORECASE)
    if fence:
        return fence.group(1).strip()

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1:
        return text[start : end + 1].strip()

    return text


def invoke_gemini_optimizer(request: OptimizeInput) -> Dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise GeminiOptimizerError("GEMINI_API_KEY environment variable is not set.")

    model = os.getenv("GEMINI_MODEL", _DEFAULT_MODEL)
    api_version = os.getenv("GEMINI_API_VERSION", _DEFAULT_API_VERSION)
    endpoint = (
        f"{_GEMINI_BASE_URL}/{api_version}/models/{model}:generateContent?key={api_key}"
    )
    logger.info("Calling Gemini model '%s' using API version '%s'", model, api_version)
    body = _build_request_body(request)

    try:
        response = requests.post(endpoint, json=body, timeout=120)
        response.raise_for_status()
    except requests.RequestException as exc:
        logger.exception("Gemini optimizer call failed")
        message = getattr(exc.response, "text", str(exc))
        raise GeminiOptimizerError(f"Gemini optimizer call failed: {message}") from exc

    try:
        payload = response.json()
    except json.JSONDecodeError as exc:
        logger.exception("Gemini response was not JSON")
        raise GeminiOptimizerError("Gemini response was not JSON.") from exc

    return _extract_response(payload)
