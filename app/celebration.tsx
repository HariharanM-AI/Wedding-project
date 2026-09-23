"use client";
import { useEffect, useRef } from "react";

// Shared with the film's scroll renderer: which scene currently owns the viewport
// and how fully it has arrived (0–1). Updated without React renders.
export const stageState = { scene: "opening", presence: 1 };
export const SCENE_EVENT = "invitation:scene";
export const SHOWER_EVENT = "invitation:shower";
export const BLESSED_EVENT = "invitation:blessed";

type Kind = "flower" | "grain" | "ember" | "sparkle";
type Sprite = { c: HTMLCanvasElement; max: number };
type P = {
  kind: Kind; s: Sprite; x: number; y: number; vx: number; vy: number; rot: number; vr: number;
  flip: number; vf: number; size: number; age: number; life: number; delay: number;
  term: number; swayA: number; swayF: number; phase: number; alpha?: number;
  // akshantalu only
  rest?: boolean; u?: number; v?: number; bounced?: boolean; stick?: boolean; py?: number;
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

function sprite(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): Sprite {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d")!; g.translate(w / 2, h / 2); draw(g);
  return { c, max: Math.max(w, h) };
}

function makeSprites() {
  const petal = (inner: string, outer: string, edge: string) => sprite(48, 64, g => {
    const gr = g.createRadialGradient(0, 8, 2, 0, 0, 34); gr.addColorStop(0, inner); gr.addColorStop(1, outer);
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, 30);
    g.bezierCurveTo(-26, 12, -22, -24, -4, -30); g.quadraticCurveTo(0, -24, 4, -30);
    g.bezierCurveTo(22, -24, 26, 12, 0, 30); g.fill();
    g.strokeStyle = edge; g.globalAlpha = .35; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, 26); g.quadraticCurveTo(2, 0, 0, -22); g.stroke();
  });
  const jasmine = sprite(64, 64, g => {
    for (let i = 0; i < 5; i++) {
      g.save(); g.rotate(i * Math.PI * 2 / 5);
      const gr = g.createLinearGradient(0, 0, 0, -28); gr.addColorStop(0, "#f3ecd4"); gr.addColorStop(1, "#fffdf5");
      g.fillStyle = gr; g.beginPath(); g.ellipse(0, -15, 8, 15, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "#d9cfb2"; g.lineWidth = 1; g.stroke(); g.restore();
    }
    g.fillStyle = "#e6d27a"; g.beginPath(); g.arc(0, 0, 4.5, 0, Math.PI * 2); g.fill();
  });
  const marigold = (a: string, b: string) => sprite(64, 64, g => {
    for (let ring = 0; ring < 3; ring++) {
      const n = 14 - ring * 3, r = 24 - ring * 7;
      for (let i = 0; i < n; i++) {
        g.save(); g.rotate(i * Math.PI * 2 / n + ring * .3);
        g.fillStyle = ring % 2 ? b : a; g.beginPath(); g.ellipse(0, -r + 6, 6 - ring, 9 - ring, 0, 0, Math.PI * 2); g.fill();
        g.restore();
      }
    }
    g.fillStyle = "#b45309"; g.beginPath(); g.arc(0, 0, 3.5, 0, Math.PI * 2); g.fill();
  });
  const glow = (core: string, mid: string, star: boolean) => sprite(48, 48, g => {
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, 24); gr.addColorStop(0, core); gr.addColorStop(.25, mid); gr.addColorStop(1, "rgba(255,200,90,0)");
    g.fillStyle = gr; g.fillRect(-24, -24, 48, 48);
    if (star) { g.fillStyle = core; g.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 2.2 : 16, a = i * Math.PI / 4; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.fill(); }
  });
  // White lotus, matching the lotuses painted in the closing landscape.
  const lotusPetal = (tip: string) => sprite(56, 88, g => {
    g.shadowColor = "rgba(120,84,50,.32)"; g.shadowBlur = 5; g.shadowOffsetY = 2;
    const gr = g.createLinearGradient(0, 32, 0, -34); gr.addColorStop(0, "#f4ecd9"); gr.addColorStop(.55, "#fffdf7"); gr.addColorStop(1, tip);
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, 32);
    g.bezierCurveTo(-19, 18, -16, -16, 0, -34); g.bezierCurveTo(16, -16, 19, 18, 0, 32); g.fill();
    g.shadowColor = "transparent"; g.strokeStyle = "#cdbd9c"; g.globalAlpha = .45; g.lineWidth = .9;
    for (const x of [-6, 0, 6]) { g.beginPath(); g.moveTo(x * .3, 28); g.quadraticCurveTo(x, 0, x * .4, -26); g.stroke(); }
  });
  const lotusBloom = sprite(96, 76, g => {
    g.shadowColor = "rgba(120,84,50,.28)"; g.shadowBlur = 5; g.shadowOffsetY = 2;
    const bloomPetal = (rot: number, len: number, w: number, a: string, b: string) => {
      g.save(); g.translate(0, 18); g.rotate(rot);
      const gr = g.createLinearGradient(0, 0, 0, -len); gr.addColorStop(0, a); gr.addColorStop(1, b);
      g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-w, -len * .35, -w * .6, -len * .8, 0, -len); g.bezierCurveTo(w * .6, -len * .8, w, -len * .35, 0, 0); g.fill();
      g.strokeStyle = "#d6c8a8"; g.globalAlpha = .5; g.lineWidth = .8; g.stroke(); g.restore();
    };
    for (const r of [-1.25, 1.25]) bloomPetal(r, 30, 11, "#efe5cf", "#fbeff0");
    for (const r of [-.7, .7]) bloomPetal(r, 38, 13, "#f3ead6", "#fdf1f2");
    bloomPetal(0, 44, 14, "#f6efdd", "#fff4f4");
    g.fillStyle = "#e8cf72"; g.beginPath(); g.ellipse(0, 12, 7, 3, 0, 0, Math.PI * 2); g.fill();
  });
  const grain = (a: string, b: string) => sprite(14, 28, g => {
    const gr = g.createLinearGradient(-5, 0, 5, 0); gr.addColorStop(0, b); gr.addColorStop(.45, a); gr.addColorStop(1, b);
    g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, 5, 12, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "rgba(90,50,10,.55)"; g.lineWidth = 1.3; g.stroke();
    g.fillStyle = "rgba(255,255,240,.7)"; g.beginPath(); g.ellipse(-1.4, -3, 1.2, 4, 0, 0, Math.PI * 2); g.fill();
  });
  return {
    flowers: [jasmine, jasmine, petal("#fff7f0", "#f3c6cf", "#c2687e"), petal("#f7a3b5", "#c2365d", "#7d1535"), petal("#ffd27a", "#f28a1a", "#a84b00"), marigold("#f59e0b", "#fbbf24"), marigold("#ea580c", "#f97316")],
    roses: [petal("#f7a3b5", "#c2365d", "#7d1535"), petal("#ffe0e6", "#e98aa2", "#a73a5a"), jasmine],
    marigold: [petal("#ffd27a", "#f28a1a", "#a84b00"), petal("#ffe7a3", "#f5b301", "#9a6400"), marigold("#f59e0b", "#fbbf24")],
    lotus: [lotusPetal("#f1cdd5"), lotusPetal("#f7e2e0"), lotusPetal("#ecc3cd"), lotusPetal("#f9ece6"), lotusBloom, jasmine],
    sparkle: [glow("#fff6d8", "rgba(236,190,96,.75)", true), glow("#ffffff", "rgba(255,221,150,.7)", true)],
    ember: [glow("#fff3c4", "rgba(255,160,50,.8)", false), glow("#ffe9a8", "rgba(245,120,40,.75)", false)],
    // Akshantalu: turmeric rice with a few kumkum-red and plain grains.
    grains: [grain("#f7cf3d", "#d9a011"), grain("#f5c52a", "#c98d0c"), grain("#fbd955", "#e0a91a"), grain("#f7cf3d", "#d9a011"), grain("#d63b2f", "#9e1f18"), grain("#fff1c7", "#e3cf95")],
  };
}

// Top surface of the illustrated couple (x → y), in the artwork's normalised
// coordinates: where falling akshantalu meet hair and shoulders.
function silhouette(u: number): number | null {
  if (u < .19 || u > .77) return null;
  if (u < .35) return .22;
  if (u < .40) return .14;
  if (u < .52) return .095;
  if (u < .58) return .215;
  if (u < .70) return .175;
  return .27;
}
const HEADS = [[.45, .12], [.645, .2]];
const FLOOR = .895;

type Theme = { rate: number; make: (W: number, H: number) => P | null };

export function Celebration({ disabled }: { disabled: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (disabled) return;
    const canvas = ref.current!, ctx = canvas.getContext("2d")!;
    const S = makeSprites();
    let W = innerWidth, H = innerHeight, dpr = 1, frame = 0, last = 0, alive = true;
    const parts: P[] = [];
    let scene = stageState.scene, sceneSince = performance.now(), lastShower = -1e9, emitCarry = 0;
    let mx = -999, my = -999, pvx = 0, pvy = 0, trail = 0, smoothScroll = scrollY;
    const scale = () => Math.max(.72, Math.min(1.15, W / 1250));

    const resize = () => {
      W = innerWidth; H = innerHeight; dpr = Math.min(2, devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); wake();
    };
    const base = (kind: Kind, s: Sprite, x: number, y: number, size: number): P => ({
      kind, s, x, y, size, vx: 0, vy: 0, rot: rand(0, 6.28), vr: rand(-1.5, 1.5), flip: rand(0, 6.28), vf: rand(1.5, 4),
      age: 0, life: 1e9, delay: 0, term: rand(45, 95), swayA: rand(12, 40), swayF: rand(.6, 1.6), phase: rand(0, 6.28),
    });
    const flower = (x: number, y: number, set = S.flowers) => { const p = base("flower", pick(set), x, y, rand(17, 30) * scale()); return p; };
    // Slow, translucent white lotus for the closing scene.
    const lotus = (x: number, y: number) => {
      const s = pick(S.lotus), p = base("flower", s, x, y, (s === S.lotus[4] ? rand(34, 44) : s === S.lotus[5] ? rand(15, 20) : rand(22, 32)) * scale());
      p.term = rand(22, 42); p.swayA = rand(18, 38); p.swayF = rand(.35, .8); p.vr = rand(-.7, .7); p.vf = rand(.8, 1.8); p.alpha = rand(.75, .95);
      if (s === S.lotus[4]) { p.vf = rand(.2, .5); p.rot = rand(-.3, .3); p.vr = rand(-.2, .2); }
      return p;
    };
    const sparkle = (x: number, y: number, size = rand(10, 20)) => { const p = base("sparkle", pick(S.sparkle), x, y, size); p.life = rand(.6, 1.3); p.vr = rand(-2, 2); return p; };
    const ember = (x: number, y: number) => { const p = base("ember", pick(S.ember), x, y, rand(8, 18) * scale()); p.life = rand(3, 6); p.term = -rand(30, 70); p.swayA = rand(8, 22); return p; };
    const grain = (x: number, y: number) => {
      const p = base("grain", pick(S.grains), x, y, rand(9, 12) * Math.max(.85, scale()));
      p.vr = rand(-12, 12); p.stick = Math.random() < .6; p.life = 1e9; return p;
    };
    const add = (p: P | null) => { if (!p) return; parts.push(p); if (parts.length > 900) parts.splice(0, parts.length - 900); };

    const coupleBox = () => {
      const img = document.querySelector<HTMLElement>(".illustrated-couple"); if (!img) return null;
      const r = img.getBoundingClientRect(), ar = 1024 / 1536;
      if (r.width / r.height > ar) { const ch = r.height, cw = ch * ar; return { x: r.left + (r.width - cw) / 2, y: r.top, w: cw, h: ch }; }
      const cw = r.width, ch = cw / ar; return { x: r.left, y: r.top + (r.height - ch) / 2, w: cw, h: ch };
    };

    const themes: Record<string, Theme> = {
      opening: { rate: 0, make: () => null },
      gate: { rate: 11, make: W => flower(rand(0, W), -30) },
      events: { rate: 5, make: W => flower(rand(0, W), -30, S.marigold) },
      couple: { rate: 3, make: W => flower(rand(0, W), -30, S.roses) },
      portrait: { rate: 7, make: (W, H) => { const f = document.querySelector(".gold-portrait")?.getBoundingClientRect(); if (!f || f.top > H) return null; const p = sparkle(rand(f.left - 30, f.right + 30), rand(f.top - 20, f.bottom), rand(8, 16)); p.vy = -rand(5, 25); p.life = rand(1, 2); return p; } },
      venue: { rate: 12, make: (W, H) => ember(rand(W * .08, W * .92), rand(H * .45, H + 10)) },
      blessing: { rate: 6, make: W => flower(rand(0, W), -30, S.roses) },
      memories: { rate: 6, make: (W, H) => { const p = sparkle(rand(0, W), rand(H * .1, H), rand(8, 14)); p.vy = -rand(8, 20); p.life = rand(1.5, 2.6); return p; } },
      final: { rate: 3.2, make: W => lotus(rand(0, W), -40) },
    };

    // --- Scene arrivals ---------------------------------------------------
    const rainFrom = (n: number, make: (x: number, y: number) => P) => {
      for (let i = 0; i < n; i++) { const p = make(rand(-20, W + 20), -rand(20, H * .9)); p.vy = rand(40, 120); add(p); }
    };
    const shower = (big: boolean) => {
      const box = coupleBox(); if (!box) return;
      const n = Math.round((big ? 320 : 140) * Math.max(.6, scale()));
      for (let i = 0; i < n; i++) {
        const h = pick(HEADS), u = Math.random() < .75 ? h[0] + rand(-.13, .13) : rand(.12, .88);
        const p = grain(box.x + u * box.w, -rand(10, 60));
        p.vy = rand(120, 420); p.vx = rand(-40, 40); p.delay = rand(0, big ? 1.6 : 1); add(p);
      }
      for (let i = 0; i < (big ? 26 : 12); i++) { const p = flower(box.x + rand(.1, .9) * box.w, -rand(20, 200), S.flowers); p.delay = rand(0, 1.2); add(p); }
      dispatchEvent(new CustomEvent(BLESSED_EVENT, { detail: big ? 5 : 1 }));
    };
    const arrive = (name: string) => {
      const now = performance.now();
      if (name === "gate") rainFrom(Math.round(90 * scale()), (x, y) => flower(x, y));
      if (name === "events") rainFrom(Math.round(30 * scale()), (x, y) => flower(x, y, S.marigold));
      if (name === "blessing") rainFrom(Math.round(40 * scale()), (x, y) => flower(x, y, S.roses));
      if (name === "final") rainFrom(Math.round(12 * scale()), lotus);
      if (name === "couple" && now - lastShower > 3500) { lastShower = now; setTimeout(() => { if (alive && stageState.scene === "couple") shower(false); }, 650); }
    };
    const onScene = () => { if (stageState.scene !== scene) { scene = stageState.scene; sceneSince = performance.now(); arrive(scene); } wake(); };

    // --- Taps and clicks: every scene answers ------------------------------
    const burst = (x: number, y: number) => {
      const k = scale();
      if (scene === "couple") {
        // Throw a handful of akshantalu over the nearest head.
        const box = coupleBox(); if (!box) return;
        const h = HEADS.reduce((a, b) => Math.abs(box.x + a[0] * box.w - x) < Math.abs(box.x + b[0] * box.w - x) ? a : b);
        const tx = box.x + h[0] * box.w, ty = box.y + (h[1] - .06) * box.h, t = .6, g = 1100;
        for (let i = 0; i < 38; i++) {
          const p = grain(x + rand(-8, 8), y + rand(-8, 8));
          p.vx = (tx - x) / t + rand(-90, 90); p.vy = (ty - y) / t - .5 * g * t + rand(-90, 60); add(p);
        }
        for (let i = 0; i < 4; i++) { const p = flower(x, y, S.flowers); p.vx = rand(-160, 160); p.vy = -rand(120, 300); add(p); }
        dispatchEvent(new CustomEvent(BLESSED_EVENT, { detail: 1 }));
        return;
      }
      if (scene === "final") {
        for (let i = 0; i < 9; i++) { const a = rand(Math.PI * 1.1, Math.PI * 1.9), sp = rand(60, 170), p = lotus(x, y); p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp; add(p); }
        return;
      }
      const n = Math.round(26 * k) + 8;
      for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2), sp = rand(120, 460);
        let p: P;
        if (scene === "venue") p = ember(x, y);
        else if (scene === "memories" || scene === "portrait" || scene === "opening") p = Math.random() < .55 ? sparkle(x, y, rand(10, 22)) : flower(x, y, S.roses);
        else if (scene === "events") p = flower(x, y, S.marigold);
        else p = flower(x, y);
        p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp - 120; if (p.kind === "sparkle") p.life = rand(.7, 1.4);
        add(p);
      }
    };
    const click = (e: MouseEvent) => {
      if (e.target instanceof Element && e.target.closest("button,a,input,[role=dialog]")) return;
      if (document.querySelector("[role=dialog]")) return;
      burst(e.clientX, e.clientY); wake();
    };
    const onShower = () => { shower(true); wake(); };
    // Save/details buttons celebrate too.
    const buttonCheer = (e: MouseEvent) => {
      const b = e.target instanceof Element && e.target.closest(".gold-button,.final-save");
      if (!b) return; const r = b.getBoundingClientRect();
      for (let i = 0; i < 22; i++) { const p = Math.random() < .5 ? sparkle(r.left + r.width / 2, r.top + r.height / 2) : flower(r.left + r.width / 2, r.top, S.flowers); const a = rand(Math.PI * 1.05, Math.PI * 1.95); const sp = rand(150, 420); p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp; add(p); }
      wake();
    };

    // --- Pointer: breeze, sparkle trail and 3D tilt ----------------------
    let tilted: HTMLElement | null = null;
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      if (mx > -999) { pvx = pvx * .5 + (e.clientX - mx) * 30; pvy = pvy * .5 + (e.clientY - my) * 30; trail += Math.hypot(e.clientX - mx, e.clientY - my); }
      mx = e.clientX; my = e.clientY;
      if (trail > 34) { trail = 0; const p = sparkle(mx + rand(-4, 4), my + rand(-4, 4), rand(7, 13)); p.vy = rand(10, 40); p.life = rand(.45, .8); add(p); }
      const t = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-tilt]") : null;
      if (tilted && tilted !== t) { tilted.style.rotate = ""; tilted = null; }
      if (t) {
        const r = t.getBoundingClientRect(), dx = (e.clientX - r.left) / r.width - .5, dy = (e.clientY - r.top) / r.height - .5;
        const deg = Math.min(1, Math.hypot(dx, dy) * 2) * Number(t.dataset.tilt || 7);
        t.style.rotate = `${(-dy).toFixed(3)} ${dx.toFixed(3)} 0 ${deg.toFixed(2)}deg`; tilted = t;
      }
      wake();
    };
    const out = () => { mx = my = -999; if (tilted) { tilted.style.rotate = ""; tilted = null; } };

    // --- Simulation ------------------------------------------------------
    function wake() { if (alive && !document.hidden && !frame) frame = requestAnimationFrame(tick); }
    function tick(time: number) {
      frame = 0; const dt = last ? Math.min((time - last) / 1000, .05) : 1 / 60; last = time;
      const theme = themes[scene] ?? themes.opening, box = scene === "couple" ? coupleBox() : null;
      // Ambient emission ramps in as the scene arrives.
      const since = (time - sceneSince) / 1000;
      emitCarry += theme.rate * scale() * Math.max(0, stageState.presence) * Math.min(1, since / .6 + .3) * dt;
      while (emitCarry >= 1) { emitCarry -= 1; add(theme.make(W, H)); }
      // Petals ride a little with the scrolling scene.
      const sy = scrollY, scrollShift = (sy - smoothScroll) * (1 - Math.exp(-dt * 1000 / 190)); smoothScroll += scrollShift;
      pvx *= Math.exp(-dt * 5); pvy *= Math.exp(-dt * 5);

      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
      let rested = 0;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        if (p.delay > 0) { p.delay -= dt; continue; }
        p.age += dt;
        if (p.kind === "grain") {
          if (p.rest) {
            rested++;
            if (!box || p.age > 9) { parts.splice(i, 1); continue; }
            p.x = box.x + p.u! * box.w; p.y = box.y + p.v! * box.h;
          } else {
            p.py = p.y; p.vy = Math.min(p.vy + 1100 * dt, 950); p.vx *= Math.exp(-dt * .4);
            p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
            if (box && p.vy > 0) {
              const u = (p.x - box.x) / box.w, top = p.bounced ? null : silhouette(u);
              const landOn = (v: number) => { p.rest = true; p.age = 0; p.u = u; p.v = v; p.vr = 0; };
              if (top !== null && p.py! < box.y + top * box.h && p.y >= box.y + top * box.h) {
                if (p.stick) landOn(top + rand(0, .035));
                else { p.bounced = true; p.vy *= -.28; p.vx += rand(-120, 120); }
              } else if (u > .17 && u < .85 && p.y >= box.y + FLOOR * box.h && p.py! < box.y + FLOOR * box.h) landOn(FLOOR + rand(-.025, .02));
            }
          }
        } else {
          if (p.kind === "sparkle") { p.vx *= Math.exp(-dt * 3); p.vy = p.vy * Math.exp(-dt * 3) + 12 * dt; }
          else { p.vx *= Math.exp(-dt * 1.3); p.vy += (p.term - p.vy) * Math.min(1, dt * 1.6); p.y -= scrollShift * (p.kind === "ember" ? .15 : .3); }
          // Breeze from the pointer.
          if (mx > -999 && p.kind !== "sparkle") {
            const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
            if (d2 < 16000) { const f = (1 - d2 / 16000) * Math.min(1, dt * 7); p.vx += (pvx - p.vx) * f * .7 + dx * f * 2; p.vy += (pvy - p.vy) * f * .5 + dy * f * 2; p.vr += pvx * f * .002; }
          }
          const sway = p.kind === "sparkle" ? 0 : Math.sin(p.age * p.swayF + p.phase) * p.swayA;
          p.x += (p.vx + sway) * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.flip += p.vf * dt;
        }
        if (p.age > p.life || p.y > H + 60 || p.y < -H || p.x < -120 || p.x > W + 120 || (p.kind === "ember" && p.y < -30)) { parts.splice(i, 1); continue; }
        let a = 1;
        if (p.kind === "sparkle") a = Math.sin(Math.min(1, p.age / p.life) * Math.PI) * (.75 + .25 * Math.sin(p.age * 18 + p.phase));
        else if (p.kind === "ember") a = Math.min(1, p.age * 2) * (1 - p.age / p.life) * (.7 + .3 * Math.sin(p.age * 9 + p.phase));
        else if (p.rest) a = p.age > 8 ? 9 - p.age : 1;
        else if (p.alpha) a = p.alpha * Math.min(1, p.age * 1.5);
        const k = p.size * dpr / p.s.max, c = Math.cos(p.rot), s = Math.sin(p.rot);
        const fx = p.kind === "flower" ? .25 + .75 * Math.abs(Math.cos(p.flip)) : 1;
        ctx.globalAlpha = Math.max(0, a);
        ctx.setTransform(c * fx * k, s * fx * k, -s * k, c * k, p.x * dpr, p.y * dpr);
        ctx.drawImage(p.s.c, -p.s.c.width / 2, -p.s.c.height / 2);
      }
      if (rested > 520) { let drop = rested - 520; for (let i = 0; i < parts.length && drop > 0; i++) if (parts[i].rest) { parts.splice(i--, 1); drop--; } }
      ctx.globalAlpha = 1;
      if (parts.length || theme.rate > 0) wake(); else last = 0;
    }

    const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; last = 0; } else wake(); };
    resize();
    addEventListener("resize", resize); addEventListener(SCENE_EVENT, onScene); addEventListener(SHOWER_EVENT, onShower);
    addEventListener("click", click); addEventListener("click", buttonCheer, true);
    addEventListener("pointermove", move, { passive: true }); document.documentElement.addEventListener("pointerleave", out);
    document.addEventListener("visibilitychange", visibility);
    onScene();
    return () => {
      alive = false; cancelAnimationFrame(frame);
      removeEventListener("resize", resize); removeEventListener(SCENE_EVENT, onScene); removeEventListener(SHOWER_EVENT, onShower);
      removeEventListener("click", click); removeEventListener("click", buttonCheer, true);
      removeEventListener("pointermove", move); document.documentElement.removeEventListener("pointerleave", out);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [disabled]);
  return disabled ? null : <canvas ref={ref} className="celebration-layer" aria-hidden="true" />;
}
