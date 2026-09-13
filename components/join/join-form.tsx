"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion, useAnimate, useReducedMotion } from "motion/react";
import {
  ArrowLeft, ArrowRight, BookOpen, Briefcase, Camera, Check, ClipboardCheck, Coffee, Eye, EyeOff,
  Hammer, ImagePlus, LoaderCircle, Mail, MapPin, MessageCircle, PenLine, Sparkles, Tag, User, X, type LucideIcon,
} from "lucide-react";
import { JoinSuccess } from "@/components/join/join-success";
import { PolaroidPreview, type PhotoPosition } from "@/components/join/polaroid-preview";
import { LIMITS, formatName, normalizeEmail } from "@/lib/join-rules";
import { cardSchema, emailSchema } from "@/lib/join-schema";
import { preparePhoto } from "@/lib/photo";
import { chapters, questionsById, type Question, type SurveyAnswers } from "@/lib/survey";

type Card = { name: string; note: string; tagline: string; bio: string; project: string; interests: string[] };
type Errors = Record<string, string>;
type Step = { id: string; label: string; icon: LucideIcon; hint?: string; chapters?: string[] };

const STEPS: Step[] = [
  { id: "email", label: "email", icon: Mail },
  { id: "card", label: "polaroid", icon: Camera },
  { id: "before", label: "before mac", icon: MapPin, hint: "all optional.", chapters: ["before"] },
  { id: "academics", label: "in class", icon: BookOpen, hint: "all optional.", chapters: ["academics"] },
  { id: "life", label: "outside class", icon: Coffee, hint: "all optional. pick the one you like most.", chapters: ["life", "coop"] },
  { id: "review", label: "review", icon: ClipboardCheck },
];

const chapterIcons: Record<string, LucideIcon> = { before: MapPin, academics: BookOpen, life: Coffee, coop: Briefcase };
const emptyCard: Card = { name: "", note: "", tagline: "", bio: "", project: "", interests: [] };
const TAKEN = "this email has already submitted.";
const OFFLINE = "couldn’t reach the server. try again.";
const ease = [0.16, 1, 0.3, 1] as const;

const stepMotion = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 36 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -36 }),
};

const questionsFor = (step: Step): Question[] => (step.chapters ?? [])
  .flatMap(id => chapters.find(chapter => chapter.id === id)?.questions ?? [])
  .map(id => questionsById[id]);

const positionText = ({ x, y }: PhotoPosition) => `${Math.round(x)}% ${Math.round(y)}%`;
const labelFor = (question: Question, value?: string) => question.options.find(option => option.value === value)?.label ?? "—";

async function isEmailAvailable(email: string) {
  const response = await fetch(`/api/join/check?email=${encodeURIComponent(email)}`);
  if (!response.ok) throw new Error("Email check failed");
  return ((await response.json()) as { available: boolean }).available;
}

export function JoinForm() {
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [navigated, setNavigated] = useState(false);
  const [email, setEmail] = useState("");
  const [showOnBoard, setShowOnBoard] = useState(true);
  const [card, setCard] = useState<Card>(emptyCard);
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [position, setPosition] = useState<PhotoPosition>({ x: 50, y: 50 });
  const [answers, setAnswers] = useState<Partial<SurveyAnswers>>({});
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState<"checking" | "photo" | "submitting" | null>(null);
  const [formError, setFormError] = useState("");
  const [done, setDone] = useState(false);
  const [scope, animate] = useAnimate<HTMLFormElement>();
  const reduceMotion = useReducedMotion();
  const fileInput = useRef<HTMLInputElement>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  const step = STEPS[stepIndex];

  // Release the preview's object URL once a new photo replaces it.
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo.url); }, [photo]);

  const clearError = (key: string) => setErrors(current => {
    if (!(key in current)) return current;
    const next = { ...current };
    delete next[key];
    return next;
  });

  function updateCard<K extends keyof Card>(key: K, value: Card[K]) {
    setCard(current => ({ ...current, [key]: value }));
    clearError(key);
  }

  function answer(id: string, value: string | undefined) {
    setAnswers(current => {
      const next = { ...current };
      if (value) next[id] = value;
      else delete next[id];
      return next;
    });
  }

  // Only the email, and a name, photo, and consent for a card on the board, are required.
  function validate(index: number): Errors {
    const id = STEPS[index].id;
    if (id === "email") {
      const result = emailSchema.safeParse(email);
      return result.success ? {} : { email: result.error.issues[0].message };
    }
    if (id === "card") {
      if (!showOnBoard) return {};
      const result = cardSchema.safeParse({ ...card, photoPosition: positionText(position) });
      const found: Errors = {};
      if (!photo) found.photo = "add a photo.";
      for (const issue of result.success ? [] : result.error.issues) found[String(issue.path[0])] ??= issue.message;
      return found;
    }
    if (id === "review") return showOnBoard && !consent ? { consent: "please confirm first." } : {};
    return {};
  }

  function go(index: number) {
    setDirection(index > stepIndex ? 1 : -1);
    setStepIndex(index);
    setNavigated(true);
    setFormError("");
    const top = (scope.current?.getBoundingClientRect().top ?? 0) + window.scrollY - 140;
    if (window.scrollY > top) window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
  }

  function reject() {
    if (!reduceMotion && scope.current) animate(scope.current, { x: [0, -9, 9, -5, 5, 0] }, { duration: 0.42 });
    requestAnimationFrame(() => scope.current
      ?.querySelector<HTMLElement>('[data-invalid="true"] input:not([disabled]), [data-invalid="true"] textarea, [data-invalid="true"] button')
      ?.focus());
  }

  async function next() {
    const found = validate(stepIndex);
    setErrors(found);
    setFormError("");
    if (Object.keys(found).length) return reject();
    if (step.id === "email") {
      setBusy("checking");
      try {
        if (!(await isEmailAvailable(normalizeEmail(email)))) {
          setErrors({ email: TAKEN });
          return reject();
        }
      } catch {
        setFormError(OFFLINE);
        return reject();
      } finally {
        setBusy(null);
      }
    }
    go(stepIndex + 1);
  }

  async function submit() {
    for (let index = 0; index < STEPS.length; index++) {
      const found = validate(index);
      if (!Object.keys(found).length) continue;
      if (index !== stepIndex) go(index);
      setErrors(found);
      return reject();
    }
    setBusy("submitting");
    setFormError("");
    const body = new FormData();
    body.set("payload", JSON.stringify({
      email,
      showOnBoard,
      answers,
      ...(showOnBoard ? { card: { ...card, photoPosition: positionText(position) } } : {}),
    }));
    if (showOnBoard && photo) body.set("photo", photo.blob, photo.blob.type === "image/webp" ? "photo.webp" : "photo.jpg");
    body.set("website", honeypot.current?.value ?? "");
    try {
      const response = await fetch("/api/join", { method: "POST", body });
      if (response.ok) {
        setDone(true);
        window.scrollTo({ top: 0 });
        return;
      }
      if (response.status === 409) {
        go(0);
        setErrors({ email: TAKEN });
        return;
      }
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      setFormError(result?.error?.toLowerCase() ?? "something went wrong. try again.");
    } catch {
      setFormError(OFFLINE);
    } finally {
      setBusy(null);
    }
  }

  async function choosePhoto(file: File | undefined) {
    if (!file) return;
    setBusy("photo");
    clearError("photo");
    try {
      const blob = await preparePhoto(file);
      setPhoto({ blob, url: URL.createObjectURL(blob) });
      setPosition({ x: 50, y: 50 });
    } catch (error) {
      setErrors(current => ({ ...current, photo: error instanceof Error ? error.message : "couldn’t use that photo." }));
    } finally {
      setBusy(null);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function renderStep() {
    if (step.id === "email") return <>
      <StepHeading icon={step.icon} focus={navigated}>your mac email.</StepHeading>
      <div className="join-fields">
        <Field id="email" label="mac email" hideLabel error={errors.email}>
          <div className="join-input-group">
            <Mail size={18} aria-hidden="true" />
            <input id="email" type="email" inputMode="email" value={email} placeholder="smithj12@mcmaster.ca" autoComplete="email"
              autoCapitalize="none" spellCheck={false} required aria-invalid={!!errors.email}
              onChange={event => { setEmail(event.target.value); clearError("email"); }} />
          </div>
        </Field>
      </div>
    </>;

    if (step.id === "card") return <>
      <StepHeading icon={step.icon} focus={navigated}>your polaroid.</StepHeading>
      <label className="check-row board-toggle">
        <input type="checkbox" checked={showOnBoard} onChange={event => { setShowOnBoard(event.target.checked); setErrors({}); }} />
        <span><strong>
          {showOnBoard ? <Eye size={17} aria-hidden="true" /> : <EyeOff size={17} aria-hidden="true" />}
          show my polaroid on the home page
        </strong></span>
      </label>
      <AnimatePresence initial={false} mode="popLayout">
        {showOnBoard
          ? <motion.div key="fields" className="join-collapse" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease }}>
              <div className="join-fields">
                <Field id="photo" label="photo" icon={ImagePlus} required error={errors.photo}>
                  <div className="photo-picker">
                    <button type="button" id="photo" className="join-button" disabled={busy === "photo"} onClick={() => fileInput.current?.click()}>
                      {busy === "photo" ? <LoaderCircle className="join-spinner" size={16} aria-hidden="true" /> : <ImagePlus size={16} aria-hidden="true" />}
                      {photo ? "change photo" : "choose a photo"}
                    </button>
                  </div>
                </Field>
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
            </motion.div>
          : <motion.p key="skip" className="join-skip" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              no card, no problem.
            </motion.p>}
      </AnimatePresence>
    </>;

    if (step.id === "review") {
      const cardRows = ([
        ["name", card.name], ["little note", card.note], ["tagline", card.tagline],
        ["bio", card.bio], ["working on", card.project], ["interests", card.interests.join(" · ")],
      ] as const).filter(([, value]) => value.trim());
      return <>
        <StepHeading icon={step.icon} focus={navigated}>look it over.</StepHeading>
        <div className="review-list">
          <ReviewGroup title="email" onEdit={() => go(0)}>
            <dl><dt>mac email</dt><dd>{normalizeEmail(email)}</dd></dl>
          </ReviewGroup>
          <ReviewGroup title="polaroid" onEdit={() => go(1)}>
            {showOnBoard
              ? <dl>{cardRows.map(([label, value]) => <Fragment key={label}><dt>{label}</dt><dd>{value}</dd></Fragment>)}</dl>
              : <p className="review-muted">not on the home page.</p>}
          </ReviewGroup>
          {STEPS.map((candidate, index) => candidate.chapters && <ReviewGroup key={candidate.id} title={candidate.label} onEdit={() => go(index)}>
            <dl>{questionsFor(candidate).map(question => <Fragment key={question.id}>
              <dt>{question.prompt}</dt><dd>{labelFor(question, answers[question.id])}</dd>
            </Fragment>)}</dl>
          </ReviewGroup>)}
        </div>
        {showOnBoard && <Field id="consent" error={errors.consent}>
          <label className="check-row">
            <input id="consent" type="checkbox" checked={consent} required aria-invalid={!!errors.consent}
              onChange={event => { setConsent(event.target.checked); clearError("consent"); }} />
            <span><strong>my polaroid can be public on this site<span className="join-required" aria-hidden="true">*</span></strong></span>
          </label>
        </Field>}
      </>;
    }

    return <>
      <StepHeading icon={step.icon} focus={navigated}>{step.label}.</StepHeading>
      {step.hint && <p className="join-lede">{step.hint}</p>}
      {step.chapters?.map(chapterId => {
        const chapter = chapters.find(candidate => candidate.id === chapterId);
        if (!chapter) return null;
        const ChapterIcon = chapterIcons[chapter.id];
        return <div className="join-questions" key={chapter.id}>
          {chapter.id !== step.id && <p className="join-chapter-label handwritten">{ChapterIcon && <ChapterIcon size={20} aria-hidden="true" />}{chapter.label}</p>}
          {chapter.questions.map(id => <ChoiceQuestion key={id} question={questionsById[id]} value={answers[id]}
            onChange={value => answer(id, value)} />)}
        </div>;
      })}
    </>;
  }

  if (done) return <JoinShell>
    <JoinSuccess showOnBoard={showOnBoard} name={card.name} note={card.note} photoUrl={photo?.url} position={position} />
  </JoinShell>;

  return <JoinShell>
    <div className="join-intro">
      <h1>add yourself<br />to the board.</h1>
    </div>
    <StepRail current={stepIndex} onJump={go} />
    <div className="join-layout">
      <form ref={scope} className="join-form" noValidate
        onSubmit={event => { event.preventDefault(); if (busy) return; void (step.id === "review" ? submit() : next()); }}>
        <input ref={honeypot} className="join-honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.section key={step.id} className="join-step" custom={direction} variants={stepMotion}
            initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease }}>
            {renderStep()}
          </motion.section>
        </AnimatePresence>
        <AnimatePresence>
          {formError && <motion.p className="join-form-error" role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {formError}
          </motion.p>}
        </AnimatePresence>
        <div className="join-actions">
          {stepIndex > 0
            ? <button type="button" className="join-button ghost" disabled={!!busy} onClick={() => go(stepIndex - 1)}>
                <ArrowLeft size={16} aria-hidden="true" /> back
              </button>
            : <span />}
          <button type="submit" className="join-button primary" disabled={!!busy}>
            {(busy === "checking" || busy === "submitting") && <LoaderCircle className="join-spinner" size={16} aria-hidden="true" />}
            {step.id === "review" ? (busy === "submitting" ? "sending…" : "submit") : "continue"}
            {step.id === "review" ? busy !== "submitting" && <Check size={16} aria-hidden="true" /> : busy !== "checking" && <ArrowRight size={16} aria-hidden="true" />}
          </button>
        </div>
      </form>
      <aside className="join-aside" data-step={step.id} aria-label="Live preview of your polaroid">
        <PolaroidPreview name={card.name} note={card.note} photoUrl={photo?.url} position={position} onPositionChange={setPosition}
          onPickPhoto={() => fileInput.current?.click()} hidden={!showOnBoard} busy={busy === "photo"} />
        <p className="preview-note">{!showOnBoard ? "just the numbers" : photo ? "drag to adjust" : "live preview"}</p>
      </aside>
    </div>
    <input ref={fileInput} type="file" accept="image/*" hidden onChange={event => void choosePhoto(event.target.files?.[0])} />
  </JoinShell>;
}

function JoinShell({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">
    <div className="join-shell">
      <header className="join-header">
        <Link className="wordmark" href="/" aria-label="Mac CS 2030 home">mac cs<span>’30</span></Link>
        <Link className="join-back" href="/"><ArrowLeft size={15} aria-hidden="true" /> back to the board</Link>
      </header>
      <main className="join-page" id="main">{children}</main>
    </div>
  </MotionConfig>;
}

function StepRail({ current, onJump }: { current: number; onJump: (index: number) => void }) {
  return <>
    <ol className="step-rail">
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        return <li key={step.id} data-state={index === current ? "current" : index < current ? "done" : "todo"}>
          <button type="button" disabled={index >= current} onClick={() => onJump(index)} aria-current={index === current ? "step" : undefined}>
            {index < current ? <Check size={14} aria-hidden="true" /> : <Icon size={14} aria-hidden="true" />}{step.label}
          </button>
          {index === current && <motion.span layoutId="step-underline" className="step-underline" transition={{ type: "spring", stiffness: 380, damping: 34 }} />}
        </li>;
      })}
    </ol>
    <div className="step-mobile" aria-hidden="true">
      <p>{current + 1} / {STEPS.length} · {STEPS[current].label}</p>
      <div className="step-mobile-track">
        <motion.div className="step-mobile-fill" initial={false} animate={{ width: `${(current + 1) / STEPS.length * 100}%` }} transition={{ duration: 0.4, ease }} />
      </div>
    </div>
  </>;
}

function StepHeading({ icon: Icon, children, focus }: { icon: LucideIcon; children: ReactNode; focus: boolean }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (focus) heading.current?.focus({ preventScroll: true });
  }, [focus]);
  return <h2 ref={heading} tabIndex={-1}>
    <motion.span className="step-icon" aria-hidden="true" initial={{ scale: 0.4, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 18 }}>
      <Icon size={20} />
    </motion.span>
    {children}
  </h2>;
}

type FieldProps = {
  id: string;
  label?: string;
  icon?: LucideIcon;
  hideLabel?: boolean;
  required?: boolean;
  hint?: string;
  error?: string;
  count?: number;
  max?: number;
  children: ReactNode;
};

function Field({ id, label, icon: Icon, hideLabel, required, hint, error, count, max, children }: FieldProps) {
  return <div className="join-field" data-invalid={!!error}>
    {label && <div className={hideLabel ? "sr-only" : "join-label-row"}>
      <label htmlFor={id}>
        {Icon && <Icon size={15} aria-hidden="true" />}{label}
        {required && <><span className="join-required" aria-hidden="true">*</span><span className="sr-only"> (required)</span></>}
      </label>
      {max !== undefined && <span className="join-count">{count}/{max}</span>}
    </div>}
    {children}
    {hint && <p className="join-hint">{hint}</p>}
    <AnimatePresence>
      {error && <motion.p key="error" className="join-error" role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
        {error}
      </motion.p>}
    </AnimatePresence>
  </div>;
}

type ChoiceProps = { question: Question; value?: string; onChange: (value: string | undefined) => void };

/** Every question is optional: tapping the chosen answer again clears it. */
function ChoiceQuestion({ question, value, onChange }: ChoiceProps) {
  return <fieldset className={`join-question ${question.kind}`}>
    <legend>{question.prompt}</legend>
    <div className="choice-list">
      {question.options.map(option => {
        const selected = value === option.value;
        return <motion.label key={option.value} className="choice" data-selected={selected} whileTap={{ scale: 0.95 }}>
          <input type="radio" name={question.id} value={option.value} checked={selected}
            onChange={() => onChange(option.value)} onClick={() => { if (selected) onChange(undefined); }} />
          <span className="choice-face">
            {question.kind === "yesno" ? option.label.toLowerCase() : option.label}
            {selected && question.kind === "choice" && <motion.span className="choice-check" initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}><Check size={14} aria-hidden="true" /></motion.span>}
          </span>
        </motion.label>;
      })}
    </div>
  </fieldset>;
}

type ChipProps = { id: string; values: string[]; invalid: boolean; onChange: (values: string[]) => void };

function ChipInput({ id, values, invalid, onChange }: ChipProps) {
  const [draft, setDraft] = useState("");
  const full = values.length >= LIMITS.interestsMax;

  function commit(raw: string) {
    const merged = [...values];
    for (const part of raw.split(",")) {
      const interest = part.trim().slice(0, LIMITS.interest);
      const duplicate = merged.some(existing => existing.toLowerCase() === interest.toLowerCase());
      if (interest && !duplicate && merged.length < LIMITS.interestsMax) merged.push(interest);
    }
    if (merged.length !== values.length) onChange(merged);
    setDraft("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit(draft);
    } else if (event.key === "Backspace" && !draft && values.length) {
      onChange(values.slice(0, -1));
    }
  }

  return <div className="chip-input">
    <AnimatePresence initial={false}>
      {values.map(value => <motion.span layout key={value} className="chip" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}>
        {value}
        <button type="button" onClick={() => onChange(values.filter(item => item !== value))} aria-label={`Remove ${value}`}><X size={12} aria-hidden="true" /></button>
      </motion.span>)}
    </AnimatePresence>
    <input id={id} value={draft} maxLength={LIMITS.interest} disabled={full} aria-invalid={invalid} autoComplete="off"
      placeholder={full ? "that’s five!" : values.length ? "add another" : "gaming, film, badminton"}
      onChange={event => event.target.value.includes(",") ? commit(event.target.value) : setDraft(event.target.value)}
      onKeyDown={handleKeyDown} onBlur={() => commit(draft)} />
  </div>;
}

function ReviewGroup({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return <section className="review-group">
    <h3>{title}<button type="button" onClick={onEdit}>edit</button></h3>
    {children}
  </section>;
}
