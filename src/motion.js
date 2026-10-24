// Frame-rate independent damping preserves continuity when a new selection interrupts a move.
export function approach(value, target, delta, duration = 150) {
 return value + (target - value) * (1 - Math.exp(-Math.min(delta, 64) / duration));
}
export function drift(index, time, strength = 1) {
 return { x: Math.sin(time * .00045 + index * 1.73) * 9 * strength,
  y: Math.cos(time * .00037 + index * 2.31) * 7 * strength };
}
export function along(a, b, progress) {
 return { x: a.x + (b.x - a.x) * progress, y: a.y + (b.y - a.y) * progress };
}
// Critically damped spring: carries velocity across interrupted selections without overshoot at rest.
export function spring(value, velocity, target, delta) {
 const dt=Math.min(delta,64)/1000,omega=12,decay=Math.exp(-omega*dt);
 const offset=value-target,step=(velocity+omega*offset)*dt;
 return {value:target+(offset+step)*decay,velocity:(velocity-omega*step)*decay};
}
