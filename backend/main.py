import json, os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from groq_engine import get_next_message, parse_profile
from scorer import score_products, get_recommendation_summary

load_dotenv()
app = FastAPI(title="Algorix API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def load_products():
    path = os.path.join(os.path.dirname(__file__), "products.json")
    with open(path, "r") as f:
        return json.load(f)

PRODUCTS = load_products()

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[Message]

class RecommendRequest(BaseModel):
    profile: dict

@app.get("/")
def root():
    return {"status": "Algorix API running"}

@app.get("/health")
def health():
    return {"status": "ok", "products_loaded": len(PRODUCTS)}

@app.post("/chat")
async def chat(request: ChatRequest):
    messages = [{"role": m.role, "content": m.content} for m in request.messages]
    ai_response = get_next_message(messages)
    profile = parse_profile(ai_response)
    if profile:
        return {"reply": "Perfect! I have everything I need. Let me find the best products for you...", "done": True, "profile": profile}
    return {"reply": ai_response, "done": False, "profile": None}

@app.post("/recommend")
async def recommend(request: RecommendRequest):
    if not request.profile:
        raise HTTPException(status_code=400, detail="Profile required")
    scored = score_products(PRODUCTS, request.profile)
    top3 = scored[:3]
    summary = get_recommendation_summary(top3[0], request.profile) if top3 else ""
    return {"results": top3, "summary": summary, "total_analyzed": len(scored), "profile": request.profile}

@app.get("/products")
def get_all_products():
    return {"products": PRODUCTS, "count": len(PRODUCTS)}