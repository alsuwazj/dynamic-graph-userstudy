// Participant flow for the two-part DARCOL study.
//
//   welcome → consent → Part 1 (static matching, ARCOL then DARCOL)
//           → Part 2 (memorize → animation → select, two conditions) → thank you
//
// Answers are uploaded to the results service after every question
// (response-service.json). Add ?local to the URL to test without uploading;
// responses can then be downloaded on the last page.

import { loadResponseService, allocateResponse, sendResponse } from './response-service.mjs';
import { cropBox, drawingSvg, bindSelection, clearSelection, fitVideo } from './graph-view.mjs';
import { buildScreens, score } from './plan.mjs?v=two-part-rome-v2';

const $ = selector => document.querySelector(selector);
const main = $('#main');
const STORAGE_KEY = 'darcol-two-part-session';
const localMode = new URLSearchParams(location.search).has('local');

let config;
let graphs;            // graphId -> { name, targetAspect, edges, initial, arcol, darcol, video, videoDurationMs }
let service = null;    // results service origin, or null when not uploading
let session = null;
let screens = [];
let activeTrial = null; // { flags, cleanup } while a question is on screen

const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nowIso = () => new Date().toISOString();

// ---------------------------------------------------------------- saving

let uploadQueue = Promise.resolve();
let pendingSnapshot = null;
let uploading = false;

function setStatus(text) { $('#save-status').textContent = text; }

function save() {
  if (!session) return;
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session)); } catch { /* storage is optional */ }
  if (!service) { setStatus(localMode ? 'Test mode · responses are not uploaded' : ''); return; }
  pendingSnapshot = structuredClone(session);
  setStatus('Saving responses…');
  if (uploading) return;
  uploading = true;
  uploadQueue = (async () => {
    try {
      while (pendingSnapshot) {
        const snapshot = pendingSnapshot;
        pendingSnapshot = null;
        try {
          await sendResponse(service, snapshot);
          session.uploadFailed = false;
          setStatus('Responses saved');
        } catch {
          session.uploadFailed = true;
          try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session)); } catch { /* offer download */ }
          setStatus('Saving failed · your answers are kept in this tab');
        }
      }
    } finally {
      uploading = false;
    }
  })();
}

function logEvent(type, extra = {}) {
  if (!session) return;
  session.events.push({ type, at: nowIso(), ...extra });
}

function downloadJson(data, name) {
  const copy = structuredClone(data);
  delete copy.token;
  const url = URL.createObjectURL(new Blob([JSON.stringify(copy, null, 2)], { type: 'application/json' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

// ---------------------------------------------------------------- start-up

async function boot() {
  try {
    config = await (await fetch('study-config.json', { cache: 'no-store' })).json();
    const stimuli = await (await fetch('stimuli.json', { cache: 'no-store' })).json();
    graphs = {};
    for (const item of stimuli.items) {
      if (graphs[item.graphId]) continue;
      const o = item.original;
      graphs[item.graphId] = {
        name: item.graphName,
        targetAspect: item.targetAspect,
        edges: item.edges,
        initial: o.initial,
        arcolInitial: o.initialA || o.initial,
        darcolInitial: o.initialB || o.initial,
        sourceAspectTag: item.sourceAspectTag,
        arcol: o.finalA,
        darcol: o.finalB,
        video: o.video,
        videoDurationMs: o.videoDurationMs,
        videos: o.videos || {},
      };
    }
    const missing = config.graphs.filter(id => !graphs[id]);
    if (missing.length) throw Error(`Missing graph data for: ${missing.join(', ')}`);
    service = localMode ? null : await loadResponseService();
    if (localMode) document.body.classList.add('test-mode');

    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && saved.version === config.version && saved.status === 'active') {
      session = saved;
      screens = buildScreens(config, session.seed).screens;
      resume();
    } else if (saved && saved.version === config.version && saved.uploadFailed) {
      session = saved;
      screens = buildScreens(config, session.seed).screens;
      await finish(saved.status);
    } else {
      welcome();
    }
  } catch (error) {
    main.innerHTML = `<div class="notice error">The study could not start: ${escapeHtml(error.message)}</div>`;
  }
}

// ---------------------------------------------------------------- intro screens

function welcome() {
  document.body.classList.add('welcome-only');
  main.innerHTML = `
    <div class="narrow">
      <h1>Graph layout study</h1>
      ${config.placeholderNotice ? `<div class="notice">${escapeHtml(config.placeholderNotice)}</div>` : ''}
      <h2>What you’ll do</h2>
      <p><strong>Part 1 · Match a path (20 questions).</strong> Two drawings of the same graph, produced by the same method, appear at different aspect ratios. Select the ${config.part1.targetCount || 4} nodes on the right that match the highlighted path on the left.</p>
      <p><strong>Part 2 · Track nodes (20 questions).</strong> Each of ten graphs appears with two animation styles. Memorize four highlighted nodes for ${config.timing.part2MemorizeMs / 1000} seconds. The highlights disappear before the animation starts. Select the same nodes in the final drawing.</p>
      <p><strong>Time:</strong> about 25–30 minutes, including instructions.</p>
      <h2>Good to know</h2>
      <ul>
        <li>Use a laptop or desktop and keep the browser window the same size throughout.</li>
        <li>Click a node to select it; click it again to deselect it.</li>
        <li>We record your selections and response times under a random session ID. We do not ask for your name or email.</li>
      </ul>
      <button class="primary" id="begin">Start</button>
    </div>`;
  $('#begin').onclick = consent;
}

function consent() {
  document.body.classList.remove('welcome-only');
  main.innerHTML = `
    <div class="narrow">
      <h1>Before you begin</h1>
      <div class="panel">
        <p class="help">Consent text, investigator contact and ethics details go here before recruitment.</p>
        <label class="check"><input type="checkbox" id="adult"> <span>I confirm that I am 18 or older.</span></label>
        <label class="check"><input type="checkbox" id="agree"> <span>I have read the information above and agree to take part.</span></label>
      </div>
      <div class="action-row">
        <button class="text-button" id="back">← Back</button>
        <button class="primary" id="consent-next" disabled>Continue</button>
      </div>
      <p class="help" id="consent-error"></p>
    </div>`;
  const wideEnough = () => innerWidth >= config.minWindowWidth;
  const ready = () => { $('#consent-next').disabled = !($('#adult').checked && $('#agree').checked && wideEnough()); };
  $('#adult').onchange = ready;
  $('#agree').onchange = ready;
  $('#back').onclick = welcome;
  if (!wideEnough()) $('#consent-error').textContent = `Please use a browser window at least ${config.minWindowWidth} pixels wide.`;
  $('#consent-next').onclick = async () => {
    $('#consent-next').disabled = true;
    $('#consent-error').textContent = '';
    try {
      await startSession();
      next();
    } catch (error) {
      $('#consent-error').textContent = error.message;
      ready();
    }
  };
}

async function startSession() {
  let allocation = null;
  if (service) {
    try { allocation = await allocateResponse(service, config.version); }
    catch { throw Error('The response server is unavailable. Please try again later.'); }
  }
  const seed = allocation?.seed ?? crypto.getRandomValues(new Uint32Array(1))[0];
  const built = buildScreens(config, seed);
  screens = built.screens;
  session = {
    ...(allocation || {}),
    id: allocation?.id || `local-${crypto.randomUUID()}`,
    version: config.version,
    design: 'darcol-two-part',
    test: localMode,
    status: 'active',
    seed,
    conditionOrder: built.conditionOrder,
    methodOrder: built.methodOrder,
    startedAt: nowIso(),
    consentAt: nowIso(),
    viewport: { width: innerWidth, height: innerHeight, pixelRatio: devicePixelRatio },
    position: -1,
    answers: [],
    events: [],
  };
  logEvent('session_start');
  save();
}

/** Continue after a reload: a question that was on screen is recorded as interrupted. */
function resume() {
  document.body.classList.remove('welcome-only');
  const screen = screens[session.position];
  const isQuestion = screen && (screen.type === 'part1' || screen.type === 'part2');
  if (isQuestion && !session.answers.some(a => a.position === session.position)) {
    session.answers.push({ ...describe(screen), position: session.position, interrupted: true, reason: 'page reloaded', selected: [], correct: null, f1: null });
    logEvent('trial_interrupted', { position: session.position, reason: 'page reloaded' });
  }
  // Intro screens are simply shown again; questions move on to the next screen.
  if (!isQuestion) session.position -= 1;
  next();
}

function next() {
  activeTrial?.cleanup();
  activeTrial = null;
  session.position += 1;
  save();
  const screen = screens[session.position];
  window.scrollTo(0, 0);
  switch (screen.type) {
    case 'part1-intro': return partIntro(1);
    case 'part2-intro': return partIntro(2);
    case 'condition-intro': return conditionIntro(screen);
    case 'part1': return part1Question(screen);
    case 'part2': return part2Question(screen);
    case 'finish': return finish('complete');
  }
}

function questionNumber(part) {
  const list = screens.filter(s => s.type === `part${part}`);
  const index = screens.slice(0, session.position + 1).filter(s => s.type === `part${part}`).length;
  return { index, total: list.length };
}

function partIntro(part) {
  const text = part === 1 ? config.part1 : config.part2;
  const total = questionNumber(part).total;
  main.innerHTML = `
    <div class="narrow">
      <p class="eyebrow">PART ${part} OF 2</p>
      <h1>${escapeHtml(text.title.replace(/^Part \d · /, ''))}</h1>
      <p class="lead">${escapeHtml(text.instruction)}</p>
      <p class="help">${total} questions${part === 1 ? `. You have ${config.timing.part1ResponseMs / 1000} seconds for each.` : `. You have ${config.timing.part2MemorizeMs / 1000} seconds to memorize and ${config.timing.part2ResponseMs / 1000} seconds to answer.`}</p>
      <button class="primary" id="go">Start Part ${part}</button>
    </div>`;
  $('#go').onclick = next;
}

function conditionIntro(screen) {
  const condition = config.part2.conditions[screen.condition];
  const blocks = screens.filter(s => s.type === 'condition-intro');
  const n = blocks.indexOf(screen) + 1;
  main.innerHTML = `
    <div class="narrow">
      <p class="eyebrow">PART 2 · SECTION ${n} OF ${blocks.length}</p>
      <h1>Track the highlighted nodes</h1>
      <p class="lead">${escapeHtml(condition.intro)}</p>
      <button class="primary" id="go">Continue</button>
    </div>`;
  $('#go').onclick = next;
}

// ---------------------------------------------------------------- shared question helpers

function describe(screen) {
  const graph = graphs[screen.graph];
  return {
    part: screen.type === 'part1' ? 1 : 2,
    method: screen.method,
    condition: screen.condition ?? null,
    animationMode: screen.type === 'part2' ? (config.part2.conditions[screen.condition].animationMode || null) : null,
    graph: screen.graph,
    graphName: graph.name,
    targetAspect: graph.targetAspect,
    sourceAspectTag: graph.sourceAspectTag,
    target: [...screen.target],
  };
}

function preload(urls) {
  return Promise.all(urls.map(url => { const img = new Image(); img.src = url; return img.decode(); }));
}

function withTimeout(promise, ms, message) {
  let timer;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise((_, reject) => { timer = setTimeout(() => reject(Error(message)), ms); }),
  ]);
}

/** Track tab switches and window resizes while a question is open. */
function watchTrial() {
  const flags = { tabHidden: false, resized: false };
  const onVisibility = () => { if (document.hidden) { flags.tabHidden = true; logEvent('tab_hidden', { position: session.position }); } };
  let resizeTimer;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { flags.resized = true; logEvent('window_resized', { position: session.position, width: innerWidth, height: innerHeight }); }, 150);
  };
  document.addEventListener('visibilitychange', onVisibility);
  addEventListener('resize', onResize);
  const timers = new Set();
  activeTrial = {
    flags,
    timers,
    cleanup() {
      document.removeEventListener('visibilitychange', onVisibility);
      removeEventListener('resize', onResize);
      clearTimeout(resizeTimer);
      for (const t of timers) { clearInterval(t); clearTimeout(t); }
      document.querySelector('#trial-video')?.pause();
    },
  };
  return activeTrial;
}

/** Countdown shown in `el`; calls onDone when it reaches zero. */
function countdown(trial, el, ms, format, onDone) {
  const start = performance.now();
  const tick = () => {
    const left = ms - (performance.now() - start);
    el.textContent = format(Math.max(0, Math.ceil(left / 1000)));
    if (left <= 0) { clearInterval(timer); onDone(); }
  };
  const timer = setInterval(tick, 100);
  trial.timers.add(timer);
  tick();
  return () => clearInterval(timer);
}

function selectionLabel(selected) {
  return `${selected.size} node${selected.size === 1 ? '' : 's'} selected · click again to deselect`;
}

function recordAnswer(screen, selected, extra) {
  const answer = {
    ...describe(screen),
    position: session.position,
    questionIndex: questionNumber(screen.type === 'part1' ? 1 : 2).index,
    selected: [...selected],
    ...score([...selected], screen.target),
    ...activeTrial.flags,
    answeredAt: nowIso(),
    ...extra,
  };
  session.answers.push(answer);
  logEvent('answer', { position: session.position });
  save();
}

function technicalProblem(screen, reason) {
  activeTrial?.cleanup();
  session.answers.push({ ...describe(screen), position: session.position, technicalInvalid: true, reason, selected: [], correct: null, f1: null });
  logEvent('technical_invalid', { position: session.position, reason });
  save();
  $('#stage-area').innerHTML = `<div class="stage-message"><h3>This question could not be shown.</h3><p>${escapeHtml(reason)} It will be skipped.</p><button class="primary" id="skip">Continue</button></div>`;
  $('#skip').onclick = next;
}

// ---------------------------------------------------------------- Part 1

async function part1Question(screen) {
  const graph = graphs[screen.graph];
  const before = screen.method === 'ARCOL' ? graph.arcolInitial : graph.darcolInitial;
  const after = screen.method === 'ARCOL' ? graph.arcol : graph.darcol;
  const { index, total } = questionNumber(1);
  const selected = new Set();
  main.innerHTML = `
    <div class="progress"><div style="width:${((index - 1) / total) * 100}%"></div></div>
    <p class="eyebrow">PART 1 · QUESTION ${index} OF ${total}</p>
    <h2>${escapeHtml(config.part1.instruction)}</h2>
    <div id="stage-area">
      <div class="pair">
        <section class="drawing-card"><header><span>First aspect ratio</span></header><div class="stage" id="before"></div></section>
        <section class="drawing-card"><header><span>Other aspect ratio</span><span class="timer" id="clock"></span></header><div class="stage" id="after"></div></section>
      </div>
      <div class="answer-bar">
        <p id="selection-label">Loading…</p>
        <div class="answer-actions"><button class="text-button" id="clear">Clear selection</button><button class="primary" id="submit" disabled>Submit answer</button></div>
      </div>
    </div>`;
  const trial = watchTrial();
  try {
    await withTimeout(preload([before.url, after.url]), 15000, 'The drawings did not load.');
  } catch (error) {
    return technicalProblem(screen, error.message);
  }
  if (activeTrial !== trial) return;
  $('#before').innerHTML = drawingSvg(before, { highlight: screen.target, label: 'Same method at the first aspect ratio, with a highlighted path' });
  $('#after').innerHTML = drawingSvg(after, { selectable: true, selected, label: 'Drawing after the change: select the matching nodes' });
  const label = $('#selection-label');
  label.textContent = selectionLabel(selected);
  bindSelection($('#after'), selected, () => { label.textContent = selectionLabel(selected); });
  $('#clear').onclick = () => { clearSelection($('#after'), selected); label.textContent = selectionLabel(selected); };

  const shown = performance.now();
  const shownAt = nowIso();
  let done = false;
  const submit = timeout => {
    if (done) return;
    done = true;
    recordAnswer(screen, selected, { timeout, responseMs: performance.now() - shown, shownAt });
    next();
  };
  $('#submit').disabled = false;
  $('#submit').onclick = () => submit(false);
  countdown(trial, $('#clock'), config.timing.part1ResponseMs, s => `${s}s left`, () => submit(true));
}

// ---------------------------------------------------------------- Part 2

async function part2Question(screen) {
  const graph = graphs[screen.graph];
  const movie = graph.videos[screen.condition] || {url:graph.video,durationMs:graph.videoDurationMs};
  const { index, total } = questionNumber(2);
  const box = cropBox([graph.initial, graph.darcol]);
  const selected = new Set();
  main.innerHTML = `
    <div class="progress"><div style="width:${((index - 1) / total) * 100}%"></div></div>
    <p class="eyebrow">PART 2 · QUESTION ${index} OF ${total}</p>
    <h2>${escapeHtml(config.part2.instruction)}</h2>
    <div id="stage-area">
      <section class="drawing-card single">
        <header><span id="phase">Get ready</span><span class="timer" id="clock"></span></header>
        <div class="stage tall" id="stage"><div class="stage-message"><p>Loading…</p></div></div>
      </section>
      <div class="answer-bar">
        <p id="selection-label"></p>
        <div class="answer-actions"><button class="text-button" id="clear" hidden>Clear selection</button><button class="primary" id="submit" disabled>Start</button></div>
      </div>
    </div>`;
  const trial = watchTrial();
  const stage = $('#stage');

  const video = document.createElement('video');
  Object.assign(video, { id: 'trial-video', muted: true, playsInline: true, preload: 'auto', controls: false, disablePictureInPicture: true });
  video.className = 'stage-video';
  const videoReady = new Promise((resolve, reject) => {
    video.addEventListener('canplaythrough', resolve, { once: true });
    video.addEventListener('error', () => reject(Error('The animation could not be loaded.')), { once: true });
  });
  video.src = movie.url;
  video.load();

  try {
    await withTimeout(Promise.all([preload([graph.initial.url, graph.darcol.url]), videoReady]), 20000, 'The question files did not load.');
  } catch (error) {
    return technicalProblem(screen, error.message);
  }
  if (activeTrial !== trial) return;

  // Ready step: participant starts the question when they are ready.
  stage.innerHTML = `<div class="stage-message"><p>Press <strong>Start</strong> when you are ready. The highlighted nodes will be shown for ${config.timing.part2MemorizeMs / 1000} seconds.</p></div>`;
  $('#submit').disabled = false;
  $('#submit').onclick = memorize;

  const times = {};

  function memorize() {
    $('#submit').disabled = true;
    $('#submit').textContent = 'Submit answer';
    $('#phase').textContent = 'Memorize the highlighted nodes';
    stage.innerHTML = drawingSvg(graph.initial, { box, highlight: screen.target, edges: graph.edges, label: 'Graph with highlighted nodes to memorize' });
    times.memorizeStart = performance.now();
    times.startedAt = nowIso();
    countdown(trial, $('#clock'), config.timing.part2MemorizeMs, s => `${s}s`, animate);
  }

  function animate() {
    $('#phase').textContent = 'Watch the transition';
    $('#clock').textContent = '';
    stage.innerHTML = '';
    stage.append(video);
    const place = () => fitVideo(stage, video, graph.initial.viewBox, box);
    place();
    const observer = new ResizeObserver(place);
    observer.observe(stage);
    const previousCleanup = trial.cleanup;
    trial.cleanup = () => { observer.disconnect(); previousCleanup(); };

    times.animationStart = performance.now();
    let finished = false;
    const end = () => {
      if (finished) return;
      finished = true;
      times.animationEnd = performance.now();
      observer.disconnect();
      respond();
    };
    video.onended = end;
    // Safety net in case `ended` never fires.
    trial.timers.add(setTimeout(end, (movie.durationMs || 1500) + 3000));
    video.currentTime = 0;
    video.play().catch(() => technicalProblem(screen, 'The animation could not be played.'));
  }

  function respond() {
    $('#phase').textContent = 'Select the same nodes';
    stage.innerHTML = drawingSvg(graph.darcol, { box, selectable: true, selected, label: 'Final drawing: select the nodes you memorized' });
    const label = $('#selection-label');
    label.textContent = selectionLabel(selected);
    bindSelection(stage, selected, () => { label.textContent = selectionLabel(selected); });
    $('#clear').hidden = false;
    $('#clear').onclick = () => { clearSelection(stage, selected); label.textContent = selectionLabel(selected); };
    times.responseStart = performance.now();
    let done = false;
    const submit = timeout => {
      if (done) return;
      done = true;
      const t = performance.now();
      recordAnswer(screen, selected, {
        timeout,
        responseMs: t - times.responseStart,
        memorizeMs: times.animationStart - times.memorizeStart,
        animationMs: times.animationEnd - times.animationStart,
        totalMs: t - times.memorizeStart,
        shownAt: times.startedAt,
      });
      next();
    };
    $('#submit').disabled = false;
    $('#submit').onclick = () => submit(false);
    countdown(trial, $('#clock'), config.timing.part2ResponseMs, s => `${s}s left`, () => submit(true));
  }
}

// ---------------------------------------------------------------- end

async function finish(status) {
  activeTrial?.cleanup();
  activeTrial = null;
  session.status = status;
  session.finishedAt = nowIso();
  logEvent('session_end', { status });
  save();
  $('#withdraw').hidden = true;
  await uploadQueue;
  const failed = service && session.uploadFailed;
  if (!failed) sessionStorage.removeItem(STORAGE_KEY);
  else try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session)); } catch { /* offer download */ }
  main.innerHTML = `
    <div class="narrow">
      <h1>Thank you for taking part.</h1>
      <p class="lead">${status === 'complete' ? 'Your responses help us understand how people follow graphs that change shape.' : 'Your session has ended and your answers so far have been saved.'}</p>
      ${failed ? '<div class="notice error">Some responses have not been saved online. Keep this tab open and try saving again, or download your response file.</div><button class="primary" id="retry-save">Try saving again</button>' : ''}
      ${!service ? '<div class="notice">Test mode: responses were not uploaded.</div>' : ''}
      ${failed || !service ? '<button class="secondary" id="download">Download responses</button>' : ''}
      <p class="help">Session code: <strong>${escapeHtml(session.id.replace(/^local-/, '').slice(0, 8))}</strong></p>
    </div>`;
  $('#download')?.addEventListener('click', () => downloadJson(session, `darcol-study-${session.id}.json`));
  $('#retry-save')?.addEventListener('click', () => finish(status));
}

$('#withdraw').onclick = () => {
  if (session?.status === 'active' && confirm('End this session? Your answers so far will be saved as incomplete.')) finish('withdrawn');
};

const observeSession = () => { $('#withdraw').hidden = !(session && session.status === 'active'); };
setInterval(observeSession, 500);

boot();
