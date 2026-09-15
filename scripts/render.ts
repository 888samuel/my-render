/**
 * Render helpers. Prefer the npm scripts so Remotion CLI flags stay in one place.
 *
 * Full machine (when RAM/CPU are comfortable):
 *   npm run render
 *
 * 8GB / constrained PC (close Remotion Studio first):
 *   npm run render:low-ram
 */
console.log("npm run render          → default Remotion render (faster, more RAM)");
console.log("npm run render:low-ram  → 8GB-safe render → out/youtube-low-ram.mp4");
