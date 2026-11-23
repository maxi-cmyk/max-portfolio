// Easing shared by the 3D figures, with no 3D library, so it can be tested.

// Eases a value toward a target without overshooting, frame-rate independent.
export function approach(value, target, dt, rate = 6) {
  return value + (target - value) * (1 - Math.exp(-rate * dt));
}
