/**
 * Decorative space backdrop: three slow, glowing purple shapes that drift
 * around and breathe. It is pure CSS (see globals.css), sits behind
 * everything and cannot be clicked.
 */
export function SpaceBackground() {
  return (
    <div aria-hidden="true" className="space-bg">
      <div className="space-orb space-orb-a" />
      <div className="space-orb space-orb-b" />
      <div className="space-orb space-orb-c" />
    </div>
  );
}
