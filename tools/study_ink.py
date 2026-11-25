"""Study-only ink settings, drawn by the native GraphCanvas programs."""
def apply(canvas):
    from vispy import gloo
    if not getattr(canvas, '_study_black_ink', False):
        original_draw = canvas.program_lines.draw
        def draw(*args, **kwargs):
            gloo.set_line_width(2.0)
            return original_draw(*args, **kwargs)
        canvas.program_lines.draw = draw
        canvas._study_black_ink = True
    canvas.node_data['a_linewidth'] = 2.
    canvas.node_data['a_fg_color'] = (0., 0., 0., 1.)
    canvas.node_data['a_bg_color'] = (132/255, 132/255, 130/255, 1.)
