/**
 * Writes the pointer position to --light-x / --light-y on <html>.
 * Every `.glass` surface reads those vars, so all panels catch the same
 * light at once. Eased with rAF so the highlight glides rather than snaps.
 */
export function initAmbientLight(): () => void {
  const root = document.documentElement;
  let tx = 50, ty = 0, x = 50, y = 0, raf = 0;

  const onMove = (e: PointerEvent) => {
    tx = (e.clientX / window.innerWidth) * 100;
    ty = (e.clientY / window.innerHeight) * 100;
  };

  const tick = () => {
    x += (tx - x) * 0.08;
    y += (ty - y) * 0.08;
    root.style.setProperty("--light-x", `${x.toFixed(2)}%`);
    root.style.setProperty("--light-y", `${y.toFixed(2)}%`);
    raf = requestAnimationFrame(tick);
  };

  window.addEventListener("pointermove", onMove, { passive: true });
  raf = requestAnimationFrame(tick);

  return () => {
    window.removeEventListener("pointermove", onMove);
    cancelAnimationFrame(raf);
  };
}
