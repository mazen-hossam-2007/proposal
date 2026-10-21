import React, { useState } from 'react';
import { Lock, KeyRound, X, AlertCircle, Loader2 } from 'lucide-react';
import { sound } from '../utils/sound';
import { ADMIN_CONFIG } from '../adminConfig';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string) => void;
}

export const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMessage('Please enter the secret password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.token) {
        sound.playCelebration();
        // Save authenticated admin token securely in localStorage
        try {
          localStorage.setItem(ADMIN_CONFIG.tokenStorageKey, data.token);
        } catch {
          // Ignore storage quota
        }
        setPassword('');
        setIsLoading(false);
        onSuccess(data.token);
      } else {
        sound.playDramaticStare();
        setErrorMessage(data.error || "Wrong password, you're not the boyfriend! 😜");
        setIsShaking(true);
        setIsLoading(false);
        setTimeout(() => setIsShaking(false), 500);
      }
    } catch {
      // Network/Server offline fallback: Check against fallback password so boyfriend is never locked out
      if (password.trim() === ADMIN_CONFIG.fallbackPassword) {
        sound.playCelebration();
        const fallbackToken = `local_session_${Date.now()}`;
        try {
          localStorage.setItem(ADMIN_CONFIG.tokenStorageKey, fallbackToken);
        } catch {
          // Ignore storage quota
        }
        setPassword('');
        setIsLoading(false);
        onSuccess(fallbackToken);
      } else {
        sound.playDramaticStare();
        setErrorMessage("Wrong password, you're not the boyfriend! 😜");
        setIsShaking(true);
        setIsLoading(false);
        setTimeout(() => setIsShaking(false), 500);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fadeIn select-none">
      <div
        className={`relative max-w-sm w-full bg-white/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-7 shadow-2xl border-2 border-rose-300 text-center transition-all ${
          isShaking ? 'animate-head-shake border-red-400' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playPop();
            onClose();
          }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-rose-100 text-stone-500 hover:text-rose-600 flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Lock Icon */}
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200 shadow-inner">
          <Lock className="w-7 h-7 stroke-[2.2]" />
        </div>

        <h3 className="text-xl font-serif-romantic font-bold text-rose-950 mb-1">
          Secret Admin Viewer
        </h3>
        <p className="text-xs text-stone-600 mb-5">
          Enter Secret Passcode to view Jana&apos;s Date Ticket 🔐
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="password"
              autoFocus
              disabled={isLoading}
              placeholder="Enter secret passcode..."
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-rose-200 bg-white text-stone-800 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-xs disabled:opacity-60"
            />
            <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>

          {errorMessage && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600 font-semibold bg-rose-50 py-2 px-3 rounded-xl border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-sm shadow-md shadow-rose-500/25 transition-all active:scale-95 cursor-pointer disabled:opacity-75 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Secret...</span>
              </>
            ) : (
              <span>Unlock Dashboard 🔓</span>
            )}
          </button>
        </form>

        <p className="text-[11px] text-stone-400 mt-4">
          Only the boyfriend has authorization here! 🤫
        </p>
      </div>
    </div>
  );
};
