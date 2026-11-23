# Two-part graph study: Rome stimulus set v2

The participant site contains 40 questions using 20 distinct source graphs
from the Rome evaluation corpus. Selection is reproducible from
`selection-provenance.json`; it does not rank graphs by a DARCOL advantage.
These are a controlled pilot stimulus set, not a random sample of the entire
corpus or a demonstration that DARCOL improves recovery accuracy.

Drawings and videos use a shared neutral medium-dark gray presentation filter
(approximately #737373 node interiors), removing node identity cues from the
source palettes. Target outlines and selection overlays remain red. Node
fill colors stay constant before, during and after playback; memorization
context is not faded. Original screenshots and videos are preserved.

## Part 1: static matching (20 questions)

Ten graphs each appear once with ARCOL and once with DARCOL. Both drawings
within a question come from the same method, at two distinct destination
aspect ratios in the existing evaluation. Each graph has the same six-node
shortest-path target (five edges) and nominal AR transition for both methods. Source and
destination layouts need not have identical coordinates across methods.

The method block order varies with the session seed. Graph order is shuffled
within blocks, with no repeated graph at the block boundary. Matched repeats
are separated by other questions. The answer deadline is 40 seconds.

The archived layouts are rendered with the current GraphCanvas. Their saved
positions and routes are retained; no new optimizer is substituted for these
recorded static endpoints. Nominal target ratios and achieved geometry are
different quantities; the eligibility rule checks both methods' recorded
node-spread error (at most 25%).

## Part 2: animated tracking (20 questions)

Ten different graphs each appear in two DARCOL-only animation conditions:
`rotation` (tree turns and core corner moves) and `landmarks_precomputed`
(the layout is computed first, then the GUI's curved landmark motion is
played). The identical six-node path is targeted in both conditions. Both
movies share exactly the same starting and final drawing from one optimizer
run with tree rotation and corner shift enabled. This is a comparison of
DARCOL animation modes, not an animated ARCOL versus DARCOL comparison.

For each question, targets are highlighted for six seconds, then removed
before the animation. Both movies have a six-second presentation duration.
Participants have 25 seconds after the movie to select the remembered nodes.
The rotation movie contains accepted current-optimizer snapshots rendered
through GraphCanvas, in order. The computed-first movie uses the GUI's
EndpointMotion implementation between the same exact endpoints. Both are
sampled to 180 frames at 30 fps; solver wall time is excluded, and these are
not real-time optimizer recordings. Part 2 starts from the recorded
original HOLA input, whereas Part 1 compares recorded resized endpoints.

Condition order uses a separate seed bit from Part 1 method order. Graphs are
shuffled inside conditions. The ten Part 2 graphs are not used in Part 1.

## Recording and timing

Exact-set accuracy, precision, recall, F1, selections, graph, method,
condition, source/destination AR information, response time, timeout,
interruption and window/tab flags are recorded. Part 2 additionally records
memorization, animation and total trial durations separately. Response time
starts only when the final selectable drawing is displayed; it excludes
memorization, video playback and media loading. Technical failures are
distinguished from incorrect answers.

The maximum timed task duration is 25.7 minutes, excluding participant-paced
instructions and readiness screens. The intended session duration is about
25–30 minutes; pilot timing and accuracy must validate this estimate.

All Part 2 final GUI route skeletons are audited for complete coverage,
node overlaps, edge–node conflicts and nonorthogonal segments. Input files
are read-only and their SHA-256 hashes are recorded. Selection criteria,
paths and target sets should be frozen before confirmatory recruitment.
The consent/contact/ethics page still requires the investigator's approved
text before recruitment.

## Landmark presentation correction (2026-11-23)

Landmarks, layout computed first uses the native GUI MotionHighlight colors
during playback: nodes with large motion unexplained by the overall resize
are blue; remaining nodes and edges are pale gray. Hanging structures use
the GUI grouped highlighting rule. The GUI movement threshold and relative
median threshold are unchanged. This is independent of the memorized targets.
The initial and final response drawings remain dark gray, and the other
animation condition remains dark gray. Both movies retain six-second duration.
The landmark movie bypasses the website grayscale filter.

All forty questions use exactly six distinct consecutive vertices on one
shortest path. Part 2 uses identical six-node targets in both animation
conditions. Protocol version two-part-rome-six-node-v5 separates these
responses from earlier four-node animation trials.
