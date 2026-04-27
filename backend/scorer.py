# scorer.py
from rapidfuzz import fuzz
from sentiment import analyze_reviews, get_trust_score


def _get_best_price(product: dict) -> tuple[int, str]:
    """Return (lowest_price, platform_name) across amazon/flipkart/croma."""
    prices = {
        "amazon": product.get("amazon_price") or 0,
        "flipkart": product.get("flipkart_price") or 0,
        "croma": product.get("croma_price") or 0,
    }
    # Filter out zero/missing prices before finding min
    valid = {k: v for k, v in prices.items() if v > 0}
    if not valid:
        return 0, "unknown"
    best_platform = min(valid, key=valid.get)
    return valid[best_platform], best_platform


def _feature_match_score(profile_features: list[str], product_specs: list[str]) -> float:
    """
    Fuzzy-match each profile feature against every product spec.
    Returns a 0-100 float representing how well specs cover requested features.
    """
    if not profile_features:
        return 50.0  # neutral if no features were requested
    hits = 0
    for pf in profile_features:
        best = max(
            fuzz.partial_ratio(pf.lower(), spec.lower())
            for spec in product_specs
        ) if product_specs else 0
        if best >= 60:
            hits += 1
    return (hits / len(profile_features)) * 100


def _price_score(best_price: int, budget: int) -> float:
    """
    Score 0-100: closest to budget ceiling without exceeding it gets 100.
    Products above budget still get a small score so they're not completely hidden.
    """
    if best_price <= 0:
        return 0.0
    ratio = best_price / budget
    if ratio <= 1.0:
        # Within budget: score peaks at ~90-100% of budget
        return min(100.0, ratio * 100)
    else:
        # Over budget: penalise proportionally
        return max(0.0, 100 - (ratio - 1) * 200)


def score_products(products: list[dict], profile: dict) -> list[dict]:
    """
    Filter and rank products against a user profile.

    Profile shape:
        { "category": str, "budget": int, "features": list[str], "use_case": str }

    Returns a list of enriched product dicts sorted by final_score desc.
    """
    category = profile.get("category", "").lower().replace(" ", "_")
    budget = int(profile.get("budget", 0))
    features = [f.lower() for f in profile.get("features", [])]
    use_case = profile.get("use_case", "").lower()

    # ------------------------------------------------------------------
    # 1. Category filter (hard) — also add use_case as an implicit feature
    # ------------------------------------------------------------------
    if use_case and use_case not in features:
        features.append(use_case)

    candidates = [
        p for p in products
        if p.get("category", "").lower().replace(" ", "_") == category
    ]

    if not candidates:
        # Fallback: return everything sorted by rating if category not found
        candidates = products[:]

    # ------------------------------------------------------------------
    # 2. Budget filter — allow up to 130% of budget (slight leniency)
    # ------------------------------------------------------------------
    budget_ceiling = budget * 1.30 if budget > 0 else float("inf")
    candidates = [
        p for p in candidates
        if _get_best_price(p)[0] <= budget_ceiling or _get_best_price(p)[0] == 0
    ]

    # ------------------------------------------------------------------
    # 3. Score each candidate
    # ------------------------------------------------------------------
    scored = []
    for product in candidates:
        best_price, best_platform = _get_best_price(product)

        # Feature match (50% weight)
        feat_score = _feature_match_score(features, product.get("specs", []))

        # Price score (30% weight)
        pr_score = _price_score(best_price, budget) if budget > 0 else 50.0

        # Sentiment/trust score from reviews (20% weight)
        reviews = product.get("reviews", [])
        trust = analyze_reviews(reviews)   # returns 0-1 float
        sentiment_score = trust * 100      # scale to 0-100

        # Weighted final score
        final_score = round(
            (feat_score * 0.50) + (pr_score * 0.30) + (sentiment_score * 0.20),
            1,
        )

        scored.append({
            # Core identity
            "id": product.get("id"),
            "name": product.get("name"),
            "brand": product.get("brand"),
            "category": product.get("category"),
            "specs": product.get("specs", []),
            # Pricing
            "best_price": best_price,
            "best_platform": best_platform,
            "prices": {
                "amazon": product.get("amazon_price"),
                "flipkart": product.get("flipkart_price"),
                "croma": product.get("croma_price"),
            },
            "savings": max(
                product.get("amazon_price") or 0,
                product.get("flipkart_price") or 0,
                product.get("croma_price") or 0,
            ) - best_price,
            # Scoring breakdown
            "feature_score": round(feat_score, 1),
            "price_score": round(pr_score, 1),
            "trust_score": get_trust_score(reviews),   # 0-100 int
            "final_score": final_score,
            # Review metadata
            "rating": product.get("rating"),
            "review_count": product.get("review_count"),
        })

    scored.sort(key=lambda x: x["final_score"], reverse=True)
    return scored[:5]  # Top 5


def get_recommendation_summary(top_product: dict, profile: dict) -> str:
    platform = top_product.get("best_platform", "online").capitalize()
    price = top_product.get("best_price", 0)
    score = top_product.get("final_score", 0)
    trust = top_product.get("trust_score", 0)
    return (
        f"{top_product['name']} is your best match with a score of {score}/100. "
        f"Buy it on {platform} for ₹{price:,}. "
        f"Review trust score: {trust}/100."
    )