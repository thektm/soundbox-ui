export interface SplashAssetBundle {
  outlineSvgMarkup: string;
  colorLogoUrl: string;
}

const SPLASH_CACHE_NAME = "sedabox-splash-assets-v1";
const SPLASH_CACHE_PREFIX = "sedabox-splash-assets-";
const OUTLINE_URL = "/logo-mark.svg";
const COLOR_URL = "/logo-text.png";

let assetPromise: Promise<SplashAssetBundle> | null = null;

const waitForImageDecode = async (source: string): Promise<void> => {
  const image = new Image();
  image.decoding = "async";
  image.src = source;

  if (typeof image.decode === "function") {
    try {
      await image.decode();
      return;
    } catch {
      // Some browsers reject decode() even though a normal load succeeds.
    }
  }

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`Unable to decode splash asset: ${source}`));
  });
};

const fetchAssetResponse = async (url: string): Promise<Response> => {
  if (typeof window === "undefined") {
    throw new Error("Splash assets can only be loaded in the browser.");
  }

  if ("caches" in window) {
    try {
      const cache = await caches.open(SPLASH_CACHE_NAME);
      const cached = await cache.match(url);
      if (cached) return cached;

      const response = await fetch(url, {
        credentials: "same-origin",
        cache: "force-cache",
      });
      if (!response.ok) {
        throw new Error(`Splash asset request failed (${response.status}): ${url}`);
      }

      await cache.put(url, response.clone());
      return response;
    } catch {
      // Cache Storage can be unavailable in private modes. Fall back to the
      // regular HTTP cache without blocking startup.
    }
  }

  const response = await fetch(url, {
    credentials: "same-origin",
    cache: "force-cache",
  });
  if (!response.ok) {
    throw new Error(`Splash asset request failed (${response.status}): ${url}`);
  }
  return response;
};

const prepareOutlineMarkup = (rawSvg: string): string => {
  const parser = new DOMParser();
  const document = parser.parseFromString(rawSvg, "image/svg+xml");
  if (document.querySelector("parsererror")) {
    throw new Error("The splash SVG could not be parsed.");
  }

  const svg = document.documentElement;
  if (svg.tagName.toLowerCase() !== "svg") {
    throw new Error("The splash outline asset is not an SVG document.");
  }

  svg.setAttribute("viewBox", "0 0 4500 4500");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("splash-mark-svg");

  svg.querySelectorAll("script, foreignObject").forEach((node) => node.remove());

  const paths = Array.from(svg.querySelectorAll("path"));
  paths.forEach((path, index) => {
    path.setAttribute("pathLength", "1");
    path.setAttribute("vector-effect", "non-scaling-stroke");
    path.style.setProperty("--splash-path-index", String(index));
    Array.from(path.attributes).forEach((attribute) => {
      if (attribute.name.toLowerCase().startsWith("on")) {
        path.removeAttribute(attribute.name);
      }
    });
  });

  return new XMLSerializer().serializeToString(svg);
};

const cleanOldSplashCaches = (): void => {
  if (!("caches" in window)) return;
  void caches
    .keys()
    .then((keys) =>
      Promise.all(
        keys
          .filter(
            (key) => key.startsWith(SPLASH_CACHE_PREFIX) && key !== SPLASH_CACHE_NAME,
          )
          .map((key) => caches.delete(key)),
      ),
    )
    .catch(() => undefined);
};

export const loadSplashAssets = (): Promise<SplashAssetBundle> => {
  if (assetPromise) return assetPromise;

  assetPromise = (async () => {
    cleanOldSplashCaches();

    const [outlineResponse, colorResponse] = await Promise.all([
      fetchAssetResponse(OUTLINE_URL),
      fetchAssetResponse(COLOR_URL),
    ]);

    const [outlineText, outlineBlob, colorBlob] = await Promise.all([
      outlineResponse.clone().text(),
      outlineResponse.blob(),
      colorResponse.blob(),
    ]);

    const outlineObjectUrl = URL.createObjectURL(outlineBlob);
    const colorObjectUrl = URL.createObjectURL(colorBlob);

    try {
      await Promise.all([
        waitForImageDecode(outlineObjectUrl),
        waitForImageDecode(colorObjectUrl),
      ]);
    } catch (error) {
      URL.revokeObjectURL(outlineObjectUrl);
      URL.revokeObjectURL(colorObjectUrl);
      throw error;
    }

    URL.revokeObjectURL(outlineObjectUrl);

    try {
      return {
        outlineSvgMarkup: prepareOutlineMarkup(outlineText),
        colorLogoUrl: colorObjectUrl,
      };
    } catch (error) {
      URL.revokeObjectURL(colorObjectUrl);
      throw error;
    }
  })().catch((error) => {
    assetPromise = null;
    throw error;
  });

  return assetPromise;
};
