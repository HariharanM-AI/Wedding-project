"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { WeddingData } from "@/lib/types/wedding";

// Single Master Image provided by the user
const ENVELOPE_IMAGE = "/Intro/Invi intro.png";
const GOLD_RELIEF_IMAGE = "/Intro/invi-gold-relief.png";
const DEFAULT_AUDIO_URL = "/Intro/WhatsApp Video 2026-09-28 at 3.19.00 AM.mp4";

// Exact geometric flap clip-paths derived from Invi intro.png (914x1720)
// Top flap seamlessly incorporates the top triangular fold and the circular wax seal at its apex
const TOP_FLAP_CLIP_PATH =
  "polygon(0.0% 0.0%, 100.0% 0.0%, 100.0% 1.8%, 66.0% 42.8%, 65.22% 45.66%, 65.95% 47.11%, 66.2% 48.6%, 65.95% 50.09%, 65.22% 51.54%, 64.03% 52.9%, 62.41% 54.13%, 60.41% 55.19%, 58.1% 56.05%, 55.54% 56.68%, 52.81% 57.07%, 50.0% 57.2%, 47.19% 57.07%, 44.46% 56.68%, 41.9% 56.05%, 39.59% 55.19%, 37.59% 54.13%, 35.97% 52.9%, 34.78% 51.54%, 34.05% 50.09%, 33.8% 48.6%, 34.05% 47.11%, 34.78% 45.66%, 34.0% 42.8%, 0.0% 1.8%)";

// Bottom flap triangular fold pointing up towards the wax seal
const BOTTOM_FLAP_CLIP_PATH =
  "polygon(0.0% 100.0%, 100.0% 100.0%, 100.0% 90.0%, 50.0% 58.5%, 0.0% 90.0%)";

// Left side panel fold
const LEFT_FLAP_CLIP_PATH =
  "polygon(0.0% 0.0%, 0.0% 100.0%, 0.0% 90.0%, 50.0% 58.5%, 50.0% 48.6%, 0.0% 1.8%)";

// Right side panel fold
const RIGHT_FLAP_CLIP_PATH =
  "polygon(100.0% 0.0%, 100.0% 100.0%, 100.0% 90.0%, 50.0% 58.5%, 50.0% 48.6%, 100.0% 1.8%)";

// Delicate star sparkles on floral relief coordinates (matching the video's floral glints)
const FLORAL_SPARKLES = [
  { top: "14.5%", left: "50%", delay: 0.1 },
  { top: "17%", left: "34%", delay: 0.25 },
  { top: "17%", left: "66%", delay: 0.35 },
  { top: "40%", left: "19%", delay: 0.45 },
  { top: "53%", left: "12%", delay: 0.6 },
  { top: "40%", left: "81%", delay: 0.5 },
  { top: "53%", left: "88%", delay: 0.65 },
  { top: "83.5%", left: "50%", delay: 0.55 }
];

interface IntroEnvelopeProps {
  data: WeddingData;
}

type IntroPhase = "idle" | "awakening" | "opening" | "revealing" | "complete";

export function IntroEnvelope({ data }: IntroEnvelopeProps) {
  const [phase, setPhase] = useState<IntroPhase>("idle");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasTriggeredRef = useRef<boolean>(false);

  const audioSrc = data.audioUrl?.trim() || DEFAULT_AUDIO_URL;

  // Pre-load the envelope master images for instantaneous 60fps rendering
  useEffect(() => {
    const img1 = new Image();
    img1.src = ENVELOPE_IMAGE;
    img1.onload = () => setImageLoaded(true);

    const img2 = new Image();
    img2.src = GOLD_RELIEF_IMAGE;
    img2.onload = () => {};
  }, []);

  // Lock body scroll while intro overlay is active
  useEffect(() => {
    if (phase !== "complete") {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [phase]);

  // Synchronize audio mute state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  function handleStartOpening() {
    if (hasTriggeredRef.current || phase !== "idle") return;
    hasTriggeredRef.current = true;

    // Start background wedding music immediately on user tap
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("Audio autoplay blocked by browser policy:", err);
        });
    }

    // Step 1: Awakening (0ms - 700ms) -> Wax seal glows with golden sheen, luminescence washes over vines
    setPhase("awakening");

    // Step 2: Opening (700ms - 3600ms) -> Flaps smoothly glide open with Framer Motion, light cavity expands
    setTimeout(() => {
      setPhase("opening");
    }, 700);

    // Step 3: Revealing (3600ms - 4400ms) -> Soft champagne light floods screen and dissolves
    setTimeout(() => {
      setPhase("revealing");
    }, 3600);

    // Step 4: Complete (4400ms) -> Overlay unmounts completely, full website interactive
    setTimeout(() => {
      setPhase("complete");
    }, 4400);
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

  const isOpening = phase === "opening" || phase === "revealing";

  return (
    <>
      {/* Background Wedding Music */}
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="auto"
        loop
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Floating Royal Sound Controller Widget (Matches the gold button in reference video) */}
      <div
        className={`fixed bottom-5 right-5 z-40 transition-all duration-700 ease-out ${
          phase !== "idle" || isPlaying
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <button
          onClick={toggleAudioPlayback}
          className="group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-[#fffaf0]/95 backdrop-blur-md border border-[#bc965e] shadow-lg shadow-[#946f35]/25 hover:border-[#946f35] hover:bg-[#fff7ea] hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer text-[#55313c]"
          title={isPlaying ? "Pause music" : "Play music"}
          aria-label={isPlaying ? "Pause music" : "Play music"}
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

          <div className="text-[#946f35] group-hover:text-[#55313c] transition-colors">
            {isMuted || !isPlaying ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </div>

          <span className="font-serif text-xs font-semibold tracking-wider uppercase text-[#55313c] pr-1">
            {isPlaying && !isMuted ? "Sound on" : "Music"}
          </span>
        </button>
      </div>

      {/* Main Cinematic Opening Overlay */}
      <AnimatePresence>
        {phase !== "complete" && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: phase === "revealing" ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            onClick={handleStartOpening}
            className="fixed inset-0 z-50 flex items-center justify-center select-none overflow-hidden cursor-pointer"
            style={{
              background:
                "radial-gradient(ellipse at center, #1a0f0b 0%, #110704 55%, #080302 100%)"
            }}
            role="button"
            tabIndex={0}
            aria-label="Tap to open the wedding invitation"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleStartOpening();
              }
            }}
          >
            {/* Ambient Floating Golden Motes */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
              <div className="ambient-mote mote-1" />
              <div className="ambient-mote mote-2" />
              <div className="ambient-mote mote-3" />
              <div className="ambient-mote mote-4" />
            </div>

            {/* Master Envelope Canvas Container */}
            <motion.div
              className="relative w-full h-full max-w-[460px] max-h-[860px] sm:h-[92vh] sm:rounded-2xl overflow-hidden shadow-2xl"
              animate={{
                scale: isOpening ? 1.04 : phase === "awakening" ? 1.015 : 1
              }}
              transition={{ duration: 2.5, ease: "easeOut" }}
              style={{
                boxShadow: isOpening
                  ? "0 0 80px rgba(223, 190, 125, 0.6), 0 30px 80px rgba(0,0,0,0.9)"
                  : "0 20px 60px rgba(0, 0, 0, 0.85)"
              }}
            >
              {/* ========================================================
                  LAYER 0: INTERIOR CAVITY & INVITATION REVEAL PEEK
                  (Situated underneath the parting flaps)
                  ======================================================== */}
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none overflow-hidden"
                style={{ zIndex: 1 }}
                animate={{
                  scale: isOpening ? [0.93, 1.02] : 0.93
                }}
                transition={{ duration: 2.8, ease: [0.25, 1, 0.5, 1] }}
              >
                {/* Parchment background with soft luxury wedding glow */}
                <div
                  className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center select-none"
                  style={{
                    background:
                      "radial-gradient(ellipse at 50% 49%, #ffffff 0%, #fdf8ee 40%, #f5e9d3 75%, #ebd4ae 100%)"
                  }}
                >
                  {/* Subtle royal framing lines */}
                  <div className="absolute inset-4 border border-[#bc965e]/30 rounded-xl pointer-events-none" />
                  <div className="absolute inset-5 border border-[#bc965e]/15 rounded-lg pointer-events-none" />

                  {/* Volumetric Center Light Core */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(ellipse at 50% 49%, rgba(255,255,255,1) 0%, rgba(255,245,215,0.95) 25%, rgba(223,190,125,0.45) 60%, transparent 85%)",
                      filter: "blur(12px)"
                    }}
                  />

                  {/* Horizontal Flare Beams emanating from central opening */}
                  <div
                    className="absolute left-0 right-0 top-[49%] -translate-y-1/2 h-56 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, rgba(240,215,145,0.7) 35%, transparent 75%)",
                      filter: "blur(16px)"
                    }}
                  />

                  {/* Couple's Monogram & Wedding Announcement inside Opening */}
                  <div className="relative z-10 flex flex-col items-center max-w-[280px]">
                    <span className="font-serif text-[10px] sm:text-[11px] tracking-[0.32em] uppercase text-[#8c6b3c] mb-2 font-medium">
                      With the blessings of our families
                    </span>
                    <h2 className="font-serif text-3xl sm:text-4xl text-[#55313c] leading-tight font-normal">
                      {data.brideName}
                    </h2>
                    <span className="font-serif text-lg sm:text-xl text-[#bc965e] italic my-0.5">
                      &
                    </span>
                    <h2 className="font-serif text-3xl sm:text-4xl text-[#55313c] leading-tight font-normal mb-3">
                      {data.groomName}
                    </h2>
                    <div className="w-12 h-[1px] bg-[#bc965e]/60 my-1.5" />
                    <p className="font-serif text-xs tracking-[0.24em] text-[#8c6b3c] uppercase mt-1">
                      {data.displayDate}
                    </p>
                    <p className="font-sans text-[10px] tracking-[0.16em] text-[#55313c]/70 uppercase mt-1">
                      {data.venueName} · {data.city}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* ========================================================
                  LAYER 1: LEFT FLAP
                  (Cut from single image using CSS clip-path)
                  ======================================================== */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  clipPath: LEFT_FLAP_CLIP_PATH,
                  zIndex: 10
                }}
                animate={{
                  x: isOpening ? "-4%" : "0%"
                }}
                transition={{ duration: 2.6, ease: [0.25, 1, 0.35, 1] }}
              >
                <img
                  src={ENVELOPE_IMAGE}
                  alt="Left envelope flap"
                  className="w-full h-full object-cover object-center pointer-events-none"
                />
              </motion.div>

              {/* ========================================================
                  LAYER 2: RIGHT FLAP
                  (Cut from single image using CSS clip-path)
                  ======================================================== */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  clipPath: RIGHT_FLAP_CLIP_PATH,
                  zIndex: 10
                }}
                animate={{
                  x: isOpening ? "4%" : "0%"
                }}
                transition={{ duration: 2.6, ease: [0.25, 1, 0.35, 1] }}
              >
                <img
                  src={ENVELOPE_IMAGE}
                  alt="Right envelope flap"
                  className="w-full h-full object-cover object-center pointer-events-none"
                />
              </motion.div>

              {/* ========================================================
                  LAYER 3: BOTTOM FLAP
                  (Glides downward with Framer Motion, casts upward shadow)
                  ======================================================== */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  clipPath: BOTTOM_FLAP_CLIP_PATH,
                  zIndex: 15
                }}
                animate={{
                  y: isOpening ? "42%" : "0%"
                }}
                transition={{ duration: 2.7, ease: [0.25, 1, 0.35, 1] }}
              >
                <img
                  src={ENVELOPE_IMAGE}
                  alt="Bottom envelope flap"
                  className="w-full h-full object-cover object-center pointer-events-none"
                />
              </motion.div>

              {/* ========================================================
                  LAYER 4: TOP FLAP WITH WAX SEAL
                  (Glides smoothly upward with Framer Motion)
                  ======================================================== */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  clipPath: TOP_FLAP_CLIP_PATH,
                  zIndex: 20
                }}
                animate={{
                  y: isOpening ? "-42%" : "0%"
                }}
                transition={{ duration: 2.7, ease: [0.25, 1, 0.35, 1] }}
              >
                <img
                  src={ENVELOPE_IMAGE}
                  alt="Top envelope flap with seal"
                  className="w-full h-full object-cover object-center pointer-events-none"
                />

                {/* Wax seal golden sheen highlight during awakening */}
                <motion.div
                  className="absolute left-1/2 top-[48.6%] -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: phase === "awakening" ? [0, 0.9, 0.6] : 0,
                    scale: phase === "awakening" ? [0.95, 1.08, 1.02] : 1
                  }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  style={{
                    background:
                      "radial-gradient(circle, rgba(255, 235, 170, 0.8) 0%, rgba(223, 190, 125, 0.4) 50%, transparent 75%)",
                    mixBlendMode: "color-dodge"
                  }}
                />
              </motion.div>

              {/* ========================================================
                  LAYER 5: BASE INTACT IMAGE (ACTIVE DURING IDLE)
                  (Ensures 100% seam-free pristine rendering before tap)
                  ======================================================== */}
              {phase === "idle" && (
                <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 25 }}>
                  <img
                    src={ENVELOPE_IMAGE}
                    alt="Wedding Invitation Envelope"
                    className="w-full h-full object-cover object-center pointer-events-none"
                  />
                  {/* Gentle ambient light breathing over seal in idle state */}
                  <div
                    className="absolute left-1/2 top-[48.6%] -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full pointer-events-none animate-seal-breathe"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(235, 205, 140, 0.35) 0%, rgba(223, 190, 125, 0.12) 50%, transparent 75%)"
                    }}
                  />
                </div>
              )}

              {/* ========================================================
                  LAYER 6: BOTANICAL GOLD EMBOSSING & TWINKLING SPARKLES
                  (Illuminates floral veins without washing out paper)
                  ======================================================== */}
              {(phase === "awakening" || isOpening) && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{ zIndex: 28 }}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: phase === "awakening" ? [0, 1, 0.85] : [0.85, 0]
                  }}
                  transition={{ duration: phase === "awakening" ? 0.7 : 1.2, ease: "easeOut" }}
                >
                  {/* Gold floral relief overlay derived from the single image */}
                  <img
                    src={GOLD_RELIEF_IMAGE}
                    alt="Gold Relief"
                    className="w-full h-full object-cover object-center pointer-events-none"
                    style={{
                      mixBlendMode: "screen",
                      filter: "drop-shadow(0 0 6px rgba(223,190,125,0.7))"
                    }}
                  />

                  {/* Twinkling Star Sparkles along the floral relief */}
                  {phase === "awakening" &&
                    FLORAL_SPARKLES.map((sparkle, idx) => (
                      <motion.div
                        key={idx}
                        className="absolute pointer-events-none"
                        style={{
                          top: sparkle.top,
                          left: sparkle.left,
                          transform: "translate(-50%, -50%)"
                        }}
                        initial={{ scale: 0, opacity: 0, rotate: 0 }}
                        animate={{
                          scale: [0, 1.25, 0],
                          opacity: [0, 1, 0],
                          rotate: [0, 90]
                        }}
                        transition={{
                          duration: 0.9,
                          delay: sparkle.delay,
                          ease: "easeInOut"
                        }}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="filter drop-shadow-[0_0_8px_rgba(255,235,170,1)]"
                        >
                          <path
                            d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z"
                            fill="url(#goldSparkleGrad)"
                          />
                          <defs>
                            <radialGradient
                              id="goldSparkleGrad"
                              cx="0.5"
                              cy="0.5"
                              r="0.5"
                              fx="0.5"
                              fy="0.5"
                            >
                              <stop offset="0%" stopColor="#ffffff" />
                              <stop offset="50%" stopColor="#faecd0" />
                              <stop offset="100%" stopColor="#bc965e" />
                            </radialGradient>
                          </defs>
                        </svg>
                      </motion.div>
                    ))}
                </motion.div>
              )}

              {/* ========================================================
                  LAYER 7: "TAP TO OPEN" BADGE & HOTSPOT (IDLE STATE)
                  ======================================================== */}
              {phase === "idle" && (
                <>
                  {/* Central seal tap hotspot */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartOpening();
                    }}
                    className="absolute left-1/2 top-[48.6%] -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full cursor-pointer z-30 focus:outline-none focus:ring-0"
                    aria-label="Tap central seal to open invitation"
                  />

                  {/* "TAP TO OPEN" Indicator with upward arrow pointing at the seal */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto cursor-pointer z-30 select-none transition-all duration-400"
                    style={{ top: "54.8%" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartOpening();
                    }}
                  >
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

                    <div className="px-3 py-1 rounded-full bg-[#fdfbf6]/85 border border-[#bc965e]/50 backdrop-blur-xs shadow-[0_2px_10px_rgba(188,150,94,0.18)] animate-text-breathe">
                      <span className="font-serif text-[11px] sm:text-xs tracking-[0.28em] uppercase text-[#694e33] font-medium">
                        Tap to Open
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Preload spinner indicator */}
              {!imageLoaded && phase === "idle" && (
                <div className="absolute top-4 right-4 z-40 pointer-events-none">
                  <div className="w-3.5 h-3.5 rounded-full border border-[#bc965e] border-t-transparent animate-spin" />
                </div>
              )}
            </motion.div>

            {/* ========================================================
                LAYER 8: SOFT CHAMPAGNE FILL REVEAL
                (Expands gently to fill screen and dissolve into website)
                ======================================================== */}
            {phase === "revealing" && (
              <motion.div
                className="fixed inset-0 pointer-events-none z-[60]"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.95, 0] }}
                transition={{ duration: 0.9, ease: "easeInOut" }}
                style={{
                  background:
                    "radial-gradient(circle at 50% 50%, #fffdf7 15%, #f6ecd7 65%, #edd9b5 100%)"
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
