/** Semantic gradient names used across event cards, heroes and avatars. */
export type EventGradient = 'crimson-ember' | 'ember-sun' | 'earth';

/**
 * Maps a semantic gradient name to its Tailwind `from`/`to` classes.
 * Pair with a direction utility, e.g. `bg-linear-to-br {{ EVENT_GRADIENTS[key] }}`.
 */
export const EVENT_GRADIENTS: Record<EventGradient, string> = {
  'crimson-ember': 'from-crimson to-ember',
  'ember-sun': 'from-ember to-sun',
  earth: 'from-earth to-ink-soft',
};

/** Ordered gradient keys, handy for cycling by index. */
export const EVENT_GRADIENT_KEYS = Object.keys(EVENT_GRADIENTS) as EventGradient[];

/** Placeholder gradient palette for capture tiles (until real images exist). */
export const CAPTURE_GRADIENTS = [
  'from-crimson to-ember',
  'from-ember to-sun',
  'from-earth to-ink-soft',
  'from-sage to-earth',
  'from-crimson-light to-crimson',
  'from-ember-deep to-earth',
];
