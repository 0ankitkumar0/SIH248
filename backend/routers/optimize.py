from fastapi import APIRouter
from typing import List
from models import schemas
from services.gemini_optimizer import GeminiOptimizerError, invoke_gemini_optimizer
import logging

router = APIRouter()
logger = logging.getLogger("uvicorn.error")


@router.post('/optimize')
def optimize(req: schemas.OptimizeInput):
    # Log the parsed input for debugging
    try:
        logger.info("/optimize called with: %s", req.dict())
    except Exception:
        logger.info("/optimize called (could not serialize request)")

    try:
        result = invoke_gemini_optimizer(req)
        logger.info("Gemini optimizer returned plan with %d entries", len(result.get('plan', [])))
        return result
    except GeminiOptimizerError as exc:
        logger.error("Gemini optimizer error: %s", exc)
        return { 'error': str(exc) }
    except Exception as exc:  # pragma: no cover - defensive catch
        logger.exception("Unexpected optimizer failure")
        return { 'error': 'Unexpected optimizer failure. Check server logs.' }
