/**
 * A single, light haptic tick for primary actions on devices that support it.
 * Calm by design — no buzzing patterns, no haptics on incidental taps.
 */
export function haptic(ms = 10): void {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* unsupported — silently no-op */
  }
}
