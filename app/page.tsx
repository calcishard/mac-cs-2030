"use client";

import { useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, CornerDownRight, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { chapters, people, type Chapter, type Person } from "@/lib/class-profile";

const sampleTotal = 48;

function ProfilePhoto({ person, eager = false }: { person: Person; eager?: boolean }) {
  return person.photo ? <img src={person.photo} alt={person.photoAlt || "Profile interest photo"} width="400" height="460" loading={eager ? "eager" : "lazy"} decoding="async" style={{ objectPosition: person.photoPosition || "center" }}/> : <span className="initials-fallback" style={{ background: person.color, color: person.ink }}>{person.initials}</span>;
}

function SurveyPanel({ chapter }: { chapter: Chapter }) {
  const largest = Math.max(...chapter.bars.map((answer) => answer.count));
  return <div className="survey-grid">
    <article className="chart-paper">
      <p className="chart-kicker">{chapter.category.toLowerCase()}</p>
      <h3>{chapter.question}</h3>
      <div className="bar-chart" role="list" aria-label={chapter.question}>
        {chapter.bars.map((answer, index) => <div className="bar-item" role="listitem" key={answer.label}>
          <div className="bar-label"><span>{answer.label}</span><span>{answer.count}<small> / {sampleTotal}</small></span></div>
          <div className="bar-track" aria-hidden="true"><div className={"bar-fill bar-" + index} style={{width:(answer.count/largest*100)+"%"}}/></div>
        </div>)}
      </div>
      <p className="chart-footnote">{sampleTotal} responses · one answer per person</p>
    </article>
    <div className="survey-side">
      <article className="number-paper"><p className="chart-kicker">{chapter.statEyebrow.toLowerCase()}</p><p className="big-stat">{chapter.statValue}<span>/{sampleTotal}</span></p><h3>{chapter.statLabel}</h3></article>
      <article className="donut-paper"><div className="donut" style={{"--progress":(chapter.donutCount/sampleTotal*100)+"%"} as CSSProperties} role="img" aria-label={chapter.donutCount+" of "+sampleTotal+" sample respondents: "+chapter.donutLabel}><span>{Math.round(chapter.donutCount/sampleTotal*100)}<small>%</small></span></div><div><h3>{chapter.donutLabel}</h3><p>{chapter.donutCount} of {sampleTotal} example responses</p></div></article>
    </div>
  </div>;
}

export default function Home() {
  const [view, setView] = useState("people");
  const [personIndex, setPersonIndex] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const profileTrigger = useRef<HTMLButtonElement | null>(null);
  const person = people[personIndex];

  const changeView = (value: string) => { setView(value); window.scrollTo({top:0, behavior:"instant"}); };

  return <Tabs value={view} onValueChange={changeView} className="site-tabs">
    <a className="skip-link" href="#main">skip to content</a>
    <header className="site-header">
      <button className="wordmark" onClick={() => changeView("people")} aria-label="Mac CS 2030 home">mac cs<span>’30</span></button>
      <TabsList aria-label="Site sections" className="main-nav" variant="line">
        <TabsTrigger value="people">the people</TabsTrigger>
        <TabsTrigger value="profile">class profile</TabsTrigger>
        <TabsTrigger value="about">about</TabsTrigger>
      </TabsList>
      <span className="header-location">mcmaster university<br/><span>hamilton, ontario</span></span>
    </header>

    <main id="main">
      <TabsContent value="people" className="people-page">
        <div className="board-heading"><h1>computer science</h1></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <section className={"photo-board" + (people.length > 6 ? " expanded-board" : "")} aria-label="Mac CS sample student webring">
            <div className="year-type" aria-hidden="true"><span>20</span><span>30</span></div>
            <div className="polaroid-spread">
              {people.map((member,index) => <DialogTrigger asChild key={member.id}>
                <button className={"polaroid photo-"+(index%6)} onClick={(event) => {profileTrigger.current=event.currentTarget;setPersonIndex(index);}} aria-label={"Open "+member.name+"’s sample profile"}>
                  <span className="photo-window"><ProfilePhoto person={member} eager={index<3}/><span className="photo-hover-label">say hello <ArrowUpRight size={17}/></span></span>
                  <span className="photo-caption"><span className="photo-name">{member.name.toLowerCase()}</span></span>
                  <span className="photo-note">{member.note || member.tagline}</span>
                </button>
              </DialogTrigger>)}
            </div>
          </section>
          <DialogContent className="profile-dialog" showCloseButton={false} onCloseAutoFocus={(event) => {event.preventDefault();profileTrigger.current?.focus();}}>
            <button className="close-dialog" onClick={() => setDialogOpen(false)} aria-label="Close profile"><X size={21}/></button>
            <div className="profile-photo"><ProfilePhoto person={person} eager/></div>
            <div className="profile-copy"><span className="profile-meta">mac cs ’30 / profile</span><DialogTitle>{person.name.toLowerCase()}</DialogTitle><DialogDescription>{person.tagline}</DialogDescription><p className="profile-bio">{person.bio}</p><div className="profile-detail"><h3>working on</h3><p>{person.project}</p></div><div className="profile-detail"><h3>also into</h3><p>{person.offline}</p></div><div className="ring-controls"><button onClick={() => setPersonIndex((i)=>(i+people.length-1)%people.length)} aria-label="Previous classmate"><ArrowLeft size={17}/> previous</button><span aria-live="polite">{String(personIndex+1).padStart(2,"0")} / {String(people.length).padStart(2,"0")}</span><button onClick={() => setPersonIndex((i)=>(i+1)%people.length)} aria-label="Next classmate">next <ArrowRight size={17}/></button></div></div>
          </DialogContent>
        </Dialog>
      </TabsContent>  

      <TabsContent value="profile" className="inner-page">
        <div className="inner-heading"><h1>us, in numbers</h1></div>
        <div className="inner-heading"><p>of course we love numbers...</p></div>
        <Tabs defaultValue="before" className="survey-tabs"><TabsList aria-label="Survey chapters" className="chapter-tabs" variant="line"><TabsTrigger value="before">before mac</TabsTrigger><TabsTrigger value="academics">in class</TabsTrigger><TabsTrigger value="life">outside class</TabsTrigger><TabsTrigger value="coop">co-op</TabsTrigger></TabsList>
          {chapters.map((chapter)=><TabsContent value={chapter.id} key={chapter.id}><SurveyPanel chapter={chapter}/></TabsContent>)}
          <TabsContent value="coop"><div className="coop-empty"><span className="handwritten">to be continued...</span><h2>we’re still getting started.</h2><p>Co-op stories, job searches, and the things we learn along the way will go here when we have them.</p></div></TabsContent>
        </Tabs>
      </TabsContent>

      <TabsContent value="about" className="inner-page about-page">
        <div className="inner-heading"><p>about this site</p><h1>just our little<br/>corner of the internet.</h1></div>
        <div className="about-layout"><div className="about-text"><p>For the people starting computer science at McMaster in fall 2026. A place to put faces to names, find each other’s projects, and look back at our time here.</p><p>We hope to update this website sometime before we graduate to add all the experiences we've had while being a part of Mac.</p><p>The idea comes from student-built sites like <a href="https://syde30.com/" target="_blank" rel="noreferrer">SYDE ’30</a>, alongside the <a href="https://www.syde27classprofile.ca/" target="_blank" rel="noreferrer">’27</a> and <a href="https://www.syde28.com/" target="_blank" rel="noreferrer">’28</a> class profiles.</p><div className="about-note"><p className="handwritten">a work in progress.</p><p></p></div></div><figure className="about-postcard"><img src="/campus.jpg" width="1280" height="960" alt="University Hall at McMaster University" loading="lazy"/><figcaption>our class at [location]</figcaption></figure></div>
      </TabsContent>
    </main>
  </Tabs>;
}
