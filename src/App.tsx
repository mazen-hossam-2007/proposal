import React, { useState, useEffect, useRef } from 'react';
import { DateProposalState } from './types';
import { ProposalStep } from './components/ProposalStep';
import { DateTimeStep } from './components/DateTimeStep';
import { LocationStep } from './components/LocationStep';
import { FoodStep } from './components/FoodStep';
import { FinalStep } from './components/FinalStep';
import { FloatingHearts } from './components/FloatingHearts';
import { AdminPasswordModal } from './components/AdminPasswordModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { ADMIN_CONFIG } from './adminConfig';
import { sound } from './utils/sound';

export default function App() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Admin secret viewer states
  const [adminToken, setAdminToken] = useState<string>(() => {
    try {
      return localStorage.getItem(ADMIN_CONFIG.tokenStorageKey) || '';
    } catch {
      return '';
    }
  });
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState<boolean>(false);

  // Triple-click tracking ref
  const secretClickCountRef = useRef<number>(0);
  const secretClickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [proposalState, setProposalState] = useState<DateProposalState>({
    hasSaidYes: false,
    rejectionAttempts: 0,
    date: '',
    timeSlot: '',
    customTime: '',
    locations: ['Zamalek 🌳✨'],
    foodCravings: ['Italian Cuisine 🍕🍝'],
    specialNote: '',
  });

  // Check URL triggers on load or hash change (#admin or ?admin=true)
  useEffect(() => {
    const checkAdminTrigger = () => {
      const hash = window.location.hash;
      const searchParams = new URLSearchParams(window.location.search);
      if (hash === ADMIN_CONFIG.secretHash || searchParams.get(ADMIN_CONFIG.secretQueryParam) === 'true') {
        const storedToken = localStorage.getItem(ADMIN_CONFIG.tokenStorageKey);
        if (storedToken) {
          setAdminToken(storedToken);
          setIsAdminDashboardOpen(true);
        } else {
          setIsPasswordModalOpen(true);
        }
      }
    };

    checkAdminTrigger();
    window.addEventListener('hashchange', checkAdminTrigger);
    return () => window.removeEventListener('hashchange', checkAdminTrigger);
  }, []);

  // Subtle secret triple-click handler on the footer heart
  const handleSecretHeartClick = () => {
    secretClickCountRef.current += 1;
    if (secretClickTimerRef.current) {
      clearTimeout(secretClickTimerRef.current);
    }

    if (secretClickCountRef.current >= 3) {
      sound.playPop();
      secretClickCountRef.current = 0;
      const storedToken = localStorage.getItem(ADMIN_CONFIG.tokenStorageKey);
      if (storedToken) {
        setAdminToken(storedToken);
        setIsAdminDashboardOpen(true);
      } else {
        setIsPasswordModalOpen(true);
      }
    } else {
      secretClickTimerRef.current = setTimeout(() => {
        secretClickCountRef.current = 0;
      }, 1500);
    }
  };

  // Background-sync any unsynced offline records from localStorage to the server
  useEffect(() => {
    const syncLocalRecords = async () => {
      try {
        const raw = localStorage.getItem(ADMIN_CONFIG.storageKey);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of list) {
          if (item && !item._synced) {
            try {
              const res = await fetch('/api/submissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item),
              });
              if (res.ok) {
                item._synced = true;
              }
            } catch {
              // will retry next time
            }
          }
        }
        localStorage.setItem(ADMIN_CONFIG.storageKey, JSON.stringify(list));
      } catch {
        // ignore
      }
    };

    syncLocalRecords();
  }, []);

  const toggleMute = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    sound.enabled = !nextState;
  };

  const handleAcceptProposal = (rejections: number) => {
    setProposalState((prev) => ({
      ...prev,
      hasSaidYes: true,
      rejectionAttempts: rejections,
    }));
    setCurrentStep(1);
  };

  // Called when Jana clicks "Lock In Our Date! ❤️" in Step 3
  const handleLockInDate = async () => {
    const record = {
      ...proposalState,
      partnerName: 'Jana',
      status: 'Confirmed',
      id: `prop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      submittedAt: new Date().toISOString(),
    };

    // 1. Save locally in localStorage as reliable backup
    try {
      const existing = localStorage.getItem(ADMIN_CONFIG.storageKey);
      let list = [];
      if (existing) {
        try {
          const parsed = JSON.parse(existing);
          list = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          list = [];
        }
      }
      list.unshift(record);
      localStorage.setItem(ADMIN_CONFIG.storageKey, JSON.stringify(list));
    } catch {
      // ignore
    }

    // 2. Save persistently online via server API
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      if (res.ok) {
        try {
          const stored = localStorage.getItem(ADMIN_CONFIG.storageKey);
          if (stored) {
            const list = JSON.parse(stored);
            if (Array.isArray(list) && list[0]) {
              list[0]._synced = true;
              localStorage.setItem(ADMIN_CONFIG.storageKey, JSON.stringify(list));
            }
          }
        } catch {
          // ignore
        }
      }
    } catch {
      // offline fallback
    }

    // Proceed to celebration summary
    setCurrentStep(4);
  };

  const handleReset = () => {
    setProposalState({
      hasSaidYes: false,
      rejectionAttempts: 0,
      date: '',
      timeSlot: '',
      customTime: '',
      locations: ['Zamalek 🌳✨'],
      foodCravings: ['Italian Cuisine 🍕🍝'],
      specialNote: '',
    });
    setCurrentStep(0);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#fef8f6] via-[#fdf2f4] to-[#fcecee] text-[#381e26] selection:bg-rose-200 selection:text-rose-900 flex flex-col justify-between overflow-x-hidden">
      {/* Floating Animated Hearts */}
      <FloatingHearts />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center">
        {currentStep === 0 && (
          <ProposalStep
            onAccept={handleAcceptProposal}
            isMuted={isMuted}
            toggleMute={toggleMute}
          />
        )}

        {currentStep === 1 && (
          <DateTimeStep
            date={proposalState.date}
            setDate={(d) => setProposalState((p) => ({ ...p, date: d }))}
            timeSlot={proposalState.timeSlot}
            setTimeSlot={(t) => setProposalState((p) => ({ ...p, timeSlot: t }))}
            customTime={proposalState.customTime}
            setCustomTime={(c) => setProposalState((p) => ({ ...p, customTime: c }))}
            onNext={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 2 && (
          <LocationStep
            selectedLocations={proposalState.locations}
            setSelectedLocations={(locs) => setProposalState((p) => ({ ...p, locations: locs }))}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <FoodStep
            selectedFood={proposalState.foodCravings}
            setSelectedFood={(f) => setProposalState((p) => ({ ...p, foodCravings: f }))}
            specialNote={proposalState.specialNote}
            setSpecialNote={(n) => setProposalState((p) => ({ ...p, specialNote: n }))}
            onNext={handleLockInDate}
            onBack={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 4 && (
          <FinalStep
            state={proposalState}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Secret Password Modal */}
      <AdminPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={(token: string) => {
          setAdminToken(token);
          setIsPasswordModalOpen(false);
          setIsAdminDashboardOpen(true);
        }}
      />

      {/* Private Admin Dashboard View */}
      <AdminDashboardModal
        isOpen={isAdminDashboardOpen}
        adminToken={adminToken}
        onClose={() => setIsAdminDashboardOpen(false)}
        onLogout={() => {
          setAdminToken('');
          setIsAdminDashboardOpen(false);
          setIsPasswordModalOpen(true);
        }}
      />

      {/* Delicate Footer with Secret Trigger on the Heart */}
      <footer className="relative z-10 py-3 text-center text-xs text-rose-900/40 select-none">
        <span>Crafted with love for Jana &amp; cute cats </span>
        <span
          onClick={handleSecretHeartClick}
          className="cursor-default inline-block hover:scale-125 transition-transform"
          title="💕"
        >
          💕
        </span>
      </footer>
    </div>
  );
}

