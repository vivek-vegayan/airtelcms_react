import { useCallback, useEffect, useState } from "react";

/**
 * A CSS-only "full window" mode (fixed overlay covering the whole viewport,
 * above the app's Header/SideBar) rather than the real Fullscreen API.
 * requestFullscreen() on a sub-element would isolate it from document.body,
 * which is where MUI portals (Select menus, Tooltips, Menu) render — inside
 * real fullscreen those would silently stop being visible. This gets the
 * same "maximize the viewing area" result without that trap.
 */
export function useFullWindow() {
  const [isFullWindow, setIsFullWindow] = useState(false);

  useEffect(() => {
    if (!isFullWindow) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullWindow(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFullWindow]);

  const toggleFullWindow = useCallback(() => setIsFullWindow((v) => !v), []);

  return { isFullWindow, toggleFullWindow };
}
