# scraper.py
# Stub module — returns static product data for hackathon demo.
# Extend with Playwright/httpx scraping if live pricing is needed.

def enrich_product_data(product: dict) -> dict:
    """
    Placeholder for live price enrichment.
    Currently returns the product unchanged (static JSON data is used).
    To enable live scraping: add Playwright or httpx calls here.
    """
    return product


def get_buy_url(product: dict, platform: str = "amazon") -> str:
    """
    Generate a search URL for the product on the given platform.
    Used in the frontend 'Buy Now' button.
    """
    query = product.get("name", "").replace(" ", "+")
    urls = {
        "amazon": f"https://www.amazon.in/s?k={query}",
        "flipkart": f"https://www.flipkart.com/search?q={query}",
        "croma": f"https://www.croma.com/searchB?q={query}",
    }
    return urls.get(platform, urls["amazon"])
