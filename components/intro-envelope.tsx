"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { WeddingData } from "@/lib/types/wedding";

/* ═══════════════════════════════════════════════════════════════════════════
   SUPPLIED ASSETS — Mobile & Window Screen (Desktop / Laptop)
   Pixel-perfect 1:1 locked coordinates with matching native aspect ratios
   ═══════════════════════════════════════════════════════════════════════════ */

const ASSETS = {
  mobile: {
    image: "/Intro/intro_image_mobile.png",
    video: "/Intro/Final_intro_mobile.mp4",
    w: 2160,
    h: 3840,
    sealTopPct: 51.8,
    sealSize: 180,
    textTopPct: 63.8,
  },
  desktop: {
    image: "/Intro/intro_image_laptop.png",
    video: "/Intro/Final_intro_window.mp4",
    w: 3840,
    h: 2160,
    sealTopPct: 53.6,
    sealSize: 420,
    textTopPct: 81.9,
  },
} as const;

interface IntroEnvelopeProps {
  data: WeddingData;
}

type Phase = "idle" | "playing" | "glow_fade_in" | "glow_fade_out" | "done";

export function IntroEnvelope({ data }: IntroEnvelopeProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [isGlowVisible, setIsGlowVisible] = useState<boolean>(false);
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return true; // Default to mobile for SSR: clients open on mobile screens
    const urlParams = new URLSearchParams(window.location.search);
    const forceView = urlParams.get("view")?.toLowerCase();
    if (forceView === "desktop" || forceView === "window") return false;
    if (forceView === "mobile") return true;
    return window.innerWidth < 768 || window.innerWidth < window.innerHeight;
  });
  const [stageW, setStageW] = useState<number>(0);
  const [stageH, setStageH] = useState<number>(0);

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const triggeredRef = useRef<boolean>(false);
  const fadeOutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const finishTimerRef = useRef<NodeJS.Timeout | null>(null);

  /* ─── Compute True Cover-Fit Dimensions to accurately fill any mobile or desktop screen with 0 blank space ─── */
  useEffect(() => {
    const measure = () => {
      const overlay = overlayRef.current;
      // Get the true rendered viewport dimensions from overlay client rect or window/visualViewport
      const vw = overlay?.clientWidth || window.innerWidth || (typeof document !== "undefined" ? document.documentElement.clientWidth : 0);
      const vh = overlay?.clientHeight || (window.visualViewport ? window.visualViewport.height : window.innerHeight);

      if (!vw || !vh) return;

      const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const forceView = urlParams?.get("view")?.toLowerCase();
      let mobile: boolean;
      if (forceView === "mobile") {
        mobile = true;
      } else if (forceView === "desktop" || forceView === "window") {
        mobile = false;
      } else {
        mobile = vw < 768 || vw < vh;
      }
      setIsMobile(mobile);

      const a = mobile ? ASSETS.mobile : ASSETS.desktop;

      // Exact mathematical COVER scale:
      // scale = max(viewportWidth / assetWidth, viewportHeight / assetHeight)
      // This mathematically guarantees that the stage is AT LEAST as wide as the screen,
      // and AT LEAST as tall as the screen under ALL conditions.
      const scale = Math.max(vw / a.w, vh / a.h);

      // Add a 6px subpixel anti-aliasing cushion so subpixel rendering on high-DPI screens never leaves a 1px gap
      const sw = Math.ceil(a.w * scale) + 6;
      const sh = Math.ceil(a.h * scale) + 6;

      setStageW(sw);
      setStageH(sh);
    };

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    if (typeof window !== "undefined" && window.visualViewport) {
      window.visualViewport.addEventListener("resize", measure);
    }
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
      if (typeof window !== "undefined" && window.visualViewport) {
        window.visualViewport.removeEventListener("resize", measure);
      }
    };
  }, []);

  const currentAssets = isMobile ? ASSETS.mobile : ASSETS.desktop;

  /* ─── Preload the static image ─── */
  useEffect(() => {
    const img = new Image();
    img.src = currentAssets.image;
  }, [currentAssets.image]);

  /* ─── Lock body & document scroll completely while the intro overlay is active ─── */
  useEffect(() => {
    if (phase === "done") return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    const preventTouch = (e: TouchEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    window.addEventListener("touchmove", preventTouch, { passive: false });

    // Pin scroll to top
    if (typeof window !== "undefined" && window.scrollY !== 0) {
      window.scrollTo(0, 0);
    }

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.touchAction = prevBodyTouchAction;
      window.removeEventListener("touchmove", preventTouch);
    };
  }, [phase]);

  /* ─── Clean up timers on unmount ─── */
  useEffect(() => {
    return () => {
      if (fadeOutTimerRef.current) clearTimeout(fadeOutTimerRef.current);
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    };
  }, []);

  /* ─── Smooth & Soft Golden Glowing Transition: Fade-In then Slow Luxurious Fade-Out ─── */
  const triggerGlowTransition = useCallback(() => {
    if (phase === "glow_fade_in" || phase === "glow_fade_out" || phase === "done") return;

    setPhase("glow_fade_in");

    // 1. Softly fade in royal golden glow over 900ms
    requestAnimationFrame(() => {
      setIsGlowVisible(true);
    });

    // 2. Once peak glow is reached (950ms), seamlessly switch off intro under the solid golden light
    fadeOutTimerRef.current = setTimeout(() => {
      setShowIntro(false);
      setPhase("glow_fade_out");

      // Give browser 1 frame to ensure showIntro is unmounted before beginning slow fade-out
      requestAnimationFrame(() => {
        setIsGlowVisible(false);
      });

      // 3. Slow, smooth fade-out over 1800ms (1.8s) reveals the wedding project gracefully with zero lag
      finishTimerRef.current = setTimeout(() => {
        setPhase("done");
        window.dispatchEvent(new CustomEvent("intro:complete"));
      }, 1850);
    }, 950);
  }, [phase]);

  /* ─── Start video playback & customized audio on user tap ─── */
  const handleOpen = useCallback(() => {
    if (triggeredRef.current || phase !== "idle") return;
    triggeredRef.current = true;

    // 1. Notify that the seal has been clicked and intro opened
    window.dispatchEvent(new CustomEvent("wedding:intro:opened"));

    // 2. Trigger customized wedding soundtrack playback configured in the admin portal
    window.dispatchEvent(new CustomEvent("wedding:audio:play"));
    if (typeof document !== "undefined") {
      const soundtrack = document.getElementById("wedding-soundtrack") as HTMLAudioElement | null;
      if (soundtrack && soundtrack.paused) {
        soundtrack.play().catch((err) => {
          console.warn("Customized audio playback notice:", err);
        });
      }
    }

    // 2. Begin intro video playback seamlessly with zero delay
    setPhase("playing");

    const video = videoRef.current;
    if (video) {
      video.muted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Video playback notice:", err);
          triggerGlowTransition();
        });
      }
    } else {
      triggerGlowTransition();
    }
  }, [phase, triggerGlowTransition]);

  /* ─── Monitor video playback time to initiate golden glow at the climax ─── */
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || phase !== "playing") return;

    if (video.duration && video.duration > 0) {
      const remainingTime = video.duration - video.currentTime;
      // Start smooth golden glow fade-in ~0.85s before video finishes
      if (remainingTime <= 0.85) {
        triggerGlowTransition();
      }
    }
  }, [phase, triggerGlowTransition]);

  /* ─── Video ended event fallback ─── */
  const handleVideoEnded = useCallback(() => {
    triggerGlowTransition();
  }, [triggerGlowTransition]);

  /* ─── Once done, unmount overlay completely ─── */
  if (phase === "done") return null;

  return (
    <>
      {/* ── Intro Envelope Overlay (Visible during idle, playback, and glow fade-in) ── */}
      {showIntro && (
        <div
          ref={overlayRef}
          onClick={phase === "idle" ? handleOpen : undefined}
          onKeyDown={
            phase === "idle"
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleOpen();
                  }
                }
              : undefined
          }
          onTouchMove={(e) => {
            // Prevent any background scrolling or browser toolbar movements during intro
            if (e.cancelable) e.preventDefault();
          }}
          role={phase === "idle" ? "button" : undefined}
          tabIndex={phase === "idle" ? 0 : undefined}
          aria-label="Tap the seal to open the wedding invitation"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100%",
            height: "100%",
            zIndex: 99998,
            overflow: "hidden",
            backgroundColor: "#f7f4ed",
            cursor: phase === "idle" ? "pointer" : "default",
            touchAction: "none",
            overscrollBehavior: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >
          {/* ── Stage: cover-fit container accurately filling both screen types with zero blank space ── */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: stageW ? `${stageW}px` : "100%",
              height: stageH ? `${stageH}px` : "100%",
              minWidth: "100%",
              minHeight: "100%",
              transform: "translate(-50%, -50%)",
              overflow: "hidden",
              backgroundColor: "#f7f4ed",
            }}
          >
            {/* 1. Ultra-HD Video Element with Native Poster — Zero shutter, zero flicker */}
            <video
              ref={videoRef}
              key={currentAssets.video}
              src={currentAssets.video}
              poster={currentAssets.image}
              playsInline
              preload="auto"
              muted
              autoPlay={false}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleVideoEnded}
              onError={() => {
                console.warn("Video failed to load, fallback to direct open");
                if (phase === "playing") triggerGlowTransition();
              }}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
                display: "block",
                pointerEvents: "none",
                zIndex: 1,
                backgroundColor: "#f7f4ed",
              }}
            />

            {/* 3. Center Wax Seal Hotspot (Zero hover effect, purely natural cursor: pointer) */}
            {phase === "idle" && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpen();
                }}
                role="button"
                tabIndex={0}
                aria-label="Click seal to open invitation"
                className="wax-seal-hotspot"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: `${currentAssets.sealTopPct}%`,
                  width: `${currentAssets.sealSize}px`,
                  height: `${currentAssets.sealSize}px`,
                  transform: "translate(-50%, -50%)",
                  borderRadius: "50%",
                  cursor: "pointer",
                  zIndex: 10,
                  background: "transparent",
                }}
              />
            )}

            {/* 4. Elegant "Tap to open" with upward chevron ^ above, placed accurately below the seal */}
            {phase === "idle" && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpen();
                }}
                role="button"
                tabIndex={0}
                className="tap-to-open-text-wrap"
                aria-label="Tap to open"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: `${currentAssets.textTopPct}%`,
                  transform: "translateX(-50%)",
                  zIndex: 10,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: isMobile ? "4px" : "0px",
                  whiteSpace: "nowrap",
                  userSelect: "none",
                  animation: "text-gentle-breathe 2.8s ease-in-out infinite",
                }}
              >
                {/* Upward chevron ^ above the text */}
                <svg
                  width={isMobile ? "100" : "100"}
                  height={isMobile ? "8" : "18"}
                  viewBox="0 0 16 9"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{
                    display: "block",
                    animation: "chevron-float 2.2s ease-in-out infinite",
                  }}
                >
                  <path
                    d="M1.5 7.5L8 1.5L14.5 7.5"
                    stroke="#7a6248ff"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                {/* TAP TO OPEN label matching classic luxury typography */}
                <span
                  style={{
                    fontFamily: "Cormorant, Georgia, serif",
                    fontSize: isMobile ? "14px" : "25px",
                    fontWeight: 500,
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    color: "#4f311370",
                    textShadow: "0 1px 1px rgba(145, 100, 52, 0.34)",
                    paddingLeft: "0.32em",
                  }}
                >
                  Tap to open
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Soft & Smooth Royal Golden Glowing Transition Veil (Slow 1.8s Smooth Fade-Out) ── */}
      {(phase === "glow_fade_in" || phase === "glow_fade_out") && (
        <div
          className="royal-gold-glow-veil"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100%",
            height: "100%",
            zIndex: 99999,
            pointerEvents: "none",
            overflow: "hidden",
            willChange: "opacity",
            transform: "translateZ(0)",
            opacity: isGlowVisible ? 1 : 0,
            transition:
              phase === "glow_fade_in"
                ? "opacity 0.9s cubic-bezier(0.33, 1, 0.68, 1)"
                : "opacity 1.8s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Layer 1: 100% Solid warm royal golden radiance base — completely covers intro */}
          <div
            style={{
              position: "absolute",
              inset: "-5%",
              width: "110%",
              height: "110%",
              background:
                "radial-gradient(ellipse at 50% 50%, #fffef7 0%, #fff8de 20%, #f7df98 48%, #eac26e 75%, #dcad4e 100%)",
              transform: isGlowVisible ? "scale(1.03)" : "scale(0.97)",
              transition: "transform 2.7s cubic-bezier(0.25, 1, 0.5, 1)",
            }}
          />

          {/* Layer 2: Ethereal radiant golden aura & celestial morning sheen */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 50% 48%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 246, 215, 0.8) 32%, rgba(244, 214, 134, 0.5) 60%, transparent 100%)",
              mixBlendMode: "screen",
            }}
          />

          {/* Layer 3: Warm golden ambiance matching project opening scene */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at 50% 30%, rgba(255, 250, 230, 0.85) 0%, rgba(246, 224, 160, 0.45) 45%, rgba(198, 216, 206, 0.25) 80%, transparent 100%)",
            }}
          />
        </div>
      )}

      {/* ── Scoped Animation Styles ── */}
      <style>{`
        .wax-seal-hotspot {
          outline: none;
          -webkit-tap-highlight-color: transparent;
        }

        .tap-to-open-text-wrap:hover span {
          color: #5c3f2b !important;
        }

        .tap-to-open-text-wrap:hover svg path {
          stroke: #5c3f2b !important;
        }

        @keyframes chevron-float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }

        @keyframes text-gentle-breathe {
          0%, 100% {
            opacity: 0.85;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
