import { loadSplashAssets, type SplashAssetBundle } from "./splashAssets";

export const SPLASH_DRAW_DURATION_MS = 1_500;
export const SPLASH_COLOR_DURATION_MS = 1_500;
export const SPLASH_EXIT_DURATION_MS = 380;

type SplashPhase = "loading-assets" | "drawing" | "coloring" | "complete";

export interface SplashRuntimeSnapshot {
  assets: SplashAssetBundle | null;
  phase: SplashPhase;
  visible: boolean;
  fading: boolean;
  animationStartedAt: number | null;
}

type Listener = () => void;

const INITIAL_SNAPSHOT: SplashRuntimeSnapshot = Object.freeze({
  assets: null,
  phase: "loading-assets",
  visible: true,
  fading: false,
  animationStartedAt: null,
});

class SplashRuntime {
  private snapshot: SplashRuntimeSnapshot = INITIAL_SNAPSHOT;
  private readonly listeners = new Set<Listener>();
  private assetLoadPromise: Promise<void> | null = null;
  private retryTimer: number | null = null;
  private phaseTimer: number | null = null;
  private exitTimer: number | null = null;
  private retryAttempt = 0;
  private authReady = false;
  private routeReady = false;
  private screensReady = false;
  private lifecycleListenersAttached = false;
  private exitCommitted = false;

  getSnapshot = (): SplashRuntimeSnapshot => this.snapshot;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  ensureStarted = (): void => {
    if (typeof window === "undefined" || !this.snapshot.visible) return;

    this.attachLifecycleListeners();
    document.documentElement.dataset.sedaboxSplashActive = "true";

    if (this.snapshot.assets || this.assetLoadPromise) return;
    this.loadAssets();
  };

  beginAnimation = (): void => {
    if (
      typeof window === "undefined" ||
      !this.snapshot.visible ||
      !this.snapshot.assets ||
      this.snapshot.animationStartedAt !== null
    ) {
      return;
    }

    this.update({
      phase: "drawing",
      animationStartedAt: performance.now(),
    });
    this.scheduleNextPhase();
  };

  setReadiness = (authReady: boolean, routeReady: boolean): void => {
    this.authReady = authReady;
    this.routeReady = routeReady;

    // Request/context readiness is intentionally not allowed to advance the
    // visual clock. Only the timeline timer and browser lifecycle events may
    // change drawing/coloring phases. Readiness can merely release an already
    // completed splash into its final exit.
    this.maybeExit();
  };

  setScreensReady = (screensReady: boolean): void => {
    this.screensReady = screensReady;
    this.maybeExit();
  };

  private update = (patch: Partial<SplashRuntimeSnapshot>): void => {
    const next = { ...this.snapshot, ...patch };
    const changed = Object.keys(patch).some(
      (key) =>
        this.snapshot[key as keyof SplashRuntimeSnapshot] !==
        next[key as keyof SplashRuntimeSnapshot],
    );
    if (!changed) return;

    this.snapshot = next;
    for (const listener of Array.from(this.listeners)) listener();
  };

  private loadAssets = (): void => {
    if (this.assetLoadPromise || !this.snapshot.visible) return;

    this.assetLoadPromise = loadSplashAssets()
      .then((assets) => {
        if (!this.snapshot.visible) return;
        this.retryAttempt = 0;
        this.clearRetryTimer();
        this.update({ assets });
      })
      .catch(() => {
        if (!this.snapshot.visible) return;

        const delay = Math.min(350 + this.retryAttempt * 250, 1_500);
        this.retryAttempt += 1;
        this.clearRetryTimer();
        this.retryTimer = window.setTimeout(() => {
          this.retryTimer = null;
          this.assetLoadPromise = null;
          this.loadAssets();
        }, delay);
      })
      .finally(() => {
        if (this.snapshot.assets) this.assetLoadPromise = null;
      });
  };

  private scheduleNextPhase = (): void => {
    this.clearPhaseTimer();
    if (this.snapshot.animationStartedAt === null || !this.snapshot.visible) return;

    const elapsed = performance.now() - this.snapshot.animationStartedAt;
    const nextBoundary =
      elapsed < SPLASH_DRAW_DURATION_MS
        ? SPLASH_DRAW_DURATION_MS
        : SPLASH_DRAW_DURATION_MS + SPLASH_COLOR_DURATION_MS;
    const remaining = Math.max(0, nextBoundary - elapsed);

    this.phaseTimer = window.setTimeout(() => {
      this.phaseTimer = null;
      this.syncTimeline();
    }, remaining + 8);
  };

  private syncTimeline = (): void => {
    if (
      typeof window === "undefined" ||
      this.snapshot.animationStartedAt === null ||
      !this.snapshot.visible
    ) {
      return;
    }

    const elapsed = performance.now() - this.snapshot.animationStartedAt;
    let phase: SplashPhase = "drawing";

    if (elapsed >= SPLASH_DRAW_DURATION_MS + SPLASH_COLOR_DURATION_MS) {
      phase = "complete";
    } else if (elapsed >= SPLASH_DRAW_DURATION_MS) {
      phase = "coloring";
    }

    if (phase !== this.snapshot.phase) this.update({ phase });

    if (phase === "complete") {
      this.clearPhaseTimer();
      this.maybeExit();
      return;
    }

    this.scheduleNextPhase();
  };

  private maybeExit = (): void => {
    if (this.exitCommitted || !this.snapshot.visible) return;

    const canExit =
      this.snapshot.phase === "complete" &&
      this.authReady &&
      this.routeReady &&
      this.screensReady;
    if (!canExit) return;

    // Once the exit begins it is intentionally monotonic. A late auth/router
    // rerender cannot reverse the fade and flash/replay the splash.
    this.exitCommitted = true;
    this.update({ fading: true });
    this.exitTimer = window.setTimeout(() => {
      this.exitTimer = null;
      this.update({ visible: false, fading: false });
      delete document.documentElement.dataset.sedaboxSplashActive;
      this.clearPhaseTimer();
      this.clearRetryTimer();
    }, SPLASH_EXIT_DURATION_MS);
  };

  private attachLifecycleListeners = (): void => {
    if (this.lifecycleListenersAttached) return;
    this.lifecycleListenersAttached = true;

    const sync = () => {
      this.syncTimeline();
      this.maybeExit();
    };

    document.addEventListener("visibilitychange", sync, { passive: true });
    window.addEventListener("pageshow", sync, { passive: true });
    window.addEventListener("focus", sync, { passive: true });
  };

  private clearRetryTimer = (): void => {
    if (this.retryTimer === null) return;
    window.clearTimeout(this.retryTimer);
    this.retryTimer = null;
  };

  private clearPhaseTimer = (): void => {
    if (this.phaseTimer === null) return;
    window.clearTimeout(this.phaseTimer);
    this.phaseTimer = null;
  };
}

declare global {
  interface Window {
    __sedaboxSplashRuntime?: SplashRuntime;
  }
}

export const getSplashRuntime = (): SplashRuntime => {
  if (typeof window === "undefined") {
    throw new Error("Splash runtime is only available in the browser.");
  }
  if (!window.__sedaboxSplashRuntime) {
    window.__sedaboxSplashRuntime = new SplashRuntime();
  }
  return window.__sedaboxSplashRuntime;
};

export const subscribeSplashRuntime = (listener: Listener): (() => void) => {
  if (typeof window === "undefined") return () => undefined;
  return getSplashRuntime().subscribe(listener);
};

export const getSplashRuntimeSnapshot = (): SplashRuntimeSnapshot => {
  if (typeof window === "undefined") return INITIAL_SNAPSHOT;
  return getSplashRuntime().getSnapshot();
};

export const getSplashServerSnapshot = (): SplashRuntimeSnapshot =>
  INITIAL_SNAPSHOT;
