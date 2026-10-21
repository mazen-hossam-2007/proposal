import React from 'react';
import { MapPin, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { sound } from '../utils/sound';
import { LocationOption } from '../types';

interface LocationStepProps {
  selectedLocations: string[];
  setSelectedLocations: (locs: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const LOCATIONS: LocationOption[] = [
  {
    id: 'zamalek',
    name: 'Zamalek 🌳✨',
    tagline: 'Island Walks & Nile Breeze',
    emoji: '🌿',
    bgGradient: 'from-emerald-500/10 to-teal-500/10 border-emerald-200',
    description: 'Picturesque tree-lined avenues, vintage antique stores, cozy aesthetic cafes, and romantic Nile walks.',
  },
  {
    id: 'club',
    name: 'The Club 🎾',
    tagline: 'Chilled Vibes & Lawn Talks',
    emoji: '🎾',
    bgGradient: 'from-sky-500/10 to-blue-500/10 border-sky-200',
    description: 'Relaxed atmosphere, refreshing iced drinks, open green lawns, padel tennis, or quiet terrace seating.',
  },
  {
    id: 'mall',
    name: 'The Mall 🛍️',
    tagline: 'Shopping, Arcade & Treats',
    emoji: '🛍️',
    bgGradient: 'from-purple-500/10 to-pink-500/10 border-purple-200',
    description: 'Window shopping, exploring stores together, arcade games, air-conditioned ease, and coffee stops.',
  },
  {
    id: 'street',
    name: 'Street Stroll 🚶‍♂️🌃',
    tagline: 'Late Night Walks & Deep Talks',
    emoji: '🌃',
    bgGradient: 'from-indigo-500/10 to-blue-500/10 border-indigo-200',
    description: 'City lights, exploring historic downtown or Korba streets, grab-and-go treats, and laughing together.',
  },
  {
    id: 'cinema',
    name: 'The Cinema 🎬🍿',
    tagline: 'Movie Marathon & Popcorn',
    emoji: '🍿',
    bgGradient: 'from-amber-500/10 to-orange-500/10 border-amber-200',
    description: 'Cozy cinema seats, huge caramel popcorn, watching a blockbuster or comedy, and discussing the plot after.',
  },
  {
    id: 'restaurant',
    name: 'Romantic Restaurant 🍝🕯️',
    tagline: 'Candlelight & Delicious Food',
    emoji: '🕯️',
    bgGradient: 'from-rose-500/10 to-pink-500/10 border-rose-200',
    description: 'Warm mood lighting, soft music, delicious starters, mouth-watering mains, and intimate conversation.',
  },
];

export const LocationStep: React.FC<LocationStepProps> = ({
  selectedLocations,
  setSelectedLocations,
  onNext,
  onBack,
}) => {
  const toggleLocation = (name: string) => {
    sound.playPop();
    if (selectedLocations.includes(name)) {
      setSelectedLocations(selectedLocations.filter((l) => l !== name));
    } else {
      setSelectedLocations([...selectedLocations, name]);
    }
  };

  const hasSelection = selectedLocations.length > 0;

  return (
    <div className="relative z-10 max-w-2xl w-full mx-auto p-3 sm:p-6 animate-fadeIn select-none">
      {/* Header */}
      <div className="text-center mb-4 sm:mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] sm:text-xs font-bold uppercase mb-1.5 sm:mb-2">
          <Sparkles className="w-3 h-3 text-rose-500" />
          <span>Step 2 of 3: Choose Destination • For Jana</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-serif-romantic font-bold text-rose-950 mb-1">
          Where do you want us to go, Jana? 🌳✨
        </h2>
        <p className="text-xs sm:text-sm text-stone-600">
          Pick your favorite spot, Jana (or select multiple if you want a combo!):
        </p>
      </div>

      {/* 6 Grid Destination Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
        {LOCATIONS.map((loc) => {
          const isSelected = selectedLocations.includes(loc.name);
          return (
            <div
              key={loc.id}
              onClick={() => toggleLocation(loc.name)}
              className={`relative p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border-2 transition-all duration-200 cursor-pointer text-left select-none touch-manipulation ${
                isSelected
                  ? 'bg-rose-50 border-rose-500 shadow-md shadow-rose-200 scale-[1.01]'
                  : 'bg-white/90 hover:bg-white border-rose-100/90 shadow-2xs hover:border-rose-200'
              }`}
            >
              {/* Selected Badge */}
              <div
                className={`absolute top-3 right-3 sm:top-4 sm:right-4 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all ${
                  isSelected ? 'bg-rose-500 text-white scale-105 shadow-xs' : 'bg-stone-100 text-transparent'
                }`}
              >
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
              </div>

              <div className="flex items-start gap-2.5 sm:gap-3">
                <span className="text-2xl sm:text-3xl p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-white shadow-2xs border border-rose-100 shrink-0">
                  {loc.emoji}
                </span>
                <div className="pr-6 sm:pr-8">
                  <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-snug">
                    {loc.name}
                  </h3>
                  <p className="text-[11px] sm:text-xs font-semibold text-rose-600 mb-1">
                    {loc.tagline}
                  </p>
                </div>
              </div>

              <p className="text-[11px] sm:text-xs text-stone-600 mt-1.5 sm:mt-2 leading-relaxed">
                {loc.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-2.5 sm:gap-4 pt-1">
        <button
          type="button"
          onClick={() => {
            sound.playPop();
            onBack();
          }}
          className="px-4 sm:px-5 py-3 rounded-2xl bg-white hover:bg-stone-50 border border-rose-200 text-stone-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-sm active:scale-95 transition-all cursor-pointer touch-manipulation shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          disabled={!hasSelection}
          onClick={() => {
            sound.playPop();
            onNext();
          }}
          className={`flex-1 sm:flex-initial px-4 sm:px-8 py-3 sm:py-3.5 rounded-2xl font-bold text-xs sm:text-base flex items-center justify-center gap-1.5 sm:gap-2 transition-all shadow-lg cursor-pointer touch-manipulation ${
            hasSelection
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-rose-500/25 hover:shadow-rose-500/40 hover:scale-[1.01] active:scale-95'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
          }`}
        >
          <span className="truncate">Next: Pick Food & Cravings</span>
          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
        </button>
      </div>

      {!hasSelection && (
        <p className="text-center text-[11px] sm:text-xs text-stone-400 mt-2.5">
          Select at least 1 destination to proceed 📍
        </p>
      )}
    </div>
  );
};
