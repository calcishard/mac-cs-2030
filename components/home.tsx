"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { MotionConfig, animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, PenLine, Play, Plus, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DraggableSlot } from "@/components/draggable-slot";
import { AboutDevelopers } from "@/components/about-developers";
import { PeopleSearch } from "@/components/people-search";
import { useEditToken } from "@/hooks/use-edit-token";
import { BOARD_SIZE, useRotatingPeople } from "@/hooks/use-rotating-people";
import type { Person } from "@/lib/class-profile";
import { MIN_RESPONSES, chapters, questionsById, statKey, type Chapter, type SurveySummary } from "@/lib/survey";

const BOARD_SLOTS = 6;
const ease = [0.16, 1, 0.3, 1] as const;

const pad = (value: number) => String(value).padStart(2, "0");
const percent = (count: number, answered: number) => Math.round(count / answered * 100);
const chapterAnchor = (chapter: Chapter) => "numbers-" + chapter.id;

function ProfilePhoto({ person, eager = false }: { person: Person; eager?: boolean }) {
  return person.photo ? <img src={person.photo} alt={person.photoAlt || "Profile photo"} width="400" height="460" loading={eager ? "eager" : "lazy"} decoding="async" draggable={false} style={{ objectPosition: person.photoPosition || "center" }}/> : <span className="initials-fallback" style={{ background: person.color, color: person.ink }}>{person.initials}</span>;
}

/** True once the element has scrolled into view, so charts draw in as they're reached. */
function useSeen<T extends Element>() {
  const ref = useRef<T>(null);
  const seen = useInView(ref, { once: true, amount: 0.25 });
  return [ref, seen] as const;
}

/** Counts up from zero once `start` turns true. Hidden from screen readers, which get the plain number beside it. */
function CountUp({ value, start }: { value: number; start: boolean }) {
  const count = useMotionValue(0);
  const text = useTransform(count, latest => String(Math.round(latest)));
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (!start) return;
    if (reduceMotion) { count.jump(value); return; }
    const controls = animate(count, value, { duration: 1.1, ease });
    return () => controls.stop();
  }, [count, value, start, reduceMotion]);
  return <motion.span aria-hidden="true">{text}</motion.span>;
}

/** The chapter's two headline numbers: a count, and a share as a donut. */
function ChapterHighlights({ chapter, survey }: { chapter: Chapter; survey: SurveySummary }) {
  const [ref, seen] = useSeen<HTMLDivElement>();
  const stat = survey.stats[statKey(chapter.stat.question, chapter.stat.option)];
  const donut = survey.stats[statKey(chapter.donut.question, chapter.donut.option)];
  const donutShare = donut ? percent(donut.count, donut.answered) : 0;

  return <div ref={ref} className="chapter-highlights">
    <article className="profile-card stat-card">
      <p className="card-kicker">{chapter.stat.eyebrow}</p>
      <p className="big-stat">{stat
        ? <><CountUp value={stat.count} start={seen}/><span className="stat-of" aria-hidden="true">of {stat.answered}</span><span className="sr-only">{stat.count} of {stat.answered}</span></>
        : "–"}</p>
      <h3>{chapter.stat.label}</h3>
    </article>
    <article className="profile-card donut-card">
      <div className="donut" style={{ "--progress": (seen ? donutShare : 0) + "%" } as CSSProperties} role="img"
        aria-label={donut ? `${chapter.donut.label}: ${donutShare}%, ${donut.count} of ${donut.answered}` : `${chapter.donut.label}: not enough answers yet`}>
        <span aria-hidden="true">{donut ? <><CountUp value={donutShare} start={seen}/><small>%</small></> : "–"}</span>
      </div>
      <div><h3>{chapter.donut.label}</h3><p>{donut ? `${donut.count} of ${donut.answered}` : "not enough answers yet"}</p></div>
    </article>
  </div>;
}

function BarChart({ id, survey }: { id: string; survey: SurveySummary }) {
  const [ref, seen] = useSeen<HTMLElement>();
  const question = questionsById[id];
  // Questions are optional, so every percentage is out of the people who answered that question.
  const chart = survey.bars[id];

  return <article ref={ref} className="profile-card chart-card" data-seen={seen || undefined}>
    <h3>{question.chartTitle}</h3>
    {chart
      ? <ol className="bar-chart" aria-label={question.chartTitle}>
          {chart.bars.map((bar, index) => {
            const share = percent(bar.count, chart.answered);
            return <li className="bar-item" key={bar.label}>
              <div className="bar-label"><span>{bar.label}</span><span>{share}%</span></div>
              <div className="bar-track" aria-hidden="true"><div className={"bar-fill bar-" + index} style={{ width: share + "%", "--i": index } as CSSProperties}/></div>
            </li>;
          })}
        </ol>
      : <p className="chart-empty">not enough answers yet. this shows up at {MIN_RESPONSES}.</p>}
  </article>;
}

function ProfileChapter({ chapter, index, survey }: { chapter: Chapter; index: number; survey: SurveySummary }) {
  const anchor = chapterAnchor(chapter);
  return <section id={anchor} className="profile-chapter" aria-labelledby={anchor + "-title"}>
    <header className="chapter-heading">
      <p className="chapter-number">{pad(index + 1)} / {pad(chapters.length)}</p>
      <h2 id={anchor + "-title"}>{chapter.label}</h2>
      <p>{chapter.blurb}</p>
    </header>
    <ChapterHighlights chapter={chapter} survey={survey}/>
    <div className="chapter-charts">
      {chapter.bars.map(id => <BarChart key={id} id={id} survey={survey}/>)}
    </div>
  </section>;
}

/** Every chapter on one page, read top to bottom, with a contents list that follows along. */
function ClassProfile({ survey, joined }: { survey: SurveySummary; joined: boolean }) {
  const [current, setCurrent] = useState(chapters[0].id);

  useEffect(() => {
    // The chapter passing just above the middle of the window is the one being read.
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setCurrent(entry.target.id.replace("numbers-", ""));
    }, { rootMargin: "-35% 0px -60% 0px" });
    for (const chapter of chapters) {
      const section = document.getElementById(chapterAnchor(chapter));
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, []);

  return <div className="numbers">
    <nav className="numbers-rail" aria-label="Class profile chapters">
      <p>chapters</p>
      <ol>
        {chapters.map((chapter, index) => <li key={chapter.id}>
          <a href={"#" + chapterAnchor(chapter)} aria-current={current === chapter.id ? "location" : undefined}><span>{pad(index + 1)}</span>{chapter.label}</a>
        </li>)}
      </ol>
    </nav>
    <div className="numbers-chapters">
      {chapters.map((chapter, index) => <ProfileChapter key={chapter.id} chapter={chapter} index={index} survey={survey}/>)}
      <aside className="numbers-outro">
        {joined
          ? <><p className="handwritten">thanks for being in here.</p><h2>the numbers update as more of us add our answers.</h2></>
          : <><p className="handwritten">not in here yet?</p><h2>every answer makes these numbers a little more us.</h2><a className="join-cta" href="/join">add yours <ArrowUpRight size={16} aria-hidden="true"/></a></>}
      </aside>
    </div>
  </div>;
}

function SurveyCollecting({ total }: { total: number }) {
  return <div className="coop-empty survey-collecting">
    <span className="handwritten">still collecting...</span>
    <h2>the charts show up at {MIN_RESPONSES} responses.</h2>
    <p>{total === 0 ? "No approved responses yet." : `${total} approved so far.`} Add yours and help fill in the class profile.</p>
    <a className="join-cta" href="/join">add yours <ArrowUpRight size={16} aria-hidden="true"/></a>
  </div>;
}

export function Home({ people, survey }: { people: Person[]; survey: SurveySummary }) {
  const [view, setView] = useState("people");
  const [personIndex, setPersonIndex] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rotationPaused, setRotationPaused] = useState(false);
  const profileTrigger = useRef<HTMLElement | null>(null);
  const person = people[personIndex];
  const { cards } = useRotatingPeople(people, rotationPaused);
  const editToken = useEditToken();

  const changeView = (value: string) => {
    setView(value);
    window.scrollTo({top:0, behavior:"instant"});
  };

  return <MotionConfig reducedMotion="user"><Tabs value={view} onValueChange={changeView} className="site-tabs">
    <a className="skip-link" href="#main">skip to content</a>
    <header className="site-header">
      <button className="wordmark" onClick={() => changeView("people")} aria-label="Mac CS 2030 home">mac cs<span>’30</span></button>
      <div className="nav-cluster">
        <TabsList aria-label="Site sections" className="main-nav" variant="line">
          <TabsTrigger value="people">the people</TabsTrigger>
          <TabsTrigger value="profile">class profile</TabsTrigger>
          <TabsTrigger value="about">about</TabsTrigger>
        </TabsList>
        <div className="header-actions">
          {!editToken && <a className="join-link" href="/join"><Plus size={14} aria-hidden="true"/>add yours</a>}
          <a className={editToken ? "join-link" : "join-link quiet"} href="/join/edit"><PenLine size={14} aria-hidden="true"/>edit yours</a>
        </div>
      </div>
      {view === "people" ? <div className="people-tools">
        <PeopleSearch people={people} onSelect={(member, input) => {
          const index = people.findIndex(candidate => candidate.id === member.id);
          if (index < 0) return;
          profileTrigger.current = input;
          setPersonIndex(index);
          setDialogOpen(true);
        }} />
        <button className="rotation-toggle" type="button"
          disabled={people.length <= BOARD_SIZE}
          aria-pressed={rotationPaused}
          aria-label={rotationPaused ? "Resume rotating cards" : "Pause rotating cards"}
          title={rotationPaused ? "Resume cards" : "Pause cards"}
          onClick={() => setRotationPaused(paused => !paused)}>
          {rotationPaused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
        </button>
      </div> : <span className="header-location">mcmaster university<br/><span>hamilton, ontario</span></span>}
    </header>

    <main id="main">
      <TabsContent value="people" className="people-page">
        <div className="board-heading"><h1>computer science</h1></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <section className="photo-board" aria-label="Mac CS student webring">
            <div className="year-type" aria-hidden="true"><span>20</span><span>30</span></div>
            <div className="polaroid-spread">
              {cards.map(({ person: member, revision }, slot) => <DraggableSlot key={slot} className={"polaroid-slot photo-" + slot} style={{ "--slot": slot } as CSSProperties}>
                <DialogTrigger asChild>
                  <button className="polaroid" data-person-id={member.id}
                    onClick={(event) => {profileTrigger.current=event.currentTarget;setPersonIndex(people.findIndex(candidate => candidate.id === member.id));}} aria-label={"Open "+member.name+"’s profile"}>
                    <span className="photo-window"><ProfilePhoto person={member} eager/><span className="photo-hover-label">say hello <ArrowUpRight size={17}/></span></span>
                    <span className="photo-caption"><span className="photo-name">{member.name.toLowerCase()}</span></span>
                    <span className="photo-note">{member.note || member.tagline}</span>
                    {revision > 0 && <span key={revision} className="polaroid-flash" aria-hidden="true" />}
                  </button>
                </DialogTrigger>
              </DraggableSlot>)}
              {Array.from({ length: Math.max(0, BOARD_SLOTS - cards.length) }, (_, index) => {
                const slot = cards.length + index;
                return <DraggableSlot key={slot} className={"polaroid-slot photo-" + slot} style={{ "--slot": slot } as CSSProperties}>
                  <a className="polaroid polaroid-blank" href="/join" draggable={false} aria-label="Add your polaroid">
                    <span className="photo-window"><span className="blank-window"><Plus size={26} aria-hidden="true"/></span></span>
                    <span className="photo-caption"><span className="photo-name">add yours</span></span>
                  </a>
                </DraggableSlot>;
              })}
            </div>
          </section>
          {person && <DialogContent className="profile-dialog" showCloseButton={false} onCloseAutoFocus={(event) => {event.preventDefault();profileTrigger.current?.focus();}}>
            <button className="close-dialog" onClick={() => setDialogOpen(false)} aria-label="Close profile"><X size={21}/></button>
            <div className="profile-photo"><ProfilePhoto person={person} eager/></div>
            <div className="profile-copy">
              <span className="profile-meta">mac cs ’30 / profile</span>
              <DialogTitle>{person.name.toLowerCase()}</DialogTitle>
              <DialogDescription>{person.tagline}</DialogDescription>
              {person.bio && <p className="profile-bio">{person.bio}</p>}
              {person.project && <div className="profile-detail"><h3>working on</h3><p>{person.project}</p></div>}
              {person.interests.length > 0 && <div className="profile-detail"><h3>also into</h3><p>{person.interests.join(" · ")}</p></div>}
              <div className="ring-controls"><button onClick={() => setPersonIndex((i)=>(i+people.length-1)%people.length)} aria-label="Previous classmate"><ArrowLeft size={17}/> previous</button><span aria-live="polite">{String(personIndex+1).padStart(2,"0")} / {String(people.length).padStart(2,"0")}</span><button onClick={() => setPersonIndex((i)=>(i+1)%people.length)} aria-label="Next classmate">next <ArrowRight size={17}/></button></div>
            </div>
          </DialogContent>}
        </Dialog>
      </TabsContent>

      <TabsContent value="profile" className="inner-page profile-page">
        <div className="inner-heading numbers-heading">
          <h1>us, in numbers</h1>
          <p className="numbers-note">of course we love numbers...</p>
          {survey.ready && <p className="numbers-lede">{survey.total} of us answered a few questions when we joined. Scroll down to see where we came from, how we learn, and where we’re headed. Every question was optional, so each number is out of the people who answered it.</p>}
        </div>
        {survey.ready
          ? <ClassProfile survey={survey} joined={Boolean(editToken)}/>
          : <SurveyCollecting total={survey.total}/>}
      </TabsContent>

      <TabsContent value="about" className="inner-page about-page">
        <div className="inner-heading"><p>about this site</p><h1>just our little<br/>corner of the internet.</h1></div>
        <div className="about-layout"><div className="about-text"><p>For the people starting computer science at McMaster in fall 2026. A place to put faces to names, find each other’s projects, and look back at our time here.</p><p>We hope to update this website sometime before we graduate to add all the experiences we&apos;ve had while being a part of Mac.</p><p>The idea comes from student-built sites like <a href="https://syde30.com/" target="_blank" rel="noreferrer">SYDE ’30</a>, alongside the <a href="https://www.syde27classprofile.ca/" target="_blank" rel="noreferrer">’27</a> and <a href="https://www.syde28.com/" target="_blank" rel="noreferrer">’28</a> class profiles.</p><AboutDevelopers/><div className="about-note"><p className="handwritten">a work in progress.</p><p></p></div></div><figure className="about-postcard"><img src="/campus.jpg" width="1280" height="960" alt="University Hall at McMaster University" loading="lazy"/><figcaption>our class at [location]</figcaption></figure></div>
      </TabsContent>
    </main>
  </Tabs></MotionConfig>;
}
