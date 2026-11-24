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


## Version 12: faster Part 3 playback
Both ARCOL and DARCOL preference movies now last three seconds (180 frames at 60 fps), matching the faster three-second Part 2 playback. Their paired durations remain equal. All task timers and order rules are unchanged.


## Version 13: strong Part 2 resizes and mixed highlighting trials
Five fixed transitions from recorded DARCOL endpoint layouts: grafo445.22 1:1 to 1:3; grafo11548.35 1:1 to 32:9; grafo2519.37 32:9 to 1:3; grafo7570.40 1:3 to 32:9; grafo2869.37 1:1 to 1:3. These are nominal target ARs; realized geometry may differ. Both styles share exact endpoint images, linear motion, three-second duration and target nodes. Endpoint source paths/hashes are recorded with assets.

Part 2 has one ten-trial mixed sequence, no condition-intro screens. Seeded constrained Fisher-Yates shuffles all graph/condition pairs together. Reject orders with fewer than two intervening trials between the same graph or four consecutive trials of one condition. The first condition varies with seed bit 1. Each graph appears once per style; condition remains stored with each answer, without identifying subsections to the participant. Legacy configurations retain their original blocked order for resume/upload compatibility.


## Version 14: mixed Part 1 methods
All 18 Part 1 graph/method pairs are shuffled together using the participant seed, with nine trials per method. Reject adjacent repeated graph families and runs of four identical methods. The first method varies with seed parity. Each of the nine graphs still appears once per method, with identical paired target nodes and endpoints. Earlier protocol versions retain their original order for resume/upload compatibility. Parts 2 and 3 are unchanged.


## Version 15: structural landmarks in Part 3 DARCOL only
DARCOL preference movies highlight fixed structural landmarks (degree >=3 or core tree attachment) in blue, with pale context during motion. ARCOL preference movies remain unhighlighted. This is a system-level preference comparison: animation and highlighting differ together. Both retain three-second duration and existing computed endpoints. Mixed Part 1 and Part 2 orders remain unchanged.


## Version 16: Wien and Sydney throughout
Only Evaluation/Real_HOLA/wien-kurz_AR.svg and sydney_AR.svg are used; preserve their recorded SHA256 hashes and all source drawings. Four resize cases per source graph support 16 static trials (eight cases x two methods). Four cases support eight animated recovery trials (four x two highlight styles); four paired preference comparisons complete the 28-trial flow. Source-graph families alternate across the entire study, while transformation cases and methods/conditions are shuffled within that constraint. This replaces the earlier 19-graph pool with a two-graph illustrative study. Each source graph appears repeatedly under different transformations. Targets are four consecutive vertices inside attached trees, frozen from topology and reused identically across matched conditions. All animations remain three seconds; memory six seconds; response caps 50/40 seconds.


## Version 17: restore the previous pool and ADD Wien/Sydney
Restores every graph and assignment from version 15 (commit 8194ae9). Adds Wien and Sydney to each part, using the captured original-HOLA real-benchmark endpoints and clips. Part 1: 11 cases x two methods = 22 trials; Part 2: seven cases x two styles = 14 trials; Part 3: seven comparisons. Total 43 trials; all 19 earlier source graphs remain, plus two real graphs. Mixed methods/highlighting order remains; source families never appear consecutively. Three-second animations and 50/40-second response caps remain. Full timeout use can exceed 30 minutes, so the welcome page no longer promises an upper bound of 25 minutes. Version 16 is preserved only as history, not the current pool.


## Version 18: split the real-graph additions
All original version-15 graphs remain. Add Wien square-to-tall only to Part 1 and Sydney wide-to-tall only to Part 2. Part 3 keeps its original five comparisons unchanged. Counts are now 20 static trials, 12 animated recovery trials, and five preference comparisons (37 total). The real-graph additions are disjoint between parts. Mixed order, targets, highlights and timers otherwise remain unchanged.


## Version 19: central Wien targets
Wien Part 1 uses consecutive core nodes 11, 51, 50, 49 instead of the outer-tree target. The path is selected for centrality and junction context in the original HOLA topology, independently of method outcomes. ARCOL and DARCOL share the exact target IDs. All other cases, timing and order rules remain unchanged.


## Version 20: remove Sydney
Sydney is removed from the active study due to graph size. All original graphs remain, and Wien stays only in Part 1 with central target nodes 11, 51, 50, 49. Counts: 20 static trials, ten animated recovery trials on five original graphs, five preference comparisons. Three-second clips, mixed order and response timers remain unchanged. Previous sessions retain their original version.
