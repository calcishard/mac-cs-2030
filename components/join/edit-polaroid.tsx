"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Check, Hammer, LoaderCircle, Mail, MessageCircle, PenLine, Plus, Send, Sparkles, Tag, Trash2, User } from "lucide-react";
import { ChipInput, Field, JoinShell, positionText } from "@/components/join/join-form";
import { PolaroidPreview, type PhotoPosition } from "@/components/join/polaroid-preview";
import { forgetEditToken, saveEditToken, useEditToken } from "@/hooks/use-edit-token";
import { LIMITS, formatName } from "@/lib/join-rules";
import { cardSchema, emailSchema } from "@/lib/join-schema";

type Card = { name: string; note: string; tagline: string; bio: string; project: string; interests: string[] };
type Loaded = { card: Card; photo?: string; position: PhotoPosition; approved: boolean };
type Errors = Record<string, string>;

const OFFLINE = "couldn’t reach the server. try again.";

/** "40% 60%" → { x: 40, y: 60 } */
function parsePosition(text: string): PhotoPosition {
  const [x, y] = text.split(" ").map(part => Number.parseFloat(part));
  return { x: x ?? 50, y: y ?? 50 };
}

const request = (method: "POST" | "PATCH" | "DELETE", body: object, path = "/api/join/edit") =>
  fetch(path, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

/** The token from an emailed link, read once so it can be swapped for this browser's own edit token. */
const linkToken = () => typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("token");

/** Lets someone change their polaroid, from the browser it was added on or through an emailed link. */
export function EditPolaroid() {
  const token = useEditToken();
  // "claiming" while an emailed link is being exchanged; a string is the message when that fails.
  const [claim, setClaim] = useState<"claiming" | string | null>(() => (linkToken() ? "claiming" : null));
  const [loaded, setLoaded] = useState<Loaded | "missing" | null>(null);
  const [card, setCard] = useState<Card | null>(null);
  const [position, setPosition] = useState<PhotoPosition>({ x: 50, y: 50 });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState<"saving" | "deleting" | null>(null);
  const [done, setDone] = useState<"saved" | "deleted" | null>(null);

  // An emailed link becomes this browser's edit token, then the address bar is tidied so a refresh doesn't retry.
  useEffect(() => {
    const fromLink = linkToken();
    if (!fromLink) return;
    let cancelled = false;
    request("POST", { token: fromLink }, "/api/join/edit/claim")
      .then(async response => {
        if (cancelled) return;
        const body = (await response.json().catch(() => null)) as { editToken?: string; error?: string } | null;
        if (response.ok && body?.editToken) {
          window.history.replaceState(null, "", "/join/edit");
          saveEditToken(body.editToken);
          return setClaim(null);
        }
        setClaim(body?.error?.toLowerCase() ?? "something went wrong. try again.");
      })
      .catch(() => { if (!cancelled) setClaim(OFFLINE); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!token || claim === "claiming") return;
    let cancelled = false;
    request("POST", { token })
      .then(async response => {
        if (cancelled) return;
        if (response.status === 404) {
          // The card was deleted, so this browser has nothing left to edit.
          forgetEditToken();
          return setLoaded("missing");
        }
        if (!response.ok) throw new Error("Load failed");
        const result = (await response.json()) as { card: Card & { photoPosition: string }; photo?: string; status: string };
        if (cancelled) return;
        const { photoPosition, ...fields } = result.card;
        setLoaded({ card: fields, photo: result.photo, position: parsePosition(photoPosition), approved: result.status === "approved" });
        setCard(fields);
        setPosition(parsePosition(photoPosition));
      })
      .catch(() => { if (!cancelled) setFormError(OFFLINE); });
    return () => { cancelled = true; };
  }, [token, claim]);

  function updateCard<K extends keyof Card>(key: K, value: Card[K]) {
    setCard(current => current && { ...current, [key]: value });
    setErrors(current => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!card || !token || busy) return;
    const draft = { ...card, name: formatName(card.name), photoPosition: positionText(position) };
    const result = cardSchema.safeParse(draft);
    if (!result.success) {
      const found: Errors = {};
      for (const issue of result.error.issues) found[String(issue.path[0])] ??= issue.message;
      return setErrors(found);
    }
    await send("saving", () => request("PATCH", { token, card: draft }), "saved");
  }

  async function remove() {
    if (!token || busy) return;
    if (!window.confirm("Delete your polaroid and your survey answers? This can’t be undone.")) return;
    await send("deleting", () => request("DELETE", { token }), "deleted");
  }

  async function send(kind: "saving" | "deleting", run: () => Promise<Response>, result: "saved" | "deleted") {
    setBusy(kind);
    setFormError("");
    try {
      const response = await run();
      if (response.ok) {
        if (result === "deleted") forgetEditToken();
        setDone(result);
        window.scrollTo({ top: 0 });
        return;
      }
      if (response.status === 404) {
        forgetEditToken();
        return setLoaded("missing");
      }
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setFormError(body?.error?.toLowerCase() ?? "something went wrong. try again.");
    } catch {
      setFormError(OFFLINE);
    } finally {
      setBusy(null);
    }
  }

  if (done) return <JoinShell>
    <div className="join-success">
      <div className="success-copy">
        {done === "saved"
          ? <>
              <p className="handwritten success-note">pinned for review</p>
              <h1>saved.</h1>
              <p>your polaroid shows up on the board again once it’s approved.</p>
            </>
          : <>
              <h1>deleted.</h1>
              <p>your polaroid and answers are gone. you can add yourself again any time.</p>
            </>}
        <div className="success-actions">
          <Link className="join-button primary" href="/"><ArrowLeft size={16} aria-hidden="true" /> back to the board</Link>
        </div>
      </div>
    </div>
  </JoinShell>;

  const missing = claim !== "claiming" && (token === null || loaded === "missing");
  const ready = loaded && loaded !== "missing" && card ? loaded : null;
  const changed = ready && card
    && JSON.stringify([card, positionText(position)]) !== JSON.stringify([ready.card, positionText(ready.position)]);

  return <JoinShell>
    <div className="join-intro">
      <h1>edit your<br />polaroid.</h1>
    </div>
    {missing
      ? <RequestLink problem={typeof claim === "string" ? claim : undefined} />
      : !ready
        ? formError
          ? <p className="join-form-error" role="alert">{formError}</p>
          : <p className="join-lede edit-loading">
              <LoaderCircle className="join-spinner" size={16} aria-hidden="true" />
              {claim === "claiming" ? " opening your link…" : " finding your polaroid…"}
            </p>
        : card && <div className="join-layout">
            <form className="join-form" noValidate onSubmit={event => void save(event)}>
              <section className="join-step">
                <p className="join-lede">
                  {ready.approved
                    ? "you’re on the board. saving sends your polaroid back for review, so it’s off the board until it’s approved again."
                    : "your polaroid is still waiting for review. changes are reviewed with it."}
                </p>
                <div className="join-fields">
                  <Field id="name" label="name" icon={User} required error={errors.name}>
                    <input id="name" className="join-input" value={card.name} placeholder="Jason T." autoComplete="off" maxLength={40}
                      required aria-invalid={!!errors.name} onChange={event => updateCard("name", event.target.value)}
                      onBlur={() => card.name && updateCard("name", formatName(card.name))} />
                  </Field>
                  <Field id="note" label="little note" icon={MessageCircle} count={card.note.length} max={LIMITS.note} error={errors.note}>
                    <input id="note" className="join-input" value={card.note} placeholder="it worked yesterday" maxLength={LIMITS.note}
                      autoComplete="off" aria-invalid={!!errors.note} onChange={event => updateCard("note", event.target.value)} />
                  </Field>
                  <Field id="tagline" label="tagline" icon={Tag} count={card.tagline.length} max={LIMITS.tagline} error={errors.tagline}>
                    <input id="tagline" className="join-input" value={card.tagline} placeholder="usually has a camera" maxLength={LIMITS.tagline}
                      autoComplete="off" aria-invalid={!!errors.tagline} onChange={event => updateCard("tagline", event.target.value)} />
                  </Field>
                  <Field id="bio" label="bio" icon={PenLine} count={card.bio.length} max={LIMITS.bio} error={errors.bio}>
                    <textarea id="bio" className="join-input" value={card.bio} placeholder="2–3 sentences about you" maxLength={LIMITS.bio} rows={3}
                      aria-invalid={!!errors.bio} onChange={event => updateCard("bio", event.target.value)} />
                  </Field>
                  <Field id="project" label="working on" icon={Hammer} count={card.project.length} max={LIMITS.project} error={errors.project}>
                    <input id="project" className="join-input" value={card.project} placeholder="a map of quiet study spots" maxLength={LIMITS.project}
                      autoComplete="off" aria-invalid={!!errors.project} onChange={event => updateCard("project", event.target.value)} />
                  </Field>
                  <Field id="interests" label="interests" icon={Sparkles} hint={`up to ${LIMITS.interestsMax}, press enter after each`} error={errors.interests}>
                    <ChipInput id="interests" values={card.interests} invalid={!!errors.interests}
                      onChange={values => updateCard("interests", values)} />
                  </Field>
                </div>
              </section>
              {formError && <p className="join-form-error" role="alert">{formError}</p>}
              <div className="join-actions">
                <div className="edit-action-group">
                  <Link className="join-button ghost" href="/"><ArrowLeft size={16} aria-hidden="true" /> cancel</Link>
                  <button type="button" className="join-button ghost" disabled={!!busy} onClick={() => void remove()}>
                    {busy === "deleting" ? <LoaderCircle className="join-spinner" size={16} aria-hidden="true" /> : <Trash2 size={16} aria-hidden="true" />}
                    {busy === "deleting" ? "deleting…" : "delete"}
                  </button>
                </div>
                <button type="submit" className="join-button primary" disabled={!!busy || !changed}>
                  {busy === "saving" ? <LoaderCircle className="join-spinner" size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
                  {busy === "saving" ? "saving…" : "save"}
                </button>
              </div>
            </form>
            <aside className="join-aside" data-step="card" aria-label="Live preview of your polaroid">
              <PolaroidPreview name={card.name} note={card.note} photoUrl={ready.photo} position={position} onPositionChange={setPosition}
                onPickPhoto={() => {}} hidden={false} busy={false} />
              <p className="preview-note">drag to adjust</p>
            </aside>
          </div>}
  </JoinShell>;
}

/** Shown when this browser has no edit token: ask for a link by email instead. */
function RequestLink({ problem }: { problem?: string }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  async function send(event: FormEvent) {
    event.preventDefault();
    if (state === "sending") return;
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setState("sending");
    setError("");
    try {
      const response = await request("POST", { email: parsed.data }, "/api/join/edit/link");
      if (response.ok) return setState("sent");
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error?.toLowerCase() ?? "something went wrong. try again.");
      setState("idle");
    } catch {
      setError(OFFLINE);
      setState("idle");
    }
  }

  return <div className="edit-missing">
    {problem && <p className="join-form-error edit-problem" role="alert">{problem}</p>}
    {state === "sent"
      ? <>
          <p className="handwritten edit-sent-note">sent</p>
          <p className="join-lede">check your mac inbox (and junk, the first time). the link works once and expires in 30 minutes.</p>
        </>
      : <>
          <p className="join-lede">enter your mac email and we’ll send you a link to edit your polaroid from here.</p>
          <form className="join-form edit-request" noValidate onSubmit={event => void send(event)}>
            <div className="join-fields">
              <Field id="edit-email" label="mac email" hideLabel error={error}>
                <div className="join-input-group">
                  <Mail size={18} aria-hidden="true" />
                  <input id="edit-email" type="email" inputMode="email" value={email} placeholder="smithj12@mcmaster.ca" autoComplete="email"
                    autoCapitalize="none" spellCheck={false} required aria-invalid={!!error}
                    onChange={event => { setEmail(event.target.value); setError(""); }} />
                </div>
              </Field>
            </div>
            <button type="submit" className="join-button primary" disabled={state === "sending"}>
              {state === "sending" ? <LoaderCircle className="join-spinner" size={16} aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
              {state === "sending" ? "sending…" : "email me an edit link"}
            </button>
          </form>
        </>}
    <div className="edit-links">
      <Link className="join-button" href="/join"><Plus size={16} aria-hidden="true" /> add yours</Link>
      <Link className="join-button ghost" href="/"><ArrowLeft size={16} aria-hidden="true" /> back to the board</Link>
    </div>
  </div>;
}
