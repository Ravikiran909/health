import React, { useState, useEffect, useCallback } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { HospitalFinder } from './components/HospitalFinder';
import { AppointmentsView } from './components/AppointmentsView';
import { AshaDashboard } from './components/AshaDashboard';
import { HealthExplainer } from './components/HealthExplainer';
import { AccessScorecard } from './components/AccessScorecard';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { EmergencyModal } from './components/EmergencyModal';
import { OfflineSyncBanner } from './components/OfflineSyncBanner';
import { Facility } from './types';
import { getOfflineQueue, clearOfflineQueue } from './utils/indexedDB';
import { HeartPulse, Bell, X, PhoneCall, ShieldCheck } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { language, t } = useLanguage();
  const { currentUser } = useAuth();
  const { activeToast, dismissToast } = useNotifications();

  const [activeTab, setActiveTab] = useState<string>('home');
  const [isVoiceOpen, setIsVoiceOpen] = useState<boolean>(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState<boolean>(false);
  const [preselectedFacility, setPreselectedFacility] = useState<Facility | null>(null);

  // Network & Offline Sync State
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Check pending offline items
  const checkPendingQueue = useCallback(async () => {
    try {
      const queue = await getOfflineQueue();
      const count =
        (queue.appointments?.length || 0) +
        (queue.patients?.length || 0) +
        (queue.referrals?.length || 0);
      setPendingSyncCount(count);
    } catch {
      setPendingSyncCount(0);
    }
  }, []);

  // Synchronize offline queue to server
  const handleSyncOfflineData = useCallback(async () => {
    if (!navigator.onLine) return;
    try {
      const queue = await getOfflineQueue();
      const total =
        (queue.appointments?.length || 0) +
        (queue.patients?.length || 0) +
        (queue.referrals?.length || 0);

      if (total === 0) return;

      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queuedAppointments: queue.appointments,
          queuedPatients: queue.patients,
          queuedReferrals: queue.referrals,
        }),
      });

      if (res.ok) {
        await clearOfflineQueue();
        setPendingSyncCount(0);
        setLastSyncTime(new Date().toISOString());
      }
    } catch (err) {
      console.warn('Sync failed:', err);
    }
  }, []);

  // Register online/offline event listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      handleSyncOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkPendingQueue();
    const interval = setInterval(checkPendingQueue, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [handleSyncOfflineData, checkPendingQueue]);

  // Handle facility booking jump from finder
  const handleBookFacility = (facility: Facility) => {
    setPreselectedFacility(facility);
    setActiveTab('appointments');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        onOpenVoice={() => setIsVoiceOpen(true)}
        onOpenEmergency={() => setIsEmergencyOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        onSync={handleSyncOfflineData}
      />

      {/* Offline Sync Banner */}
      <OfflineSyncBanner
        isOnline={isOnline}
        pendingCount={pendingSyncCount}
        onSync={handleSyncOfflineData}
        lastSyncTime={lastSyncTime}
      />

      {/* Push Notification In-App Toast */}
      {activeToast && (
        <div className="fixed top-24 right-4 z-50 max-w-sm w-full bg-slate-900 border-2 border-teal-500 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-top-4 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 shrink-0">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-teal-300">
                {language === 'kn' ? activeToast.kannadaTitle : activeToast.title}
              </span>
              <button
                onClick={dismissToast}
                className="text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-200 mt-1 leading-snug">
              {language === 'kn' ? activeToast.kannadaBody : activeToast.body}
            </p>
          </div>
        </div>
      )}

      {/* Main Content View Switcher */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'home' && (
          <HomeView
            onOpenVoice={() => setIsVoiceOpen(true)}
            onOpenEmergency={() => setIsEmergencyOpen(true)}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'facilities' && (
          <HospitalFinder
            onBookFacility={handleBookFacility}
            isOnline={isOnline}
          />
        )}

        {activeTab === 'appointments' && (
          <AppointmentsView
            isOnline={isOnline}
            onRefreshSync={checkPendingQueue}
            preselectedFacility={preselectedFacility}
          />
        )}

        {activeTab === 'asha' && (
          <AshaDashboard
            isOnline={isOnline}
            onRefreshSync={checkPendingQueue}
          />
        )}

        {activeTab === 'health_info' && <HealthExplainer />}

        {activeTab === 'scorecard' && <AccessScorecard />}

        {activeTab === 'analytics' && <AnalyticsDashboard />}
      </main>

      {/* Floating Emergency 108 Action Dial */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        <button
          onClick={() => setIsVoiceOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 flex items-center justify-center shadow-xl shadow-teal-500/30 transition-transform active:scale-95 cursor-pointer ring-4 ring-teal-500/20 group"
          title="Voice Assistant"
        >
          <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping absolute" />
          <HeartPulse className="w-7 h-7 group-hover:scale-110 transition-transform" />
        </button>

        <button
          onClick={() => setIsEmergencyOpen(true)}
          className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-2xl shadow-rose-600/40 transition-transform active:scale-95 cursor-pointer ring-4 ring-rose-500/30 animate-pulse"
          title="108 Emergency Dial"
        >
          <PhoneCall className="w-7 h-7" />
        </button>
      </div>

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onNavigateTab={setActiveTab}
      />

      {/* Emergency 108 Modal */}
      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-xs py-8 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-teal-400" />
            <span className="font-bold text-slate-200">HealthConnect AI</span>
            <span>• {language === 'kn' ? 'ಗ್ರಾಮೀಣ ಆರೋಗ್ಯ ಪ್ರವೇಶ ವೇದಿಕೆ' : 'Rural Healthcare Navigation Platform'}</span>
          </div>

          <div className="text-center text-[11px] text-slate-400">
            {language === 'kn'
              ? 'ರಾಷ್ಟ್ರೀಯ ಆರೋಗ್ಯ ಅಭಿಯಾನ (NHM) ಕರ್ನಾಟಕ ಶಿಷ್ಟಾಚಾರಗಳೊಂದಿಗೆ ಹೊಂದಿಸಲಾಗಿದೆ. ತುರ್ತು ಸಂದರ್ಭದಲ್ಲಿ 108 ಗೆ ಕರೆ ಮಾಡಿ.'
              : 'Aligned with National Health Mission (NHM) Karnataka guidelines. In case of life-threatening distress, dial 108 immediately.'}
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              PWA Ready
            </span>
            <span className="text-teal-400 font-semibold">Gemini 3.8 Flash Powered</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <NotificationProvider>
          <MainAppContent />
        </NotificationProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
