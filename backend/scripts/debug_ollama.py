import requests
import json

def test_ollama_direct():
    url = "http://localhost:11434/api/generate"
    payload = {
        "model": "phi3",
        "prompt": "Say hello",
        "stream": False
    }
    print(f"Sending request to {url} with payload {payload}")
    try:
        response = requests.post(url, json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("Response:", response.json().get("response"))
        else:
            print("Error Response:", response.text)
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_ollama_direct()
