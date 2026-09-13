"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { Check, EyeOff, LogOut, Pencil, Save, Trash2, TriangleAlert, Undo2 } from "lucide-react";
import type { AdminEntry } from "@/lib/class-profile";
import { LIMITS, formatName } from "@/lib/join-rules";
import { chapters, questionsById, type SurveyAnswers } from "@/lib/survey";

type Action = "approve" | "unapprove" | "delete";
/** An entry being edited, as plain form values. Interests are comma separated. */
type Draft = { name: string; note: string; tagline: string; bio: string; project: string; interests: string; answers: Partial<SurveyAnswers> };
type TextKey = Exclude<keyof Draft, "answers">;
/** The card as the server saved it. Blanked optional fields are left out. */
type SavedCard = { name: string; note?: string; tagline?: string; bio?: string; project?: string; interests: string[] };

const TEXT_FIELDS = [
  { key: "name", label: "name", max: 40 },
  { key: "note", label: "little note", max: LIMITS.note },
  { key: "tagline", label: "tagline", max: LIMITS.tagline },
  { key: "project", label: "working on", max: LIMITS.project },
] as const;

const isMcMasterEmail = (email: string) => email.endsWith("@mcmaster.ca");

const draftFor = (entry: AdminEntry): Draft => ({
  name: entry.name ?? "",
  note: entry.note ?? "",
  tagline: entry.tagline ?? "",
  bio: entry.bio ?? "",
  project: entry.project ?? "",
  interests: entry.interests.join(", "),
  answers: { ...entry.answers },
});

function AdminShell({ children, signedIn = false }: { children: ReactNode; signedIn?: boolean }) {
  async function signOut() {
    await fetch("/api/admin/session", { method: "DELETE" }).catch(() => null);
    window.location.reload();
  }
  return <div className="join-shell">
    <header className="join-header">
      <Link className="wordmark" href="/" aria-label="Mac CS 2030 home">mac cs<span>’30</span></Link>
      {signedIn && <button type="button" className="join-back" onClick={() => void signOut()}><LogOut size={15} aria-hidden="true" /> sign out</button>}
    </header>
    <main className="admin-page" id="main">{children}</main>
  </div>;
}

export function AdminLogin({ configured }: { configured: boolean }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (response.ok) return window.location.reload();
      setError(response.status === 401 ? "wrong password." : "couldn’t sign in.");
    } catch {
      setError("couldn’t reach the server.");
    }
    setBusy(false);
  }

  return <AdminShell>
    {configured
      ? <form className="admin-login" onSubmit={event => void signIn(event)}>
          <h1>admin</h1>
          <label className="join-label" htmlFor="admin-password">password</label>
          <input id="admin-password" className="join-input" type="password" autoComplete="current-password" value={password}
            onChange={event => setPassword(event.target.value)} />
          {error && <p className="join-error" role="alert">{error}</p>}
          <button className="join-button primary" disabled={busy || !password}>sign in</button>
        </form>
      : <div className="admin-login">
          <h1>admin</h1>
          <p>Set an <code>ADMIN_PASSWORD</code> secret to turn this page on.</p>
        </div>}
  </AdminShell>;
}

export function AdminBoard({ entries: initialEntries }: { entries: AdminEntry[] }) {
  const [entries, setEntries] = useState(initialEntries);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const pending = entries.filter(entry => entry.status === "pending");
  const approved = entries.filter(entry => entry.status === "approved");

  async function send(email: string, body: Record<string, unknown>) {
    const response = await fetch("/api/admin/submissions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, ...body }),
    });
    const result = (await response.json().catch(() => null)) as { error?: string; card?: SavedCard; answers?: Partial<SurveyAnswers> } | null;
    if (!response.ok) throw new Error(result?.error ?? "Request failed.");
    return result;
  }

  /** Runs one request for an entry. Resolves to its error message, or null when it worked. */
  async function run(email: string, task: () => Promise<void>) {
    setBusy(email);
    try {
      await task();
      return null;
    } catch (caught) {
      return caught instanceof Error ? caught.message : "request failed.";
    } finally {
      setBusy(null);
    }
  }

  async function act(email: string, action: Action) {
    if (action === "delete" && !window.confirm(`Delete ${email}’s submission? This also lets that email submit again.`)) return;
    setError("");
    const failed = await run(email, async () => {
      await send(email, { action });
      setEntries(current => action === "delete"
        ? current.filter(entry => entry.email !== email)
        : current.map(entry => entry.email === email ? { ...entry, status: action === "approve" ? "approved" : "pending" } : entry));
    });
    if (failed) setError(`${email}: ${failed}`);
  }

  function save(entry: AdminEntry, draft: Draft) {
    const { email, showOnBoard } = entry;
    return run(email, async () => {
      const { answers, ...card } = draft;
      const interests = card.interests.split(",").map(interest => interest.trim()).filter(Boolean);
      const result = await send(email, {
        action: "edit",
        answers,
        // Survey-only entries have no card to edit.
        ...(showOnBoard ? { card: { ...card, name: formatName(card.name), interests } } : {}),
      });
      if (!result?.answers) throw new Error("Request failed.");
      const { card: saved, answers: savedAnswers } = result;
      setEntries(current => current.map(item => item.email !== email ? item : {
        ...item,
        answers: savedAnswers,
        ...(saved && {
          name: saved.name,
          note: saved.note ?? null,
          tagline: saved.tagline ?? null,
          bio: saved.bio ?? null,
          project: saved.project ?? null,
          interests: saved.interests,
        }),
      }));
    });
  }

  return <AdminShell signedIn>
    <div className="inner-heading"><p>admin</p><h1>the pile.</h1></div>
    <p className="admin-summary">
      {pending.length} waiting · {approved.length} approved · {approved.filter(entry => entry.showOnBoard).length} on the board
    </p>
    {error && <p className="join-error" role="alert">{error}</p>}
    <AdminSection title="waiting for review" entries={pending} busy={busy} onAction={act} onSave={save} empty="Nothing to review." />
    <AdminSection title="approved" entries={approved} busy={busy} onAction={act} onSave={save} empty="Nothing approved yet." />
  </AdminShell>;
}

type Handlers = {
  onAction: (email: string, action: Action) => void;
  onSave: (entry: AdminEntry, draft: Draft) => Promise<string | null>;
};

type SectionProps = Handlers & { title: string; entries: AdminEntry[]; busy: string | null; empty: string };

function AdminSection({ title, entries, busy, empty, onAction, onSave }: SectionProps) {
  return <section className="admin-section">
    <h2>{title} ({entries.length})</h2>
    {entries.length === 0 && <p className="admin-empty">{empty}</p>}
    {entries.map(entry => <AdminCard key={entry.email} entry={entry} busy={busy === entry.email} onAction={onAction} onSave={onSave} />)}
  </section>;
}

function AdminCard({ entry, busy, onAction, onSave }: Handlers & { entry: AdminEntry; busy: boolean }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editError, setEditError] = useState("");
  // While editing, the polaroid previews the draft.
  const name = draft ? draft.name : entry.name;
  const note = draft ? draft.note : entry.note;

  const update = (key: TextKey, value: string) => setDraft(current => current && { ...current, [key]: value });

  const updateAnswer = (id: string, value: string) => setDraft(current => {
    if (!current) return current;
    const answers = { ...current.answers };
    if (value) answers[id] = value;
    else delete answers[id];
    return { ...current, answers };
  });

  function stopEditing() {
    setDraft(null);
    setEditError("");
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    const failed = await onSave(entry, draft);
    if (failed) setEditError(failed);
    else stopEditing();
  }

  return <article className="admin-card">
    {entry.showOnBoard
      ? <div className="polaroid admin-polaroid">
          <span className="photo-window">
            {entry.photo && <img src={entry.photo} alt="" loading="lazy" style={{ objectPosition: entry.photoPosition ?? "center" }} />}
          </span>
          <span className="photo-caption"><span className="photo-name">{name?.toLowerCase()}</span></span>
          <span className="photo-note">{note}</span>
        </div>
      : <div className="admin-survey-only"><EyeOff size={20} aria-hidden="true" />survey only</div>}
    <div className="admin-details">
      <p className="admin-email">
        {entry.email}
        {!isMcMasterEmail(entry.email) && <span className="admin-flag"><TriangleAlert size={13} aria-hidden="true" />not @mcmaster.ca</span>}
        <span className="admin-date">{entry.createdAt.slice(0, 16).replace("T", " ")} UTC</span>
      </p>
      {draft
        ? <form className="admin-edit" onSubmit={event => void save(event)}>
            {entry.showOnBoard && <fieldset className="admin-edit-group">
              <legend>polaroid</legend>
              {TEXT_FIELDS.map(({ key, label, max }) => <label key={key}>
                {label}
                <input className="join-input" value={draft[key]} maxLength={max} autoComplete="off" onChange={event => update(key, event.target.value)} />
              </label>)}
              <label className="admin-edit-wide">
                bio
                <textarea className="join-input" rows={4} value={draft.bio} maxLength={LIMITS.bio} onChange={event => update("bio", event.target.value)} />
              </label>
              <label className="admin-edit-wide">
                <span>interests <small>comma separated, up to {LIMITS.interestsMax}</small></span>
                <input className="join-input" value={draft.interests} autoComplete="off" onChange={event => update("interests", event.target.value)} />
              </label>
            </fieldset>}
            {chapters.map(chapter => <fieldset className="admin-edit-group" key={chapter.id}>
              <legend>{chapter.label}</legend>
              {chapter.questions.map(id => {
                const question = questionsById[id];
                return <label key={id}>
                  {question.prompt}
                  <select className="join-input" value={draft.answers[id] ?? ""} onChange={event => updateAnswer(id, event.target.value)}>
                    <option value="">skipped</option>
                    {question.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>;
              })}
            </fieldset>)}
            {editError && <p className="join-error" role="alert">{editError}</p>}
            <div className="admin-actions">
              <button type="submit" className="join-button primary" disabled={busy}><Save size={16} aria-hidden="true" /> save</button>
              <button type="button" className="join-button ghost" disabled={busy} onClick={stopEditing}>cancel</button>
            </div>
          </form>
        : <>
            {entry.tagline && <p className="admin-tagline">{entry.tagline}</p>}
            {entry.bio && <p className="admin-bio">{entry.bio}</p>}
            {(entry.project || entry.interests.length > 0) && <dl>
              {entry.project && <><dt>working on</dt><dd>{entry.project}</dd></>}
              {entry.interests.length > 0 && <><dt>also into</dt><dd>{entry.interests.join(" · ")}</dd></>}
            </dl>}
            <div className="admin-actions">
              {entry.status === "pending"
                ? <button type="button" className="join-button primary" disabled={busy} onClick={() => onAction(entry.email, "approve")}>
                    <Check size={16} aria-hidden="true" /> approve
                  </button>
                : <button type="button" className="join-button" disabled={busy} onClick={() => onAction(entry.email, "unapprove")}>
                    <Undo2 size={16} aria-hidden="true" /> move back to review
                  </button>}
              <button type="button" className="join-button" disabled={busy} onClick={() => setDraft(draftFor(entry))}>
                <Pencil size={16} aria-hidden="true" /> edit
              </button>
              <button type="button" className="join-button ghost" disabled={busy} onClick={() => onAction(entry.email, "delete")}>
                <Trash2 size={16} aria-hidden="true" /> delete
              </button>
            </div>
          </>}
    </div>
  </article>;
}
