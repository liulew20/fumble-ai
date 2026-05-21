"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import API_URL from "@/lib/api";
import { useMode } from "./components/ModeProvider";

interface Agent {
  id: string;
  name: string;
  bio: string | null;
  traits: string[];
  interests: string[];
  avatar: string | null;
}

interface FeedItem {
  id: string;
  agent_1_name: string;
  agent_2_name: string;
  status: string;
  outcome: string | null;
  compatibility_score: number | null;
  preview: string | null;
  created_at: string;
}

const OUTCOME_LABELS: Record<string, string> = {
  dating: "💚 Dating",
  netflix_and_chill: "🍿 Netflix & Chill",
  situationship: "🌀 Situationship",
  failed: "💔 Failed",
  // legacy
  match: "💚 Dating",
  rejection: "💔 Failed",
  ghosted: "👻 Ghosted",
};

const OUTCOME_COLORS: Record<string, string> = {
  dating: "bg-green-100 text-green-800",
  netflix_and_chill: "bg-purple-100 text-purple-800",
  situationship: "bg-yellow-100 text-yellow-800",
  failed: "bg-red-100 text-red-800",
  match: "bg-green-100 text-green-800",
  rejection: "bg-red-100 text-red-800",
  ghosted: "bg-gray-100 text-gray-600",
};

function avatarUrl(seed: string, uploaded?: string | null) {
  if (uploaded) return uploaded;
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=ffdfbf,ffd5dc,d1d4f9,b6e3f4,c0aede`;
}

function StatusBadge({ status, outcome }: { status: string; outcome: string | null }) {
  if (status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-100 px-2.5 py-0.5 text-xs font-semibold text-pink-700">
        <span className="h-1.5 w-1.5 rounded-full bg-pink-500 animate-pulse" />
        Happening Now
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
        <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
        Starting…
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
        Error
      </span>
    );
  }
  if (outcome) {
    const label = OUTCOME_LABELS[outcome] ?? outcome;
    const color = OUTCOME_COLORS[outcome] ?? "bg-gray-100 text-gray-700";
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
      Completed
    </span>
  );
}

function AgentCard({ agent, selected, onClick, onDelete }: { agent: Agent; selected?: boolean; onClick?: () => void; onDelete?: () => void }) {
  return (
    <div className="relative group w-28 shrink-0">
      <button
        type="button"
        onClick={onClick}
        className={`flex flex-col items-center gap-2 rounded-xl border p-3 w-full transition-all text-left ${
          selected
            ? "border-pink-400 bg-pink-50 shadow-sm"
            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
        }`}
      >
        <img
          src={avatarUrl(agent.name, agent.avatar)}
          alt={agent.name}
          className="w-14 h-14 rounded-full border border-gray-100 bg-gray-50 object-cover"
        />
        <p className="text-xs font-semibold text-center text-gray-800 leading-tight line-clamp-1 w-full">
          {agent.name}
        </p>
        {agent.traits?.[0] && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 leading-tight line-clamp-1">
            {agent.traits[0]}
          </span>
        )}
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute -top-1.5 -right-1.5 hidden group-hover:flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none shadow hover:bg-red-600 transition-colors"
          title="删除 Agent"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default function LoveFeed() {
  const router = useRouter();
  const { mode } = useMode();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  // Matchmaker state
  const [matchOpen, setMatchOpen] = useState(false);
  const [pick1, setPick1] = useState("");
  const [pick2, setPick2] = useState("");

  async function fetchFeed() {
    try {
      const res = await fetch(`${API_URL}/feed`);
      if (res.ok) setItems(await res.json());
    } catch { /* backend not ready */ }
    setLoading(false);
  }

  async function fetchAgents() {
    try {
      const res = await fetch(`${API_URL}/agents`);
      if (res.ok) setAgents(await res.json());
    } catch { /* ignore */ }
  }

  useEffect(() => {
    fetchFeed();
    fetchAgents();
    const interval = setInterval(fetchFeed, 5000);
    return () => clearInterval(interval);
  }, []);

  async function startDate(body: object = {}) {
    setStarting(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/dates/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, ...body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ?? "Could not start a date.");
      } else {
        setMatchOpen(false);
        setPick1(""); setPick2("");
        await fetchFeed();
        router.push(`/dates/${data.id}`);
      }
    } catch {
      setError("Could not reach the backend.");
    } finally {
      setStarting(false);
    }
  }

  function handleAgentCardClick(agentId: string) {
    setMatchOpen(true);
    setError("");
    if (!pick1) { setPick1(agentId); return; }
    if (!pick2 && agentId !== pick1) { setPick2(agentId); return; }
    setPick1(agentId); setPick2("");
  }

  async function deleteAgent(agentId: string) {
    if (!confirm("确定要删除这个 Agent 吗？")) return;
    try {
      const res = await fetch(`${API_URL}/agents/${agentId}`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        if (pick1 === agentId) setPick1("");
        if (pick2 === agentId) setPick2("");
        await fetchAgents();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? "删除失败");
      }
    } catch {
      setError("无法连接到后端");
    }
  }

  const liveCount = items.filter((i) => i.status === "in_progress" || i.status === "pending").length;

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-6 sm:py-8">

      {/* ── Existing Agents ── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            Existing Agents
            {agents.length > 0 && (
              <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-500 normal-case tracking-normal">
                {agents.length}
              </span>
            )}
          </h2>
          <Link href="/create-agent" className="text-xs font-semibold text-pink-600 hover:text-pink-800 transition-colors">
            + New Agent
          </Link>
        </div>

        {agents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-xs text-gray-400">
            No agents yet.{" "}
            <Link href="/create-agent" className="underline text-gray-600">Create one</Link> to get started.
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                selected={pick1 === agent.id || pick2 === agent.id}
                onClick={() => handleAgentCardClick(agent.id)}
                onDelete={() => deleteAgent(agent.id)}
              />
            ))}
          </div>
        )}

        {(pick1 || pick2) && (
          <p className="mt-2 text-xs text-pink-600">
            {pick1 && pick2
              ? "Both selected — open Matchmaker to start the date."
              : "Select one more agent to pair them."}
          </p>
        )}
      </section>

      {/* ── Love Feed header ── */}
      <div className="mb-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Love Feed</h1>
            <p className="text-sm text-gray-600 mt-0.5">
              Watch AI agents fall in love (or not) in real time.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => { setMatchOpen(true); setError(""); }}
              className="flex-1 sm:flex-none rounded-md border px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Matchmaker 🏹
            </button>
            <button
              onClick={() => startDate()}
              disabled={starting}
              className="flex-1 sm:flex-none rounded-md bg-black px-3 py-2 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {starting ? "Starting…" : "Random Date"}
            </button>
          </div>
        </div>

        {liveCount > 0 && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-pink-600 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-pink-500 animate-pulse" />
            {liveCount} date{liveCount > 1 ? "s" : ""} happening right now
          </div>
        )}
      </div>

      {/* ── Human Matchmaker panel ── */}
      {matchOpen && (
        <div className="mb-5 rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Human Matchmaker Mode 🏹</p>
            <button
              onClick={() => { setMatchOpen(false); setPick1(""); setPick2(""); }}
              className="text-gray-400 hover:text-gray-700 text-lg leading-none"
            >
              ×
            </button>
          </div>

          {agents.length < 2 ? (
            <p className="text-xs text-gray-500">
              Need at least 2 agents.{" "}
              <Link href="/create-agent" className="underline">Create one</Link>.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Avatar preview row */}
              {(pick1 || pick2) && (
                <div className="flex items-center justify-center gap-4 py-2">
                  {pick1 ? (
                    <div className="flex flex-col items-center gap-1">
                      <img src={avatarUrl(agents.find(a => a.id === pick1)?.name ?? "")} className="w-12 h-12 rounded-full border" alt="" />
                      <span className="text-xs text-gray-600">{agents.find(a => a.id === pick1)?.name}</span>
                    </div>
                  ) : <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-200" />}
                  <span className="text-pink-400 text-xl font-bold">♥</span>
                  {pick2 ? (
                    <div className="flex flex-col items-center gap-1">
                      <img src={avatarUrl(agents.find(a => a.id === pick2)?.name ?? "")} className="w-12 h-12 rounded-full border" alt="" />
                      <span className="text-xs text-gray-600">{agents.find(a => a.id === pick2)?.name}</span>
                    </div>
                  ) : <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-200" />}
                </div>
              )}

              <div className="flex gap-2">
                <select
                  value={pick1}
                  onChange={(e) => setPick1(e.target.value)}
                  className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">Select agent 1…</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id} disabled={a.id === pick2}>{a.name}</option>
                  ))}
                </select>
                <span className="self-center text-pink-400 font-bold text-lg">♥</span>
                <select
                  value={pick2}
                  onChange={(e) => setPick2(e.target.value)}
                  className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">Select agent 2…</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id} disabled={a.id === pick1}>{a.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => startDate({ agent_1_id: pick1, agent_2_id: pick2 })}
                disabled={!pick1 || !pick2 || pick1 === pick2 || starting}
                className="w-full rounded-md bg-black py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40 transition-colors"
              >
                {starting ? "Starting…" : "Start This Date"}
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Feed list ── */}
      {loading ? (
        <p className="text-sm text-gray-400 text-center py-16">Loading…</p>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-5xl mb-3">💔</p>
          <p className="text-sm font-medium text-gray-500 mb-1">No dates yet</p>
          <p className="text-xs text-gray-400">Hit "Random Date" to kick things off!</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/dates/${item.id}`}
                className="block rounded-xl border bg-white p-4 hover:shadow-md hover:border-gray-300 transition-all"
              >
                <div className="flex items-start gap-3">
                  {/* Stacked avatars */}
                  <div className="relative w-10 h-8 shrink-0 mt-0.5">
                    <img
                      src={avatarUrl(item.agent_1_name)}
                      alt={item.agent_1_name}
                      className="absolute left-0 top-0 w-8 h-8 rounded-full border-2 border-white bg-gray-100"
                    />
                    <img
                      src={avatarUrl(item.agent_2_name)}
                      alt={item.agent_2_name}
                      className="absolute left-4 top-0 w-8 h-8 rounded-full border-2 border-white bg-gray-100"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">
                      {item.agent_1_name}
                      <span className="text-pink-400 mx-1.5">♥</span>
                      {item.agent_2_name}
                    </p>
                    {item.preview && (
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        "{item.preview}"
                      </p>
                    )}
                    <p className="mt-1.5 text-xs text-gray-400">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <StatusBadge status={item.status} outcome={item.outcome} />
                    {item.compatibility_score != null && (
                      <span className="text-xs text-gray-500 font-medium tabular-nums">
                        {Math.round(item.compatibility_score)}% compatible
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {agents.length > 0 && items.length > 0 && (
        <p className="mt-6 text-center text-xs text-gray-400">
          {agents.length} agent{agents.length !== 1 ? "s" : ""} in the pool · refreshes every 5s
        </p>
      )}
    </div>
  );
}
