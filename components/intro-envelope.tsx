"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { WeddingData } from "@/lib/types/wedding";

const INTRO_ASSETS = [
  "/Intro/Invi intro.png",
  "/Intro/Intro seel glow.png",
  "/Intro/Invi with glow.png",
  "/Intro/Flow glowing intro.png",
  "/Intro/Opening with intro glowing.png"
];

const DEFAULT_AUDIO_URL = "/Intro/WhatsApp Video 2026-09-28 at 3.19.00 AM.mp4";

interface IntroEnvelopeProps {
  data: WeddingData;
}

// Keyframe stages mapped directly to the Master Prompt specification:
// Keyframe 1: "idle"         - Calm closed invitation, awaiting explicit user tap
// Keyframe 2: "illuminating" - Floral artwork and central seal begin to softly illuminate (0ms - 450ms)
// Keyframe 3 & 4: "flowing"  - Champagne gold glow flowing naturally through floral vines & branches (450ms - 1450ms)
// Keyframe 5 & 6: "opening"  - Envelope flap sections separate, warm golden light appears from inside (1450ms - 2500ms)
// Keyframe 7: "radiant"      - Volumetric rays widen, bloom expands, camera pushes forward (2500ms - 3350ms)
// Keyframe 8: "revealing"    - Champagne-white illumination fills screen, gently dissolves to reveal website (3350ms - 4150ms)
// Keyframe 9: "complete"     - Overlay completely unmounted, wedding website active
type CinematicStage =
  | "idle"
  | "illuminating"
  | "flowing"
  | "opening"
  | "radiant"
  | "revealing"
  | "complete";

export function IntroEnvelope({ data }: IntroEnvelopeProps) {
  const [stage, setStage] = useState<CinematicStage>("idle");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [assetsReady, setAssetsReady] = useState<boolean>(false);
  const [isRevealingDissolve, setIsRevealingDissolve] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasTriggeredRef = useRef<boolean>(false);

  const audioSrc = data.audioUrl?.trim() || DEFAULT_AUDIO_URL;

  // Pre-decode all 5 master images on mount for 60FPS fluid transitions
  useEffect(() => {
    let isMounted = true;
    const decodePromises = INTRO_ASSETS.map((src) => {
      const img = new Image();
      img.src = src;
      return img.decode().catch(() => {});
    });

    Promise.all(decodePromises).then(() => {
      if (isMounted) setAssetsReady(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Lock body scroll while the cinematic intro overlay is active
  useEffect(() => {
    if (stage !== "complete") {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [stage]);

  // Synchronize audio mute state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  function handleOpenEnvelope() {
    if (hasTriggeredRef.current || stage !== "idle") return;
    hasTriggeredRef.current = true;

    // Start background wedding music immediately upon user tap
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("Audio autoplay blocked by browser policy:", err);
        });
    }

    // Keyframe 2: Seal and floral artwork begin to illuminate
    setStage("illuminating");

    // Keyframe 3 & 4: Flowing champagne-gold light trails stream through floral vines
    setTimeout(() => {
      setStage("flowing");
    }, 450);

    // Keyframe 5 & 6: Envelope sections physically separate, warm interior light emerges
    setTimeout(() => {
      setStage("opening");
    }, 1450);

    // Keyframe 7: Volumetric light rays expand, camera pushes in gently
    setTimeout(() => {
      setStage("radiant");
    }, 2500);

    // Keyframe 8: Champagne-white illumination expands to fill the screen
    setTimeout(() => {
      setStage("revealing");
    }, 3350);

    // Light gently dissolves away, revealing the wedding website content
    setTimeout(() => {
      setIsRevealingDissolve(true);
    }, 3700);

    // Keyframe 9: Complete cinematic ceremony and unmount overlay
    setTimeout(() => {
      setStage("complete");
    }, 4150);
  }

  function toggleAudioPlayback() {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }

  return (
    <>
      {/* Background Wedding Soundtrack */}
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="auto"
        loop
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Floating Royal Audio Controller Widget (Remains accessible on the invitation) */}
      <div
        className={`fixed bottom-5 right-5 z-40 transition-all duration-700 ease-out ${
          stage === "opening" || stage === "radiant" || stage === "revealing" || stage === "complete" || isPlaying
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <button
          onClick={toggleAudioPlayback}
          className="group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-[#fffaf0]/95 backdrop-blur-md border border-[#bc965e] shadow-lg shadow-[#946f35]/25 hover:border-[#946f35] hover:bg-[#fff7ea] hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer text-[#55313c]"
          title={isPlaying ? "Pause wedding music" : "Play wedding music"}
          aria-label={isPlaying ? "Pause wedding music" : "Play wedding music"}
        >
          {/* Animated 3-Bar Equalizer */}
          <div className="flex items-end gap-[3px] h-3.5 px-0.5" aria-hidden="true">
            <span
              className={`w-[2.5px] bg-[#bc965e] rounded-full transition-all duration-300 ${
                isPlaying && !isMuted ? "h-3.5 animate-pulse" : "h-1"
              }`}
            />
            <span
              className={`w-[2.5px] bg-[#946f35] rounded-full transition-all duration-300 ${
                isPlaying && !isMuted ? "h-2 animate-bounce" : "h-1"
              }`}
            />
            <span
              className={`w-[2.5px] bg-[#bc965e] rounded-full transition-all duration-300 ${
                isPlaying && !isMuted ? "h-3 animate-pulse" : "h-1"
              }`}
            />
          </div>

          {/* Speaker Line Icon */}
          <div className="text-[#946f35] group-hover:text-[#55313c] transition-colors">
            {isMuted || !isPlaying ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </div>

          {/* Typography Label */}
          <span className="font-serif text-xs font-semibold tracking-wider uppercase text-[#55313c] pr-1">
            {isPlaying && !isMuted ? "Sound on" : "Music"}
          </span>
        </button>
      </div>

      {/* Main Cinematic Intro Overlay */}
      {stage !== "complete" && (
        <div
          onClick={handleOpenEnvelope}
          className={`fixed inset-0 z-50 flex items-center justify-center select-none overflow-hidden cursor-pointer transition-opacity duration-700 ease-out ${
            isRevealingDissolve ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          style={{
            background:
              "radial-gradient(ellipse at center, #1e110c 0%, #120805 55%, #080302 100%)"
          }}
          role="button"
          tabIndex={0}
          aria-label="Tap to open the wedding invitation"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleOpenEnvelope();
            }
          }}
        >
          {/* Subtle Ambient Floating Golden Motes in Atmosphere */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
            <div className="ambient-mote mote-1" />
            <div className="ambient-mote mote-2" />
            <div className="ambient-mote mote-3" />
            <div className="ambient-mote mote-4" />
          </div>

          {/* Master Invitation Card Container (Fills mobile viewport, maintains exact artwork proportions) */}
          <div
            className={`relative w-full h-full max-w-[460px] max-h-[840px] sm:h-[92vh] sm:rounded-2xl overflow-hidden shadow-2xl transition-all duration-1000 ease-out [perspective:1400px] [transform-style:preserve-3d] ${
              stage === "radiant" || stage === "revealing"
                ? "sm:scale-[1.06] shadow-[0_0_90px_rgba(223,190,125,0.7)]"
                : stage === "opening"
                ? "sm:scale-[1.03] shadow-[0_0_60px_rgba(223,190,125,0.5)]"
                : "shadow-[0_20px_60px_rgba(0,0,0,0.85)] border-0 sm:border sm:border-[#bc965e]/50"
            }`}
            style={{
              transform:
                stage === "radiant"
                  ? "scale(1.08)"
                  : stage === "opening"
                  ? "scale(1.03)"
                  : stage === "flowing"
                  ? "scale(1.015)"
                  : "scale(1)"
            }}
          >
            {/* ========================================================
                KEYFRAME 7 & 8: INTERIOR OPEN ENVELOPE WITH LIGHT CAVITY
                (Revealed behind separating sections as envelope opens)
                ======================================================== */}
            <img
              src="/Intro/Opening with intro glowing.png"
              alt="Open Wedding Envelope"
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
              style={{
                opacity: stage === "opening" || stage === "radiant" || stage === "revealing" ? 1 : 0,
                transition: "opacity 900ms cubic-bezier(0.25, 1, 0.5, 1)"
              }}
            />

            {/* ========================================================
                VOLUMETRIC WARM LIGHT BEAMS FROM CENTRAL OPENING
                (Originates from actual center opening at 50%, 48.5%)
                ======================================================== */}
            <div
              className="absolute left-1/2 top-[48.5%] -translate-x-1/2 pointer-events-none transition-all duration-1000 ease-out origin-bottom"
              style={{
                width: "90%",
                height: "65%",
                transform:
                  stage === "radiant" || stage === "revealing"
                    ? "translateX(-50%) translateY(-100%) scaleY(1.4) scaleX(1.2)"
                    : stage === "opening"
                    ? "translateX(-50%) translateY(-100%) scaleY(1.15) scaleX(1.0)"
                    : "translateX(-50%) translateY(-100%) scaleY(0) scaleX(0.3)",
                opacity: stage === "opening" ? 0.85 : stage === "radiant" || stage === "revealing" ? 1 : 0,
                background:
                  "linear-gradient(to top, rgba(255,248,225,1) 0%, rgba(240,215,145,0.85) 30%, rgba(188,150,94,0.35) 70%, transparent 100%)",
                clipPath: "polygon(20% 100%, 80% 100%, 100% 0%, 0% 0%)",
                filter: "blur(12px)"
              }}
            />

            {/* Secondary diffused atmospheric bloom */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-1000 ease-out"
              style={{
                opacity: stage === "radiant" || stage === "revealing" ? 0.9 : stage === "opening" ? 0.5 : 0,
                background:
                  "radial-gradient(circle at 50% 48.5%, rgba(255, 245, 215, 0.95) 0%, rgba(235, 205, 140, 0.45) 45%, transparent 75%)"
              }}
            />

            {/* ========================================================
                KEYFRAME 4: FLOWING GLOWING VINES & BRANCHES
                (Animated expanding radial wave mask creates genuine
                 light movement traveling along the floral ornamentation)
                ======================================================== */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-600 ease-out"
              style={{
                opacity:
                  stage === "flowing" || stage === "opening"
                    ? 1
                    : stage === "illuminating"
                    ? 0.5
                    : 0,
                maskImage:
                  stage === "flowing" || stage === "opening" || stage === "radiant"
                    ? "radial-gradient(circle at 50% 48.5%, black 0%, black 85%, transparent 100%)"
                    : "radial-gradient(circle at 50% 48.5%, black 0%, black 15%, transparent 35%)",
                WebkitMaskImage:
                  stage === "flowing" || stage === "opening" || stage === "radiant"
                    ? "radial-gradient(circle at 50% 48.5%, black 0%, black 85%, transparent 100%)"
                    : "radial-gradient(circle at 50% 48.5%, black 0%, black 15%, transparent 35%)",
                transition: "mask-image 1000ms cubic-bezier(0.25, 0.1, 0.25, 1), -webkit-mask-image 1000ms cubic-bezier(0.25, 0.1, 0.25, 1), opacity 600ms ease-out"
              }}
            >
              <img
                src="/Intro/Flow glowing intro.png"
                alt="Glowing Floral Relief"
                className="w-full h-full object-cover object-center pointer-events-none"
              />
            </div>

            {/* ========================================================
                KEYFRAME 2 & 3: WAX SEAL ILLUMINATION & FIRST WAVE
                ======================================================== */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-500 ease-out"
              style={{
                opacity: stage === "illuminating" ? 1 : 0
              }}
            >
              <img
                src="/Intro/Intro seel glow.png"
                alt="Illuminated Wax Seal"
                className="w-full h-full object-cover object-center pointer-events-none"
              />
            </div>

            {/* ========================================================
                KEYFRAME 1: MASTER CLOSED INVITATION ENVELOPE
                (Active during idle; fades as light awakens)
                ======================================================== */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-700 ease-out"
              style={{
                opacity: stage === "idle" ? 1 : 0
              }}
            >
              <img
                src="/Intro/Invi intro.png"
                alt="Closed Wedding Invitation Envelope"
                className="w-full h-full object-cover object-center pointer-events-none"
              />
            </div>

            {/* Subtle ambient light breathing over seal in idle state */}
            {stage === "idle" && (
              <div
                className="absolute left-1/2 top-[48.5%] -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full pointer-events-none animate-seal-breathe"
                style={{
                  background:
                    "radial-gradient(circle, rgba(235, 205, 140, 0.35) 0%, rgba(223, 190, 125, 0.12) 50%, transparent 75%)"
                }}
              />
            )}

            {/* ========================================================
                KEYFRAME 5: PHYSICAL 3D TOP FLAP OPENING
                (Smoothly lifts and folds upwards in 3D space)
                ======================================================== */}
            {stage !== "idle" && (
              <div
                className="absolute top-0 left-0 w-full pointer-events-none origin-top [transform-style:preserve-3d]"
                style={{
                  height: "50%",
                  transform:
                    stage === "opening" || stage === "radiant" || stage === "revealing"
                      ? "rotateX(-175deg)"
                      : "rotateX(0deg)",
                  transition: "transform 1100ms cubic-bezier(0.35, 0.0, 0.15, 1)",
                  backfaceVisibility: "hidden",
                  zIndex: 25
                }}
              >
                <div
                  className="relative w-full h-full overflow-hidden"
                  style={{
                    clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                    filter:
                      stage === "opening" || stage === "radiant"
                        ? "drop-shadow(0 20px 30px rgba(0,0,0,0.6))"
                        : "none"
                  }}
                >
                  <img
                    src="/Intro/Flow glowing intro.png"
                    alt="Envelope Flap"
                    className="absolute top-0 left-0 w-full h-[200%] object-cover object-top pointer-events-none"
                  />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 60%)"
                    }}
                  />
                </div>
              </div>
            )}

            {/* Dynamic shadow underneath the lifting flap */}
            <div
              className="absolute left-0 w-full pointer-events-none transition-opacity duration-700 ease-out"
              style={{
                top: "47%",
                height: "22%",
                opacity: stage === "opening" ? 0.5 : 0,
                background:
                  "radial-gradient(ellipse at top, rgba(0,0,0,0.65) 0%, transparent 70%)"
              }}
            />

            {/* ========================================================
                INTERACTION: CENTRAL SEAL HOTSPOT
                (Allows guest to tap either the seal or TAP TO OPEN)
                ======================================================== */}
            {stage === "idle" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEnvelope();
                }}
                className="absolute left-1/2 top-[48.5%] -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full cursor-pointer z-30 focus:outline-none focus:ring-0"
                aria-label="Tap central seal to open invitation"
              />
            )}

            {/* ========================================================
                SECTION 2: "TAP TO OPEN" WITH UPWARD ARROW BELOW SEAL
                Hierarchy:
                     [ CENTRAL SEAL ]
                            ↑
                       TAP TO OPEN
                ======================================================== */}
            {stage === "idle" && (
              <div
                className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto cursor-pointer z-30 select-none transition-all duration-400"
                style={{ top: "54.8%" }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEnvelope();
                }}
              >
                {/* Arrow pointing UPWARD toward the central seal */}
                <div className="text-[#946f35] animate-arrow-bob mb-1">
                  <svg
                    width="14"
                    height="16"
                    viewBox="0 0 14 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="filter drop-shadow-[0_1px_4px_rgba(255,255,255,0.9)]"
                  >
                    <path
                      d="M7 14.5V2.5M7 2.5L2 7.5M7 2.5L12 7.5"
                      stroke="#8a6327"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Subtle refined typography matching the invitation */}
                <div className="px-3 py-1 rounded-full bg-[#fdfbf6]/85 border border-[#bc965e]/50 backdrop-blur-xs shadow-[0_2px_10px_rgba(188,150,94,0.18)] animate-text-breathe">
                  <span className="font-serif text-[11px] sm:text-xs tracking-[0.28em] uppercase text-[#694e33] font-medium">
                    Tap to Open
                  </span>
                </div>
              </div>
            )}

            {/* Subdued pre-decoding indicator */}
            {!assetsReady && stage === "idle" && (
              <div className="absolute top-4 right-4 z-40 pointer-events-none">
                <div className="w-3.5 h-3.5 rounded-full border border-[#bc965e] border-t-transparent animate-spin" />
              </div>
            )}
          </div>

          {/* ========================================================
              KEYFRAME 8: SOFT CHAMPAGNE-WHITE ILLUMINATION FILL
              (Screen gently fills with warm champagne light, then fades
               to reveal the wedding website naturally without hard cut)
              ======================================================== */}
          <div
            className="fixed inset-0 pointer-events-none transition-opacity duration-700 ease-out z-[60]"
            style={{
              opacity: stage === "revealing" && !isRevealingDissolve ? 0.95 : isRevealingDissolve ? 0 : 0,
              background:
                "radial-gradient(circle at 50% 50%, #fffdf7 15%, #f6ecd7 65%, #edd9b5 100%)"
            }}
          />
        </div>
      )}

      {/* Scoped CSS animations for breathing light, particles and arrow bobbing */}
      <style jsx>{`
        @keyframes sealBreathe {
          0%, 100% {
            opacity: 0.18;
            transform: translate(-50%, -50%) scale(0.96);
          }
          50% {
            opacity: 0.42;
            transform: translate(-50%, -50%) scale(1.08);
          }
        }
        .animate-seal-breathe {
          animation: sealBreathe 6s ease-in-out infinite;
        }

        @keyframes arrowBob {
          0%, 100% {
            transform: translateY(0px);
            opacity: 0.7;
          }
          50% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }
        .animate-arrow-bob {
          animation: arrowBob 2.2s ease-in-out infinite;
        }

        @keyframes textBreathe {
          0%, 100% {
            opacity: 0.72;
          }
          50% {
            opacity: 1;
          }
        }
        .animate-text-breathe {
          animation: textBreathe 3s ease-in-out infinite;
        }

        .ambient-mote {
          position: absolute;
          width: 3px;
          height: 3px;
          background: #dfbe7d;
          border-radius: 50%;
          box-shadow: 0 0 8px #dfbe7d;
          animation: moteFloat 10s ease-in-out infinite;
        }
        .mote-1 {
          top: 22%;
          left: 18%;
          animation-duration: 9s;
        }
        .mote-2 {
          top: 68%;
          right: 20%;
          animation-duration: 12s;
          animation-delay: -3s;
        }
        .mote-3 {
          top: 35%;
          right: 28%;
          animation-duration: 11s;
          animation-delay: -5s;
        }
        .mote-4 {
          top: 75%;
          left: 26%;
          animation-duration: 14s;
          animation-delay: -7s;
        }

        @keyframes moteFloat {
          0%, 100% {
            transform: translate(0, 0);
            opacity: 0.2;
          }
          50% {
            transform: translate(6px, -12px);
            opacity: 0.65;
          }
        }
      `}</style>
    </>
  );
}
