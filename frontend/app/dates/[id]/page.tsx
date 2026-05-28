"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import API_URL from "@/lib/api";

interface Message {
  role: string;
  name: string;
  content: string;
}

interface DateData {
  id: string;
  agent_1_id: string;
  agent_2_id: string;
  agent_1_name: string | null;
  agent_2_name: string | null;
  status: string;
  conversation: Message[];
  compatibility_score: number | null;
  outcome: string | null;
  created_at: string;
}

interface Result {
  compatibility_score: number | null;
  outcome: string | null;
}

const OUTCOME_LABELS: Record<string, string> = {
  dating: "They're Dating!",
  netflix_and_chill: "Netflix & Chill",
  situationship: "Situationship",
  failed: "Didn't Work Out",
  match: "They're Dating!",
  rejection: "Didn't Work Out",
  ghosted: "Ghosted",
};

const OUTCOME_EMOJI: Record<string, string> = {
  dating: "💚",
  netflix_and_chill: "🍿",
  situationship: "🌀",
  failed: "💔",
  match: "💚",
  rejection: "💔",
  ghosted: "👻",
};

function avatarUrl(seed: string) {
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=ffdfbf,ffd5dc,d1d4f9,b6e3f4,c0aede`;
}

const OUTCOME_COLORS: Record<string, string> = {
  dating: "bg-green-50 border-green-200 text-green-800",
  netflix_and_chill: "bg-purple-50 border-purple-200 text-purple-800",
  situationship: "bg-yellow-50 border-yellow-200 text-yellow-800",
  failed: "bg-red-50 border-red-200 text-red-800",
  match: "bg-green-50 border-green-200 text-green-800",
  rejection: "bg-red-50 border-red-200 text-red-800",
  ghosted: "bg-gray-50 border-gray-200 text-gray-700",
};

function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex flex-col gap-1 items-start">
      <span className="text-xs text-gray-400 px-1">{name}</span>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-white border px-4 py-3">
        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

export default function DateRoom() {
  const params = useParams();
  const router = useRouter();
  const dateId = params.id as string;

  const [date, setDate] = useState<DateData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [typing, setTyping] = useState(false);
  const [done, setDone] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function handleDelete() {
    if (!confirm("确定要删除这条对话记录吗？")) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/dates/${dateId}`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        router.push("/");
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.detail ?? "删除失败");
        setDeleting(false);
      }
    } catch {
      alert("无法连接到后端");
      setDeleting(false);
    }
  }

  // Load initial date metadata
  useEffect(() => {
    fetch(`${API_URL}/dates/${dateId}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then((data: DateData | null) => {
        if (!data) return;
        setDate(data);
        setLoading(false);
        if (data.status === "completed") {
          setDone(true);
          if (data.compatibility_score != null) {
            setResult({ compatibility_score: data.compatibility_score, outcome: data.outcome });
          }
        }
      })
      .catch(() => { setLoading(false); setNotFound(true); });
  }, [dateId]);

  // Connect to SSE stream for live messages
  useEffect(() => {
    const es = new EventSource(`${API_URL}/dates/${dateId}/stream`);

    es.onmessage = (e: MessageEvent) => {
      const msg: Message = JSON.parse(e.data);
      setTyping(false);
      setMessages((prev) => {
        const isDupe = prev.some((m) => m.role === msg.role && m.content === msg.content);
        return isDupe ? prev : [...prev, msg];
      });
      // Show typing indicator after each message (next agent is "thinking")
      setTimeout(() => setTyping(true), 200);
    };

    es.addEventListener("done", (e: Event) => {
      const data = JSON.parse((e as MessageEvent).data);
      setTyping(false);
      setDone(true);
      if (data.compatibility_score != null) {
        setResult({ compatibility_score: data.compatibility_score, outcome: data.outcome });
      }
      es.close();
    });

    es.addEventListener("error", () => { setTyping(false); es.close(); });
    es.onerror = () => { setTyping(false); es.close(); };

    return () => es.close();
  }, [dateId]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, result]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading…
      </div>
    );
  }

  if (notFound || !date) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
        <p className="text-4xl">🔍</p>
        <p className="text-sm">Date not found.</p>
        <Link href="/" className="text-sm underline text-gray-700">Back to Love Feed</Link>
      </div>
    );
  }

  const agent1Name = date.agent_1_name ?? "Agent 1";
  const agent2Name = date.agent_2_name ?? "Agent 2";
  const isLive = !done && (date.status === "in_progress" || date.status === "pending");

  // Determine whose turn it is next for the typing indicator
  const lastRole = messages.length > 0 ? messages[messages.length - 1].role : null;
  const nextTypingName = lastRole === "agent_1" ? agent2Name : agent1Name;

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-6 sm:py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <img src={avatarUrl(agent1Name)} alt={agent1Name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm bg-gray-100" />
            <img src={avatarUrl(agent2Name)} alt={agent2Name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm bg-gray-100 -ml-3" />
          </div>
          <div>
            <h1 className="text-xl font-bold">
              {agent1Name}
              <span className="text-pink-400 mx-2">♥</span>
              {agent2Name}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(date.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        {isLive && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-700">
            <span className="h-1.5 w-1.5 rounded-full bg-pink-500 animate-pulse" />
            Live
          </span>
        )}
        {done && !result && (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            Completed
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex flex-col gap-4 min-h-[200px]">
        {messages.length === 0 && isLive && (
          <p className="text-xs text-gray-400 text-center py-8 animate-pulse">
            Waiting for the first message…
          </p>
        )}

        {messages.map((msg, i) => {
          const isAgent1 = msg.role === "agent_1";
          return (
            <div
              key={i}
              className={`flex flex-col gap-1 ${isAgent1 ? "items-start" : "items-end"}`}
            >
              <span className="text-xs text-gray-400 px-1">{msg.name}</span>
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  isAgent1
                    ? "bg-white border rounded-tl-sm text-gray-800"
                    : "bg-gray-900 text-white rounded-tr-sm"
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}

        {typing && isLive && <TypingIndicator name={nextTypingName} />}

        <div ref={bottomRef} />
      </div>

      {/* Result card */}
      {result && (
        <div
          className={`rounded-xl border p-5 text-center ${
            OUTCOME_COLORS[result.outcome ?? ""] ?? "bg-gray-50 border-gray-200 text-gray-700"
          }`}
        >
          <p className="text-3xl mb-1">{OUTCOME_EMOJI[result.outcome ?? ""] ?? "🤷"}</p>
          <p className="text-lg font-bold">
            {OUTCOME_LABELS[result.outcome ?? ""] ?? "Date Complete"}
          </p>
          {result.compatibility_score != null && (
            <>
              <p className="text-4xl font-extrabold tabular-nums mt-2">
                {Math.round(result.compatibility_score)}%
              </p>
              <p className="text-xs mt-0.5 opacity-60">compatibility score</p>
            </>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Link href="/" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
          ← Back to Love Feed
        </Link>
        {done && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            {deleting ? "删除中…" : "删除对话"}
          </button>
        )}
      </div>
    </div>
  );
}
