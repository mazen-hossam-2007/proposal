import React from 'react';
import { Utensils, ArrowRight, ArrowLeft, Check, Sparkles, Heart } from 'lucide-react';
import { sound } from '../utils/sound';
import { FoodOption } from '../types';

interface FoodStepProps {
  selectedFood: string[];
  setSelectedFood: (food: string[]) => void;
  specialNote: string;
  setSpecialNote: (note: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const FOOD_OPTIONS: FoodOption[] = [
  {
    id: 'italian',
    title: 'Italian Cuisine 🍕🍝',
    emoji: '🍝',
    description: 'Neapolitan wood-fired pizza, creamy fettuccine, or garlic parmesan pasta.',
    category: 'Savory',
  },
  {
    id: 'burgers',
    title: 'Smash Burgers & Fries 🍔🍟',
    emoji: '🍔',
    description: 'Cheesy brioche burgers, loaded fries, crispy onion rings & milkshakes.',
    category: 'Savory',
  },
  {
    id: 'sushi',
    title: 'Sushi & Asian Delights 🍣🍱',
    emoji: '🍣',
    description: 'Fresh salmon nigiri, crunchy fried rolls, spicy noodles & dumplings.',
    category: 'Savory',
  },
  {
    id: 'egyptian',
    title: 'Egyptian Street Classics 🥙✨',
    emoji: '🥙',
    description: 'Savory chicken/beef shawarma with garlic tomeya, koshari, or spicy hawawshi.',
    category: 'Savory',
  },
  {
    id: 'dessert',
    title: 'Desserts & Sweets 🍨🧇',
    emoji: '🍨',
    description: 'Warm Nutella crepes, molten chocolate lava cake, churros, or gelato.',
    category: 'Sweet',
  },
  {
    id: 'cafe',
    title: 'Boba, Matcha & Iced Latte 🧋☕',
    emoji: '🧋',
    description: 'Brown sugar boba tea, iced strawberry matcha, Spanish latte & bakery pastries.',
    category: 'Drinks & Snacks',
  },
];

export const FoodStep: React.FC<FoodStepProps> = ({
  selectedFood,
  setSelectedFood,
  specialNote,
  setSpecialNote,
  onNext,
  onBack,
}) => {
  const toggleFood = (title: string) => {
    sound.playPop();
    if (selectedFood.includes(title)) {
      setSelectedFood(selectedFood.filter((f) => f !== title));
    } else {
      setSelectedFood([...selectedFood, title]);
    }
  };

  const hasSelection = selectedFood.length > 0;

  return (
    <div className="relative z-10 max-w-2xl w-full mx-auto p-3 sm:p-6 animate-fadeIn select-none">
      {/* Header featuring the Cat Eating Chips GIF */}
      <div className="text-center mb-4 sm:mb-6">
        <div className="relative inline-block mx-auto mb-2 sm:mb-3">
          <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-3xl overflow-hidden shadow-lg border-3 border-amber-300 mx-auto bg-amber-50">
            <img
              src="/assets/cat-eating-chips.gif"
              alt="Cat crunching and eating chips happily"
              className="w-full h-full object-cover scale-110"
            />
          </div>
          <span className="absolute -bottom-1.5 -right-1.5 bg-white rounded-full p-1 sm:p-1.5 shadow-md border border-amber-200 text-sm sm:text-lg">
            😋
          </span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] sm:text-xs font-bold uppercase mb-1.5 sm:mb-2">
          <Sparkles className="w-3 h-3 text-rose-500" />
          <span>Step 3 of 3: Food Cravings • Jana's Choice</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-serif-romantic font-bold text-rose-950 mb-1">
          What are you craving, Jana? 🍽️
        </h2>
        <p className="text-xs sm:text-sm text-stone-600">
          Pick everything your heart desires, Jana — my treat! 😋✨
        </p>
      </div>

      {/* Food Choices Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-4 sm:mb-6">
        {FOOD_OPTIONS.map((item) => {
          const isSelected = selectedFood.includes(item.title);
          return (
            <div
              key={item.id}
              onClick={() => toggleFood(item.title)}
              className={`p-3 sm:p-4 rounded-2xl sm:rounded-3xl border-2 transition-all cursor-pointer text-left select-none relative touch-manipulation ${
                isSelected
                  ? 'bg-rose-50 border-rose-500 shadow-md shadow-rose-200/50 scale-[1.01]'
                  : 'bg-white/90 hover:bg-white border-rose-100/80 shadow-2xs hover:border-rose-200'
              }`}
            >
              <div
                className={`absolute top-3 right-3 sm:top-4 sm:right-4 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all ${
                  isSelected ? 'bg-rose-500 text-white scale-105 shadow-xs' : 'bg-stone-100 text-transparent'
                }`}
              >
                <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3 mb-1.5">
                <span className="text-xl sm:text-2xl p-1.5 sm:p-2 rounded-xl bg-white shadow-2xs border border-rose-100 shrink-0">
                  {item.emoji}
                </span>
                <h3 className="font-bold text-stone-900 text-sm sm:text-base leading-snug pr-6 sm:pr-8">
                  {item.title}
                </h3>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-600 leading-relaxed pr-2">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Special Craving Note Card */}
      <div className="bg-white/90 backdrop-blur-xl border border-rose-100 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xs mb-4 sm:mb-6">
        <label className="flex items-center gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
          <Utensils className="w-3.5 h-3.5 text-rose-500" />
          <span>Any specific craving or favorite dessert for you, Jana?</span>
        </label>
        <textarea
          rows={2}
          value={specialNote}
          onChange={(e) => setSpecialNote(e.target.value)}
          placeholder="e.g. 'Jana wants pistachio gelato!' or 'A cute quiet cafe with a river view please'..."
          className="w-full px-3.5 py-2 rounded-xl sm:rounded-2xl border border-rose-200 bg-white text-stone-800 placeholder-stone-400 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
        />
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
            sound.playCelebration();
            onNext();
          }}
          className={`flex-1 sm:flex-initial px-4 sm:px-8 py-3 sm:py-3.5 rounded-2xl font-bold text-xs sm:text-base flex items-center justify-center gap-1.5 sm:gap-2 transition-all shadow-lg cursor-pointer touch-manipulation ${
            hasSelection
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-rose-500/25 hover:shadow-rose-500/40 hover:scale-[1.01] active:scale-95'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
          }`}
        >
          <Heart className="w-4 h-4 fill-white shrink-0" />
          <span className="truncate">Lock In Our Date! ❤️</span>
          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
        </button>
      </div>

      {!hasSelection && (
        <p className="text-center text-[11px] sm:text-xs text-stone-400 mt-2.5">
          Select at least 1 food option to finalize the date 🍕
        </p>
      )}
    </div>
  );
};
