from google import genai
from config import AI

client = genai.Client(api_key=AI.gemini_api_key)

for model in client.models.list():
    print(model.name)