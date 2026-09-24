export function setAdminBranding() {
  if (typeof document === "undefined") return;
  document.title = "Royal Wedding Invitation Planner Studio";
  setFavicon("/Hari_WEDDING_project_logo_final.png");
}

export function setClientBranding(brideName?: string, groomName?: string, monogram?: string) {
  if (typeof document === "undefined") return;
  const couple = [brideName, groomName].filter(Boolean).join(" & ") || "Royal Wedding";
  document.title = `${couple} — A Beautiful Beginning`;

  let initials = (monogram || "").trim().toUpperCase();
  if (!initials && brideName && groomName) {
    initials = `${brideName.trim()[0]}&${groomName.trim()[0]}`.toUpperCase();
  }
  if (!initials) initials = "✦";

  // Clean royal monogram seal in signature wine (#55313c) & gold (#bc965e / #e8ce99)
  const fontSize = initials.length > 3 ? "15" : initials.length > 2 ? "19" : "24";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="30" fill="#55313c" stroke="#bc965e" stroke-width="2.5"/>
    <circle cx="32" cy="32" r="26" fill="none" stroke="#e8ce99" stroke-width="0.8" stroke-dasharray="2.5 2"/>
    <text x="32" y="34" text-anchor="middle" dominant-baseline="central" font-family="Georgia, serif" font-size="${fontSize}" font-weight="bold" fill="#fff7df" letter-spacing="-0.5">${initials}</text>
  </svg>`;

  const dataUri = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  setFavicon(dataUri);
}

function setFavicon(url: string) {
  if (typeof document === "undefined") return;
  const selectors = ["link[rel~='icon']", "link[rel='shortcut icon']", "link[rel='icon']", "link[rel='apple-touch-icon']"];
  let found = false;
  selectors.forEach((sel) => {
    document.querySelectorAll<HTMLLinkElement>(sel).forEach((link) => {
      link.href = url;
      found = true;
    });
  });
  if (!found) {
    const link = document.createElement("link");
    link.rel = "icon";
    link.href = url;
    document.head.appendChild(link);
  }
}
