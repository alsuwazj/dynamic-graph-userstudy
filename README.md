# Dynamic Graph User Study

Participant website for the DARCOL aspect-ratio study. It is a static site
(GitHub Pages); no build step.

- **Part 1 · Static path matching (20 questions):** ten graphs, each shown
  once per method. Both drawings within a question use that method at two
  different ARs. The same six path nodes are highlighted for both methods. Method order varies across
  participants and graph order is shuffled within blocks.
- **Part 2 · Animated node tracking (DARCOL):** one panel at a time.
  Memorize the highlighted nodes (rest of the graph in light grey), watch the
  transition, then select the same nodes. Two conditions, *highlighted region*
  and *nodes moved for the aspect-ratio change*, in counterbalanced order.

Part 2 has 20 questions: ten other Rome graphs, each appearing in both target
conditions. Targets are memorized for six seconds, followed by a six-second
GUI-rendered optimizer trajectory and a 25-second response window. There are
20 distinct source graphs in total. See [STUDY-DESIGN.md](STUDY-DESIGN.md) for
selection rules, provenance, timing definitions and remaining pilot checks.

## Files

| File | Purpose |
|---|---|
| `study-config.json` | Timings, instruction text, graphs used, and the target nodes for each part/condition |
| `stimuli.json`, `media/gui/` | Drawings (images + node click areas) and DARCOL animations |
| `study.mjs` | Participant flow, timing, answer recording and upload |
| `graph-view.mjs` | Draws a drawing: cropping, highlights, light-grey context, node selection |
| `plan.mjs` | Question order (seeded) and scoring |
| `response-service.json/.mjs` | Results service the answers are uploaded to |

## Running locally

Serve the folder over HTTP (`.mjs` files need a JavaScript MIME type):

```
python -c "import http.server,mimetypes;mimetypes.add_type('text/javascript','.mjs');http.server.test(HandlerClass=http.server.SimpleHTTPRequestHandler,port=8000)"
```

Open `http://localhost:8000/?local` to test without uploading anything; the
last page then offers the responses as a JSON download.

## Saved data

Every answer is uploaded to the results service as soon as it is submitted
(the whole session object is sent each time). Each entry in `answers` has:
`part`, `method`, `condition`, `graph`, `targetAspect`, `target`, `selected`,
`correct`, `hits`, `precision`, `recall`, `f1`, `timeout`, `responseMs`
(Part 2 also `memorizeMs`, `animationMs`, `totalMs`), `tabHidden`, `resized`,
and `position` / `questionIndex` for presentation order. Participants never see
their scores.
