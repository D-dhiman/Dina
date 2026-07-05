import requests, json
url = 'http://localhost:8000/twin/dailies/sync'
payload = {
    'patient_id': 'PT_NEENA_373',
    'prescriptions': [
        {'name': 'Test Daily From UI', 'system_action': 'new', 'frequency': 'daily'}
    ]
}
r = requests.post(url, json=payload)
print('status', r.status_code)
print(json.dumps(r.json(), indent=2)[:2000])