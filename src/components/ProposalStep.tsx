import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Heart, Volume2, VolumeX, Eye } from 'lucide-react';
import { sound } from '../utils/sound';

interface ProposalStepProps {
  onAccept: (rejections: number) => void;
  isMuted: boolean;
  toggleMute: () => void;
}

const FUNNY_NO_QUOTES = [
  "WHY NOOO JANA?! 🥺💔",
  "Jana, look into my eyes and say that again! 👁️👄👁️",
  "Why would you do that, Jana?! Look at this face! 😿",
  "Error 404: Jana saying 'No' is physically impossible! 🚫",
  "Jana, anti-rejection defense system is activated! 🛡️⚡",
  "Cat Supreme Court has officially banned Jana from clicking No! 📜🐱",
  "Nice try Jana, but this button has teleportation powers! 💨",
  "Every time Jana tries to click No, the YES button gets 20% bigger! 💕"
];

export const ProposalStep: React.FC<ProposalStepProps> = ({ onAccept, isMuted, toggleMute }) => {
  const [noAttempts, setNoAttempts] = useState(0);
  const [showStaringCatModal, setShowStaringCatModal] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [noPosition, setNoPosition] = useState<{ x: number; y: number } | null>(null);
  const [isWiggling, setIsWiggling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const noButtonRef = useRef<HTMLButtonElement>(null);

  // Trigger evasive dodge and pop up the 3rd gif (scemer staring cat)
  const handleNoInteraction = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const nextAttempts = noAttempts + 1;
    setNoAttempts(nextAttempts);
    setCurrentQuoteIndex(nextAttempts % FUNNY_NO_QUOTES.length);

    // Play funny sounds
    sound.playDodge();
    sound.playDramaticStare();

    // Show the dramatic 3rd GIF modal
    setShowStaringCatModal(true);
    setIsWiggling(true);
    setTimeout(() => setIsWiggling(false), 500);

    // Move "No" button to a safe random coordinate inside the viewport/container
    if (typeof window !== 'undefined') {
      const maxX = Math.max(80, window.innerWidth - 180);
      const maxY = Math.max(120, window.innerHeight - 150);
      const randomX = Math.floor(Math.random() * (maxX - 80) + 40);
      const randomY = Math.floor(Math.random() * (maxY - 120) + 80);
      setNoPosition({ x: randomX, y: randomY });
    }
  };

  // Close modal when she clicks "Okay fine"
  const handleDismissModal = () => {
    setShowStaringCatModal(false);
  };

  // Dynamic scale for the "YES" button so it grows irresistibly
  const yesScale = Math.min(1.85, 1 + noAttempts * 0.12);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 select-none" ref={containerRef}>
      {/* Sound Toggle Header */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
        <button
          onClick={toggleMute}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-all active:scale-95"
          title={isMuted ? "Unmute sounds" : "Mute sounds"}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-rose-600 animate-pulse" />}
          <span>{isMuted ? "Sound Off" : "Sound On"}</span>
        </button>
      </div>

      {/* Main Proposal Romantic Card */}
      <div className={`relative z-10 max-w-md w-full bg-white/85 backdrop-blur-xl border border-rose-100 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-rose-200/50 text-center transition-all duration-300 ${isWiggling ? 'animate-head-shake' : ''}`}>
        
        {/* Floating badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-100/80 border border-rose-200 text-rose-700 text-xs font-semibold tracking-wide uppercase mb-4">
          <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-spin" style={{ animationDuration: '4s' }} />
          <span>A Very Serious Question for Jana</span>
          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
        </div>

        {/* Kitten with Flowers GIF */}
        <div className="relative mx-auto w-48 h-48 sm:w-56 sm:h-56 mb-5 group">
          <div className="absolute -inset-2 bg-gradient-to-r from-rose-200 via-pink-200 to-amber-100 rounded-3xl blur-md opacity-70 group-hover:opacity-100 transition duration-500"></div>
          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-rose-50 border-2 border-rose-200/80 shadow-inner flex items-center justify-center">
            <img
              src="/assets/cat-flowers.gif"
              alt="Cute kitten offering a bouquet of flowers"
              className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
              loading="eager"
            />
          </div>
          {/* Sweet flower pin */}
          <span className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-md border border-rose-100 text-xl">
            💐
          </span>
        </div>

        {/* Romantic Calligraphic Question */}
        <h1 className="text-3xl sm:text-4xl font-serif-romantic font-bold text-rose-950 mb-2 leading-tight">
          Will you go on a date with me, Jana?
        </h1>
        
        <p className="font-handwriting text-2xl text-rose-600 mb-6">
          I promise good food, laughs, and pure vibes with you, Jana... 🌸✨
        </p>

        {/* Counter of dodge attempts */}
        {noAttempts > 0 && (
          <div className="mb-4 inline-block px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium animate-bounce">
            👀 Jana, you tried to avoid it {noAttempts} {noAttempts === 1 ? 'time' : 'times'}! Resistance is futile!
          </div>
        )}

        {/* Action Buttons Zone */}
        <div className="relative min-h-[90px] flex items-center justify-center gap-4 pt-2">
          {/* YES Button */}
          <button
            onClick={() => {
              sound.playCelebration();
              onAccept(noAttempts);
            }}
            style={{ transform: `scale(${yesScale})` }}
            className="relative z-10 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white font-bold text-lg sm:text-xl shadow-lg shadow-rose-500/35 hover:shadow-rose-500/50 hover:brightness-105 active:scale-95 transition-all duration-200 flex items-center gap-2 cursor-pointer"
          >
            <Heart className="w-5 h-5 fill-white" />
            <span>YES! Absolutely, Mazen! 🥰</span>
          </button>

          {/* Normal placement No button (if not moved yet) */}
          {!noPosition && (
            <button
              ref={noButtonRef}
              onMouseEnter={handleNoInteraction}
              onTouchStart={handleNoInteraction}
              onClick={handleNoInteraction}
              className="px-6 py-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-600 font-semibold text-base border border-stone-200 shadow-sm transition-all duration-150 cursor-pointer"
            >
              No 🙈
            </button>
          )}
        </div>

        <p className="mt-6 text-stone-600 text-xs">
          (Hovering or tapping &quot;No&quot; may result in severe cat judgment, Jana)
        </p>
      </div>

      {/* Floating / Evasive "No" Button when triggered */}
      {noPosition && (
        <button
          ref={noButtonRef}
          style={{
            position: 'fixed',
            left: `${noPosition.x}px`,
            top: `${noPosition.y}px`,
            zIndex: 40,
            transition: 'all 0.18s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
          onMouseEnter={handleNoInteraction}
          onTouchStart={handleNoInteraction}
          onClick={handleNoInteraction}
          className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-rose-100 text-stone-600 text-sm font-bold border border-stone-300 shadow-xl cursor-pointer flex items-center gap-1.5 animate-pulse"
        >
          <span>No 🙈</span>
          <span className="text-xs text-rose-500">💨</span>
        </button>
      )}

      {/* POPUP MODAL: The 3rd GIF (scemer-staring-cat) Appears with Funny Reaction! */}
      {showStaringCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative max-w-sm w-full bg-white rounded-3xl p-6 shadow-2xl border-4 border-rose-400 text-center animate-dramatic-zoom">
            
            {/* Dramatic "SUS / ALERT" Header Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-black tracking-wider uppercase mb-3 animate-bounce">
              <Eye className="w-3.5 h-3.5" />
              <span>JUDGMENT CAT LOOKING AT JANA</span>
            </div>

            {/* The 3rd GIF: scemer-staring-cat.gif with zoomed, hilarious presentation */}
            <div className="relative mx-auto w-52 h-44 rounded-2xl overflow-hidden border-3 border-rose-300 shadow-lg bg-stone-900 mb-4 group">
              <img
                src="/assets/scemer-staring-cat.gif"
                alt="Intense staring cat meme judging you"
                className="w-full h-full object-cover scale-110 animate-pulse-subtle"
              />
              <div className="absolute inset-0 bg-rose-500/10 pointer-events-none"></div>
            </div>

            {/* Funny Teasing Punchline */}
            <h3 className="text-lg font-extrabold text-stone-900 mb-2 leading-snug">
              {FUNNY_NO_QUOTES[currentQuoteIndex]}
            </h3>

            <p className="text-xs text-stone-500 mb-5">
              The button got scared of Jana and ran away. Your only safe option is to click <span className="font-bold text-rose-600">YES</span>!
            </p>

            {/* Dismiss / Back to Proposal Button */}
            <button
              onClick={handleDismissModal}
              className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Okay fine, Jana won&apos;t click No! 🙈💕</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
