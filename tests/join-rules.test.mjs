import assert from "node:assert/strict";
import test from "node:test";
import { EMAIL_PATTERN, NAME_PATTERN, PHOTO_POSITION_PATTERN, formatName, normalizeEmail, sniffImageType } from "../lib/join-rules.ts";

test("emails are trimmed and lowercased, and only their shape is checked", () => {
  assert.equal(normalizeEmail("  SmithJ12@McMaster.ca "), "smithj12@mcmaster.ca");
  // Admins decide whether an address is really a McMaster one.
  for (const valid of ["smithj12@mcmaster.ca", "someone@gmail.com"]) assert.ok(EMAIL_PATTERN.test(valid), valid);
  for (const invalid of ["smithj12", "smith j@mcmaster.ca", "a@b", "@mcmaster.ca"]) assert.ok(!EMAIL_PATTERN.test(invalid), invalid);
});

test("names are tidied into first name and last initial", () => {
  const cases = [
    ["jason t", "Jason T."],
    ["jason tran", "Jason T."],
    ["  jason   t. ", "Jason T."],
    ["mary ann smith", "Mary Ann S."],
    ["élodie c", "Élodie C."],
    ["Jason T.", "Jason T."],
  ];
  for (const [input, expected] of cases) {
    assert.equal(formatName(input), expected);
    assert.ok(NAME_PATTERN.test(expected), expected);
  }
  for (const invalid of ["jason t.", "Jason", "Jason Tran", "Jason T"]) assert.ok(!NAME_PATTERN.test(invalid), invalid);
});

test("uploads are identified by their first bytes", () => {
  const bytes = text => new Uint8Array([...text].map(char => char.charCodeAt(0)));
  assert.equal(sniffImageType(bytes("RIFF\0\0\0\0WEBPVP8 ")), "image/webp");
  assert.equal(sniffImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), "image/jpeg");
  assert.equal(sniffImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a])), "image/png");
  assert.equal(sniffImageType(bytes("<svg></svg>")), null);
});

test("photo positions are two whole percentages", () => {
  for (const valid of ["50% 40%", "0% 100%", "100% 0%"]) assert.ok(PHOTO_POSITION_PATTERN.test(valid), valid);
  for (const invalid of ["101% 0%", "50%", "50% 40% 10%", "center"]) assert.ok(!PHOTO_POSITION_PATTERN.test(invalid), invalid);
});
