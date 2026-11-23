# Dynamic Graph User Study

Participant website for the DARCOL aspect-ratio study. It is a static site
(GitHub Pages); no build step.

- **Part 1 · Static path matching:** 20 questions using ten graphs, once
  per method, with 50 seconds to answer. Both methods use the same six path
  nodes and nominal aspect-ratio transition.
- **Part 2 · Animation recovery:** ten questions using the same five graphs
  with both DARCOL modes: optimizer iterations and highlighted curved playback
  after computation. Six seconds to memorize, six seconds of playback and
  40 seconds to answer. Mode order is counterbalanced.
- **Part 3 · Animation preferences:** five other graphs, each shown as two
  looping videos side by side. ARCOL uses linear interpolation between its
  computed endpoints; DARCOL uses the GUI highlighted curved trajectory.
  Side assignment and comparison order vary. Three five-point ratings cover
  pleasantness, tracking and overall preference.

The videos use each method's own starting layout at the same source aspect
ratio, rather than identical starting geometry. Both methods share the same
original HOLA input and destination aspect ratio. All ten preference videos
last six seconds. See [STUDY-DESIGN.md](STUDY-DESIGN.md) for the full protocol.

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

Part 3 ratings are stored separately in `ratings`, including raw side-based
responses, method-normalized values, side assignment, time and viewing flags.
Positive normalized values prefer DARCOL. Earlier versions keep their own
assignment and scoring.
