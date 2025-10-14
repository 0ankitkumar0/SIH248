def run_mock(data):
    """Return a mocked plan for demo/testing.
    data: input JSON or None
    Returns: (plan_list, total_cost, before_cost)
    """
    # Simple hard-coded plan
    plan = [
        {"rake_id": "R1", "wagons": [1,2,3], "destination": "CMO1", "material": "IronOre", "cost": 1200.0},
        {"rake_id": "R2", "wagons": [4,5], "destination": "CustomerA", "material": "Pellets", "cost": 900.0},
    ]
    total = sum(p['cost'] for p in plan)
    before = total * 1.25
    return plan, total, before
