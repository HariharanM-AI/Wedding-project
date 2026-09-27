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

export function IntroEnvelope({ data }: IntroEnvelopeProps) {
  // Phase 0: Idle envelope awaiting tap
  // Phase 1: Wax seal illuminates (0ms)
  // Phase 2: Golden relief lines course through vines (350ms)
  // Phase 3: Maximum golden radiance with sparkling embers (850ms)
  // Phase 4: Envelope flap opens upwards with radiant beam of golden rays (1400ms)
  // Phase 5: Camera zoom and brightness bloom into invitation (2150ms)
  // Phase 6: Completed, envelope unmounted (2900ms)
  const [phase, setPhase] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [assetsReady, setAssetsReady] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasTriggeredRef = useRef<boolean>(false);

  const audioSrc = data.audioUrl?.trim() || DEFAULT_AUDIO_URL;

  // Pre-decode all 5 envelope frames on mount for butter-smooth 60FPS transitions
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

  // Lock body scroll while the royal envelope intro is playing
  useEffect(() => {
    if (phase < 5) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [phase]);

  // Audio mute sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  function handleOpenEnvelope() {
    if (hasTriggeredRef.current || phase > 0) return;
    hasTriggeredRef.current = true;

    // Start audio playback synchronously upon guest tap
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn("Audio autoplay blocked by browser policy:", err);
        });
    }

    // Phase 1: Seal glows
    setPhase(1);

    // Phase 2: Gold relief carvings ignite
    setTimeout(() => {
      setPhase(2);
    }, 380);

    // Phase 3: Maximum golden luminescence and floating embers
    setTimeout(() => {
      setPhase(3);
    }, 900);

    // Phase 4: Flap opens, central golden rays burst forth
    setTimeout(() => {
      setPhase(4);
    }, 1450);

    // Phase 5: Camera scales up and blooms into the wedding invitation
    setTimeout(() => {
      setPhase(5);
    }, 2200);

    // Phase 6: Unmount envelope overlay completely
    setTimeout(() => {
      setPhase(6);
    }, 2950);
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

  function toggleMute() {
    setIsMuted((prev) => !prev);
  }

  return (
    <>
      {/* Background Audio Player */}
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="auto"
        loop
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Floating Royal Audio Controller (Remains accessible on the invitation) */}
      <div
        className={`fixed bottom-5 right-5 z-40 transition-all duration-700 ease-out ${
          phase >= 4 || isPlaying ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <button
          onClick={toggleAudioPlayback}
          className="group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-[#fffaf0]/95 backdrop-blur-md border border-[#bc965e] shadow-lg shadow-[#946f35]/25 hover:border-[#946f35] hover:bg-[#fff7ea] hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer text-[#55313c]"
          title={isPlaying ? "Pause wedding music" : "Play wedding music"}
          aria-label={isPlaying ? "Pause wedding music" : "Play wedding music"}
        >
          {/* Animated Equalizer Bars */}
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

          {/* Sound Icon */}
          <div className="text-[#946f35] group-hover:text-[#55313c] transition-colors">
            {isMuted || !isPlaying ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </div>

          {/* Typography Label */}
          <span className="font-serif text-xs font-semibold tracking-wider uppercase text-[#55313c] pr-1">
            {isPlaying && !isMuted ? "Sound on" : "Music"}
          </span>
        </button>
      </div>

      {/* Main Full-Screen Intro Overlay */}
      {phase < 6 && (
        <div
          onClick={handleOpenEnvelope}
          className={`fixed inset-0 z-50 flex items-center justify-center select-none overflow-hidden cursor-pointer transition-all duration-750 ease-out ${
            phase === 5
              ? "opacity-0 scale-[1.08] filter brightness-[1.4] pointer-events-none"
              : "opacity-100 bg-[#0e0705]"
          }`}
          style={{
            background:
              "radial-gradient(ellipse at center, #23120c 0%, #150a07 50%, #0a0403 100%)"
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
          {/* Subtle Ambient Particle Sparks */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
            <div className="absolute top-1/4 left-1/5 w-1 h-1 bg-[#dfbe7d] rounded-full shadow-[0_0_10px_#dfbe7d] animate-ping" />
            <div className="absolute top-3/5 right-1/4 w-1.5 h-1.5 bg-[#f3d99d] rounded-full shadow-[0_0_12px_#f3d99d] animate-pulse" />
            <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-[#bc965e] rounded-full shadow-[0_0_8px_#bc965e] animate-ping" />
            <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-[#dfbe7d] rounded-full shadow-[0_0_12px_#dfbe7d] animate-pulse" />
          </div>

          {/* Envelope Card Container */}
          <div
            className={`relative w-full h-full max-w-[460px] max-h-[820px] sm:h-[92vh] sm:rounded-2xl overflow-hidden shadow-2xl transition-all duration-700 ease-out ${
              phase >= 4
                ? "sm:scale-105 shadow-[0_0_80px_rgba(223,190,125,0.6)]"
                : "shadow-[0_20px_60px_rgba(0,0,0,0.85)] border-0 sm:border-2 sm:border-[#bc965e]/60"
            }`}
          >
            {/* FRAME 0: Idle embossed closed envelope */}
            <img
              src="/Intro/Invi intro.png"
              alt="Royal Wedding Envelope"
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-opacity duration-300"
              style={{ opacity: phase === 0 ? 1 : 0 }}
            />

            {/* FRAME 1: Wax seal illuminates */}
            <img
              src="/Intro/Intro seel glow.png"
              alt="Wax seal glowing"
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-opacity duration-350 ease-out"
              style={{ opacity: phase === 1 ? 1 : 0 }}
            />

            {/* FRAME 2: Gold relief carvings illuminate */}
            <img
              src="/Intro/Invi with glow.png"
              alt="Golden floral relief carving illuminated"
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-opacity duration-400 ease-out"
              style={{ opacity: phase === 2 ? 1 : 0 }}
            />

            {/* FRAME 3: Maximum golden radiance with sparkling embers */}
            <img
              src="/Intro/Flow glowing intro.png"
              alt="Golden radiance across envelope"
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-opacity duration-450 ease-out"
              style={{ opacity: phase === 3 ? 1 : 0 }}
            />

            {/* FRAME 4 & 5: Envelope flap opens with central golden beam */}
            <img
              src="/Intro/Opening with intro glowing.png"
              alt="Envelope opening with radiant golden beam"
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-all duration-600 ease-out"
              style={{
                opacity: phase >= 4 ? 1 : 0,
                transform: phase === 5 ? "scale(1.2)" : "scale(1)"
              }}
            />

            {/* Radial Light Beam Flare on Open */}
            <div
              className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ease-out ${
                phase >= 4 ? "opacity-100" : "opacity-0"
              }`}
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, rgba(255, 235, 175, 0.75) 0%, rgba(223, 190, 125, 0.3) 45%, transparent 70%)"
              }}
            />

            {/* Idle Prompt: "TAP TO OPEN" */}
            <div
              className={`absolute inset-x-0 bottom-12 sm:bottom-14 flex flex-col items-center justify-center gap-2 pointer-events-none transition-all duration-400 ${
                phase === 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
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

            {/* Subdued Loader if Assets Are Still Decoding */}
            {!assetsReady && phase === 0 && (
              <div className="absolute top-4 right-4 z-20 pointer-events-none">
                <div className="w-4 h-4 rounded-full border border-[#bc965e] border-t-transparent animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
