import { useEffect, useMemo, useRef, useState } from "react";
import API from "../api/api";

function isEmailLike(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function uniqByKey(list, keyFn) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const key = keyFn(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export default function ParticipantPicker({
  value,
  onChange,
  label = "Participants",
  placeholder = "Type email or search users…",
}) {
  const participants = Array.isArray(value) ? value : [];
  const setParticipants = (next) => onChange?.(next);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const abortRef = useRef(null);

  const normalizedParticipants = useMemo(() => {
    return uniqByKey(participants, (p) =>
      p?.kind === "user" && p?.userId ? `u:${p.userId}` : p?.email ? `e:${p.email}` : ""
    );
  }, [participants]);

  useEffect(() => {
    setParticipants(normalizedParticipants);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedParticipants.length]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setOpen(true);
    setLoading(true);
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const t = setTimeout(async () => {
      try {
        const [usersRes, contactsRes] = await Promise.all([
          API.get("/users", { params: { q, limit: 4 }, signal: controller.signal }).catch(() => ({ data: [] })),
          API.get("/contacts", { params: { q, limit: 4 }, signal: controller.signal }).catch(() => ({ data: [] }))
        ]);
        
        const users = Array.isArray(usersRes.data) ? usersRes.data.map(u => ({ ...u, _source: "user" })) : [];
        const contacts = Array.isArray(contactsRes.data) ? contactsRes.data.map(c => ({ ...c, _source: "contact" })) : [];
        
        setSuggestions([...users, ...contacts]);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query]);

  const addExternalFromText = () => {
    const q = query.trim();
    if (!q) return;
    if (!isEmailLike(q)) return;
    setParticipants([
      ...participants,
      { kind: "external", email: q.toLowerCase(), name: "", role: "viewer" },
    ]);
    setQuery("");
    setOpen(false);
  };

  const addUser = (u) => {
    if (!u?._id && !u?.email) return;
    
    if (u._source === "user") {
      setParticipants([
        ...participants,
        { kind: "user", userId: u._id, email: u.email, name: u.name || "", role: "viewer" },
      ]);
    } else {
      setParticipants([
        ...participants,
        { kind: "external", email: u.email, name: u.name || "", role: "viewer" },
      ]);
    }
    
    setQuery("");
    setSuggestions([]);
    setOpen(false);
  };

  const removeAt = (idx) => {
    setParticipants(participants.filter((_, i) => i !== idx));
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-semibold">{label}</label>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("open-people-drawer"))}
          className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Browse People
        </button>
      </div>

      <div className="border rounded p-2 bg-white">
        <div className="flex flex-wrap gap-2 mb-2">
          {participants.length ? (
            participants.map((p, idx) => {
              const text = p?.name
                ? `${p.name}${p.email ? ` <${p.email}>` : ""}`
                : p?.email || "participant";
              return (
                <span
                  key={`${p?.kind || "p"}-${p?.userId || p?.email || idx}`}
                  className="inline-flex items-center gap-2 rounded-full border bg-gray-50 px-3 py-1 text-sm"
                >
                  <span className="truncate max-w-[220px]">{text}</span>
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-900"
                    onClick={() => removeAt(idx)}
                    aria-label="Remove participant"
                  >
                    ×
                  </button>
                </span>
              );
            })
          ) : (
            <span className="text-sm text-gray-500">No participants added</span>
          )}
        </div>

        <div className="flex gap-2">
          <input
            className="flex-1 outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
          />
          <button
            type="button"
            onClick={addExternalFromText}
            disabled={!isEmailLike(query.trim())}
            className="px-3 py-2 rounded bg-gray-900 text-white disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      {open && (loading || suggestions.length) ? (
        <div className="absolute z-10 mt-2 w-full rounded border bg-white shadow-lg overflow-hidden">
          <div className="p-2 text-xs text-gray-500 bg-gray-50 border-b">
            {loading ? "Searching…" : "Select a contact or user"}
          </div>
          {suggestions.map((u) => (
            <button
              key={u._id}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-gray-50"
              onClick={() => addUser(u)}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-slate-900">{u.name || u.email}</div>
                {u._source === "contact" && (
                  <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded uppercase tracking-wide">Contact</span>
                )}
              </div>
              <div className="text-xs text-gray-500">{u.email}</div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

