# API

POST /optimize
- Accepts JSON with input data (materials, orders, wagons, constraints)
- Returns optimized plan: { plan: [...], total_cost: float, before_cost: float }

POST /forecast
- Accepts JSON input and returns dummy forecast series

Examples:
POST /optimize
Request body (example OptimizeInput):
{
  "materials": [ { "material": "IronOre", "quantity": 7000 } ],
  "orders": [ { "order_id": "O1", "material": "IronOre", "quantity": 5000, "destination": "CMO1" } ],
  "wagons": [ { "id": 1, "capacity": 100 } ],
  "constraints": { "rake_size": 24, "siding_capacity": 10000 }
}

Response:
{
  "plan": [ { "rake_id": "R1", "wagons": [1,2,3], "destination": "CMO1", "material": "IronOre", "cost": 1200 } ],
  "total_cost": 2100,
  "before_cost": 2625
}
