"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { WeddingData } from "@/lib/types/wedding";

// Assets provided by the user
const MOBILE_ENVELOPE = "/Intro/Invi intro.png";
const DESKTOP_ENVELOPE = "/Intro/wedding-lap-screen.png";
const MOBILE_RELIEF = "/Intro/invi-gold-relief-mobile.png";
const DESKTOP_RELIEF = "/Intro/invi-gold-relief-desktop.png";
const DEFAULT_AUDIO_URL = "/Intro/WhatsApp Video 2026-09-28 at 3.19.00 AM.mp4";

// =============================================================================
// GEOMETRIC FLAP CLIP-PATHS
// =============================================================================

// Mobile (Portrait 9:16) Flap Geometries
const MOBILE_TOP_FLAP =
  "polygon(0.0% 0.0%, 100.0% 0.0%, 100.0% 1.8%, 66.0% 42.8%, 65.22% 45.66%, 65.95% 47.11%, 66.2% 48.6%, 65.95% 50.09%, 65.22% 51.54%, 64.03% 52.9%, 62.41% 54.13%, 60.41% 55.19%, 58.1% 56.05%, 55.54% 56.68%, 52.81% 57.07%, 50.0% 57.2%, 47.19% 57.07%, 44.46% 56.68%, 41.9% 56.05%, 39.59% 55.19%, 37.59% 54.13%, 35.97% 52.9%, 34.78% 51.54%, 34.05% 50.09%, 33.8% 48.6%, 34.05% 47.11%, 34.78% 45.66%, 34.0% 42.8%, 0.0% 1.8%)";

const MOBILE_BOTTOM_FLAP =
  "polygon(0.0% 100.0%, 100.0% 100.0%, 100.0% 90.0%, 50.0% 58.5%, 0.0% 90.0%)";

const MOBILE_LEFT_FLAP =
  "polygon(0.0% 0.0%, 0.0% 100.0%, 0.0% 90.0%, 50.0% 58.5%, 50.0% 48.6%, 0.0% 1.8%)";

const MOBILE_RIGHT_FLAP =
  "polygon(100.0% 0.0%, 100.0% 100.0%, 100.0% 90.0%, 50.0% 58.5%, 50.0% 48.6%, 100.0% 1.8%)";

// Desktop (Widescreen 16:9) Flap Geometries
const DESKTOP_TOP_FLAP =
  "polygon(0.0% 0.0%, 100.0% 0.0%, 55.3% 52.4%, 55.22% 50.8%, 55.3% 52.4%, 55.22% 54.0%, 54.98% 55.55%, 54.59% 57.0%, 54.06% 58.31%, 53.41% 59.45%, 52.65% 60.37%, 51.81% 61.05%, 50.92% 61.46%, 50.0% 61.6%, 49.08% 61.46%, 48.19% 61.05%, 47.35% 60.37%, 46.59% 59.45%, 45.94% 58.31%, 45.41% 57.0%, 45.02% 55.55%, 44.78% 54.0%, 44.7% 52.4%, 44.78% 50.8%, 0.0% 0.0%)";

const DESKTOP_BOTTOM_FLAP =
  "polygon(0.0% 100.0%, 100.0% 100.0%, 50.0% 61.6%, 0.0% 100.0%)";

const DESKTOP_LEFT_FLAP =
  "polygon(0.0% 0.0%, 0.0% 100.0%, 50.0% 52.4%, 0.0% 0.0%)";

const DESKTOP_RIGHT_FLAP =
  "polygon(100.0% 0.0%, 100.0% 100.0%, 50.0% 52.4%, 100.0% 0.0%)";

// Delicate diamond star sparkles along floral relief coordinates
const MOBILE_SPARKLES = [
  { top: "14.5%", left: "50%", delay: 0.15 },
  { top: "17%", left: "34%", delay: 0.3 },
  { top: "17%", left: "66%", delay: 0.4 },
  { top: "40%", left: "19%", delay: 0.5 },
  { top: "53%", left: "12%", delay: 0.65 },
  { top: "40%", left: "81%", delay: 0.55 },
  { top: "53%", left: "88%", delay: 0.7 },
  { top: "83.5%", left: "50%", delay: 0.6 }
];

const DESKTOP_SPARKLES = [
  { top: "16%", left: "50%", delay: 0.15 },
  { top: "19%", left: "41%", delay: 0.3 },
  { top: "19%", left: "59%", delay: 0.4 },
  { top: "35%", left: "11%", delay: 0.5 },
  { top: "55%", left: "9%", delay: 0.65 },
  { top: "35%", left: "89%", delay: 0.55 },
  { top: "55%", left: "91%", delay: 0.7 },
  { top: "83%", left: "50%", delay: 0.6 }
];

interface IntroEnvelopeProps {
  data: WeddingData;
}

type IntroPhase = "idle" | "circling" | "flowing" | "opening" | "revealing" | "complete";

export function IntroEnvelope({ data }: IntroEnvelopeProps) {
  const [phase, setPhase] = useState<IntroPhase>("idle");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasTriggeredRef = useRef<boolean>(false);

  const audioSrc = data.audioUrl?.trim() || DEFAULT_AUDIO_URL;

  // Responsive screen detection: Window/Laptop Screen (16:9) vs Mobile (9:16)
  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 820 && window.innerWidth > window.innerHeight);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Pre-load assets
  useEffect(() => {
    const assets = [MOBILE_ENVELOPE, DESKTOP_ENVELOPE, MOBILE_RELIEF, DESKTOP_RELIEF];
    let loaded = 0;
    assets.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loaded++;
        if (loaded >= 2) setImageLoaded(true);
      };
    });
  }, []);

  // Lock body scroll while overlay is active
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

  // Exact Choreography:
  // 1. Tapping starts audio + Phase: "circling" (0ms - 1100ms)
  //    Golden light circles the perimeter of the wax seal!
  // 2. Phase: "flowing" (1100ms - 2700ms)
  //    Golden luminescence flows outward towards EVERY petal on all 4 sides!
  // 3. Phase: "opening" (2700ms - 5100ms)
  //    Flaps glide smoothly open with Framer Motion, cavity reveals invitation card!
  // 4. Phase: "revealing" (5100ms - 6100ms)
  //    Warm champagne bloom fills screen and gently dissolves!
  // 5. Phase: "complete" (6100ms) -> Unmounts overlay!
  function handleStartOpening() {
    if (hasTriggeredRef.current || phase !== "idle") return;
    hasTriggeredRef.current = true;

    // Start background music immediately on user tap
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("Audio autoplay blocked by browser policy:", err);
        });
    }

    // Step 1: Glow circles the seal
    setPhase("circling");

    // Step 2: Glow flows smoothly towards every petal on all sides
    setTimeout(() => {
      setPhase("flowing");
    }, 1100);

    // Step 3: Flaps glide open revealing the wedding invitation
    setTimeout(() => {
      setPhase("opening");
    }, 2700);

    // Step 4: Soft champagne fill and gentle dissolve
    setTimeout(() => {
      setPhase("revealing");
    }, 5100);

    // Step 5: Unmount overlay completely
    setTimeout(() => {
      setPhase("complete");
    }, 6100);
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

  // Active asset and geometry selections based on viewport
  const envelopeSrc = isDesktop ? DESKTOP_ENVELOPE : MOBILE_ENVELOPE;
  const reliefSrc = isDesktop ? DESKTOP_RELIEF : MOBILE_RELIEF;
  const sealY = isDesktop ? 52.4 : 48.6;
  const tapPillTop = isDesktop ? "59.2%" : "55.2%";
  const sparkles = isDesktop ? DESKTOP_SPARKLES : MOBILE_SPARKLES;

  const topClip = isDesktop ? DESKTOP_TOP_FLAP : MOBILE_TOP_FLAP;
  const bottomClip = isDesktop ? DESKTOP_BOTTOM_FLAP : MOBILE_BOTTOM_FLAP;
  const leftClip = isDesktop ? DESKTOP_LEFT_FLAP : MOBILE_LEFT_FLAP;
  const rightClip = isDesktop ? DESKTOP_RIGHT_FLAP : MOBILE_RIGHT_FLAP;

  const isFlapOpening = phase === "opening" || phase === "revealing";

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
            transition={{ duration: 0.85, ease: "easeInOut" }}
            onClick={handleStartOpening}
            className="fixed inset-0 z-50 flex items-center justify-center select-none overflow-hidden cursor-pointer"
            style={{
              background:
                "radial-gradient(ellipse at center, #180e0a 0%, #100603 55%, #060201 100%)"
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

            {/* Master Envelope Canvas Container (Responsive: Widescreen on desktop, Portrait on mobile) */}
            <motion.div
              className={`relative overflow-hidden shadow-2xl transition-all duration-700 ${
                isDesktop
                  ? "w-[92vw] max-w-[1100px] h-[52vw] max-h-[620px] aspect-[16/9] rounded-2xl"
                  : "w-full h-full max-w-[460px] max-h-[860px] sm:h-[92vh] sm:rounded-2xl"
              }`}
              animate={{
                scale: isFlapOpening ? 1.03 : phase === "flowing" ? 1.015 : 1
              }}
              transition={{ duration: 2.5, ease: "easeOut" }}
              style={{
                boxShadow: isFlapOpening
                  ? "0 0 90px rgba(223, 190, 125, 0.65), 0 30px 80px rgba(0,0,0,0.9)"
                  : "0 20px 60px rgba(0, 0, 0, 0.85)"
              }}
            >
              {/* ========================================================
                  LAYER 0: INTERIOR CAVITY & WEDDING CARD PEEK
                  (Situated underneath the parting flaps)
                  ======================================================== */}
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none overflow-hidden"
                style={{ zIndex: 1 }}
                animate={{
                  scale: isFlapOpening ? [0.93, 1.02] : 0.93
                }}
                transition={{ duration: 2.8, ease: [0.25, 1, 0.5, 1] }}
              >
                {/* Parchment background with soft luxury wedding glow */}
                <div
                  className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center select-none"
                  style={{
                    background:
                      "radial-gradient(ellipse at 50% 50%, #ffffff 0%, #fdf8ee 40%, #f5e9d3 75%, #ebd4ae 100%)"
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
                        "radial-gradient(ellipse at 50% 50%, rgba(255,255,255,1) 0%, rgba(255,245,215,0.95) 25%, rgba(223,190,125,0.45) 60%, transparent 85%)",
                      filter: "blur(12px)"
                    }}
                  />

                  {/* Horizontal Flare Beams emanating from central opening */}
                  <div
                    className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-56 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, rgba(240,215,145,0.7) 35%, transparent 75%)",
                      filter: "blur(16px)"
                    }}
                  />

                  {/* Couple's Monogram & Wedding Announcement inside Opening */}
                  <div className="relative z-10 flex flex-col items-center max-w-[320px]">
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
                  (Cut from image using exact CSS clip-path)
                  ======================================================== */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  clipPath: leftClip,
                  zIndex: 10
                }}
                animate={{
                  x: isFlapOpening ? "-4%" : "0%"
                }}
                transition={{ duration: 2.6, ease: [0.25, 1, 0.35, 1] }}
              >
                <img
                  src={envelopeSrc}
                  alt="Left envelope flap"
                  className="w-full h-full object-cover object-center pointer-events-none"
                />
              </motion.div>

              {/* ========================================================
                  LAYER 2: RIGHT FLAP
                  (Cut from image using exact CSS clip-path)
                  ======================================================== */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  clipPath: rightClip,
                  zIndex: 10
                }}
                animate={{
                  x: isFlapOpening ? "4%" : "0%"
                }}
                transition={{ duration: 2.6, ease: [0.25, 1, 0.35, 1] }}
              >
                <img
                  src={envelopeSrc}
                  alt="Right envelope flap"
                  className="w-full h-full object-cover object-center pointer-events-none"
                />
              </motion.div>

              {/* ========================================================
                  LAYER 3: BOTTOM FLAP
                  (Glides downward with Framer Motion)
                  ======================================================== */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  clipPath: bottomClip,
                  zIndex: 15
                }}
                animate={{
                  y: isFlapOpening ? "44%" : "0%"
                }}
                transition={{ duration: 2.7, ease: [0.25, 1, 0.35, 1] }}
              >
                <img
                  src={envelopeSrc}
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
                  clipPath: topClip,
                  zIndex: 20
                }}
                animate={{
                  y: isFlapOpening ? "-44%" : "0%"
                }}
                transition={{ duration: 2.7, ease: [0.25, 1, 0.35, 1] }}
              >
                <img
                  src={envelopeSrc}
                  alt="Top envelope flap with seal"
                  className="w-full h-full object-cover object-center pointer-events-none"
                />

                {/* Wax seal golden sheen highlight during circling & flowing */}
                <motion.div
                  className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full pointer-events-none"
                  style={{
                    top: `${sealY}%`,
                    background:
                      "radial-gradient(circle, rgba(255, 235, 170, 0.85) 0%, rgba(223, 190, 125, 0.45) 50%, transparent 75%)",
                    mixBlendMode: "color-dodge"
                  }}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: phase === "circling" || phase === "flowing" ? [0, 0.95, 0.75] : 0,
                    scale: phase === "circling" || phase === "flowing" ? [0.95, 1.08, 1.03] : 1
                  }}
                  transition={{ duration: 1.4, ease: "easeOut" }}
                />
              </motion.div>

              {/* ========================================================
                  LAYER 5: BASE INTACT IMAGE (ACTIVE DURING IDLE)
                  (Ensures 100% pristine seam-free rendering before tap)
                  ======================================================== */}
              {phase === "idle" && (
                <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 25 }}>
                  <img
                    src={envelopeSrc}
                    alt="Wedding Invitation Envelope"
                    className="w-full h-full object-cover object-center pointer-events-none"
                  />
                  {/* Subtle ambient light breathing over the seal in idle state */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full pointer-events-none animate-seal-breathe"
                    style={{
                      top: `${sealY}%`,
                      background:
                        "radial-gradient(circle, rgba(235, 205, 140, 0.35) 0%, rgba(223, 190, 125, 0.12) 50%, transparent 75%)"
                    }}
                  />
                </div>
              )}

              {/* ========================================================
                  LAYER 6: "GLOW CIRCLES THE SEAL" (PHASE: CIRCLING)
                  (Animated golden light trail racing around the wax seal)
                  ======================================================== */}
              {(phase === "circling" || phase === "flowing") && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
                  style={{
                    top: `${sealY}%`,
                    width: isDesktop ? "160px" : "150px",
                    height: isDesktop ? "160px" : "150px"
                  }}
                >
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 160 160">
                    <defs>
                      <linearGradient id="circlingGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                        <stop offset="25%" stopColor="#ffe6a3" stopOpacity="0.95" />
                        <stop offset="60%" stopColor="#d4af37" stopOpacity="0.75" />
                        <stop offset="100%" stopColor="#8c6b3c" stopOpacity="0" />
                      </linearGradient>
                      <filter id="sealGlowBlur" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="3.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Animated circling light ring */}
                    <motion.circle
                      cx="80"
                      cy="80"
                      r="58"
                      fill="none"
                      stroke="url(#circlingGoldGrad)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      filter="url(#sealGlowBlur)"
                      initial={{ pathLength: 0, rotate: -90, opacity: 0 }}
                      animate={{
                        pathLength: [0, 1],
                        rotate: [-90, 270],
                        opacity: [0, 1, 1, 0.7]
                      }}
                      transition={{ duration: 1.1, ease: "easeInOut" }}
                    />

                    {/* Inner glowing pulse ring */}
                    <motion.circle
                      cx="80"
                      cy="80"
                      r="52"
                      fill="none"
                      stroke="rgba(255, 235, 170, 0.6)"
                      strokeWidth="2"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{
                        scale: [0.95, 1.05, 1.0],
                        opacity: [0, 0.8, 0.5]
                      }}
                      transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
                    />
                  </svg>
                </div>
              )}

              {/* ========================================================
                  LAYER 7: "GLOW FLOWS SMOOTHLY TOWARDS EVERY PETAL"
                  (Progressive radial wave streaming outward along all vines)
                  ======================================================== */}
              {(phase === "flowing" || phase === "opening") && (
                <motion.div
                  className="absolute inset-0 pointer-events-none z-28"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: phase === "flowing" ? [0, 1, 0.9] : [0.9, 0]
                  }}
                  transition={{ duration: phase === "flowing" ? 0.9 : 1.4, ease: "easeOut" }}
                >
                  {/* Expanding radial wave revealing the gold relief toward all petals */}
                  <motion.div
                    className="w-full h-full"
                    initial={{
                      maskImage: `radial-gradient(circle at 50% ${sealY}%, black 0%, black 10%, transparent 18%)`,
                      WebkitMaskImage: `radial-gradient(circle at 50% ${sealY}%, black 0%, black 10%, transparent 18%)`
                    }}
                    animate={{
                      maskImage: `radial-gradient(circle at 50% ${sealY}%, black 0%, black 90%, transparent 100%)`,
                      WebkitMaskImage: `radial-gradient(circle at 50% ${sealY}%, black 0%, black 90%, transparent 100%)`
                    }}
                    transition={{ duration: 1.4, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <img
                      src={reliefSrc}
                      alt="Gold Floral Relief"
                      className="w-full h-full object-cover object-center pointer-events-none"
                      style={{
                        mixBlendMode: "screen",
                        filter: "drop-shadow(0 0 8px rgba(223,190,125,0.75))"
                      }}
                    />
                  </motion.div>

                  {/* Traveling light wavefront pulse expanding from seal */}
                  <motion.div
                    className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
                    style={{
                      top: `${sealY}%`,
                      border: "2px solid rgba(255, 235, 170, 0.8)",
                      boxShadow: "0 0 25px rgba(223, 190, 125, 0.7), inset 0 0 20px rgba(255, 240, 190, 0.4)"
                    }}
                    initial={{ width: 120, height: 120, opacity: 0.9 }}
                    animate={{
                      width: isDesktop ? 1200 : 700,
                      height: isDesktop ? 1200 : 700,
                      opacity: [0.9, 0.6, 0]
                    }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />

                  {/* Twinkling Star Sparkles along every floral petal cluster */}
                  {sparkles.map((sparkle, idx) => (
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
                        scale: [0, 1.3, 0],
                        opacity: [0, 1, 0],
                        rotate: [0, 90]
                      }}
                      transition={{
                        duration: 1.0,
                        delay: sparkle.delay,
                        ease: "easeInOut"
                      }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="filter drop-shadow-[0_0_8px_rgba(255,235,170,1)]"
                      >
                        <path
                          d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z"
                          fill="url(#goldSparkleGrad2)"
                        />
                        <defs>
                          <radialGradient
                            id="goldSparkleGrad2"
                            cx="0.5"
                            cy="0.5"
                            r="0.5"
                            fx="0.5"
                            fy="0.5"
                          >
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="45%" stopColor="#faecd0" />
                            <stop offset="100%" stopColor="#bc965e" />
                          </radialGradient>
                        </defs>
                      </svg>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* ========================================================
                  LAYER 8: "TAP TO OPEN" BADGE & HOTSPOT (IDLE STATE)
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
                    className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full cursor-pointer z-30 focus:outline-none focus:ring-0"
                    style={{ top: `${sealY}%` }}
                    aria-label="Tap central seal to open invitation"
                  />

                  {/* "TAP TO OPEN" Badge with upward arrow pointing at the seal */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto cursor-pointer z-30 select-none transition-all duration-400"
                    style={{ top: tapPillTop }}
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
                LAYER 9: SOFT CHAMPAGNE FILL REVEAL
                (Expands gently to fill screen and dissolve into website)
                ======================================================== */}
            {phase === "revealing" && (
              <motion.div
                className="fixed inset-0 pointer-events-none z-[60]"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.95, 0] }}
                transition={{ duration: 1.0, ease: "easeInOut" }}
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
