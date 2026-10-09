import React, { useState, useEffect } from 'react';
import { 
  X, Lock, Calendar, Clock, MapPin, Utensils, MessageSquare, 
  RefreshCw, Check, Copy, Heart, Sparkles, AlertCircle 
} from 'lucide-react';
import { DateSubmissionRecord } from '../types';
import { sound } from '../utils/sound';
import { ADMIN_CONFIG } from '../adminConfig';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [submissions, setSubmissions] = useState<DateSubmissionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    let loadedFromApi = false;

    // 1. Fetch from server API
    try {
      const res = await fetch('/api/submissions');
      if (res.ok) {
        const data = await res.json();
        if (data.submissions && Array.isArray(data.submissions)) {
          setSubmissions(data.submissions);
          loadedFromApi = true;
        }
      }
    } catch {
      // offline / API fallback
    }

    // 2. Fallback to localStorage backup if API had no data
    if (!loadedFromApi || submissions.length === 0) {
      try {
        const localData = localStorage.getItem(ADMIN_CONFIG.storageKey);
        if (localData) {
          const parsed = JSON.parse(localData);
          const list = Array.isArray(parsed) ? parsed : [parsed];
          setSubmissions((prev) => (prev.length > 0 ? prev : list));
        }
      } catch {
        // ignore
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchSubmissions();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const latest = submissions[0];

  const handleCopy = (record: DateSubmissionRecord) => {
    sound.playPop();
    const formatted = 
`💘 JANA'S CONFIRMED DATE TICKET 💘
📅 Date: ${record.date || 'TBD'}
⏰ Time: ${record.customTime || record.timeSlot || 'Evening'}
📍 Destination: ${record.locations.join(', ') || 'None'}
🍽️ Food Choices: ${record.foodCravings.join(', ') || 'None'}
💌 Personal Note: "${record.specialNote || 'None'}"
⏰ Submitted: ${new Date(record.submittedAt).toLocaleString()}`;

    navigator.clipboard.writeText(formatted);
    setCopiedId(record.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-fadeIn select-none">
      <div 
        className="relative max-w-lg w-full bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border-2 border-rose-300 max-h-[90vh] overflow-y-auto animate-dramatic-zoom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-rose-100 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif-romantic font-bold text-rose-950">
                Boyfriend Admin Dashboard
              </h2>
              <p className="text-[11px] text-stone-500">
                Private viewer for Jana&apos;s date choices 🔒
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playPop();
                fetchSubmissions();
              }}
              disabled={isLoading}
              className="p-2 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-600 transition-all cursor-pointer"
              title="Refresh submissions"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => {
                sound.playPop();
                onClose();
              }}
              className="p-2 rounded-xl bg-stone-100 hover:bg-rose-100 text-stone-600 hover:text-rose-600 transition-all cursor-pointer"
              title="Close and lock admin"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Banner */}
        {latest ? (
          <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm animate-bounce">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-emerald-950">
                Jana Confirmed the Date! 🎉
              </h3>
              <p className="text-xs text-emerald-700">
                Submitted on {new Date(latest.submittedAt).toLocaleDateString()} at{' '}
                {new Date(latest.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                Waiting for Jana to confirm... ⏳
              </h3>
              <p className="text-xs text-amber-700">
                No submissions received yet. When Jana clicks &quot;Lock In Our Date&quot;, her choices will appear here instantly!
              </p>
            </div>
          </div>
        )}

        {/* Latest Submission Card Details */}
        {latest && (
          <div className="bg-rose-50/50 rounded-2xl p-5 border border-rose-200/80 mb-5 space-y-4">
            {/* Header info */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                <span>Confirmed Date Ticket</span>
              </span>

              <button
                onClick={() => handleCopy(latest)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition-all cursor-pointer shadow-2xs"
              >
                {copiedId === latest.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Grid of Choices */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Date */}
              <div className="bg-white p-3.5 rounded-xl border border-rose-100 shadow-2xs">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-rose-500" />
                  <span>Date Chosen</span>
                </p>
                <p className="text-sm font-bold text-stone-900">
                  {latest.date || 'Not specified'}
                </p>
              </div>

              {/* Time */}
              <div className="bg-white p-3.5 rounded-xl border border-rose-100 shadow-2xs">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Clock className="w-3.5 h-3.5 text-rose-500" />
                  <span>Time / Slot</span>
                </p>
                <p className="text-sm font-bold text-stone-900">
                  {latest.customTime || latest.timeSlot || 'Not specified'}
                </p>
              </div>

              {/* Destination */}
              <div className="bg-white p-3.5 rounded-xl border border-rose-100 shadow-2xs sm:col-span-2">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Destination(s)</span>
                </p>
                <p className="text-sm font-bold text-stone-900">
                  {latest.locations.join(' • ') || 'None selected'}
                </p>
              </div>

              {/* Food */}
              <div className="bg-white p-3.5 rounded-xl border border-rose-100 shadow-2xs sm:col-span-2">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Utensils className="w-3.5 h-3.5 text-amber-500" />
                  <span>Food &amp; Cravings</span>
                </p>
                <p className="text-sm font-bold text-stone-900">
                  {latest.foodCravings.join(' • ') || 'None selected'}
                </p>
              </div>
            </div>

            {/* Note from Jana */}
            <div className="bg-white p-3.5 rounded-xl border border-rose-100 shadow-2xs">
              <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1 mb-1">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Personal Note Written by Jana</span>
              </p>
              <p className="text-xs font-medium text-stone-800 italic">
                {latest.specialNote ? `"${latest.specialNote}"` : 'No additional note left.'}
              </p>
            </div>
          </div>
        )}

        {/* Older submissions history list if any */}
        {submissions.length > 1 && (
          <div className="mb-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
              Submission History ({submissions.length})
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {submissions.slice(1).map((sub, i) => (
                <div 
                  key={sub.id || i}
                  className="p-3 bg-stone-50 rounded-xl text-xs flex items-center justify-between border border-stone-200"
                >
                  <div>
                    <span className="font-bold text-stone-800">{sub.date} ({sub.timeSlot})</span>
                    <span className="text-stone-500 block text-[10px]">
                      {new Date(sub.submittedAt).toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(sub)}
                    className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-rose-50 text-stone-600 text-[10px] font-bold cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={() => {
              sound.playPop();
              onClose();
            }}
            className="w-full py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>Close / Lock Admin</span>
          </button>
        </div>
      </div>
    </div>
  );
};
