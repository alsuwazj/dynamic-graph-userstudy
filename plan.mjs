// Builds the participant's sequence of screens and scores answers.

/** Small deterministic PRNG so a session's order can be rebuilt from its seed. */
export function random(seed) {
  let n = seed >>> 0;
  return () => {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    return n / 4294967296;
  };
}

export function shuffle(items, rng) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Shuffle the graphs for one block so that graphs sharing a start drawing
 * (same family) are never back to back, and the block does not open with the
 * graph that closed the previous block. Falls back to a plain shuffle if the
 * graph list makes that impossible.
 */
function orderGraphs(config, rng, previous) {
  const family = id => config.graphFamilies?.[id] ?? id;
  let order;
  for (let attempt = 0; attempt < 500; attempt++) {
    order = shuffle(config.graphs, rng);
    const clash = order.some((g, i) => i > 0 && family(g) === family(order[i - 1]));
    if (!clash && order[0] !== previous) return order;
  }
  return order;
}

/**
 * Part 1: one block per method in config order (ARCOL, then DARCOL).
 * Part 2: the two conditions as blocks, their order alternating by seed
 * parity (counterbalanced across participants).
 * Inside every block the graph order is shuffled (see orderGraphs).
 */
export function buildScreens(config, seed) {
  const rng = random(seed);
  const screens = [{ type: 'part1-intro' }];
  let last = null;
  const block = () => {
    const order = orderGraphs(config, rng, last);
    last = order[order.length - 1];
    return order;
  };
  for (const method of config.part1.methodOrder) {
    for (const graph of block()) {
      screens.push({ type: 'part1', method, graph, target: config.part1.targets[graph] });
    }
  }
  screens.push({ type: 'part2-intro' });
  const conditions = Object.keys(config.part2.conditions);
  const conditionOrder = seed % 2 ? [...conditions].reverse() : conditions;
  for (const condition of conditionOrder) {
    screens.push({ type: 'condition-intro', condition });
    for (const graph of block()) {
      screens.push({
        type: 'part2',
        method: config.part2.method,
        condition,
        graph,
        target: config.part2.conditions[condition].targets[graph],
      });
    }
  }
  screens.push({ type: 'finish' });
  return { screens, conditionOrder };
}

/** Exact-set correctness plus precision / recall / F1 against the target. */
export function score(selected, target) {
  const chosen = new Set(selected);
  const wanted = new Set(target);
  const hits = [...chosen].filter(id => wanted.has(id)).length;
  const precision = chosen.size ? hits / chosen.size : 0;
  const recall = wanted.size ? hits / wanted.size : 0;
  return {
    correct: chosen.size === wanted.size && hits === wanted.size,
    hits,
    precision,
    recall,
    f1: chosen.size + wanted.size ? (2 * hits) / (chosen.size + wanted.size) : 0,
  };
}
