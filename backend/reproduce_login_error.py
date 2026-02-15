import requests
import json

url = "http://localhost:8000/api/v1/auth/login"
data = {"username": "", "password": ""}
headers = {"Content-Type": "application/x-www-form-urlencoded"}

try:
    response = requests.post(url, data=data, headers=headers)
    print(f"Status Code: {response.status_code}")
    try:
        print(json.dumps(response.json(), indent=2))
    except:
        print(response.text)
except Exception as e:
    print(f"Error: {e}")
