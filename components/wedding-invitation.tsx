"use client";

import { memo, useEffect, useRef, useState } from "react";
import { ArrowDown, CalendarDays, ArrowUpRight, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Celebration, stageState, SCENE_EVENT, SHOWER_EVENT, BLESSED_EVENT } from "@/app/celebration";
import { WeddingData } from "@/lib/types/wedding";
import { defaultWeddingData } from "@/lib/default-wedding";
import { subscribeToWeddingUpdates } from "@/lib/wedding-storage";
import { setClientBranding } from "@/lib/branding";

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const part = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const ease = (t: number) => t * t * (3 - 2 * t);

function Countdown({ isoDate }: { isoDate: string }) {
  const weddingTimestamp = Date.parse(isoDate) || Date.now() + 86400000 * 30;
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setRemaining(Math.max(0, weddingTimestamp - Date.now()));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [weddingTimestamp]);

  const n =
    remaining === null
      ? ["—", "—", "—", "—"]
      : [
          Math.floor(remaining / 86400000),
          Math.floor(remaining / 3600000) % 24,
          Math.floor(remaining / 60000) % 60,
          Math.floor(remaining / 1000) % 60
        ].map((x) => String(x).padStart(2, "0"));

  return (
    <div className="countdown">
      {["Days", "Hours", "Minutes", "Seconds"].map((label, i) => (
        <div key={label}>
          <span key={n[i]} className="count-digit">
            {n[i]}
          </span>
          <small>{label}</small>
        </div>
      ))}
    </div>
  );
}

function BlessingControls({ bride, groom }: { bride: string; groom: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const add = (e: Event) => setCount((c) => c + ((e as CustomEvent<number>).detail || 1));
    addEventListener(BLESSED_EVENT, add);
    return () => removeEventListener(BLESSED_EVENT, add);
  }, []);

  return (
    <div className="blessing-controls" data-layer="blessing-controls">
      <span className="eyebrow">{bride.toUpperCase()} & {groom.toUpperCase()}</span>
      <button className="gold-button akshantalu-button" onClick={() => dispatchEvent(new Event(SHOWER_EVENT))}>
        Bless The Couple <span aria-hidden="true">✦</span>
      </button>
      <p className="tap-hint">
        Tap anywhere to bless the couple
        {count > 0 ? (
          <>
            {" "}· <b>{count}</b> {count === 1 ? "blessing" : "blessings"}
          </>
        ) : null}
      </p>
    </div>
  );
}

function OpeningAtmosphere() {
  return (
    <div className="opening-atmosphere" data-layer="opening-atmosphere" aria-hidden="true">
      <div className="cloud-plane cloud-plane-left" data-air-depth="-22">
        <img className="intro-cloud cloud-left" src="/art/cloud.webp" alt="" width="1280" height="853" />
      </div>
      <div className="cloud-plane cloud-plane-right" data-air-depth="-12">
        <img className="intro-cloud cloud-right" src="/art/cloud.webp" alt="" width="1280" height="853" />
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`butterfly-position butterfly-${i}`}>
          <div className="butterfly-parallax" data-air-depth={18 + i * 9}>
            <div className="butterfly-flight">
              <div className="butterfly-wings">
                <span className="butterfly-wing wing-left">
                  <img src="/art/butterfly.webp" alt="" width="320" height="320" />
                </span>
                <span className="butterfly-wing wing-right">
                  <img src="/art/butterfly.webp" alt="" width="320" height="320" />
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const FilmScenes = memo(function FilmScenes({
  data,
  onDetails
}: {
  data: WeddingData;
  onDetails: (target: number | "muhurtham") => void;
}) {
  const rawEvents = data.events && data.events.length > 0 ? data.events : defaultWeddingData.events;
  const events = (rawEvents || []).filter(
    (e) => !/the wedding ceremony/i.test(e.title || "") && e.id !== "event-3"
  );
  const photos = data.photos || defaultWeddingData.photos;

  return (
    <main className="film-stage" aria-label={`${data.brideName} and ${data.groomName}'s scrolling wedding invitation`}>
      {/* 1. OPENING SCENE */}
      <div className="film-scene opening-scene" data-scene="opening">
        <div className="opening-glow" />
        <OpeningAtmosphere />
        <div className="opening-title" data-layer="opening-title">
          <p className="eyebrow">{data.blessingEyebrow || "WITH THE BLESSINGS OF OUR FAMILIES"}</p>
          <h1>
            {data.brideName}
            <span>&</span>
            {data.groomName}
          </h1>
          <p className="opening-date">{data.displayDate}</p>
          <p className="eyebrow tiny">{data.subheading || "ARE GETTING MARRIED"}</p>
        </div>
        <img
          className="opening-temple art"
          data-layer="opening-temple"
          src="/art/temple.webp"
          alt="An illustrated Chola-inspired South Indian temple rises into the sky"
          fetchPriority="high"
        />
        <div className="opening-hint" data-layer="opening-hint">
          <span>Scroll to unfold our story</span>
          <ArrowDown size={17} />
        </div>
      </div>

      {/* 2. GATE SCENE */}
      <section className="film-scene gate-scene" data-scene="gate" aria-label="The invitation">
        <div className="paper-fill" />
        <div className="invitation-words" data-layer="invitation-words">
          <span className="eyebrow">{data.invitationEyebrow || "IN THE PRESENCE OF LOVE & TRADITION"}</span>
          <h2>
            <em>{data.invitationHeading || "You're invited"}</em>
          </h2>
          <p style={{ whiteSpace: "pre-line" }}>
            {data.invitationSubtitle || "Together with our families,\nwe invite you to celebrate the wedding of"}
          </p>
          <h3>
            {data.brideName} <span>&</span> {data.groomName}
          </h3>
          <div className="fine-rule" />
          <p style={{ whiteSpace: "pre-line" }}>
            {data.invitationQuote || "Two hearts. Two families.\nOne beautiful beginning."}
          </p>
          <span className="eyebrow">{data.locationLine || `${data.displayDate} · ${data.city}`}</span>
        </div>
        <img
          className="gate-frame frame-art art"
          data-layer="gate-frame"
          src="/art/gate.webp"
          alt="Carved wedding gateway with jasmine garlands, banana leaves and brass lamps"
        />
      </section>

      {/* 3. EVENTS SCENE */}
      <section className="film-scene events-scene" data-scene="events" aria-label="Celebrations">
        <div className="paper-fill" />
        <img className="event-surround frame-art art" data-layer="event-surround" src="/art/gate.webp" alt="" />
        <p className="events-label eyebrow">LET THE CELEBRATIONS BEGIN</p>
        <div className="event-window" data-layer="event-window" data-tilt="5">
          <div
            className="event-reel"
            data-layer="event-reel"
            style={{ width: `${Math.max(1, events.length) * 100}%` }}
          >
            {events.map((event, i) => (
              <article
                className="event-invitation"
                key={event.id || event.title || i}
                style={{ width: `${100 / Math.max(1, events.length)}%` }}
              >
                <div className="event-portrait">
                  <img
                    src={event.image || (i === 0 ? photos.couplePortrait : i === 1 ? photos.handsDetail : photos.templeScene)}
                    alt={event.title}
                  />
                </div>
                <div className="event-copy">
                  <span className="eyebrow">
                    {event.shortTagline || (i === 0 ? "A LITTLE COLOUR. A LOT OF JOY." : i === 1 ? "OUR FAMILIES. OUR FAVOURITE SONGS." : "WHERE OUR CELEBRATION CONTINUES")}
                  </span>
                  <h2>{event.title}</h2>
                  <p>
                    {event.date}
                    <br />
                    {event.time}
                  </p>
                  <p className="event-short">
                    {event.shortCopy || event.copy || (i === 0 ? "Henna, laughter and all the little joys before forever." : "A night of music, a little magic, and a whole lot of love.")}
                  </p>
                  <button className="gold-button" onClick={() => onDetails(i)}>
                    The details <ArrowUpRight size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
        <div className="event-pips">
          {events.map((_, i) => (
            <span key={i} data-layer={`pip-${i}`} />
          ))}
        </div>
      </section>

      {/* 4. COUPLE SCENE */}
      <section className="film-scene couple-scene" data-scene="couple" aria-label="The bride and groom">
        <div className="couple-sky" />
        <img className="couple-temple temple-side left art" src="/art/temple.webp" alt="" />
        <img className="couple-temple temple-side right art" src="/art/temple.webp" alt="" />
        <img className="couple-temple main-temple art" data-layer="couple-temple" src="/art/temple.webp" alt="Temple architecture behind the wedding couple" />
        <div className="couple-heading" data-layer="couple-heading">
          <span className="eyebrow">A LITTLE DESTINY. A LOT OF LOVE.</span>
          <h2>
            The bride <em>&</em> groom
          </h2>
        </div>
        <img className="illustrated-couple art" data-layer="illustrated-couple" src="/art/couple.webp" alt="An illustrated South Indian bride and groom holding wedding garlands" />
        <BlessingControls bride={data.brideName} groom={data.groomName} />
      </section>

      {/* 5. PORTRAIT SCENE */}
      <section className="film-scene portrait-scene plum-scene" data-scene="portrait" aria-label={`Meet ${data.brideName} and ${data.groomName}`}>
        <div className="arch-paper" />
        <img className="plum-frame frame-art art" src="/art/plum.webp" alt="Plum and antique gold wedding arch with lamps and lotus ornament" />
        <div className="portrait-intro" data-layer="portrait-intro">
          <span className="eyebrow">MEET THE BRIDE & GROOM</span>
          <h2>
            {data.brideName} <em>&</em> {data.groomName}
          </h2>
          <p>{data.storyIntro || "Different paths, the same kind of forever."}</p>
        </div>
        <figure className="gold-portrait" data-layer="gold-portrait" data-tilt="10">
          <img src={photos.couplePortrait} alt={`${data.brideName} and ${data.groomName}`} />
        </figure>
        <div className="temple-procession" data-layer="temple-procession">
          {[0, 1, 2, 3, 4].map((i) => (
            <img key={i} className={`procession-temple temple-${i}`} src="/art/temple.webp" alt="" />
          ))}
        </div>
      </section>

      {/* 6. VENUE SCENE */}
      <section className="film-scene venue-scene plum-scene" data-scene="venue" aria-label="The wedding venue">
        <div className="arch-paper" />
        <img className="plum-frame frame-art art" src="/art/plum.webp" alt="" />
        <div className="venue-copy" data-layer="venue-copy">
          <span className="eyebrow">WHERE OUR FOREVER BEGINS</span>
          <h2>
            {data.venueName.split(" ")[0]}
            <br />
            <em>{data.venueName.split(" ").slice(1).join(" ") || "Courtyard"}</em>
          </h2>
          <p>{data.city}</p>
          <div className="fine-rule" />
          <p>
            {data.displayDate}
            <br />
            {data.muhurthamTime}
          </p>
          <button className="gold-button wine-button" onClick={() => onDetails("muhurtham")}>
            Wedding details <ArrowUpRight size={15} />
          </button>
        </div>
        <img className="venue-temple art" data-layer="venue-temple" src="/art/temple.webp" alt="Golden temple illustration below the ceremony details" />
      </section>

      {/* 7. BLESSING SCENE */}
      <section className="film-scene blessing-scene plum-scene" data-scene="blessing" aria-label="An invitation from our families">
        <div className="arch-paper" />
        <img className="plum-frame frame-art art" src="/art/plum.webp" alt="" />
        <div className="blessing-copy" data-layer="blessing-copy">
          <span className="eyebrow">WITH ALL OUR LOVE</span>
          <h2>
            Will you
            <br />
            <em>join us?</em>
          </h2>
          <p>
            Together with our families,
            <br />
            we invite you to celebrate our beginning.
          </p>
          <a className="gold-button wine-button" href="/ananya-karthik-wedding.ics" download>
            Save the celebrations <CalendarDays size={15} />
          </a>
          <span className="eyebrow">YOUR PRESENCE IS OUR GREATEST GIFT</span>
        </div>
        <img className="blessing-landscape art" src="/art/landscape.webp" alt="A painted South Indian temple landscape" />
      </section>

      {/* 8. MEMORIES SCENE */}
      <section className="film-scene memories-scene" data-scene="memories" aria-label="Counting the days and making memories">
        <div className="memories-ornament" aria-hidden="true">
          <img src="/art/gate.webp" alt="" />
        </div>
        <div className="countdown-heading" data-layer="countdown-heading">
          <span className="eyebrow">UNTIL OUR BEAUTIFUL BEGINNING</span>
          <h2>
            <em>Counting the days</em>
          </h2>
          <Countdown isoDate={data.weddingDate} />
        </div>
        <div className="memories-heading" data-layer="memories-heading">
          <h2>
            Good things
            <br />
            <em>come in moments.</em>
          </h2>
        </div>
        <div className="floating-memories">
          {[
            photos.couplePortrait,
            photos.handsDetail,
            photos.carTravel,
            photos.templeScene,
            photos.couplePortrait
          ].map((src, i) => (
            <figure className={`memory memory-${i}`} data-layer={`memory-${i}`} key={i}>
              <img
                src={src}
                alt={[
                  "Our story together",
                  "A promise of forever",
                  "The road to our celebration",
                  "Where traditions meet",
                  "Memories to hold close"
                ][i]}
              />
            </figure>
          ))}
        </div>
      </section>

      {/* 9. FINAL SCENE */}
      <section className="film-scene final-scene" data-scene="final" aria-label="The final invitation">
        <img className="final-landscape art" data-layer="final-landscape" src="/art/landscape.webp" alt="An original temple framed by terracotta hills, palms and lotus flowers" />
        <div className="final-words" data-layer="final-words">
          <span className="eyebrow final-eyebrow">TOGETHER IS A BEAUTIFUL PLACE TO BE</span>
          <h2>
            Our forever
            <br />
            begins <em>with you.</em>
          </h2>
          <p className="final-names">
            {data.brideName} <em>&</em> {data.groomName}
          </p>
          <div className="final-location-wrap">
            <span className="final-location-badge">
              <MapPin size={13} className="text-[#946f35]" />
              <span>{data.locationLine || `${data.displayDate} · ${data.city}`}</span>
            </span>
          </div>
          <a className="final-save gold-button wine-button" href="/ananya-karthik-wedding.ics" download>
            Save the date <CalendarDays size={15} />
          </a>
          <small className="final-subtext">{data.finalSubtext || `Wedding of ${data.brideName} & ${data.groomName}`}</small>
        </div>
        <p className="tap-hint final-hint" aria-hidden="true">
          Tap anywhere to scatter lotus petals
        </p>
      </section>
    </main>
  );
});

export function WeddingInvitation({ initialData }: { initialData?: WeddingData }) {
  const [data, setData] = useState<WeddingData>(initialData || defaultWeddingData);
  const root = useRef<HTMLDivElement>(null);
  const maxScroll = useRef(1);
  const reduceRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [event, setEvent] = useState<number | "muhurtham" | null>(null);
  const [reduced, setReduced] = useState(false);

  // Sync real-time updates across tabs/editor
  useEffect(() => {
    if (initialData) setData(initialData);
  }, [initialData]);

  useEffect(() => {
    const unsubscribe = subscribeToWeddingUpdates((updated) => {
      if (updated.slug === data.slug) {
        setData(updated);
      }
    });
    return unsubscribe;
  }, [data.slug]);

  // Dynamically update browser tab title and royal monogram favicon
  useEffect(() => {
    setClientBranding(data.brideName, data.groomName, data.monogram);
  }, [data.brideName, data.groomName, data.monogram]);

  useEffect(() => {
    const el = root.current!;
    const stage = el.querySelector<HTMLElement>(".film-stage")!;
    const nodes: Record<string, HTMLElement> = {};
    const scenes: Record<string, HTMLElement> = {};
    const owners: Record<string, string> = {};

    el.querySelectorAll<HTMLElement>("[data-layer]").forEach((n) => {
      const name = n.dataset.layer!;
      nodes[name] = n;
      owners[name] = n.closest<HTMLElement>("[data-scene]")!.dataset.scene!;
    });
    el.querySelectorAll<HTMLElement>("[data-scene]").forEach((n) => (scenes[n.dataset.scene!] = n));

    const eventCards = Array.from(el.querySelectorAll<HTMLElement>(".event-invitation"));
    const air = Array.from(el.querySelectorAll<HTMLElement>("[data-air-depth]")).map((n) => ({
      node: n,
      depth: Number(n.dataset.airDepth)
    }));
    const ys: Record<string, number> = {};
    const active = new Set<string>();
    const written = new WeakMap<HTMLElement, Record<string, string>>();

    const style = (
      n: HTMLElement,
      property: "transform" | "opacity" | "visibility" | "pointerEvents",
      value: string
    ) => {
      let cache = written.get(n);
      if (!cache) {
        cache = {};
        written.set(n, cache);
      }
      if (cache[property] === value) return;
      cache[property] = value;
      n.style[property] = value;
    };

    const flag = (n: HTMLElement, name: string, value: boolean) => {
      const next = String(value);
      if (n.getAttribute(name) !== next) n.setAttribute(name, next);
    };

    const media = matchMedia("(prefers-reduced-motion: reduce)");
    reduceRef.current = media.matches;
    setReduced(media.matches);

    let alive = true,
      frame = 0,
      last = 0,
      smoothed = scrollY,
      target = scrollY,
      lastRendered = -1,
      width = innerWidth,
      height = innerHeight;
    let input: "wheel" | "touch" = "wheel",
      pointerX = 0,
      pointerY = 0,
      airX = 0,
      airY = 0,
      tapTimer: ReturnType<typeof setTimeout> | undefined;

    const wake = () => {
      if (alive && !document.hidden && !frame) frame = requestAnimationFrame(tick);
    };

    const measure = () => {
      width = innerWidth;
      height = stage.clientHeight;
      maxScroll.current = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      target = scrollY;
      lastRendered = -1;
      wake();
    };

    const scroll = () => {
      target = scrollY;
      wake();
    };
    const wheel = () => {
      input = "wheel";
    };
    const touch = () => {
      input = "touch";
    };
    const changeMotion = () => {
      reduceRef.current = media.matches;
      setReduced(media.matches);
      pointerX = pointerY = 0;
      lastRendered = -1;
      wake();
    };

    const pointer = (e: PointerEvent) => {
      if (e.pointerType === "touch" || reduceRef.current || target / maxScroll.current > 0.13) return;
      pointerX = (e.clientX / width) * 2 - 1;
      pointerY = (e.clientY / height) * 2 - 1;
      wake();
    };

    const leave = () => {
      pointerX = pointerY = 0;
      wake();
    };

    const tap = (e: PointerEvent) => {
      if (
        e.pointerType !== "touch" ||
        reduceRef.current ||
        target / maxScroll.current > 0.1 ||
        (e.target instanceof Element && e.target.closest("button,a"))
      )
        return;
      pointerX = ((e.clientX / width) * 2 - 1) * 1.5;
      pointerY = ((e.clientY / height) * 2 - 1) * 1.5;
      clearTimeout(tapTimer);
      tapTimer = setTimeout(leave, 900);
      wake();
    };

    const visibility = () => {
      flag(el, "data-page-visible", !document.hidden);
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
        last = 0;
      } else {
        target = scrollY;
        wake();
      }
    };

    const move = (name: string, x: number, y: number, scale = 1, rotate = 0, opacity = 1) => {
      if (!active.has(owners[name])) return;
      const n = nodes[name];
      if (!n) return;
      style(
        n,
        "transform",
        `translate3d(${((x * width) / 100).toFixed(3)}px,${((y * height) / 100).toFixed(3)}px,0) scale(${scale.toFixed(4)}) rotate(${rotate.toFixed(3)}deg)`
      );
      style(n, "opacity", opacity.toFixed(4));
    };

    const scene = (name: string, start: number, arrive: number, depart: number, end: number, p: number) => {
      const n = scenes[name];
      let y = (1 - ease(part(p, start, arrive))) * 100 - ease(part(p, depart, end)) * 105;
      let visible = p >= start - 0.025 && p <= end + 0.015;
      if (name === "opening") {
        y = 0;
        visible = p < 0.195;
      }
      if (name === "final") {
        y = (1 - ease(part(p, start, arrive))) * 100;
        visible = p >= start - 0.025;
      }
      if (reduceRef.current) {
        visible = p >= start && (name === "final" || p < end);
        y = 0;
      }
      flag(n, "data-active", visible);
      style(n, "visibility", visible ? "visible" : "hidden");
      const interactive = visible && Math.abs(y) < 15;
      style(n, "pointerEvents", interactive ? "auto" : "none");
      if (n.inert === interactive) n.inert = !interactive;
      flag(n, "aria-hidden", !interactive);
      if (visible) {
        active.add(name);
        ys[name] = y;
        style(n, "transform", `translate3d(0,${((y * height) / 100).toFixed(3)}px,0)`);
      }
    };

    const render = (p: number) => {
      const r = reduceRef.current;
      active.clear();
      scene("opening", 0, 0, 0.15, 0.255, p);
      scene("gate", 0.105, 0.175, 0.255, 0.315, p);
      scene("events", 0.265, 0.315, 0.412, 0.468, p);
      scene("couple", 0.413, 0.462, 0.516, 0.573, p);
      scene("portrait", 0.516, 0.575, 0.64, 0.69, p);
      scene("venue", 0.645, 0.69, 0.735, 0.791, p);
      scene("blessing", 0.744, 0.792, 0.83, 0.878, p);
      scene("memories", 0.837, 0.877, 0.932, 0.978, p);
      scene("final", 0.93, 0.99, 1, 1.01, p);

      let owner = "opening";
      for (const n of ["opening", "gate", "events", "couple", "portrait", "venue", "blessing", "memories", "final"]) {
        if (active.has(n) && Math.abs(ys[n]) <= 50) owner = n;
      }
      stageState.presence = Math.max(0, 1 - Math.abs(ys[owner] ?? 0) / 100);
      if (stageState.scene !== owner) {
        stageState.scene = owner;
        dispatchEvent(new Event(SCENE_EVENT));
      }

      move("blessing-controls", 0, 0, 1, 0, part(p, 0.47, 0.49));
      move("opening-title", 0, r ? 0 : -part(p, 0.012, 0.115) * 83, 1, 0, 1 - part(p, 0.055, 0.11));
      move("opening-temple", 0, r ? 0 : 85 - part(p, 0, 0.235) * 225, r ? 1 : 0.91 + part(p, 0, 0.19) * 0.28);
      move("opening-hint", 0, 0, 1, 0, 1 - part(p, 0, 0.035));
      move("opening-atmosphere", 0, r ? 0 : -part(p, 0, 0.15) * 28, 1, 0, 1 - ease(part(p, 0.065, 0.16)));
      move("invitation-words", 0, r ? 0 : 10 - part(p, 0.13, 0.25) * 14, 1, 0, part(p, 0.145, 0.178));
      move("gate-frame", 0, r ? 0 : -part(p, 0.18, 0.265) * 7, 1 + part(p, 0.15, 0.26) * 0.05);
      move("event-window", 0, r ? 0 : 3 - part(p, 0.3, 0.43) * 6, r ? 1 : 0.99 + part(p, 0.3, 0.43) * 0.02);
      move("event-surround", 0, r ? 0 : 2 - part(p, 0.27, 0.43) * 4);

      if (active.has("events")) {
        const numEvents = eventCards.length || 1;
        if (numEvents <= 1) {
          style(nodes["event-reel"], "transform", "translate3d(0%,0,0)");
          if (nodes["pip-0"]) style(nodes["pip-0"], "opacity", "1");
        } else {
          const t = part(p, 0.33, 0.405);
          const continuous = t * (numEvents - 1);
          const baseIndex = Math.floor(continuous);
          const frac = continuous - baseIndex;
          const easedContinuous = baseIndex + ease(frac);

          eventCards.forEach((n, i) => {
            const inert = Math.abs(easedContinuous - i) > 0.45;
            if (n.inert !== inert) n.inert = inert;
          });

          const reelTranslate = -easedContinuous * (100 / numEvents);
          style(nodes["event-reel"], "transform", `translate3d(${reelTranslate.toFixed(4)}%,0,0)`);

          for (let i = 0; i < numEvents; i++) {
            const pipNode = nodes[`pip-${i}`];
            if (pipNode) {
              const dist = Math.abs(easedContinuous - i);
              const opacity = Math.max(0.35, 1 - dist * 0.65);
              style(pipNode, "opacity", opacity.toFixed(4));
            }
          }
        }
      }

      move("couple-temple", 0, r ? 0 : 16 - part(p, 0.437, 0.54) * 35, 1 + part(p, 0.44, 0.53) * 0.1);
      move("illustrated-couple", 0, r ? 0 : 55 - part(p, 0.44, 0.525) * 72, r ? 1 : 0.8 + part(p, 0.44, 0.525) * 0.23);
      move("portrait-intro", 0, r ? 0 : 7 - part(p, 0.566, 0.64) * 10, 1, 0, part(p, 0.551, 0.582));
      move("gold-portrait", 0, r ? 0 : 43 - part(p, 0.572, 0.625) * 48, r ? 1 : 0.9 + part(p, 0.58, 0.64) * 0.1);
      move("temple-procession", 0, r ? 0 : 45 - part(p, 0.61, 0.665) * 61, 1.1);
      move("venue-copy", 0, r ? 0 : 16 - part(p, 0.674, 0.737) * 29, 1, 0, part(p, 0.67, 0.695));
      move("venue-temple", 0, r ? 0 : 35 - part(p, 0.674, 0.745) * 47, 1);
      move("blessing-copy", 0, r ? 0 : 14 - part(p, 0.773, 0.833) * 21, 1, 0, part(p, 0.77, 0.795));
      move("countdown-heading", 0, r ? 0 : -part(p, 0.885, 0.927) * 53, 1, 0, 1 - part(p, 0.912, 0.93));
      move("memories-heading", 0, r ? 0 : 17 - part(p, 0.886, 0.932) * 25, 1, 0, part(p, 0.884, 0.903) * (1 - part(p, 0.934, 0.95)));

      if (active.has("memories")) {
        const gather = ease(part(p, 0.892, 0.936)),
          fly = ease(part(p, 0.936, 0.974));
        [
          [-36, 28, -19],
          [35, 37, 17],
          [-24, 62, 12],
          [28, 70, -14],
          [4, 83, -8]
        ].forEach(([x, y, rot], i) =>
          move(
            `memory-${i}`,
            r ? 0 : x * (1 - gather) + Math.sin(i * 2) * fly * 60,
            r ? 0 : y * (1 - gather) + 14 * gather - fly * (50 + i * 12),
            r ? 0.4 : 0.58 + gather * 0.15 - fly * 0.33,
            rot * (1 - gather) + i * 6 * gather - fly * rot,
            part(p, 0.881 + i * 0.003, 0.9 + i * 0.003) * (1 - fly)
          )
        );
      }

      move("final-landscape", 0, r ? 0 : 12 - part(p, 0.94, 1) * 12, 1.02);
      move("final-words", 0, r ? 0 : 12 - part(p, 0.96, 0.995) * 12, 1, 0, part(p, 0.955, 0.985));
    };

    function tick(time: number) {
      frame = 0;
      const dt = last ? Math.min(time - last, 64) : 16.67;
      last = time;
      const damping = reduceRef.current ? 1 : 1 - Math.exp(-dt / (input === "touch" ? 80 : 190));
      smoothed += (target - smoothed) * damping;
      if (Math.abs(target - smoothed) < 0.12) smoothed = target;
      const p = clamp(smoothed / maxScroll.current),
        settled = smoothed === target;
      flag(el, "data-scroll-moving", !settled);
      if (lastRendered !== smoothed) {
        lastRendered = smoothed;
        render(p);
      }
      if (active.has("opening") && !reduceRef.current) {
        const f = 1 - Math.exp(-dt / 240);
        airX += (pointerX - airX) * f;
        airY += (pointerY - airY) * f;
        if (Math.abs(pointerX - airX) < 0.001) airX = pointerX;
        if (Math.abs(pointerY - airY) < 0.001) airY = pointerY;
        air.forEach(({ node, depth }) =>
          style(
            node,
            "transform",
            `translate3d(${(airX * depth).toFixed(2)}px,${(airY * depth * 0.6).toFixed(2)}px,0)`
          )
        );
      }
      const pointerMoving = active.has("opening") && !reduceRef.current && (airX !== pointerX || airY !== pointerY);
      if (!settled || pointerMoving) wake();
      else last = 0;
    }

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("wheel", wheel, { passive: true });
    window.addEventListener("touchstart", touch, { passive: true });
    window.addEventListener("pointermove", pointer, { passive: true });
    window.addEventListener("pointerdown", tap, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", visibility);
    media.addEventListener("change", changeMotion);

    Promise.allSettled(Array.from(el.querySelectorAll<HTMLImageElement>("img")).map((im) => im.decode())).then(() => {
      if (alive) {
        setReady(true);
        measure();
      }
    });
    measure();

    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      clearTimeout(tapTimer);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("touchstart", touch);
      window.removeEventListener("pointermove", pointer);
      window.removeEventListener("pointerdown", tap);
      document.documentElement.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", visibility);
      media.removeEventListener("change", changeMotion);
    };
  }, [data.events?.length]);

  const rawActiveEvents = data.events && data.events.length > 0 ? data.events : defaultWeddingData.events;
  const activeEvents = (rawActiveEvents || []).filter(
    (e) => !/the wedding ceremony/i.test(e.title || "") && e.id !== "event-3"
  );
  const currentEvent = typeof event === "number" && activeEvents[event] ? activeEvents[event] : null;

  return (
    <div ref={root} id="invitation-top" className={`invitation-film ${ready ? "ready" : ""} ${reduced ? "reduced" : ""}`}>
      <div className="film-loader" aria-hidden={ready}>
        <span className="loader-monogram">{(data.monogram || "S&J").toUpperCase()}</span>
        <div />
        <span className="eyebrow">UNFOLDING OUR STORY</span>
      </div>

      <FilmScenes data={data} onDetails={setEvent} />
      <Celebration disabled={reduced} />
      <div className="scroll-track" aria-hidden="true" />

      <a className="film-monogram" href="#invitation-top" aria-label="Return to the beginning">
        {(data.monogram || "S&J").toUpperCase()}
      </a>

      <Dialog
        open={event !== null}
        onOpenChange={(open) => {
          if (!open) setEvent(null);
        }}
      >
        <DialogContent className="event-dialog">
          {event === "muhurtham" ? (
            <>
              <span className="eyebrow">
                {data.brideName.toUpperCase()} & {data.groomName.toUpperCase()} · AUSPICIOUS MUHURTHAM
              </span>
              <DialogTitle className="dialog-title">The Wedding Ceremony & Muhurtham</DialogTitle>
              <DialogDescription className="dialog-description">
                {data.muhurthamDetails ||
                  "With the blessings of our families, join us as we step into forever under sacred chants and auspicious blessings. A traditional feast follows the ceremony."}
              </DialogDescription>
              <p className="dialog-date">
                {data.displayDate}
                <br />
                {data.muhurthamTime}
              </p>
              <p>
                {data.venueName} · {data.city}
              </p>
              <a className="gold-button wine-button" href="/ananya-karthik-wedding.ics" download>
                Save the celebrations <CalendarDays size={16} />
              </a>
            </>
          ) : currentEvent ? (
            <>
              <span className="eyebrow">
                {data.brideName.toUpperCase()} & {data.groomName.toUpperCase()} · THE CELEBRATIONS
              </span>
              <DialogTitle className="dialog-title">{currentEvent.title}</DialogTitle>
              <DialogDescription className="dialog-description">{currentEvent.copy}</DialogDescription>
              <p className="dialog-date">
                {currentEvent.date}
                <br />
                {currentEvent.time}
              </p>
              <p>{currentEvent.venue}</p>
              <a className="gold-button wine-button" href="/ananya-karthik-wedding.ics" download>
                Save the celebrations <CalendarDays size={16} />
              </a>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
