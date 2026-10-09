import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Calendar, Clock, ArrowRight, Heart, Sparkles } from 'lucide-react';
import { sound } from '../utils/sound';

interface DateTimeStepProps {
  date: string;
  setDate: (d: string) => void;
  timeSlot: string;
  setTimeSlot: (t: string) => void;
  customTime: string;
  setCustomTime: (c: string) => void;
  onNext: () => void;
}

const QUICK_DATES = [
  { label: 'This Friday 🌙', daysFromNow: 1 },
  { label: 'This Saturday ✨', daysFromNow: 2 },
  { label: 'Sunday Chill ☕', daysFromNow: 3 },
  { label: 'Next Weekend 🌸', daysFromNow: 7 },
];

const TIME_SLOTS = [
  { id: 'afternoon', title: 'Afternoon Coffee (3:30 PM)', icon: '☕', desc: 'Cozy brew & sweet chats' },
  { id: 'sunset', title: 'Sunset Magic (5:30 PM)', icon: '🌅', desc: 'Golden hour views & stroll' },
  { id: 'dinner', title: 'Dinner Time (7:30 PM)', icon: '🕯️', desc: 'Candlelight & great food' },
  { id: 'stargaze', title: 'Night Adventure (9:00 PM)', icon: '🌙', desc: 'Breeze, ice cream & deep talks' },
];

export const DateTimeStep: React.FC<DateTimeStepProps> = ({
  date,
  setDate,
  timeSlot,
  setTimeSlot,
  customTime,
  setCustomTime,
  onNext,
}) => {
  // Fire celebratory confetti on mount
  useEffect(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f43f5e', '#ec4899', '#fb7185', '#fda4af', '#fef08a'],
    });
  }, []);

  // Format date helper
  const setQuickDate = (days: number) => {
    sound.playPop();
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  const isComplete = Boolean(date && (timeSlot || customTime));

  return (
    <div className="relative z-10 max-w-xl w-full mx-auto p-4 sm:p-6 animate-fadeIn">
      {/* Celebration Header with Happy Cat Dancing GIF */}
      <div className="text-center mb-8">
        <div className="relative inline-block mx-auto mb-3">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden shadow-xl border-3 border-rose-300 mx-auto bg-rose-50">
            <img
              src="/assets/happy-cat.gif"
              alt="Happy dancing cat jumping with joy"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="absolute -bottom-2 -right-2 bg-white rounded-full p-1.5 shadow-md border border-rose-200 text-lg animate-bounce">
            🎉
          </span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold uppercase mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step 1 of 3: Lock Down The Time • Jana &amp; Mazen</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-serif-romantic font-bold text-rose-950 mb-1">
          When are you free, Jana? 🌸
        </h2>
        <p className="text-sm text-stone-600">
          Pick any day and vibe that fits your schedule best, Jana!
        </p>
      </div>

      {/* Date & Time Picker Card */}
      <div className="bg-white/85 backdrop-blur-xl border border-rose-100 rounded-3xl p-6 sm:p-8 shadow-xl shadow-rose-200/40 space-y-6">
        
        {/* Date Selection */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-stone-800 mb-2">
            <Calendar className="w-4 h-4 text-rose-500" />
            <span>Pick a Date:</span>
          </label>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {QUICK_DATES.map((qd, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setQuickDate(qd.daysFromNow)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all active:scale-95 cursor-pointer"
              >
                {qd.label}
              </button>
            ))}
          </div>

          <input
            type="date"
            value={date}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => {
              sound.playPop();
              setDate(e.target.value);
            }}
            className="w-full px-4 py-3 rounded-2xl border border-rose-200 bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium text-sm transition-all shadow-sm"
          />
        </div>

        {/* Time Slot Selection */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-stone-800 mb-3">
            <Clock className="w-4 h-4 text-rose-500" />
            <span>What time of day suits you?</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {TIME_SLOTS.map((slot) => {
              const selected = timeSlot === slot.title;
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    setTimeSlot(slot.title);
                    setCustomTime('');
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    selected
                      ? 'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/20 scale-[1.02]'
                      : 'bg-white hover:bg-rose-50/60 border-rose-100 text-stone-700 hover:border-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{slot.icon}</span>
                    <span className={`text-sm font-bold ${selected ? 'text-white' : 'text-stone-900'}`}>
                      {slot.title}
                    </span>
                  </div>
                  <p className={`text-xs ${selected ? 'text-rose-100' : 'text-stone-500'}`}>
                    {slot.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Custom Time Option */}
          <div className="pt-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Or type a specific time (e.g. 6:45 PM)..."
                value={customTime}
                onChange={(e) => {
                  setCustomTime(e.target.value);
                  setTimeSlot('');
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-rose-200 bg-white text-stone-800 placeholder-stone-400 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
          </div>
        </div>

        {/* Next Step Button */}
        <div className="pt-2">
          <button
            type="button"
            disabled={!isComplete}
            onClick={() => {
              sound.playPop();
              onNext();
            }}
            className={`w-full py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
              isComplete
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-rose-500/25 hover:shadow-rose-500/40 hover:scale-[1.01] active:scale-95'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
            }`}
          >
            <span>Next: Choose Where We Go</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          {!isComplete && (
            <p className="text-center text-xs text-stone-400 mt-2">
              Pick a date and time slot to continue ✨
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
