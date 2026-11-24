# Three part graph layout study

Protocol version three-part-four-node-v8.

## Part 1 static matching

Sixteen questions use eight graphs once per method, with 50 seconds to answer.
The same four consecutive path vertices and nominal aspect-ratio transition
are used for ARCOL and DARCOL. The reference highlights those vertices and
their three actual connecting edge routes. Response drawings contain no cue.
Method block order is counterbalanced by seed and graph order is shuffled.

## Part 2 animation recovery

Ten questions use the same five frozen graphs twice, once per DARCOL mode.
The first mode shows accepted optimizer iterations with tree turns and
corner moves. The other computes the final drawing first, then uses the
GUI curved trajectory and highlights large movers blue against pale gray.
Memorization lasts six seconds, video playback six seconds, and answering
allows 40 seconds. Response time excludes memorization, playback and loading.
The same four path targets and identical endpoints are used in both modes.
Condition order uses a separate seed bit; graph order is shuffled, preventing
an immediate repeat across the two blocks.

## Part 3 paired preferences

Five other graphs from the existing frozen Rome pool are shown once each.
Each page plays ARCOL linear interpolation alongside DARCOL highlighted
curved playback. Both videos last six seconds and share the original HOLA
source graph and nominal source and destination aspect ratios. The methods
use their own computed starting and ending layouts; their starting geometry
is not identical. These recordings use saved computed endpoints, rather than
an ARCOL optimization recording. DARCOL uses the GUI EndpointMotion and
MotionHighlight implementations. The source paths and hashes are recorded.

The two videos start together and restart together after both reach the end.
Participants may pause or restart both. At least one complete loop and one
rating is required. Each five-point item ranges from strongly preferring
Animation A through about equal to strongly preferring Animation B. The question asks which animation is preferred overall. Methods are labeled A and B; side assignment is counterbalanced
2/3 within a participant and reversed across seeds. Comparison order is
shuffled. Raw side-based responses and method-normalized values are saved;
positive normalized ratings prefer DARCOL. Rating time includes viewing and
answering, excluding initial media loading. Technical failures are recorded
separately and do not become neutral preference ratings.

## Timing and records

The maximum timed recovery portion is 22 minutes, excluding
instructions and Part 3. The welcome page estimates 25–30 minutes; validate
this with a pilot. Preference comparisons have no fixed response deadline.
Accuracy, F1, selections, timing, timeout and interruption flags are saved for
recovery tasks. Preferences are saved separately and exported as JSON and
CSV. The dashboard shows descriptive recovery and preference summaries.

Earlier protocol versions remain accepted and retain their original targets,
limits and scoring. They must not be pooled silently with this revision.
The consent/contact/ethics placeholder still needs approved text before
recruitment. Graphs and paths were frozen independently of method advantage.

Revision v8 reduces Part 1 to eight graphs shown with both methods (16
trials). Four consecutive vertices are taken from the middle of each
previously frozen six-node path, identically in the paired conditions.
Part 3 asks only one overall preference question per comparison. Earlier
protocol data retain their original targets and questions.


## Version 9: PDF review allocation (24 November 2026)

18 static matching trials (nine graphs x two methods), ten DARCOL recovery trials (five graphs x two existing animation modes), five blinded paired preferences. Part 1: 50 seconds; Part 2: six-second memory, six-second video, then 40 seconds response time. Response timing excludes memory and video. Targets are four consecutive vertices, identical across the paired methods/conditions, filled red inside their symbols without contours or edge overlays. Answer-key highlights from the review PDF are never displayed on participant response drawings.

The pool combines curated favorable gallery cases and user-selected replacements. It is not an outcome-independent or representative sample. See selection-provenance-v9.json. Original inputs and their SHA256 hashes remain recorded. Existing results are preserved under their original protocol versions. Part 2 final drawings come from new actual GUI optimizer runs with tree-turn and corner-move options enabled; the PDF endpoint stills were provisional. Graph and method labels shown in the researcher PDF remain blinded in participant panels.


## Version 10: controlled highlighting comparison

Part 2 compares structural landmarks (degree >=3 or core tree attachment) with GUI residual movement highlights. Both use the same two precomputed endpoint keyframes, linear screen-space interpolation, six-second duration, symbol sizes, edge presentation and four red memorization targets. Blue masks are fixed from the endpoints and faded in/out identically; context is pale gray in both. grafo11548.35 uses destination AR 9:16 because its prior mild resize produced no qualifying residual movement. All five graphs now have non-empty masks in both conditions; no threshold fallback was used.

Each participant sees every graph/method or graph/condition pair. Seeded Fisher-Yates shuffles the graphs inside each block; method block order uses seed bit 0 and condition block order uses bit 1. Block boundaries reject adjacent repeated graph families. Part 3 graph order is shuffled, and left/right assignment is varied by seed bit 2 with a 2/3 within-participant split. The seed and order are recorded so sequences can be reconstructed. This is constrained seeded randomization, not a Latin square.


## Version 11: faster Part 2 playback
Both highlighting conditions play the same trajectories in three seconds (180 frames at 60 fps), replacing six-second playback. Memorization remains six seconds and the response limit remains 40 seconds. Part 3 is unchanged.
