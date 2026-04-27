import os, json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

SYSTEM_PROMPT = """
You are Verdiqt, an intelligent product advisor.
Ask ONE clear conversational question at a time to understand:
1. Product category
2. Budget in Indian Rupees
3. Key features needed
4. Use case (indoor/outdoor, personal/office)

Rules:
- Ask only ONE question per response
- Be friendly, not robotic
- After collecting all 4, respond ONLY with this JSON:
{"DONE": true, "profile": {"category": "security_camera", "budget": 3000, "features": ["night vision", "waterproof"], "use_case": "outdoor"}}
- Budget must be a number. Features must be a list. No text before/after JSON.
"""

def get_next_message(messages: list) -> str:
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "system", "content": SYSTEM_PROMPT}, *messages],
            max_tokens=500,
            temperature=0.7
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error: {str(e)}"

def parse_profile(response_text: str) -> dict | None:
    try:
        if '"DONE": true' in response_text or '"DONE":true' in response_text:
            start = response_text.find('{')
            end = response_text.rfind('}') + 1
            data = json.loads(response_text[start:end])
            if data.get("DONE"):
                return data.get("profile")
    except (json.JSONDecodeError, ValueError):
        pass
    return None