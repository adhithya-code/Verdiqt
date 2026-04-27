"use client";
import { useState, useRef, useEffect } from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  final_score: number;
  trust_score: number;
  feature_score: number;
  price_score: number;
  best_price: number;
  best_platform: string;
  prices: { amazon: number | null; flipkart: number | null; croma: number | null };
  specs: string[];
  rating: number;
  review_count: number;
  savings: number;
}

interface RecommendResponse {
  results: Product[];
  summary: string;
  profile: Record<string, unknown>;
  total_analyzed: number;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const API = "http://localhost:8000";

const platformColors: Record<string, string> = {
  amazon: "bg-orange-500",
  flipkart: "bg-blue-600",
  croma: "bg-green-600",
  unknown: "bg-gray-500",
};

const platformIcons: Record<string, string> = {
  amazon: "🛒",
  flipkart: "🏪",
  croma: "🔌",
  unknown: "🏬",
};

const rankStyles = [
  { border: "border-yellow-400", label: "🥇 Best Match", glow: "shadow-yellow-400/20" },
  { border: "border-gray-400",   label: "🥈 Runner Up",  glow: "shadow-gray-400/20"  },
  { border: "border-orange-500", label: "🥉 Third Pick", glow: "shadow-orange-500/20"},
  { border: "border-purple-400", label: "4th Pick",      glow: ""                    },
  { border: "border-blue-400",   label: "5th Pick",      glow: ""                    },
];

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────
function ScoreBadge({ score, label, color }: { score: number; label: string; color?: string }) {
  const autoColor = color
    ? color
    : score >= 75
    ? "text-green-400"
    : score >= 50
    ? "text-yellow-400"
    : "text-red-400";
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`text-xl font-bold ${autoColor}`}>{score}</span>
      <span className="text-xs text-gray-400 text-center leading-tight">{label}</span>
    </div>
  );
}

function ProductCard({ product, rank }: { product: Product; rank: number }) {
  const style = rankStyles[rank] ?? rankStyles[4];
  const buyUrl = (platform: string) => {
    const q = encodeURIComponent(product.name);
    const urls: Record<string, string> = {
      amazon: `https://www.amazon.in/s?k=${q}`,
      flipkart: `https://www.flipkart.com/search?q=${q}`,
      croma: `https://www.croma.com/searchB?q=${q}`,
    };
    return urls[platform] ?? urls["amazon"];
  };

  return (
    <div className={`bg-gray-800/80 border-2 ${style.border} rounded-2xl p-5 flex flex-col gap-4 shadow-lg ${style.glow}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-yellow-400 mb-1">{style.label}</p>
          <h3 className="text-white font-semibold text-sm leading-snug">{product.name}</h3>
          <p className="text-gray-400 text-xs mt-1">{product.brand} · {product.category.replace("_", " ")}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold text-white">₹{product.best_price.toLocaleString("en-IN")}</p>
          <span className={`text-xs text-white px-2 py-0.5 rounded-full ${platformColors[product.best_platform] ?? "bg-gray-600"}`}>
            {platformIcons[product.best_platform]} {product.best_platform}
          </span>
          {product.savings > 0 && (
            <p className="text-green-400 text-xs mt-1">Save ₹{product.savings.toLocaleString("en-IN")}</p>
          )}
        </div>
      </div>

      {/* Score Bar */}
      <div className="flex justify-around bg-gray-900 rounded-xl py-3 px-2">
        <ScoreBadge score={product.final_score} label="Match Score" />
        <div className="w-px bg-gray-700" />
        <ScoreBadge score={product.trust_score} label="Trust Score" />
        <div className="w-px bg-gray-700" />
        <ScoreBadge score={product.feature_score} label="Features" />
        <div className="w-px bg-gray-700" />
        <ScoreBadge score={product.price_score} label="Price Fit" />
      </div>

      {/* Price Comparison */}
      <div className="grid grid-cols-3 gap-2">
        {(["amazon", "flipkart", "croma"] as const).map((platform) => {
          const price = product.prices[platform];
          const isBest = platform === product.best_platform;
          return (
            <a
              key={platform}
              href={buyUrl(platform)}
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-lg p-2 text-center transition-all hover:scale-105 cursor-pointer ${
                isBest ? "bg-green-900 border border-green-500" : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              <p className="text-xs text-gray-300 capitalize">{platform}</p>
              <p className="text-white font-semibold text-sm">
                {price ? `₹${price.toLocaleString("en-IN")}` : "N/A"}
              </p>
              {isBest && <p className="text-green-400 text-xs">Best!</p>}
            </a>
          );
        })}
      </div>

      {/* Specs */}
      <div className="flex flex-wrap gap-1">
        {product.specs.slice(0, 6).map((spec) => (
          <span key={spec} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
            {spec}
          </span>
        ))}
      </div>

      {/* Rating + Buy Button */}
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-xs">
          ⭐ {product.rating} · {product.review_count.toLocaleString()} reviews
        </p>
        <a
          href={buyUrl(product.best_platform)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold px-3 py-1.5 rounded-lg transition-colors"
        >
          Buy Now →
        </a>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"chat" | "loading" | "results">("chat");
  const [results, setResults] = useState<RecommendResponse | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Greeting on mount
  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: "Hi! I'm Verdiqt, your AI product advisor 👋 I can help you find the best camera, laptop, smartphone, headphones, or smartwatch. What are you looking to buy today?",
      },
    ]);
  }, []);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });
      const data = await res.json();

      if (data.done && data.profile) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
        setPhase("loading");
        setLoading(false);

        const recRes = await fetch(`${API}/recommend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile: data.profile }),
        });
        const recData = await recRes.json();
        setResults(recData);
        setPhase("results");
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
        setLoading(false);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Connection error. Make sure the backend is running on port 8000." },
      ]);
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetChat = () => {
    setMessages([{ role: "assistant", content: "Let's find another product! What are you looking for?" }]);
    setPhase("chat");
    setResults(null);
    setInput("");
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold">
            <span className="text-yellow-400">Verdiqt</span>
            <span className="text-gray-400 text-sm font-normal ml-2">by Algorix</span>
          </h1>
          <p className="text-xs text-gray-500">AI-Powered Product Recommendation · India</p>
        </div>
        {phase === "results" && (
          <button
            onClick={resetChat}
            className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            🔄 New Search
          </button>
        )}
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <div className={`flex flex-col transition-all duration-500 ${phase === "results" ? "w-1/2 border-r border-gray-800" : "w-full max-w-2xl mx-auto"}`}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-yellow-500 text-gray-900 font-medium"
                    : "bg-gray-800 text-gray-100"
                }`}>
                  {msg.role === "assistant" && (
                    <p className="text-xs text-yellow-400 font-semibold mb-1">Verdiqt</p>
                  )}
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 rounded-2xl px-4 py-3">
                  <p className="text-xs text-yellow-400 font-semibold mb-1">Verdiqt</p>
                  <div className="flex gap-1">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {phase !== "loading" && (
            <div className="border-t border-gray-800 p-4 flex gap-2 shrink-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={loading}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 transition-colors"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-gray-900 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                Send
              </button>
            </div>
          )}

          {phase === "loading" && (
            <div className="border-t border-gray-800 p-6 text-center shrink-0">
              <div className="flex justify-center gap-2 mb-3">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
              <p className="text-gray-400 text-sm">Analyzing products with AI scoring engine...</p>
            </div>
          )}
        </div>

        {/* Results Panel */}
        {phase === "results" && results && (
          <div className="w-1/2 overflow-y-auto p-4 space-y-4">
            {/* Summary Card */}
            <div className="bg-gray-900 rounded-xl p-4 border border-yellow-400/30">
              <h2 className="text-yellow-400 font-bold text-sm mb-1">🎯 AI Recommendation Summary</h2>
              <p className="text-gray-300 text-sm">{results.summary}</p>
              <p className="text-gray-500 text-xs mt-2">
                Analyzed {results.total_analyzed} products · Amazon · Flipkart · Croma
              </p>
            </div>

            {/* Product Cards */}
            {results.results.map((product, i) => (
              <ProductCard key={product.id} product={product} rank={i} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
