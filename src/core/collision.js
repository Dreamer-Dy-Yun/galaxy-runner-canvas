// Galaxy Runner - collision helpers
// Keeps visible size and gameplay hitboxes deliberately separate.

class Collision {
  static circleCircle(ax, ay, ar, bx, by, br) {
    const dx = ax - bx;
    const dy = ay - by;
    const radius = ar + br;
    return dx * dx + dy * dy < radius * radius;
  }

  static circleEllipse(cx, cy, cr, ex, ey, erx, ery) {
    const rx = erx + cr;
    const ry = ery + cr;
    const nx = (cx - ex) / rx;
    const ny = (cy - ey) / ry;
    return nx * nx + ny * ny <= 1;
  }
}
