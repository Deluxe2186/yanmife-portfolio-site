import type { IconType } from 'react-icons';
import { SiFiverr } from 'react-icons/si';

/**
 * Fiverr's logo is a wide wordmark. The stock icon sits in a square canvas
 * and leaves empty space above and below the letters, so it looks tiny.
 * This crops the canvas to the letters (ratio about 3.2 : 1, with a small margin) so the whole
 * logo can be shown at a readable size without a text label.
 */
export const FiverrWordmark: IconType = (props) => (
  <SiFiverr {...props} viewBox="-0.25 8.16 24.5 7.68" />
);
