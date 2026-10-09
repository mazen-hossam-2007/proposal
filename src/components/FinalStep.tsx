import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Heart, Copy, Check, Share2, MessageCircle, Calendar, MapPin, Utensils, RotateCcw, ShieldAlert, Sparkles } from 'lucide-react';
import { DateProposalState } from '../types';
import { sound } from '../utils/sound';

interface FinalStepProps {
  state: DateProposalState;
  onReset: () => void;
}

export const FinalStep: React.FC<FinalStepProps> = ({ state, onReset }) => {
  const [copied, setCopied] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(false);

  useEffect(() => {
    // Grand celebration confetti blast!
    const end = Date.now() + 2.5 * 1000;
    const colors = ['#f43f5e', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  const formattedTime = state.customTime || state.timeSlot || 'Evening';
  const placesList = state.locations.join(', ') || 'Surprise spot';
  const foodList = state.foodCravings.join(', ') || 'Delicious food';
  const rejections = state.rejectionAttempts || 0;

  // Format the romantic summary message
  const shareMessage = 
`Hey Mazen! ❤️ It's Jana, and I said YES to our date!

Here are my choices for our date:
📅 Date: ${state.date || 'TBD'}
⏰ Time: ${formattedTime}
📍 Place: ${placesList}
🍽️ Food: ${foodList}${state.specialNote ? `\n💌 Special Note from Jana: "${state.specialNote}"` : ''}
${rejections > 0 ? `🙈 P.S. I tried to reject you ${rejections} ${rejections === 1 ? 'time' : 'times'} but the button ran away! 😂` : '🥰 P.S. I said YES immediately on the first click!'}

Can't wait to see you, Mazen! 🥰✨`;

  const handleCopy = () => {
    sound.playPop();
    navigator.clipboard.writeText(shareMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppSend = () => {
    sound.playPop();
    const encoded = encodeURIComponent(shareMessage);
    let url = `https://wa.me/?text=${encoded}`;
    if (phoneNumber.trim()) {
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
      url = `https://wa.me/${cleanPhone}?text=${encoded}`;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="relative z-10 max-w-xl w-full mx-auto p-4 sm:p-6 animate-fadeIn select-none">
      
      {/* Celebration Header */}
      <div className="text-center mb-6">
        <div className="relative inline-block mx-auto mb-3">
          <div className="w-32 h-32 rounded-3xl overflow-hidden shadow-2xl border-4 border-rose-300 mx-auto bg-rose-50">
            <img
              src="/assets/happy-cat.gif"
              alt="Happy dancing cat celebrating"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg border border-rose-200 text-2xl animate-bounce">
            🎉
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-serif-romantic font-extrabold text-rose-950 mb-1">
          IT&apos;S AN OFFICIAL DATE WITH JANA! ❤️
        </h1>
        <p className="font-handwriting text-2xl text-rose-600 mb-3">
          Best decision of the year, Jana! Here is our cute itinerary:
        </p>

        {/* Rejection Attempts Callout Banner */}
        {rejections > 0 ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-bold shadow-xs">
            <span className="text-base">😼</span>
            <span>Jana tried to reject / avoid saying Yes <strong>{rejections} {rejections === 1 ? 'time' : 'times'}</strong> before giving up! 😂</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Jana said YES on the very first try with zero hesitation! 🥰</span>
          </div>
        )}
      </div>

      {/* Romantic Golden Love Ticket Card */}
      <div className="relative bg-white/90 backdrop-blur-xl border-2 border-rose-200 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-rose-200/50 mb-6 overflow-hidden">
        {/* Ticket punch hole notches */}
        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#fdf8f5] border-r-2 border-rose-200"></div>
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#fdf8f5] border-l-2 border-rose-200"></div>

        {/* Header Tag */}
        <div className="flex items-center justify-between border-b border-rose-100 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
            <span className="font-serif-romantic font-bold text-rose-900 tracking-wide text-sm">
              DATE NIGHT PASS • JANA &amp; MAZEN
            </span>
          </div>
          <span className="px-3 py-1 rounded-full bg-rose-100/80 text-rose-700 text-xs font-bold uppercase tracking-wider">
            Confirmed 🎟️
          </span>
        </div>

        {/* Details Grid */}
        <div className="space-y-4">
          {/* Rejection Attempts Line inside ticket */}
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-rose-100/70 text-rose-600 border border-rose-200">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Rejections / Dodges</p>
              <p className="text-base font-bold text-stone-900">
                {rejections > 0 
                  ? `${rejections} ${rejections === 1 ? 'Attempt' : 'Attempts'} (Resistance was futile! 😼)` 
                  : '0 Attempts (Immediate YES! 🥰)'}
              </p>
              <p className="text-xs text-rose-600 font-semibold">
                {rejections > 0 ? 'The staring cat won in the end!' : 'Zero hesitation, true love!'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Date &amp; Time</p>
              <p className="text-base font-bold text-stone-900">{state.date || 'TBD'}</p>
              <p className="text-xs text-rose-600 font-semibold">{formattedTime}</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Destination</p>
              <p className="text-base font-bold text-stone-900">{placesList}</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Food &amp; Treats</p>
              <p className="text-base font-bold text-stone-900">{foodList}</p>
            </div>
          </div>

          {state.specialNote && (
            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80">
              <p className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-1">
                💌 Special Craving / Note:
              </p>
              <p className="text-sm font-medium text-stone-800 italic">
                &ldquo;{state.specialNote}&rdquo;
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons: WhatsApp & Copy */}
      <div className="space-y-3">
        {/* WhatsApp Send Button */}
        <button
          onClick={handleWhatsAppSend}
          className="w-full py-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-98 text-white font-bold text-base shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
        >
          <MessageCircle className="w-5 h-5 fill-white" />
          <span>Send Plan to WhatsApp 💬</span>
        </button>

        {/* Copy Text Button */}
        <button
          onClick={handleCopy}
          className="w-full py-3.5 rounded-2xl bg-white hover:bg-stone-50 border border-rose-200 text-stone-700 font-bold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700">Copied to Clipboard! 🎉</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-stone-500" />
              <span>Copy Date Itinerary Text</span>
            </>
          )}
        </button>

        {/* Optional phone number configure */}
        <div className="text-center pt-2">
          {!showPhoneInput ? (
            <button
              onClick={() => setShowPhoneInput(true)}
              className="text-xs text-rose-600 hover:underline cursor-pointer"
            >
              Want to send directly to a specific phone number?
            </button>
          ) : (
            <div className="p-3 rounded-2xl bg-white border border-rose-100 shadow-sm mt-2 flex items-center gap-2">
              <input
                type="tel"
                placeholder="Enter WhatsApp number (e.g. +201234567890)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-rose-400"
              />
              <button
                onClick={handleWhatsAppSend}
                className="px-3 py-1.5 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 cursor-pointer"
              >
                Send
              </button>
            </div>
          )}
        </div>

        {/* Restart Button */}
        <div className="text-center pt-4">
          <button
            onClick={() => {
              sound.playPop();
              onReset();
            }}
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Plan another date / restart</span>
          </button>
        </div>
      </div>
    </div>
  );
};
