// Class profile questions. The join form, the API, and the charts all read
// this file, so a question is added or reworded in one place.
// No imports, so Node can load this file directly.

export type Option = { value: string; label: string };
export type Question = {
  id: string;
  kind: "choice" | "yesno";
  prompt: string;
  chartTitle: string;
  options: readonly Option[];
};
export type SurveyAnswers = Record<string, string>;

const yesNo: readonly Option[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export const questions: readonly Question[] = [
  {
    id: "hometown", kind: "choice", prompt: "where’s your hometown?", chartTitle: "Where did we call home?",
    options: [
      { value: "gta", label: "Greater Toronto Area" },
      { value: "hamilton", label: "Hamilton & Halton" },
      { value: "kw", label: "Kitchener–Waterloo" },
      { value: "ottawa", label: "Ottawa" },
      { value: "ontario", label: "Elsewhere in Ontario" },
      { value: "canada", label: "Elsewhere in Canada" },
      { value: "international", label: "Outside Canada" },
    ],
  },
  { id: "coded_before", kind: "yesno", prompt: "before mac cs, had you ever coded?", chartTitle: "Had we coded before?", options: yesNo },
  { id: "been_to_hamilton", kind: "yesno", prompt: "before coming to mac, had you ever been to hamilton?", chartTitle: "Had we been to Hamilton?", options: yesNo },
  {
    id: "first_language", kind: "choice", prompt: "what was the first programming language you learned?", chartTitle: "What did we code in first?",
    options: [
      { value: "python", label: "Python" },
      { value: "java", label: "Java" },
      { value: "javascript", label: "JavaScript" },
      { value: "c_cpp", label: "C / C++" },
      { value: "blocks", label: "Scratch or blocks" },
      { value: "other", label: "Something else" },
      { value: "none", label: "Haven’t coded yet" },
    ],
  },
  {
    id: "why_mac", kind: "choice", prompt: "what’s the biggest reason you picked mac?", chartTitle: "Why did we pick Mac?",
    options: [
      { value: "coop", label: "Co-op" },
      { value: "reputation", label: "Reputation" },
      { value: "close", label: "Close to home" },
      { value: "campus", label: "Campus vibe" },
      { value: "people", label: "Friends & family" },
      { value: "scholarship", label: "Scholarship" },
      { value: "other", label: "Something else" },
    ],
  },
  {
    id: "living", kind: "choice", prompt: "where are you living this year?", chartTitle: "Where are we living?",
    options: [
      { value: "residence", label: "Residence" },
      { value: "home", label: "Commuting from home" },
      { value: "off_campus", label: "Off-campus housing" },
    ],
  },
  {
    id: "subfield", kind: "choice", prompt: "what subfield of cs are you most interested in?", chartTitle: "What are we curious about?",
    options: [
      { value: "swe", label: "Software engineering" },
      { value: "ai", label: "AI & machine learning" },
      { value: "security", label: "Cybersecurity" },
      { value: "games", label: "Game development" },
      { value: "data", label: "Data science" },
      { value: "systems", label: "Systems & hardware" },
      { value: "theory", label: "Theory & math" },
      { value: "exploring", label: "Still exploring" },
    ],
  },
  { id: "learn_by_building", kind: "yesno", prompt: "do you learn best by building?", chartTitle: "Do we learn by building?", options: yesNo },
  { id: "study_in_group", kind: "yesno", prompt: "do you prefer studying in a group?", chartTitle: "Do we study together?", options: yesNo },
  {
    id: "laptop_os", kind: "choice", prompt: "what’s your main laptop running?", chartTitle: "What’s on our laptops?",
    options: [
      { value: "macos", label: "macOS" },
      { value: "windows", label: "Windows" },
      { value: "linux", label: "Linux" },
    ],
  },
  {
    id: "editor", kind: "choice", prompt: "what’s your go-to code editor?", chartTitle: "Where do we write code?",
    options: [
      { value: "vscode", label: "VS Code" },
      { value: "jetbrains", label: "JetBrains" },
      { value: "vim", label: "Vim / Neovim" },
      { value: "other", label: "Something else" },
      { value: "none", label: "No favourite yet" },
    ],
  },
  {
    id: "outside_interest", kind: "choice", prompt: "what are you into outside of cs class?", chartTitle: "What happens when we log off?",
    options: [
      { value: "gaming", label: "Gaming" },
      { value: "sports", label: "Sports & fitness" },
      { value: "music", label: "Music" },
      { value: "art", label: "Art & design" },
      { value: "reading", label: "Reading & writing" },
      { value: "outdoors", label: "The outdoors" },
      { value: "film", label: "Film & TV" },
      { value: "other", label: "Something else" },
    ],
  },
  { id: "morning_person", kind: "yesno", prompt: "are you a morning person?", chartTitle: "Are we morning people?", options: yesNo },
  { id: "club_or_team", kind: "yesno", prompt: "are you in a club or team?", chartTitle: "Are we in clubs or teams?", options: yesNo },
  {
    id: "fuel", kind: "choice", prompt: "what gets you through a long study session?", chartTitle: "What keeps us going?",
    options: [
      { value: "coffee", label: "Coffee" },
      { value: "tea", label: "Tea" },
      { value: "energy", label: "Energy drinks" },
      { value: "water", label: "Water, I’m fine" },
    ],
  },
  {
    id: "planning_coop", kind: "choice", prompt: "are you planning to do co-op?", chartTitle: "Are we doing co-op?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Not sure yet" },
    ],
  },
  {
    id: "dream_path", kind: "choice", prompt: "where do you see yourself after mac?", chartTitle: "Where are we headed?",
    options: [
      { value: "big_tech", label: "Big tech" },
      { value: "startup", label: "A startup" },
      { value: "founder", label: "My own startup" },
      { value: "research", label: "Research / grad school" },
      { value: "public", label: "Government / public sector" },
      { value: "unsure", label: "No idea yet" },
    ],
  },
];

export const questionsById: Record<string, Question> = Object.fromEntries(questions.map(question => [question.id, question]));

export type Chapter = {
  id: string;
  label: string;
  /** One line under the chapter heading on the class profile. */
  blurb: string;
  /** Questions asked on the form, in order. */
  questions: readonly string[];
  /** Choice questions shown as bar charts. */
  bars: readonly string[];
  stat: { question: string; option: string; eyebrow: string; label: string };
  donut: { question: string; option: string; label: string };
};

export const chapters: readonly Chapter[] = [
  {
    id: "before", label: "before mac",
    blurb: "Where we grew up, and what we knew before we got here.",
    questions: ["hometown", "coded_before", "been_to_hamilton", "first_language", "why_mac", "living"],
    bars: ["hometown", "first_language", "why_mac", "living"],
    stat: { question: "coded_before", option: "yes", eyebrow: "before our first lecture,", label: "had tried coding." },
    donut: { question: "been_to_hamilton", option: "no", label: "New to Hamilton" },
  },
  {
    id: "academics", label: "in class",
    blurb: "How we like to learn, and what we learn on.",
    questions: ["subfield", "learn_by_building", "study_in_group", "laptop_os", "editor"],
    bars: ["subfield", "laptop_os", "editor"],
    stat: { question: "learn_by_building", option: "yes", eyebrow: "out of all of our learning styles,", label: "learn best by building something." },
    donut: { question: "study_in_group", option: "yes", label: "Prefer studying together" },
  },
  {
    id: "life", label: "outside class",
    blurb: "What fills the hours between lectures.",
    questions: ["outside_interest", "morning_person", "club_or_team", "fuel"],
    bars: ["outside_interest", "fuel"],
    stat: { question: "morning_person", option: "yes", eyebrow: "even though we all have 8:30 am lectures, only", label: "would call themselves morning people." },
    donut: { question: "club_or_team", option: "yes", label: "Are in a club or team" },
  },
  {
    id: "coop", label: "co-op",
    blurb: "Where we think we’re headed after Mac.",
    questions: ["planning_coop", "dream_path"],
    bars: ["dream_path"],
    stat: { question: "planning_coop", option: "yes", eyebrow: "looking ahead,", label: "are planning to do co-op." },
    donut: { question: "planning_coop", option: "unsure", label: "Still deciding on co-op" },
  },
];

/** The class profile appears at this many approved responses, and each chart once this many people answered it. */
export const MIN_RESPONSES = 10;
/** Answers picked by fewer people than this are merged into OTHER_LABEL. */
export const MIN_BUCKET = 3;
export const MAX_BARS = 5;
export const OTHER_LABEL = "Something else";

export type Bar = { label: string; count: number };
// Every question is optional, so each chart counts only the people who answered it.
export type QuestionChart = { answered: number; bars: Bar[] };
export type StatCount = { answered: number; count: number };
export type SurveySummary = {
  total: number;
  ready: boolean;
  /** null when too few people answered to show the question without singling anyone out. */
  bars: Record<string, QuestionChart | null>;
  stats: Record<string, StatCount | null>;
};

export const statKey = (question: string, option: string) => `${question}:${option}`;

/** Turns raw responses into only the numbers the charts display. */
export function summarize(responses: readonly Partial<SurveyAnswers>[]): SurveySummary {
  const total = responses.length;
  if (total < MIN_RESPONSES) return { total, ready: false, bars: {}, stats: {} };

  const tally = (id: string) => {
    const counts = new Map<string, number>();
    let answered = 0;
    for (const answers of responses) {
      const value = answers[id];
      if (!value) continue;
      answered++;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return { counts, answered };
  };

  const bars: SurveySummary["bars"] = {};
  const stats: SurveySummary["stats"] = {};
  for (const chapter of chapters) {
    for (const id of chapter.bars) {
      const { counts, answered } = tally(id);
      bars[id] = answered >= MIN_RESPONSES ? { answered, bars: foldBars(questionsById[id], counts) } : null;
    }
    for (const { question, option } of [chapter.stat, chapter.donut]) {
      const { counts, answered } = tally(question);
      stats[statKey(question, option)] = answered >= MIN_RESPONSES ? { answered, count: counts.get(option) ?? 0 } : null;
    }
  }
  return { total, ready: true, bars, stats };
}

/** Largest answers first. Rare answers are merged so no one stands out. */
export function foldBars(question: Question, counts: ReadonlyMap<string, number>): Bar[] {
  let other = 0;
  const kept: Bar[] = [];
  for (const option of question.options) {
    const count = counts.get(option.value) ?? 0;
    if (!count) continue;
    if (option.value === "other" || count < MIN_BUCKET) other += count;
    else kept.push({ label: option.label, count });
  }
  kept.sort((a, b) => b.count - a.count);
  for (const bar of kept.splice(MAX_BARS)) other += bar.count;
  if (other) kept.push({ label: OTHER_LABEL, count: other });
  return kept;
}
