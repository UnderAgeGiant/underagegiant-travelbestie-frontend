# Attraction Image & Coverage Fix Loop — operational notes

This branch (`fix/attractions-images`) is worked on by an hourly cloud
routine. Every run is a fresh clone with no memory of past runs — all state
lives in this repo:

- `scripts/attraction-image-audit.json` — regenerated every run by
  `node scripts/audit-attraction-images.mjs`. Don't hand-edit.
- `scripts/city-fix-state.json` — per-city attempt/radius/stuck tracking.
  Don't hand-edit; delete a city's key to force a fresh retry.
- `scripts/GOAL_MET.flag` — if present, every attraction in every city meets
  the goal (15+ attractions, no duplicate images within a city). Safe to
  disable/delete the routine once this appears.
- `scripts/AUTOMATION_EXHAUSTED.flag` — if present, every remaining
  unresolved city has been retried 5 times and OSM/Commons/Wikipedia/
  Openverse couldn't fill it further (usually a small town with few tagged
  POIs). Lists the stuck city ids. Needs a human to add manual entries via
  hand-curated data, or to accept those cities as-is.

## What one hourly run does

```bash
node scripts/run-fix-loop.mjs --max-cities 3
```

1. Checks for `GOAL_MET.flag` / `AUTOMATION_EXHAUSTED.flag` — if either
   exists, does nothing.
2. Runs the audit (`scripts/audit-attraction-images.mjs`).
3. Picks up to 3 cities, highest-priority (most touristic, per
   `scripts/touristic-cities-priority.json`) first, that still need work.
4. For each: de-duplicates images within the city (keeps one, re-sources a
   genuinely new image for every other duplicate), then discovers and
   appends new attractions via OSM (`scripts/discover-attractions.mjs`) with
   sourced images until the city reaches 15 attractions or this run's cap.
5. Writes `GOAL_MET.flag` if nothing is left, or marks a city `stuck` after
   5 failed attempts (radius grows 1.5x each retry).

After running, review the diff, then commit and push:

```bash
git add -A
git commit -m "fix(data): resolve attraction images/coverage — <city names from summary>"
git push origin fix/attractions-images
```

Never touch other branches. Never reorder/renumber/delete existing
`attractions-curated.ts` entries — append-only (see
`src/app/data/attractions.data.ts`'s stable-ID rule).
