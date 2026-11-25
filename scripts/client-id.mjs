#!/usr/bin/env node
/**
 * Client IDs for the client portal ("Track your engagements").
 *
 *   node scripts/client-id.mjs new "Client name"   issue a new random Client ID and its registry entry
 *   node scripts/client-id.mjs fingerprint <ID>    print the fingerprint of an existing ID
 *
 * Give the Client ID to the client privately. Add the printed entry to the
 * CLIENT_REGISTRY environment variable in Vercel (Production), then redeploy.
 * The registry holds only fingerprints, never the IDs themselves.
 */
import { createHash, randomInt } from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I

const normalize = (raw) => raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
const fingerprint = (raw) => createHash("sha256").update(normalize(raw)).digest("hex");

function newId() {
  const group = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `VTR-${group()}-${group()}-${group()}`;
}

const [command, ...rest] = process.argv.slice(2);

if (command === "new") {
  const id = newId();
  const name = rest.join(" ").trim() || "Client name";
  const today = new Date().toISOString().slice(0, 10);
  const entry = {
    [fingerprint(id)]: {
      name,
      status: "Engagement open",
      stage: "Introductions in progress",
      updated: today,
      timeline: [{ date: today, label: "Engagement opened", done: true }],
    },
  };
  console.log(`Client ID (give this to the client privately):\n  ${id}\n`);
  console.log("Registry entry (merge into CLIENT_REGISTRY):");
  console.log(JSON.stringify(entry, null, 2));
} else if (command === "fingerprint" && rest[0]) {
  console.log(fingerprint(rest.join(" ")));
} else {
  console.log('Usage:\n  node scripts/client-id.mjs new "Client name"\n  node scripts/client-id.mjs fingerprint <ID>');
  process.exitCode = 1;
}
