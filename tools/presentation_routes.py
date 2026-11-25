"""Symmetric, presentation-only route cleanup for frozen study drawings.

Never changes nodes, connectivity, targets, or the archived optimizer routes.
Uses the desktop router's boundary ports, obstacle checks and port spreading.
"""
import numpy as np
from darcol.routing.orthogonal_router import (
    Rect, RouteRecord, route_orthogonal_layout, _compress, _port,
    _side_from_point, _simple_candidates, _valid_route, _bend_count,
    _route_length, _assign_shared_port_offsets, _SegmentIndex,
)


def clean_routes(positions, sizes, pairs, routes):
    positions = np.asarray(positions, float)
    sizes = np.asarray(sizes, float)
    rects = [Rect(*p, *s, 0.) for p, s in zip(positions, sizes)]
    degree = np.bincount(np.asarray(pairs).ravel(), minlength=len(positions))
    records, _ = route_orthogonal_layout(
        positions, sizes, pairs, previous_routes=[np.asarray(r).tolist() for r in routes],
        clearance=0.5, port_separation=6., separate_lines=True)
    removed = 0
    for rec in records:
        old = _compress(rec.points)
        # Preserve the chosen side for core edges. Degree-two chains and their
        # pivot connections may use a simpler, unobstructed side pair.
        ss = _side_from_point(rects[rec.u], old[0]) or rec.source_side
        ts = _side_from_point(rects[rec.v], old[-1]) or rec.target_side
        chain = min(degree[rec.u], degree[rec.v]) <= 2
        side_pairs = [(ss, ts)]
        if chain:
            side_pairs = [(a, b) for a in 'EWNS' for b in 'EWNS']
        candidates = []
        index = _SegmentIndex.for_drawing(rects)
        for other in records:
            index.add(other.points, other.u, other.v, True, None)
        before = index.conflicts(old, rec.u, rec.v, True, None)
        for a, b in side_pairs:
            for points in _simple_candidates(_port(rects[rec.u], a), _port(rects[rec.v], b), a, b, .5):
                points = _compress(points)
                if _valid_route(points, a, b, rects, rec.u, rec.v):
                    after = index.conflicts(points, rec.u, rec.v, True, None)
                    if after[0] <= before[0] and after[1] <= before[1]:
                        candidates.append((points, a, b))
        if candidates:
            points, a, b = min(candidates, key=lambda c: (_bend_count(c[0]), _route_length(c[0]), c[1], c[2]))
            removed += max(0, _bend_count(old)-_bend_count(points))
            rec.points, rec.source_side, rec.target_side = points, a, b
        rec.fan = False
    # All singleton ports are centered above; multi-edge sides are spread in
    # neighbor order with the same deterministic rule in both methods.
    _assign_shared_port_offsets(records, rects, rects, 6., [True]*len(records))
    # An obstacle can require an offset long trunk even when the node has
    # only one port on that side. Center its short local stub, preserving the
    # obstacle-avoiding trunk rather than dragging it through another node.
    entries = {}
    for rec in records:
        entries.setdefault((rec.u, rec.source_side), []).append((rec, True))
        entries.setdefault((rec.v, rec.target_side), []).append((rec, False))
    for (node, side), group in entries.items():
        coordinate = 1 if side in 'EW' else 0
        current = [rec.points[0 if source else -1] for rec, source in group]
        duplicates = len({tuple(np.round(p, 5)) for p in current}) != len(current)
        if len(group) > 1 and not duplicates:
            continue
        group.sort(key=lambda entry: entry[0].points[-1 if entry[1] else 0][coordinate])
        cap = (rects[node].h if side in 'EW' else rects[node].w)*.5-3.
        step = min(6., 2*cap/max(1,len(group)-1))
        for j,(rec, source) in enumerate(group):
            pts = rec.points if source else list(reversed(rec.points))
            center = _port(rects[node], side, (j-(len(group)-1)*.5)*step)
            if np.linalg.norm(np.asarray(center)-pts[0]) < 1e-5:
                continue
            normal = {'E': (1, 0), 'W': (-1, 0), 'N': (0, -1), 'S': (0, 1)}[side]
            for stub in (2., .5, 4., 8., 12.):
                if np.linalg.norm(np.asarray(pts[1])-pts[0]) <= stub:
                    continue
                a = tuple(np.asarray(center)+np.asarray(normal)*stub)
                b = tuple(np.asarray(pts[0])+np.asarray(normal)*stub)
                trial = _compress([center, a, b]+pts[1:])
                trial = trial if source else list(reversed(trial))
                if _valid_route(trial, rec.source_side, rec.target_side, rects, rec.u, rec.v):
                    rec.points = trial
                    break
    bad = []
    for rec in records:
        rec.points = _compress(rec.points)
        if not _valid_route(rec.points, rec.source_side, rec.target_side, rects, rec.u, rec.v):
            bad.append(rec.edge_index)
    if bad:
        raise ValueError(f'Invalid presentation routes: {bad}')
    groups = {}
    for rec in records:
        groups.setdefault((rec.u, rec.source_side), []).append(rec.points[0])
        groups.setdefault((rec.v, rec.target_side), []).append(rec.points[-1])
    off_center = []
    shared_duplicates = []
    for (node, side), points in groups.items():
        if len(points) == 1 and np.linalg.norm(np.asarray(points[0])-_port(rects[node], side)) > 1e-5:
            off_center.append({'node': int(node), 'side': side})
        if len(points) > 1 and len({tuple(np.round(p, 5)) for p in points}) != len(points):
            shared_duplicates.append({'node': int(node), 'side': side})
    return [rec.points for rec in records], {'removedChainBends': removed, 'edges': len(records),
        'offCenterSingletons': off_center, 'sharedPortDuplicates': shared_duplicates,
        'nodeIntersections': 0, 'nonorthogonalSegments': 0}


def install(canvas, path=None):
    """Install derived sharp routes; GraphCanvas supplies the rounded ink."""
    from types import SimpleNamespace
    if path is not None:
        with np.load(path, allow_pickle=False) as data:
            positions, sizes, pairs = (data[k].copy() for k in ('positions', 'sizes', 'edge_indices'))
            off = data['route_offsets']
            routes = [data['route_points'][a:b].copy() for a, b in zip(off, off[1:])]
        assert [(e.u, e.v) for e in canvas.core_edges] == list(map(tuple, pairs))
        canvas.update_nodes_positions(positions)
    else:
        positions = np.array([(n.cx, n.cy) for n in canvas.core_nodes])
        sizes = np.array([(n.w, n.h) for n in canvas.core_nodes])
        pairs = [(e.u, e.v) for e in canvas.core_edges]
        routes = [e.route for e in canvas.core_edges]
    routes, audit = clean_routes(positions, sizes, pairs, routes)
    for edge, route in zip(canvas.core_edges, routes):
        edge.route = route
        edge._darcol_explicit_route = route
        edge.corner_radii = []
    canvas._input_routes = dict(enumerate(routes))
    canvas._show_input_routes = True
    canvas.orthogonal_mode = True
    canvas._tree_finalized = True
    canvas.layout_run = SimpleNamespace(final_routes=dict(routes=routes, positions=positions.tolist(), report=None),
                                       minimal_embedding=False, safe_tree_finish_report=None)
    canvas._positions_version = getattr(canvas, '_positions_version', 0)+1
    canvas._edge_buffer_version = None
    canvas._study_route_audit = audit
    return audit
