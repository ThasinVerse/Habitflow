// The only place the app-shell service worker is registered.
const PREVIEW_LABEL = /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/;

function refused(): boolean {
  if (!import.meta.env.PROD) return true;
  if (window.self !== window.top) return true;
  const host = window.location.hostname.toLowerCase();
  const label = host.split(".")[0] ?? "";
  for (const d of ["lovable.app", "gpt-eng.com", "gptengineer.run"]) {
    if (host.endsWith("." + d) && (PREVIEW_LABEL.test(label) || /^project--.+-dev$/.test(label))) return true;
  }
  for (const d of ["lovableproject.com", "lovableproject-dev.com", "beta.lovable.dev"]) {
    if (host === d || host.endsWith("." + d)) return true;
  }
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function unregisterApp() {
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.filter((r) => r.active?.scriptURL.endsWith("/sw.js") || r.installing?.scriptURL.endsWith("/sw.js")).map((r) => r.unregister()));
}

export async function registerSW() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    if (refused()) {
      await unregisterApp();
      return;
    }
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch (e) {
    console.warn("Service worker registration failed", e);
  }
}
