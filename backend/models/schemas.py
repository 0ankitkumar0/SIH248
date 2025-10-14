from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class OptimizeInput(BaseModel):
    orders: List[Dict[str, Any]]
    stockyards: List[Dict[str, Any]]
    loading_points: List[Dict[str, Any]]
    rakes: List[Dict[str, Any]]
    costs: Optional[List[Dict[str, Any]]] = None
    constraints: Optional[Dict[str, Any]] = None
    wagon_availability: Optional[Dict[str, Any]] = None
