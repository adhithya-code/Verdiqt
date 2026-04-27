from transformers import pipeline
import numpy as np

_sentiment_pipe = None

def get_sentiment_pipe():
    global _sentiment_pipe
    if _sentiment_pipe is None:
        print("Loading sentiment model...")
        _sentiment_pipe = pipeline(
            "sentiment-analysis",
            model="cardiffnlp/twitter-roberta-base-sentiment-latest",
            truncation=True, max_length=512
        )
    return _sentiment_pipe

def analyze_reviews(reviews: list[str]) -> float:
    if not reviews:
        return 0.5
    pipe = get_sentiment_pipe()
    try:
        results = pipe(reviews[:10])
        scores = []
        for r in results:
            label = r['label'].upper()
            confidence = r['score']
            if 'POSITIVE' in label or label == 'LABEL_2':
                scores.append(confidence)
            elif 'NEGATIVE' in label or label == 'LABEL_0':
                scores.append(-confidence)
            else:
                scores.append(0.0)
        avg = float(np.mean(scores))
        return round((avg + 1) / 2, 3)
    except Exception as e:
        print(f"Sentiment error: {e}")
        return 0.5

def get_trust_score(reviews: list[str]) -> int:
    return int(analyze_reviews(reviews) * 100)