# groq_engine.py
import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

SYSTEM_PROMPT = """
You are Verdiqt, an intelligent product advisor.
Your job is to understand exactly what product the user wants to buy.
Ask ONE clear, conversational question at a time to understand:
1. What product category they want (camera, laptop, phone, headphones, etc.)
2. Their budget in Indian Rupees
3. Key features they need (night vision, waterproof, wireless, etc.)
4. Use case (indoor/outdoor, personal/office, beginner/professional)

Rules:
- Ask only ONE question per response
- Be friendly and conversational, not robotic
- After you have all 4 pieces of information, respond ONLY with this JSON and nothing else:
{"DONE": true, "profile": {"category": "security_camera", "budget": 3000, "features": ["night vision", "waterproof"], "use_case": "outdoor"}}
- Replace the example values with actual values from the conversation
- Budget must be a number, not a string
- Features must be a list of strings
- Do not add any text before or after the JSON when you are done
"""

def get_next_message(messages: list) -> str:
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                *messages
            ],
            max_tokens=500,
            temperature=0.7
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"I apologize, I encountered an issue. Please try again. Error: {str(e)}"

def parse_profile(response_text: str) -> dict | None:
    try:
        if '"DONE": true' in response_text or '"DONE":true' in response_text:
            start = response_text.find('{')
            end = response_text.rfind('}') + 1
            json_str = response_text[start:end]
            data = json.loads(json_str)
            if data.get("DONE"):
                return data.get("profile")
    except (json.JSONDecodeError, ValueError):
        pass
    return None