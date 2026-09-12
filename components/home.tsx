"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, MotionConfig, animate, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play, Plus, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DraggableSlot } from "@/components/draggable-slot";
import { AboutDevelopers } from "@/components/about-developers";
import { PeopleSearch } from "@/components/people-search";
import { BOARD_SIZE, useRotatingPeople } from "@/hooks/use-rotating-people";
import type { Person } from "@/lib/class-profile";
import { MIN_RESPONSES, chapters, questionsById, statKey, type Chapter, type SurveySummary } from "@/lib/survey";

const BOARD_SLOTS = 6;
const ease = [0.16, 1, 0.3, 1] as const;

const slide = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 28 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -28 }),
};

function ProfilePhoto({ person, eager = false }: { person: Person; eager?: boolean }) {
  return person.photo ? <img src={person.photo} alt={person.photoAlt || "Profile photo"} width="400" height="460" loading={eager ? "eager" : "lazy"} decoding="async" draggable={false} style={{ objectPosition: person.photoPosition || "center" }}/> : <span className="initials-fallback" style={{ background: person.color, color: person.ink }}>{person.initials}</span>;
}

/** Counts up from zero when a chart first appears. */
function CountUp({ value }: { value: number }) {
  const node = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (!node.current || reduceMotion) return;
    const target = node.current;
    const controls = animate(0, value, { duration: 1.1, ease, onUpdate: latest => { target.textContent = String(Math.round(latest)); } });
    return () => controls.stop();
  }, [value, reduceMotion]);
  return <span ref={node}>{value}</span>;
}

function SurveyPanel({ chapter, survey }: { chapter: Chapter; survey: SurveySummary }) {
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(1);
  const question = questionsById[chapter.bars[page]];
  // Questions are optional, so every number is out of the people who answered that question.
  const chart = survey.bars[question.id];
  const largest = Math.max(1, ...(chart?.bars ?? []).map(bar => bar.count));
  const stat = survey.stats[statKey(chapter.stat.question, chapter.stat.option)];
  const donut = survey.stats[statKey(chapter.donut.question, chapter.donut.option)];
  const donutPercent = donut ? Math.round(donut.count / donut.answered * 100) : 0;

  const turn = (step: number) => {
    setDirection(step);
    setPage(current => (current + step + chapter.bars.length) % chapter.bars.length);
  };

  return <div className="survey-grid">
    <article className="chart-paper">
      <div className="chart-top">
        <p className="chart-kicker">{chapter.label}</p>
        {chapter.bars.length > 1 && <div className="chart-pager">
          <button type="button" onClick={() => turn(-1)} aria-label="Previous question"><ArrowLeft size={15}/></button>
          <span aria-live="polite">{page + 1} / {chapter.bars.length}</span>
          <button type="button" onClick={() => turn(1)} aria-label="Next question"><ArrowRight size={15}/></button>
        </div>}
      </div>
      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.div key={question.id} className="chart-body" custom={direction} variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.28, ease }}>
          <h3>{question.chartTitle}</h3>
          {chart
            ? <div className="bar-chart" role="list" aria-label={question.chartTitle}>
                {chart.bars.map((answer, index) => <div className="bar-item" role="listitem" key={answer.label}>
                  <div className="bar-label"><span>{answer.label}</span><span>{answer.count}<small> / {chart.answered}</small></span></div>
                  <div className="bar-track" aria-hidden="true"><div className={"bar-fill bar-" + index} style={{ width: (answer.count / largest * 100) + "%", "--i": index } as CSSProperties}/></div>
                </div>)}
              </div>
            : <p className="chart-empty">not enough answers yet.</p>}
        </motion.div>
      </AnimatePresence>
      <p className="chart-footnote">{chart ? `${chart.answered} answered · one answer per person` : `shows up at ${MIN_RESPONSES} answers`}</p>
    </article>
    <div className="survey-side">
      <article className="number-paper">
        <p className="chart-kicker">{chapter.stat.eyebrow}</p>
        <p className="big-stat">{stat ? <><CountUp value={stat.count}/><span>/{stat.answered}</span></> : "–"}</p>
        <h3>{chapter.stat.label}</h3>
      </article>
      <article className="donut-paper">
        <div className="donut" style={{ "--progress": donutPercent + "%" } as CSSProperties} role="img"
          aria-label={donut ? `${donut.count} of ${donut.answered} who answered: ${chapter.donut.label}` : `${chapter.donut.label}: not enough answers yet`}>
          <span>{donut ? <><CountUp value={donutPercent}/><small>%</small></> : "–"}</span>
        </div>
        <div><h3>{chapter.donut.label}</h3><p>{donut ? `${donut.count} of ${donut.answered} answered` : "not enough answers yet"}</p></div>
      </article>
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
        <a className="join-link" href="/join"><Plus size={14} aria-hidden="true"/>add yours</a>
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

      <TabsContent value="profile" className="inner-page">
        <div className="inner-heading"><h1>us, in numbers</h1></div>
        <div className="inner-heading"><p>of course we love numbers...</p></div>
        {survey.ready
          ? <Tabs defaultValue={chapters[0].id} className="survey-tabs">
              <TabsList aria-label="Survey chapters" className="chapter-tabs" variant="line">
                {chapters.map(chapter => <TabsTrigger value={chapter.id} key={chapter.id}>{chapter.label}</TabsTrigger>)}
              </TabsList>
              {chapters.map(chapter => <TabsContent value={chapter.id} key={chapter.id}><SurveyPanel chapter={chapter} survey={survey}/></TabsContent>)}
            </Tabs>
          : <SurveyCollecting total={survey.total}/>}
      </TabsContent>

      <TabsContent value="about" className="inner-page about-page">
        <div className="inner-heading"><p>about this site</p><h1>just our little<br/>corner of the internet.</h1></div>
        <div className="about-layout"><div className="about-text"><p>For the people starting computer science at McMaster in fall 2026. A place to put faces to names, find each other’s projects, and look back at our time here.</p><p>We hope to update this website sometime before we graduate to add all the experiences we&apos;ve had while being a part of Mac.</p><p>The idea comes from student-built sites like <a href="https://syde30.com/" target="_blank" rel="noreferrer">SYDE ’30</a>, alongside the <a href="https://www.syde27classprofile.ca/" target="_blank" rel="noreferrer">’27</a> and <a href="https://www.syde28.com/" target="_blank" rel="noreferrer">’28</a> class profiles.</p><AboutDevelopers/><div className="about-note"><p className="handwritten">a work in progress.</p><p></p></div></div><figure className="about-postcard"><img src="/campus.jpg" width="1280" height="960" alt="University Hall at McMaster University" loading="lazy"/><figcaption>our class at [location]</figcaption></figure></div>
      </TabsContent>
    </main>
  </Tabs></MotionConfig>;
}
