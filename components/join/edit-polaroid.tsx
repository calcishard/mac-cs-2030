"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Check, Hammer, LoaderCircle, MessageCircle, PenLine, Plus, Sparkles, Tag, Trash2, User } from "lucide-react";
import { ChipInput, Field, JoinShell, positionText } from "@/components/join/join-form";
import { PolaroidPreview, type PhotoPosition } from "@/components/join/polaroid-preview";
import { forgetEditToken, useEditToken } from "@/hooks/use-edit-token";
import { LIMITS, formatName } from "@/lib/join-rules";
import { cardSchema } from "@/lib/join-schema";

type Card = { name: string; note: string; tagline: string; bio: string; project: string; interests: string[] };
type Loaded = { card: Card; photo?: string; position: PhotoPosition; approved: boolean };
type Errors = Record<string, string>;

const OFFLINE = "couldn’t reach the server. try again.";

/** "40% 60%" → { x: 40, y: 60 } */
function parsePosition(text: string): PhotoPosition {
  const [x, y] = text.split(" ").map(part => Number.parseFloat(part));
  return { x: x ?? 50, y: y ?? 50 };
}

const request = (method: "POST" | "PATCH" | "DELETE", body: object) =>
  fetch("/api/join/edit", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

/** Lets someone change the polaroid they added from this browser. */
export function EditPolaroid() {
  const token = useEditToken();
  const [loaded, setLoaded] = useState<Loaded | "missing" | null>(null);
  const [card, setCard] = useState<Card | null>(null);
  const [position, setPosition] = useState<PhotoPosition>({ x: 50, y: 50 });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState<"saving" | "deleting" | null>(null);
  const [done, setDone] = useState<"saved" | "deleted" | null>(null);

  useEffect(() => {
    if (!token) return;
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
  }, [token]);

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

  const missing = token === null || loaded === "missing";
  const ready = loaded && loaded !== "missing" && card ? loaded : null;
  const changed = ready && card
    && JSON.stringify([card, positionText(position)]) !== JSON.stringify([ready.card, positionText(ready.position)]);

  return <JoinShell>
    <div className="join-intro">
      <h1>edit your<br />polaroid.</h1>
    </div>
    {missing
      ? <div className="edit-missing">
          <p className="join-lede">this browser doesn’t have a polaroid to edit. a polaroid can only be edited from the browser it was added on.</p>
          <div className="edit-links">
            <Link className="join-button primary" href="/join"><Plus size={16} aria-hidden="true" /> add yours</Link>
            <Link className="join-button ghost" href="/"><ArrowLeft size={16} aria-hidden="true" /> back to the board</Link>
          </div>
        </div>
      : !ready
        ? formError
          ? <p className="join-form-error" role="alert">{formError}</p>
          : <p className="join-lede edit-loading"><LoaderCircle className="join-spinner" size={16} aria-hidden="true" /> finding your polaroid…</p>
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
