# Graph layout study

Protocol: gui-straight-playback-v50. The site is published through GitHub Pages; response collection uses the separate results service.

Part 1: 18 static path-matching questions, nine graphs once per method, four consecutive target nodes and a 50-second deadline. Method trials are interleaved; the same graph never immediately repeats.

Part 2: 18 tree-direction questions, nine graphs once per method. The unmarked starting drawing appears for six seconds, followed by one-second direct linear interpolation. The whole target tree is highlighted only after playback and a 150 ms final hold. Responses allow 40 seconds; timing excludes viewing and playback. Both methods use the same tree IDs and nominal aspect-ratio pair. Direction-change and preservation cases are recorded.

Part 3: nine side-by-side ARCOL-versus-DARCOL comparisons. Both start from the same DARCOL drawing and use the same destination aspect-ratio target. ARCOL linearly interpolates to an independently computed ARCOL final drawing without highlights. DARCOL uses endpoint interpolation with smooth tree/chain turns, blue movement highlights and pale context nodes. Both clips last one second and replay after a two-second pause. Participants give one overall five-point preference rating. Graph order and left/right method placement vary by seed; positive normalized scores favor DARCOL. This is a comparison of the two presentation systems, including their different endpoints and highlighting.

Part 3 follows the GUI playback convention: every edge is a straight node-to-node connection during motion. The saved rounded orthogonal routes appear only at the exact starting and final layouts. There is no bend interpolation during playback. Square fills are #848482, black edges and borders are 2px, and corner radius is 4px. DARCOL tree rotation and blue/pale highlighting remain.

Edge attachments preserve offset route lines and add only short connectors to glyph borders. The long original segments are never dragged toward node centers. All exported endpoints are checked for introduced long diagonals.

Edge attachments preserve offset route lines and add only short connectors to glyph borders. The long original segments are never dragged toward node centers. All exported endpoints are checked for introduced long diagonals.

Parts 1 and 2 retain the v44 layouts, target IDs, timing and randomization unchanged. Historical session versions remain supported by the service. Current Part 3 summaries exclude the retired within-DARCOL animation-style comparison.

All source layout paths and original HOLA hashes are recorded in stimuli.json. The fixed demonstration set is selected rather than a representative random graph sample.

---

## Historical protocol notes (superseded)

# Dynamic Graph User Study

Participant website for the DARCOL aspect-ratio study. It is a static site
(GitHub Pages); no build step.

- **Part 1 · Static path matching:** 16 questions using eight graphs, once
  per method, with 50 seconds to answer. Both methods use the same four path
  nodes and nominal aspect-ratio transition.
- **Part 2 · Animation recovery:** ten questions using the same five graphs
  with both DARCOL modes: optimizer iterations and highlighted curved playback
  after computation. Six seconds to memorize, six seconds of playback and
  40 seconds to answer. Mode order is counterbalanced.
- **Part 3 · Animation preferences:** five other graphs, each shown as two
  looping videos side by side. ARCOL uses linear interpolation between its
  computed endpoints; DARCOL uses the GUI highlighted curved trajectory.
  Side assignment and comparison order vary. One five-point rating asks for overall preference.

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

Revision v8 reduces Part 1 to eight graphs shown with both methods (16
trials). Four consecutive vertices are taken from the middle of each
previously frozen six-node path, identically in the paired conditions.
Part 3 asks only one overall preference question per comparison. Earlier
protocol data retain their original targets and questions.