from ai.gemini_client import GeminiClient

client = GeminiClient()

response = client.generate(
    "Say hello in exactly three words."
)

print(response)