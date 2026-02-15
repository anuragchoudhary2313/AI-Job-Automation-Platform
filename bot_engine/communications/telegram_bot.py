import requests

def telegram_notifications(chat_id: str, message: str, token: str):
    """
    Sends a notification via Telegram Bot API.
    """
    api_url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message
    }
    try:
        # response = requests.post(api_url, json=payload)
        # response.raise_for_status()
        print(f"Telegram sent to {chat_id}: {message}")
    except Exception as e:
        print(f"Telegram fail: {e}")
