import requests

url = "http://localhost:8000/api/v1/auth/forgot-password"
data = {"email": "dynamicbaba6@gmail.com"}

print("Sending request to:", url)
try:
    response = requests.post(url, json=data)
    print("Status Code:", response.status_code)
    print("Response Body:", response.text)
except Exception as e:
    print("Request failed:", e)
