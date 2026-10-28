import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  HeartPulse,
  Globe,
  Bell,
  PhoneCall,
  Wifi,
  WifiOff,
  User,
  Menu,
  X,
  Volume2,
  VolumeX,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  onOpenVoice: () => void;
  onOpenEmergency: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOnline: boolean;
  pendingSyncCount: number;
  onSync: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenVoice,
  onOpenEmergency,
  activeTab,
  setActiveTab,
  isOnline,
  pendingSyncCount,
  onSync,
}) => {
  const { language, toggleLanguage, t, speechEnabled, setSpeechEnabled } = useLanguage();
  const { currentUser, setRole, availableRoles } = useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    permissionStatus,
    requestPermission,
    sendFcmAppointmentReminder,
    sendFcmAshaTaskAlert,
  } = useNotifications();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: t('nav_home') },
    { id: 'facilities', label: t('nav_facilities') },
    { id: 'appointments', label: t('nav_appointments') },
    { id: 'asha', label: t('nav_asha'), badge: currentUser.role === 'asha' ? 'Active' : undefined },
    { id: 'health_info', label: t('nav_health_info') },
    { id: 'scorecard', label: t('nav_scorecard'), highlight: true },
    { id: 'analytics', label: t('nav_analytics') },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-teal-800/40 text-white shadow-lg">
      {/* Top micro-bar: Network status, PWA offline status, Push status, Language */}
      <div className="bg-slate-950/80 px-4 py-1.5 border-b border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium">
            {isOnline ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Wifi className="w-3.5 h-3.5" />
                <span>ಆನ್‌ಲೈನ್ / Online</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400 font-semibold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-700/50">
                <WifiOff className="w-3.5 h-3.5" />
                <span>ಆಫ್‌ಲೈನ್ / Offline PWA</span>
              </span>
            )}
          </div>

          {pendingSyncCount > 0 && (
            <button
              onClick={onSync}
              className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded border border-amber-500/30 transition-colors cursor-pointer"
            >
              <Clock className="w-3 h-3 animate-spin" />
              <span>{pendingSyncCount} {language === 'kn' ? 'ಬಾಕಿ ಸಿಂಕ್' : 'Pending Sync'}</span>
            </button>
          )}

          {/* Push permission trigger if not granted */}
          {permissionStatus !== 'granted' && (
            <button
              onClick={requestPermission}
              className="hidden sm:inline-flex items-center gap-1 text-teal-300 hover:text-teal-200 underline text-[11px]"
            >
              <Bell className="w-3 h-3" />
              <span>{language === 'kn' ? 'ಅಧಿಸೂಚನೆ ಸಕ್ರಿಯಗೊಳಿಸಿ' : 'Enable Push Alerts'}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Audio speech readout toggle */}
          <button
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded transition text-[11px] ${
              speechEnabled ? 'text-teal-300 bg-teal-950/50 border border-teal-800/60' : 'text-slate-400'
            }`}
            title="Read out text loud"
          >
            {speechEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{speechEnabled ? 'ಧ್ವನಿ / Audio ON' : 'Audio OFF'}</span>
          </button>

          {/* Bilingual Switcher (Kannada / English) */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-teal-700 to-emerald-600 hover:from-teal-600 hover:to-emerald-500 text-white font-bold text-xs shadow-sm transition active:scale-95"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{language === 'kn' ? 'English ಗೆ ಬದಲಿಸಿ' : 'ಕನ್ನಡಕ್ಕೆ ಬದಲಿಸಿ'}</span>
          </button>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform border border-teal-300/30">
              <HeartPulse className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white group-hover:text-teal-200 transition">
                  Health<span className="text-teal-400">Connect</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  AI
                </span>
              </div>
              <div className="text-[11px] text-teal-300/80 font-medium">
                {language === 'kn' ? 'ಗ್ರಾಮೀಣ ಆರೋಗ್ಯ ಸಂಪರ್ಕ ವೇದಿಕೆ' : 'Rural Health Access & Navigation'}
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`relative px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === link.id
                    ? 'bg-teal-600/30 text-teal-200 border border-teal-500/40 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {link.label}
                {link.badge && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/40">
                    {link.badge}
                  </span>
                )}
                {link.highlight && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Right Action Icons: Voice button, Notifications, Role Switcher, 108 Emergency */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Voice Nav Button */}
            <button
              onClick={onOpenVoice}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-teal-500/20 transition active:scale-95 cursor-pointer"
              title="Voice Assistant"
            >
              <span className="w-2 h-2 rounded-full bg-slate-900 animate-ping" />
              <span>{language === 'kn' ? 'ಧ್ವನಿ ಸಹಾಯಕ' : 'Voice Assistant'}</span>
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifDrawerOpen(!notifDrawerOpen)}
                className="relative p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition cursor-pointer border border-slate-700"
                title="Notifications & Reminders"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-extrabold text-[10px] flex items-center justify-center ring-2 ring-slate-900 animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Drawer Modal */}
              {notifDrawerOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-teal-700/50 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-teal-400" />
                      <span className="font-bold text-sm text-white">
                        {language === 'kn' ? 'FCM ಪುಶ್ ಅಧಿಸೂಚನೆಗಳು' : 'FCM Push Notifications'}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                      FCM Online
                    </span>
                  </div>

                  {/* FCM Device Token Pill */}
                  <div className="px-3.5 py-2 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{language === 'kn' ? 'ಸಾಧನ ನೋಂದಾಯಿತ (FCM)' : 'Device Registered (FCM)'}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Role: {currentUser.role}
                    </span>
                  </div>

                  {/* Interactive FCM Test Triggers */}
                  <div className="p-2.5 bg-slate-950/40 border-b border-slate-800 grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={async () => {
                        await sendFcmAppointmentReminder({
                          patientName: currentUser.name.split(' (')[0],
                          facilityName: 'Bilikere Primary Health Centre',
                          department: 'Prenatal Care (ANC)',
                        });
                      }}
                      className="px-2 py-1.5 rounded-lg bg-teal-950 hover:bg-teal-900 border border-teal-700/60 text-teal-300 font-semibold text-[11px] transition text-center cursor-pointer"
                    >
                      🔔 {language === 'kn' ? 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ನೆನಪೋಲೆ' : 'Test User Reminder'}
                    </button>

                    <button
                      onClick={async () => {
                        await sendFcmAshaTaskAlert({
                          patientName: 'Kavitha M. Gowda',
                          taskType: 'NEW_REFERRAL',
                          details: 'Urgent referral: Gestational BP monitoring at Hunsur Hospital',
                        });
                      }}
                      className="px-2 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-700/60 text-rose-300 font-semibold text-[11px] transition text-center cursor-pointer"
                    >
                      ⚠️ {language === 'kn' ? 'ಆಶಾ ಕಾರ್ಯ ಸೂಚನೆ' : 'Test ASHA Alert'}
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800 p-1">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-slate-400">
                        {language === 'kn' ? 'ಯಾವುದೇ ಅಧಿಸೂಚನೆಗಳಿಲ್ಲ' : 'No notifications yet'}
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markAsRead(n.id);
                            if (n.actionUrl) {
                              if (n.actionUrl.includes('referrals') || n.actionUrl.includes('followups')) {
                                setActiveTab('asha');
                              } else if (n.actionUrl.includes('appointments')) {
                                setActiveTab('appointments');
                              }
                            }
                            setNotifDrawerOpen(false);
                          }}
                          className={`p-3 rounded-xl transition cursor-pointer my-1 ${
                            n.read
                              ? 'bg-slate-900/40 text-slate-400'
                              : 'bg-teal-950/40 border border-teal-800/40 text-slate-100 font-medium'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-teal-300">
                              {language === 'kn' ? n.kannadaTitle : n.title}
                            </span>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                            {language === 'kn' ? n.kannadaBody : n.body}
                          </p>
                          <span className="text-[10px] text-slate-500 mt-1.5 block">
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-center">
                    <button
                      onClick={requestPermission}
                      className="text-xs text-teal-400 hover:text-teal-300 font-semibold"
                    >
                      {permissionStatus === 'granted'
                        ? (language === 'kn' ? '✓ ಬ್ರೌಸರ್ FCM ಅನುಮತಿ ಸಕ್ರಿಯವಾಗಿದೆ' : '✓ Browser FCM Permissions Granted')
                        : (language === 'kn' ? 'ಬ್ರೌಸರ್ ಪುಶ್ ಅಧಿಸೂಚನೆ ಸಕ್ರಿಯಗೊಳಿಸಿ' : 'Enable Device Push Notifications')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Role Switcher Button */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-teal-200 transition"
              >
                <User className="w-3.5 h-3.5 text-teal-400" />
                <span className="hidden sm:inline max-w-[100px] truncate">{currentUser.name.split(' ')[0]}</span>
                <span className="px-1 py-0.2 rounded bg-teal-900 text-teal-300 text-[10px] uppercase font-bold">
                  {currentUser.role}
                </span>
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50">
                  <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {language === 'kn' ? 'ಪಾತ್ರ ಬದಲಿಸಿ (Role Switcher)' : 'Switch User Role (Demo Mode)'}
                  </div>
                  {availableRoles.map((r) => (
                    <button
                      key={r.role}
                      onClick={() => {
                        setRole(r.role);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs transition mb-1 flex items-start gap-2.5 ${
                        currentUser.role === r.role
                          ? 'bg-teal-600/30 text-teal-100 border border-teal-500/40 font-bold'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-white">
                          {language === 'kn' ? r.kannadaTitle : r.title}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {language === 'kn' ? r.kannadaDesc : r.desc}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* EMERGENCY 108 BUTTON (HIGH CONTRAST RED) */}
            <button
              onClick={onOpenEmergency}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-rose-600/30 transition-transform active:scale-95 animate-pulse cursor-pointer border border-rose-400"
            >
              <PhoneCall className="w-4 h-4" />
              <span>108 {language === 'kn' ? 'ತುರ್ತು' : 'EMERGENCY'}</span>
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-t border-slate-800 px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                setActiveTab(link.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-between ${
                activeTab === link.id
                  ? 'bg-teal-600/30 text-teal-200 border border-teal-500/40'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>{link.label}</span>
              {link.highlight && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-teal-500 text-slate-950 font-bold">
                  Hackathon ⭐
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
