"use client";

/**
 * "Fly to cart": a copy of the product photo travels along a curved path from the product
 * to the cart icon, shrinking as it goes; then the cart icon bumps.
 *
 * Markup contract:
 *   - [data-fly-root]  — the product container (card or product page); its [data-fly-img] is the photo.
 *   - [data-cart-target] — every cart icon (header, mobile bottom nav). The first visible one wins.
 */

const DURATION = 850;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isVisible(el: Element) {
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  if (getComputedStyle(el).visibility === "hidden") return false;
  return r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
}

/** The cart icon currently on screen (header cart while visible, otherwise the mobile bottom-nav cart). */
function pickTarget(): HTMLElement | null {
  const all = Array.from(document.querySelectorAll<HTMLElement>("[data-cart-target]"));
  return all.find(isVisible) ?? all.find((el) => el.getBoundingClientRect().width > 0) ?? null;
}

/** Bounce every cart icon (the count badge updates when the server confirms). */
export function bumpCart() {
  document.querySelectorAll<HTMLElement>("[data-cart-target]").forEach((el) => {
    if (prefersReducedMotion()) return;
    el.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.28) rotate(-8deg)" },
        { transform: "scale(0.92) rotate(4deg)" },
        { transform: "scale(1.06)" },
        { transform: "scale(1)" },
      ],
      { duration: 550, easing: "ease-out" },
    );
    // Soft green ring that expands from the icon.
    const r = el.getBoundingClientRect();
    if (r.width === 0) return;
    const ring = document.createElement("span");
    Object.assign(ring.style, {
      position: "fixed",
      left: `${r.left + r.width / 2 - 22}px`,
      top: `${r.top + r.height / 2 - 22}px`,
      width: "44px",
      height: "44px",
      borderRadius: "9999px",
      border: "3px solid rgb(63 163 77 / 0.7)",
      pointerEvents: "none",
      zIndex: "9999",
    } satisfies Partial<CSSStyleDeclaration>);
    document.body.appendChild(ring);
    ring
      .animate([{ transform: "scale(0.6)", opacity: 1 }, { transform: "scale(1.9)", opacity: 0 }], { duration: 600, easing: "ease-out" })
      .finished.finally(() => ring.remove());
  });
}

/** Start the flight from the product that contains `trigger`. Resolves when the item reaches the cart. */
export function flyToCart(trigger: HTMLElement | null): Promise<void> {
  if (typeof window === "undefined" || !trigger) return Promise.resolve();
  const target = pickTarget();
  if (!target || prefersReducedMotion()) {
    bumpCart();
    return Promise.resolve();
  }

  const root = trigger.closest("[data-fly-root]");
  const img = root?.querySelector<HTMLImageElement>("[data-fly-img]") ?? null;
  const from = (img && img.getBoundingClientRect().width > 0 ? img : trigger).getBoundingClientRect();
  const to = target.getBoundingClientRect();

  // Start as a square thumbnail centred on the product photo (max 140px), end as a dot inside the cart.
  const size = Math.min(140, Math.max(56, Math.min(from.width, from.height)));
  const startX = from.left + from.width / 2 - size / 2;
  const startY = from.top + from.height / 2 - size / 2;
  const endX = to.left + to.width / 2 - size / 2;
  const endY = to.top + to.height / 2 - size / 2;

  const flyer = document.createElement("div");
  Object.assign(flyer.style, {
    position: "fixed",
    left: `${startX}px`,
    top: `${startY}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "18px",
    overflow: "hidden",
    pointerEvents: "none",
    zIndex: "9999",
    boxShadow: "0 12px 32px rgb(16 40 24 / 0.28)",
    border: "3px solid #fff",
    background: "#EEF7EC",
    willChange: "transform, opacity",
  } satisfies Partial<CSSStyleDeclaration>);
  if (img) {
    const copy = document.createElement("img");
    copy.src = img.currentSrc || img.src;
    copy.alt = "";
    Object.assign(copy.style, { width: "100%", height: "100%", objectFit: "cover", display: "block" });
    flyer.appendChild(copy);
  }
  document.body.appendChild(flyer);

  // Quadratic Bézier: rise above the straighter line, then drop into the cart.
  const dx = endX - startX;
  const dy = endY - startY;
  const lift = Math.max(120, Math.abs(dx) * 0.35);
  const cx = dx * 0.5;
  const cy = Math.min(0, dy) - lift;
  const steps = 14;
  const frames: Keyframe[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = 2 * (1 - t) * t * cx + t * t * dx;
    const y = 2 * (1 - t) * t * cy + t * t * dy;
    const scale = 1 - 0.85 * t; // ends ~15% of the start size
    const radius = 18 + 30 * t; // becomes a circle
    frames.push({
      transform: `translate(${x}px, ${y}px) scale(${i === 0 ? 1.05 : scale}) rotate(${t * 14}deg)`,
      borderRadius: `${radius}px`,
      opacity: t > 0.88 ? 1 - (t - 0.88) / 0.12 * 0.9 : 1,
      offset: t,
    });
  }

  return flyer
    .animate(frames, { duration: DURATION, easing: "cubic-bezier(0.45, 0, 0.25, 1)", fill: "forwards" })
    .finished.then(() => {
      flyer.remove();
      bumpCart();
    })
    .catch(() => flyer.remove());
}
