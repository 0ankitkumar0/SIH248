import os

import requests

API = 'http://localhost:8000'


def test_optimize():
    if not os.getenv('GEMINI_API_KEY'):
        print('Skipping optimize test - GEMINI_API_KEY not configured.')
        return

    payload = {
        'orders': [
            {'order_id': 'ORD-TEST-1', 'material': 'HR Coil', 'quantity': 420, 'due_date': '2025-10-14', 'priority': 'High', 'destination': 'Delhi'},
            {'order_id': 'ORD-TEST-2', 'material': 'CR Sheet', 'quantity': 300, 'due_date': '2025-10-15', 'priority': 'Medium', 'destination': 'Mumbai'},
        ],
        'stockyards': [
            {'stockyard': 'Yard-A', 'material': 'HR Coil', 'quantity_available': 600, 'loading_point': 'LP-1', 'transport_cost_per_ton': 18},
            {'stockyard': 'Yard-B', 'material': 'CR Sheet', 'quantity_available': 450, 'loading_point': 'LP-2', 'transport_cost_per_ton': 19},
        ],
        'loading_points': [
            {'loading_point': 'LP-1', 'siding': 'Siding-Alpha', 'daily_capacity_ton': 600},
            {'loading_point': 'LP-2', 'siding': 'Siding-Beta', 'daily_capacity_ton': 500},
        ],
        'rakes': [
            {'rake_id': 'Rake-01', 'wagon_type': 'BOXN', 'wagons_available': 40, 'wagon_capacity_ton': 58, 'loading_point': 'LP-1'},
            {'rake_id': 'Rake-02', 'wagon_type': 'BOXNHL', 'wagons_available': 45, 'wagon_capacity_ton': 60, 'loading_point': 'LP-2'},
        ],
        'costs': [
            {'material': 'HR Coil', 'destination': 'Delhi', 'transport_cost_per_ton': 22, 'loading_cost_per_ton': 4, 'penalty_cost_per_ton': 12},
            {'material': 'CR Sheet', 'destination': 'Mumbai', 'transport_cost_per_ton': 26, 'loading_cost_per_ton': 5, 'penalty_cost_per_ton': 14},
        ],
        'constraints': {'minRakeTonnage': 1800, 'sidingCapacity': 600},
        'wagon_availability': {'BOXN': True, 'BOXNHL': True, 'BRN': False},
    }

    response = requests.post(f'{API}/optimize', json=payload, timeout=120)
    print('status', response.status_code)
    print(response.json())


if __name__ == '__main__':
    test_optimize()
