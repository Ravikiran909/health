import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, Clock } from 'lucide-react';

interface OfflineSyncBannerProps {
  isOnline: boolean;
  pendingCount: number;
  onSync: () => Promise<void>;
  lastSyncTime: string | null;
}

export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({
  isOnline,
  pendingCount,
  onSync,
  lastSyncTime,
}) => {
  const { language } = useLanguage();
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const handleManualSync = async () => {
    if (!isOnline || syncing) return;
    setSyncing(true);
    setSyncSuccess(false);
    try {
      await onSync();
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 4000);
    } finally {
      setSyncing(false);
    }
  };

  if (isOnline && pendingCount === 0 && !syncSuccess) {
    return null;
  }

  return (
    <div
      className={`px-4 py-2.5 transition-all text-xs font-medium border-b ${
        !isOnline
          ? 'bg-amber-950/90 text-amber-200 border-amber-800/80'
          : syncSuccess
          ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800/80'
          : 'bg-teal-950/90 text-teal-200 border-teal-800/80'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          ) : syncSuccess ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <Clock className="w-4 h-4 text-teal-400 shrink-0" />
          )}

          <span>
            {!isOnline ? (
              language === 'kn' ? (
                <>
                  <strong>ಆಫ್‌ಲೈನ್ ಮೋಡ್ ಸಕ್ರಿಯವಾಗಿದೆ:</strong> ನಿಮ್ಮ ವಿನಂತಿಗಳು ಸ್ಥಳೀಯ IndexedDB ಯಲ್ಲಿ ಸುರಕ್ಷಿತವಾಗಿವೆ.
                </>
              ) : (
                <>
                  <strong>Offline Mode Active:</strong> You can continue searching facilities and queuing appointments. Requests are stored safely in local IndexedDB.
                </>
              )
            ) : syncSuccess ? (
              language === 'kn' ? (
                'ಎಲ್ಲಾ ಆಫ್‌ಲೈನ್ ವಿನಂತಿಗಳು ಕೇಂದ್ರ ಸರ್ವರ್‌ನೊಂದಿಗೆ ಯಶಸ್ವಿಯಾಗಿ ಸಿಂಕ್ ಆಗಿವೆ!'
              ) : (
                'All offline requests successfully synchronized with server!'
              )
            ) : (
              language === 'kn' ? (
                <>
                  <strong>{pendingCount} ಬಾಕಿ ವಿನಂತಿಗಳು</strong> ಸಿಂಕ್ ಮಾಡಲು ಸಿದ್ಧವಾಗಿವೆ.
                </>
              ) : (
                <>
                  <strong>{pendingCount} pending requests</strong> queued for server sync.
                </>
              )
            )}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {lastSyncTime && (
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Last Sync: {new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}

          {isOnline && pendingCount > 0 && (
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="px-3 py-1 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? (language === 'kn' ? 'ಸಿಂಕ್ ಆಗುತ್ತಿದೆ...' : 'Syncing...') : (language === 'kn' ? 'ಈಗ ಸಿಂಕ್ ಮಾಡಿ' : 'Sync Now')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
