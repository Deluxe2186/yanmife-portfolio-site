/**
 * Decorative space backdrop: a few faint stars and three slow, glowing
 * purple shapes that breathe. It is pure CSS (see globals.css), sits behind
 * everything and cannot be clicked.
 */
export function SpaceBackground() {
  return (
    <div aria-hidden="true" className="space-bg">
      <div className="space-stars" />
      <div className="space-stars space-stars-b" />
      <div className="space-orb space-orb-a" />
      <div className="space-orb space-orb-b" />
      <div className="space-orb space-orb-c" />
    </div>
  );
}
