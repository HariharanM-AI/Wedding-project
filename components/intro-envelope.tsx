"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Sparkles } from "lucide-react";
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

type AnimationStage = "idle" | "igniting" | "opening" | "blooming" | "complete";

export function IntroEnvelope({ data }: IntroEnvelopeProps) {
  const [stage, setStage] = useState<AnimationStage>("idle");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [assetsReady, setAssetsReady] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasTriggeredRef = useRef<boolean>(false);

  const audioSrc = data.audioUrl?.trim() || DEFAULT_AUDIO_URL;

  // Pre-decode all envelope asset frames into GPU memory on mount
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

  // Lock body scroll while the royal intro overlay is active
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

    // Start audio playback synchronously upon guest tap
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("Audio autoplay blocked by browser policy:", err);
        });
    }

    // Stage 1 (0ms - 450ms): Wax seal ignites, golden luminescence streams through floral relief vines
    setStage("igniting");

    // Stage 2 (450ms - 1700ms): 3D Top Flap physically unfolds upwards in perspective + volumetric light beam eruption
    setTimeout(() => {
      setStage("opening");
    }, 450);

    // Stage 3 (1700ms - 2450ms): Golden light bloom and camera zoom into the invitation
    setTimeout(() => {
      setStage("blooming");
    }, 1700);

    // Stage 4 (2450ms): Complete ceremony and unmount overlay
    setTimeout(() => {
      setStage("complete");
    }, 2450);
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
      {/* Background Wedding Audio Track */}
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
          stage === "opening" || stage === "blooming" || stage === "complete" || isPlaying
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

      {/* Full-Screen Royal Envelope Intro Overlay */}
      {stage !== "complete" && (
        <div
          onClick={handleOpenEnvelope}
          className={`fixed inset-0 z-50 flex items-center justify-center select-none overflow-hidden cursor-pointer transition-all duration-750 ease-out ${
            stage === "blooming"
              ? "opacity-0 scale-[1.08] filter brightness-[1.5] pointer-events-none"
              : "opacity-100 bg-[#0e0705]"
          }`}
          style={{
            background:
              "radial-gradient(ellipse at center, #24130d 0%, #150906 50%, #090302 100%)"
          }}
          role="button"
          tabIndex={0}
          aria-label="Tap to open the royal wedding invitation"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleOpenEnvelope();
            }
          }}
        >
          {/* Subtle Ambient Golden Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35">
            <div className="absolute top-1/4 left-1/5 w-1 h-1 bg-[#dfbe7d] rounded-full shadow-[0_0_10px_#dfbe7d] animate-ping" />
            <div className="absolute top-3/5 right-1/4 w-1.5 h-1.5 bg-[#f3d99d] rounded-full shadow-[0_0_12px_#f3d99d] animate-pulse" />
            <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-[#bc965e] rounded-full shadow-[0_0_8px_#bc965e] animate-ping" />
            <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-[#dfbe7d] rounded-full shadow-[0_0_12px_#dfbe7d] animate-pulse" />
          </div>

          {/* Royal Envelope Card Container with 3D Perspective */}
          <div
            className={`relative w-full h-full max-w-[460px] max-h-[820px] sm:h-[92vh] sm:rounded-2xl overflow-hidden shadow-2xl transition-all duration-700 ease-out [perspective:1400px] [transform-style:preserve-3d] ${
              stage === "opening" || stage === "blooming"
                ? "sm:scale-105 shadow-[0_0_80px_rgba(223,190,125,0.65)]"
                : "shadow-[0_20px_60px_rgba(0,0,0,0.85)] border-0 sm:border-2 sm:border-[#bc965e]/60"
            }`}
          >
            {/* LAYER 1: BASE OPEN ENVELOPE (Revealed behind the flap as it opens) */}
            <img
              src="/Intro/Opening with intro glowing.png"
              alt="Open Envelope Pocket"
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
            />

            {/* LAYER 2: VOLUMETRIC GOLDEN LIGHT SHAFT */}
            <div
              className="absolute left-1/2 top-[48.5%] -translate-x-1/2 pointer-events-none transition-all duration-1000 ease-out origin-bottom"
              style={{
                width: "85%",
                height: "65%",
                transform:
                  stage === "opening" || stage === "blooming"
                    ? "translateX(-50%) translateY(-100%) scaleY(1.3) scaleX(1.15)"
                    : "translateX(-50%) translateY(-100%) scaleY(0) scaleX(0.4)",
                opacity: stage === "opening" || stage === "blooming" ? 0.95 : 0,
                background:
                  "linear-gradient(to top, rgba(255,248,225,1) 0%, rgba(240,215,145,0.8) 25%, rgba(188,150,94,0.3) 65%, transparent 100%)",
                clipPath: "polygon(22% 100%, 78% 100%, 100% 0%, 0% 0%)",
                filter: "blur(10px)"
              }}
            />

            {/* LAYER 3: PRISTINE CLOSED ENVELOPE (Active during idle and igniting) */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-600 ease-out z-10"
              style={{
                opacity: stage === "opening" || stage === "blooming" ? 0 : 1
              }}
            >
              {/* Idle closed embossed envelope */}
              <img
                src="/Intro/Invi intro.png"
                alt="Closed Envelope"
                className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
              />

              {/* Glowing wax seal & relief vines crossfade on tap */}
              <img
                src="/Intro/Flow glowing intro.png"
                alt="Glowing Floral Relief"
                className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-opacity duration-400 ease-out"
                style={{
                  opacity: stage === "igniting" ? 1 : 0
                }}
              />
            </div>

            {/* LAYER 4: PHYSICAL 3D TOP FLAP (Folds upwards in real 3D perspective upon tap) */}
            {stage !== "idle" && (
              <div
                className="absolute top-0 left-0 w-full pointer-events-none origin-top [transform-style:preserve-3d] transition-transform duration-1000 ease-out z-20"
                style={{
                  height: "50%",
                  transform:
                    stage === "opening" || stage === "blooming"
                      ? "rotateX(-175deg)"
                      : "rotateX(0deg)",
                  transitionTimingFunction: "cubic-bezier(0.35, 0.0, 0.15, 1)",
                  backfaceVisibility: "hidden"
                }}
              >
                {/* Triangular flap container */}
                <div
                  className="relative w-full h-full overflow-hidden"
                  style={{
                    clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                    filter:
                      stage === "opening"
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
                        "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%)"
                    }}
                  />
                </div>
              </div>
            )}

            {/* LAYER 5: DYNAMIC SHADOW UNDERNEATH LIFTING FLAP */}
            <div
              className="absolute left-0 w-full pointer-events-none transition-opacity duration-700 ease-out"
              style={{
                top: "47%",
                height: "20%",
                opacity: stage === "opening" ? 0.45 : 0,
                background:
                  "radial-gradient(ellipse at top, rgba(0,0,0,0.6) 0%, transparent 70%)"
              }}
            />

            {/* LAYER 6: FLOATING RADIANT LIGHT FLARE & EMBERS */}
            <div
              className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ease-out z-30 ${
                stage === "opening" || stage === "blooming" ? "opacity-100" : "opacity-0"
              }`}
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, rgba(255, 240, 190, 0.8) 0%, rgba(223, 190, 125, 0.25) 50%, transparent 75%)"
              }}
            />

            {/* LAYER 7: IDLE CALL TO ACTION PROMPT */}
            <div
              className={`absolute inset-x-0 bottom-12 sm:bottom-14 flex flex-col items-center justify-center gap-2 pointer-events-none transition-all duration-400 z-40 ${
                stage === "idle" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
              }`}
            >
              <div className="relative group/btn flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#35161e]/90 border border-[#bc965e] shadow-[0_0_24px_rgba(223,190,125,0.45)] ring-1 ring-[#bc965e]/50 backdrop-blur-sm animate-pulse">
                <Sparkles size={14} className="text-[#dfbe7d]" />
                <span className="font-serif text-xs font-semibold tracking-[0.24em] uppercase text-[#fff7df]">
                  Tap to Open
                </span>
                <Sparkles size={14} className="text-[#dfbe7d]" />
              </div>
              <span className="font-serif text-[11px] tracking-wider text-[#d4af37]/80">
                Wedding of {data.brideName || "Bride"} & {data.groomName || "Groom"}
              </span>
            </div>

            {/* Subdued Loader while pre-decoding textures */}
            {!assetsReady && stage === "idle" && (
              <div className="absolute top-4 right-4 z-40 pointer-events-none">
                <div className="w-4 h-4 rounded-full border border-[#bc965e] border-t-transparent animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
