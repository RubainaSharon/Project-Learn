import requests

GEMINI_API_KEY = "AIzaSyDXFJ6vfjTj8EuTCKLMbGZrylPDkyvy4PY"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"

headers = {
    "Content-Type": "application/json"
}

data = {
    "contents": [
        {
            "parts": [
                {"text": "How you doing today?"}
            ]
        }
    ]
}

try:
    response = requests.post(GEMINI_URL, headers=headers, json=data)
    response.raise_for_status()  # Raise an error for bad HTTP status
    result = response.json()
    # Extracting and printing the output
    text_response = result["candidates"][0]["content"]["parts"][0]["text"]
    print(text_response)
except Exception as e:
    print(f"Error: {e}")