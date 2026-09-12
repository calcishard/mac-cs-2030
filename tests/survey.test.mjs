import assert from "node:assert/strict";
import test from "node:test";
import { MAX_BARS, MIN_RESPONSES, OTHER_LABEL, chapters, foldBars, questions, questionsById, statKey, summarize } from "../lib/survey.ts";

const responses = (count, answer) => Array.from({ length: count }, (_, index) =>
  Object.fromEntries(questions.map(question => [question.id, answer(question, index)])));

test("every chapter points at real questions and options, and asks each question once", () => {
  for (const chapter of chapters) {
    for (const id of [...chapter.questions, ...chapter.bars]) assert.ok(questionsById[id], id);
    for (const id of chapter.bars) assert.equal(questionsById[id].kind, "choice", id);
    for (const { question, option } of [chapter.stat, chapter.donut]) {
      assert.ok(questionsById[question].options.some(candidate => candidate.value === option), `${question}:${option}`);
    }
  }
  const asked = chapters.flatMap(chapter => chapter.questions);
  assert.deepEqual([...asked].sort(), questions.map(question => question.id).sort());
});

test("charts stay hidden, with no counts sent, until enough responses arrive", () => {
  const summary = summarize(responses(MIN_RESPONSES - 1, question => question.options[0].value));
  assert.equal(summary.ready, false);
  assert.equal(summary.total, MIN_RESPONSES - 1);
  assert.deepEqual(summary.bars, {});
  assert.deepEqual(summary.stats, {});
});

test("rare answers merge into something else", () => {
  const counts = new Map([["gta", 9], ["hamilton", 4], ["ottawa", 2], ["international", 1]]);
  assert.deepEqual(foldBars(questionsById.hometown, counts), [
    { label: "Greater Toronto Area", count: 9 },
    { label: "Hamilton & Halton", count: 4 },
    { label: OTHER_LABEL, count: 3 },
  ]);
});

test("a picked 'something else' option joins the merged bar, and ties keep form order", () => {
  const counts = new Map([["python", 4], ["java", 4], ["other", 5]]);
  assert.deepEqual(foldBars(questionsById.first_language, counts), [
    { label: "Python", count: 4 },
    { label: "Java", count: 4 },
    { label: OTHER_LABEL, count: 5 },
  ]);
});

test("only the largest answers get their own bar", () => {
  const counts = new Map([["gaming", 10], ["sports", 9], ["music", 8], ["art", 7], ["reading", 6], ["outdoors", 5], ["film", 4]]);
  const bars = foldBars(questionsById.outside_interest, counts);
  assert.equal(bars.length, MAX_BARS + 1);
  assert.deepEqual(bars.at(-1), { label: OTHER_LABEL, count: 9 });
});

test("summaries count stats and keep every bar chart summing to the total", () => {
  const summary = summarize(responses(12, (question, index) => {
    if (question.id === "coded_before") return index < 7 ? "yes" : "no";
    return question.options[index % 2].value;
  }));
  assert.equal(summary.ready, true);
  assert.equal(summary.stats[statKey("coded_before", "yes")], 7);
  for (const chapter of chapters) {
    for (const id of chapter.bars) {
      assert.equal(summary.bars[id].reduce((sum, bar) => sum + bar.count, 0), 12, id);
    }
  }
});
