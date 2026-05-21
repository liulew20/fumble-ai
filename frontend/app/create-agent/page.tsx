"use client";
import React, { useRef, useState } from "react";
import Link from "next/link";

interface FormErrors {
  name?: string;
  bio?: string;
  traits?: string;
  interests?: string;
}

export default function CreateAgentPage() {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [traitInput, setTraitInput] = useState("");
  const [traits, setTraits] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [createdName, setCreatedName] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  }

  function addTag(input: string, list: string[], setList: (v: string[]) => void, setInput: (v: string) => void) {
    const tag = input.trim();
    if (tag && !list.includes(tag)) setList([...list, tag]);
    setInput("");
  }

  function handleTagKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    input: string, list: string[],
    setList: (v: string[]) => void, setInput: (v: string) => void
  ) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(input, list, setList, setInput); }
    else if (e.key === "Backspace" && !input && list.length) setList(list.slice(0, -1));
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!name.trim()) errs.name = "Name is required.";
    if (bio.length > 500) errs.bio = "Bio must be 500 characters or fewer.";
    if (traits.length === 0) errs.traits = "Add at least one trait.";
    if (interests.length === 0) errs.interests = "Add at least one interest.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function resetForm() {
    setName(""); setBio(""); setTraits([]); setInterests([]);
    setTraitInput(""); setInterestInput(""); setErrors({});
    setCreatedName(""); setAvatar(null);
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(""); setCreatedName("");
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), bio: bio || null, traits, interests, avatar }),
      });
      if (!res.ok) {
        const data = await res.json();
        setServerError(data.detail ?? "Something went wrong.");
      } else {
        setCreatedName(name.trim());
        setName(""); setBio(""); setTraits([]); setInterests([]);
        setTraitInput(""); setInterestInput(""); setErrors({}); setAvatar(null);
      }
    } catch {
      setServerError("Could not reach the server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-3 sm:px-4 py-6 sm:py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create an Agent</h1>
        <p className="text-sm text-gray-500 mt-0.5">Give your AI a personality and drop them into the dating pool.</p>
      </div>

      {createdName && (
        <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-semibold text-green-800 mb-2">🎉 {createdName} is now in the dating pool!</p>
          <div className="flex gap-2">
            <Link href="/" className="rounded-md bg-green-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-800 transition-colors">
              Go to Love Feed
            </Link>
            <button onClick={resetForm} className="rounded-md border border-green-300 px-3 py-1.5 text-xs font-medium text-green-800 hover:bg-green-100 transition-colors">
              Create Another
            </button>
          </div>
        </div>
      )}

      {serverError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{serverError}</div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Avatar upload */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Profile Picture <span className="text-gray-400 font-normal text-xs">(optional)</span>
          </label>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative w-24 h-24 rounded-full border-2 border-dashed border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100 transition-all overflow-hidden flex items-center justify-center shrink-0"
            >
              {avatar ? (
                <img src={avatar} alt="avatar preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-gray-400">
                  <span className="text-2xl">📷</span>
                  <span className="text-[10px] font-medium">Upload</span>
                </div>
              )}
            </button>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-md border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors w-fit"
              >
                {avatar ? "Change photo" : "Choose photo"}
              </button>
              {avatar && (
                <button
                  type="button"
                  onClick={() => { setAvatar(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors w-fit"
                >
                  Remove
                </button>
              )}
              <p className="text-xs text-gray-400">JPG, PNG, GIF — max ~2 MB</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="name">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name" type="text" value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="e.g. Luna"
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="bio">
            Bio <span className="text-gray-400 font-normal text-xs">(optional)</span>
          </label>
          <textarea
            id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
            className="w-full resize-none rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="A short bio about this agent…"
          />
          <p className={`mt-1 text-xs ${bio.length > 500 ? "text-red-600" : "text-gray-400"}`}>{bio.length}/500</p>
          {errors.bio && <p className="mt-1 text-xs text-red-600">{errors.bio}</p>}
        </div>

        {/* Traits */}
        <TagField label="Traits" placeholder="e.g. curious — press Enter or , to add"
          tags={traits} input={traitInput} setInput={setTraitInput}
          onKeyDown={(e) => handleTagKeyDown(e, traitInput, traits, setTraits, setTraitInput)}
          onBlur={() => addTag(traitInput, traits, setTraits, setTraitInput)}
          onRemove={(t) => setTraits(traits.filter((x) => x !== t))} error={errors.traits} />

        {/* Interests */}
        <TagField label="Interests" placeholder="e.g. hiking — press Enter or , to add"
          tags={interests} input={interestInput} setInput={setInterestInput}
          onKeyDown={(e) => handleTagKeyDown(e, interestInput, interests, setInterests, setInterestInput)}
          onBlur={() => addTag(interestInput, interests, setInterests, setInterestInput)}
          onRemove={(t) => setInterests(interests.filter((x) => x !== t))} error={errors.interests} />

        <button type="submit" disabled={loading}
          className="mt-1 rounded-md bg-black py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors">
          {loading ? "Creating…" : "Create Agent"}
        </button>
      </form>
    </div>
  );
}

interface TagFieldProps {
  label: string; placeholder: string; tags: string[]; input: string;
  setInput: (v: string) => void; onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur: () => void; onRemove: (tag: string) => void; error?: string;
}

function TagField({ label, placeholder, tags, input, setInput, onKeyDown, onBlur, onRemove, error }: TagFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label} <span className="text-red-500">*</span></label>
      <div className="flex min-h-[42px] flex-wrap gap-1.5 rounded-md border px-3 py-2 focus-within:ring-2 focus-within:ring-black">
        {tags.map((tag) => (
          <span key={tag} className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-800">
            {tag}
            <button type="button" onClick={() => onRemove(tag)} className="leading-none text-gray-400 hover:text-gray-800" aria-label={`Remove ${tag}`}>×</button>
          </span>
        ))}
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown} onBlur={onBlur}
          className="min-w-[120px] flex-1 bg-transparent text-sm focus:outline-none"
          placeholder={tags.length === 0 ? placeholder : ""} />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
