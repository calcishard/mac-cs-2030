"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { Check, EyeOff, LogOut, Trash2, TriangleAlert, Undo2 } from "lucide-react";
import type { AdminEntry } from "@/lib/class-profile";

type Action = "approve" | "unapprove" | "delete";

const isMcMasterEmail = (email: string) => email.endsWith("@mcmaster.ca");

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

  async function act(email: string, action: Action) {
    if (action === "delete" && !window.confirm(`Delete ${email}’s submission? This also lets that email submit again.`)) return;
    setBusy(email);
    setError("");
    try {
      const response = await fetch("/api/admin/submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, action }),
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(result?.error ?? "Request failed.");
      }
      setEntries(current => action === "delete"
        ? current.filter(entry => entry.email !== email)
        : current.map(entry => entry.email === email ? { ...entry, status: action === "approve" ? "approved" : "pending" } : entry));
    } catch (caught) {
      setError(`${email}: ${caught instanceof Error ? caught.message : "request failed."}`);
    } finally {
      setBusy(null);
    }
  }

  return <AdminShell signedIn>
    <div className="inner-heading"><p>admin</p><h1>the pile.</h1></div>
    <p className="admin-summary">
      {pending.length} waiting · {approved.length} approved · {approved.filter(entry => entry.showOnBoard).length} on the board
    </p>
    {error && <p className="join-error" role="alert">{error}</p>}
    <AdminSection title="waiting for review" entries={pending} busy={busy} onAction={act} empty="Nothing to review." />
    <AdminSection title="approved" entries={approved} busy={busy} onAction={act} empty="Nothing approved yet." />
  </AdminShell>;
}

type SectionProps = { title: string; entries: AdminEntry[]; busy: string | null; empty: string; onAction: (email: string, action: Action) => void };

function AdminSection({ title, entries, busy, empty, onAction }: SectionProps) {
  return <section className="admin-section">
    <h2>{title} ({entries.length})</h2>
    {entries.length === 0 && <p className="admin-empty">{empty}</p>}
    {entries.map(entry => <article className="admin-card" key={entry.email}>
      {entry.showOnBoard
        ? <div className="polaroid admin-polaroid">
            <span className="photo-window">
              {entry.photo && <img src={entry.photo} alt="" loading="lazy" style={{ objectPosition: entry.photoPosition ?? "center" }} />}
            </span>
            <span className="photo-caption"><span className="photo-name">{entry.name?.toLowerCase()}</span></span>
            <span className="photo-note">{entry.note}</span>
          </div>
        : <div className="admin-survey-only"><EyeOff size={20} aria-hidden="true" />survey only</div>}
      <div className="admin-details">
        <p className="admin-email">
          {entry.email}
          {!isMcMasterEmail(entry.email) && <span className="admin-flag"><TriangleAlert size={13} aria-hidden="true" />not @mcmaster.ca</span>}
          <span className="admin-date">{entry.createdAt.slice(0, 16)} UTC</span>
        </p>
        {entry.showOnBoard && <>
          <p className="admin-tagline">{entry.tagline}</p>
          <p className="admin-bio">{entry.bio}</p>
          <dl>
            <dt>working on</dt><dd>{entry.project}</dd>
            <dt>also into</dt><dd>{entry.interests.join(" · ")}</dd>
          </dl>
        </>}
        <div className="admin-actions">
          {entry.status === "pending"
            ? <button type="button" className="join-button primary" disabled={busy === entry.email} onClick={() => onAction(entry.email, "approve")}>
                <Check size={16} aria-hidden="true" /> approve
              </button>
            : <button type="button" className="join-button" disabled={busy === entry.email} onClick={() => onAction(entry.email, "unapprove")}>
                <Undo2 size={16} aria-hidden="true" /> move back to review
              </button>}
          <button type="button" className="join-button ghost" disabled={busy === entry.email} onClick={() => onAction(entry.email, "delete")}>
            <Trash2 size={16} aria-hidden="true" /> delete
          </button>
        </div>
      </div>
    </article>)}
  </section>;
}
