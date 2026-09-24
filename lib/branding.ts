export function setAdminBranding() {
  if (typeof document === "undefined") return;
  document.title = "Royal Wedding Invitation Planner Studio";
  setFavicon("/Hari_WEDDING_project_logo.png", "image/png");
}

function createMonogramPng(initials: string): string {
  if (typeof document === "undefined") return "";
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // Clear canvas
    ctx.clearRect(0, 0, 64, 64);

    // Deep Royal Wine background circle (#55313c)
    ctx.beginPath();
    ctx.arc(32, 32, 29, 0, Math.PI * 2);
    ctx.fillStyle = "#55313c";
    ctx.fill();

    // Outer Antique Gold border ring (#bc965e)
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#bc965e";
    ctx.stroke();

    // Inner fine golden ring (#e8ce99)
    ctx.beginPath();
    ctx.arc(32, 32, 25, 0, Math.PI * 2);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#e8ce99";
    ctx.stroke();

    // Monogram Initials text in warm ivory (#fff7df)
    ctx.fillStyle = "#fff7df";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const fontSize = initials.length > 3 ? 16 : initials.length > 2 ? 20 : 25;
    ctx.font = `bold ${fontSize}px Georgia, serif`;
    ctx.fillText(initials, 32, 33.5);

    return canvas.toDataURL("image/png");
  } catch (err) {
    console.warn("Could not generate canvas monogram favicon:", err);
    return "";
  }
}

export function setClientBranding(brideName?: string, groomName?: string, monogram?: string) {
  if (typeof document === "undefined") return;
  const couple = [brideName, groomName].filter(Boolean).join(" & ") || "Royal Wedding";
  document.title = `${couple} — A Beautiful Beginning`;

  let initials = (monogram || "").trim().toUpperCase();
  if (!initials && brideName && groomName) {
    const b = brideName.trim()[0] || "";
    const g = groomName.trim()[0] || "";
    initials = `${b}&${g}`.toUpperCase();
  }
  if (!initials) initials = "✦";

  const pngUrl = createMonogramPng(initials);
  if (pngUrl) {
    setFavicon(pngUrl, "image/png");
  } else {
    // Fallback SVG if canvas fails
    const fontSize = initials.length > 3 ? "15" : initials.length > 2 ? "19" : "24";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="30" fill="#55313c" stroke="#bc965e" stroke-width="2.5"/>
      <circle cx="32" cy="32" r="26" fill="none" stroke="#e8ce99" stroke-width="0.8" stroke-dasharray="2.5 2"/>
      <text x="32" y="34" text-anchor="middle" dominant-baseline="central" font-family="Georgia, serif" font-size="${fontSize}" font-weight="bold" fill="#fff7df" letter-spacing="-0.5">${initials}</text>
    </svg>`;
    const dataUri = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    setFavicon(dataUri, "image/svg+xml");
  }
}

function setFavicon(url: string, type: string = "image/png") {
  if (typeof document === "undefined") return;

  // Remove all existing icon elements to force the browser to discard any cached icon state
  const existing = document.querySelectorAll<HTMLLinkElement>(
    "link[rel*='icon'], link[rel='shortcut icon']"
  );
  existing.forEach((el) => el.parentNode?.removeChild(el));

  // Add primary icon
  const link = document.createElement("link");
  link.type = type;
  link.rel = "icon";
  link.href = url;
  document.head.appendChild(link);

  // Add shortcut icon
  const shortcut = document.createElement("link");
  shortcut.type = type;
  shortcut.rel = "shortcut icon";
  shortcut.href = url;
  document.head.appendChild(shortcut);

  // Add apple touch icon
  const apple = document.createElement("link");
  apple.type = type;
  apple.rel = "apple-touch-icon";
  apple.href = url;
  document.head.appendChild(apple);
}
