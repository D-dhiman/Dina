import requests
import json

url = 'http://localhost:8000/twin/habits/sync'
payload = {
    'patient_id': 'PT_NEENA_373',
    'prescriptions': [
        {'name': 'Test Habit From UI', 'system_action': 'new', 'frequency': 'daily'}
    ]
}

r = requests.post(url, json=payload)
print('status', r.status_code)
try:
    print(json.dumps(r.json(), indent=2)[:2000])
except Exception as e:
    print('response text:', r.text)