// Draws one graph drawing (a screenshot plus per-node click areas) as SVG.
//
// Each drawing asset from stimuli.json looks like
//   { url, viewBox: [x, y, w, h], hitboxes: [{ id, x, y, width, height }] }
// where hitbox coordinates are in the image's own pixel space.

let uid = 0;

/** Bounding box of the nodes (optionally of several drawings), with padding. */
export function cropBox(assets, pad = 36) {
  const boxes = assets.flatMap(asset => asset.hitboxes);
  const x0 = Math.min(...boxes.map(b => b.x)) - pad;
  const y0 = Math.min(...boxes.map(b => b.y)) - pad;
  const x1 = Math.max(...boxes.map(b => b.x + b.width)) + pad;
  const y1 = Math.max(...boxes.map(b => b.y + b.height)) + pad;
  return [x0, y0, x1 - x0, y1 - y0];
}

const centre = b => [b.x + b.width / 2, b.y + b.height / 2];

/**
 * options:
 *   box         crop box [x, y, w, h] (defaults to the drawing's own nodes)
 *   highlight   node ids drawn with the highlight outline
 *   fadeContext draw everything except the highlighted nodes (and edges
 *               between them) in very light grey
 *   edges       [[u, v], ...] used to keep edges between highlighted nodes visible
 *   selectable  add focusable click areas for every node
 *   selected    Set of currently selected node ids
 *   label       accessible label for the drawing
 */
export function drawingSvg(asset, options = {}) {
  const {
    box = cropBox([asset]),
    highlight = [],
    fadeContext = false,
    edges = [],
    selectable = false,
    selected = new Set(),
    label = 'Graph drawing',
  } = options;
  const [ix, iy, iw, ih] = asset.viewBox;
  const image = attrs => `<image href="${asset.url}" x="${ix}" y="${iy}" width="${iw}" height="${ih}" preserveAspectRatio="xMidYMid meet" ${attrs}/>`;
  const byId = new Map(asset.hitboxes.map(b => [b.id, b]));
  const targets = highlight.map(id => byId.get(id)).filter(Boolean);
  const parts = [];

  if (fadeContext) {
    // Draw the whole drawing in grey and wash it out, then paint the targets
    // (and straight edges joining them) back on top in full colour via a mask.
    const id = ++uid;
    const inTarget = new Set(highlight);
    const links = edges
      .filter(([u, v]) => inTarget.has(u) && inTarget.has(v) && byId.has(u) && byId.has(v))
      .map(([u, v]) => [centre(byId.get(u)), centre(byId.get(v))])
      // Only axis-aligned edges: a bent route can't be uncovered by a straight
      // strip without also uncovering neighbouring nodes.
      .filter(([[x1, y1], [x2, y2]]) => Math.abs(x1 - x2) < 2 || Math.abs(y1 - y2) < 2)
      .map(([[x1, y1], [x2, y2]]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="white" stroke-width="4"/>`);
    const holes = targets.map(b => `<rect x="${b.x - 2}" y="${b.y - 2}" width="${b.width + 4}" height="${b.height + 4}" fill="white"/>`);
    parts.push(
      `<filter id="grey-${id}"><feColorMatrix type="saturate" values="0"/></filter>`,
      image(`filter="url(#grey-${id})"`),
      `<rect class="context-wash" x="${ix}" y="${iy}" width="${iw}" height="${ih}"/>`,
      `<mask id="focus-${id}" maskUnits="userSpaceOnUse" x="${ix}" y="${iy}" width="${iw}" height="${ih}"><rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="black"/>${links.join('')}${holes.join('')}</mask>`,
      image(`mask="url(#focus-${id})"`),
    );
  } else {
    parts.push(image(''));
  }

  // Show the five actual routed edges only with the reference path cue.
  // Never draw these on the response graph or during video playback.
  const path = asset.targetPath;
  if (path && highlight.length === path.nodes.length && path.nodes.every(id => highlight.includes(id))) {
    for (const segment of path.segments) {
      const points = segment.points.map(p => p.join(',')).join(' ');
      parts.push(`<polyline class="path-highlight" points="${points}" aria-hidden="true"/>`);
    }
  }

  for (const b of targets) {
    parts.push(`<rect class="node-highlight" x="${b.x - 4}" y="${b.y - 4}" width="${b.width + 8}" height="${b.height + 8}" rx="3"/>`);
  }

  if (selectable) {
    asset.hitboxes.forEach((b, i) => {
      const on = selected.has(b.id);
      parts.push(
        `<g class="node-choice${on ? ' selected' : ''}" role="checkbox" tabindex="0" aria-checked="${on}" aria-label="Node ${i + 1}" data-id="${b.id}">` +
        `<rect class="node-hit" x="${b.x - 4}" y="${b.y - 4}" width="${b.width + 8}" height="${b.height + 8}" rx="3"/></g>`,
      );
    });
  }

  return `<svg viewBox="${box.join(' ')}" preserveAspectRatio="xMidYMid meet" role="${selectable ? 'group' : 'img'}" aria-label="${label}">${parts.join('')}</svg>`;
}

/** Wire click/keyboard toggling for a selectable drawing inside `root`. */
export function bindSelection(root, selected, onChange) {
  for (const el of root.querySelectorAll('.node-choice')) {
    const toggle = () => {
      const id = Number(el.dataset.id);
      if (selected.has(id)) selected.delete(id); else selected.add(id);
      const on = selected.has(id);
      el.classList.toggle('selected', on);
      el.setAttribute('aria-checked', on);
      onChange();
    };
    el.addEventListener('click', toggle);
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  }
}

/** Clear every selection mark inside `root`. */
export function clearSelection(root, selected) {
  selected.clear();
  for (const el of root.querySelectorAll('.node-choice')) {
    el.classList.remove('selected');
    el.setAttribute('aria-checked', 'false');
  }
}

/**
 * Size and position a video (whose frame matches the image space `frame`)
 * inside `container` so that the crop `box` is shown, matching drawingSvg's
 * "meet" fit. Call again whenever the container resizes.
 */
export function fitVideo(container, video, frame, box) {
  const { width: cw, height: ch } = container.getBoundingClientRect();
  const [fx, fy, fw, fh] = frame;
  const [bx, by, bw, bh] = box;
  const scale = Math.min(cw / bw, ch / bh);
  const left = (cw - bw * scale) / 2 - (bx - fx) * scale;
  const top = (ch - bh * scale) / 2 - (by - fy) * scale;
  Object.assign(video.style, {
    width: `${fw * scale}px`,
    height: `${fh * scale}px`,
    left: `${left}px`,
    top: `${top}px`,
  });
}
