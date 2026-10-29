import React, { useState } from 'react';
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
  Clock,
  Sparkles,
  Sliders,
  Check,
  ChevronDown,
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
  const {
    language,
    setLanguage,
    t,
    speechEnabled,
    setSpeechEnabled,
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    speechRate,
    setSpeechRate,
    currentLanguageConfig,
    supportedLanguages,
  } = useLanguage();

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
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [accessibilityModalOpen, setAccessibilityModalOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: t('nav_home') },
    { id: 'facilities', label: t('nav_facilities') },
    { id: 'appointments', label: t('nav_appointments') },
    {
      id: 'asha',
      label: t('nav_asha'),
      badge: currentUser.role === 'asha' ? 'Active' : undefined,
    },
    { id: 'health_info', label: t('nav_health_info') },
    { id: 'scorecard', label: t('nav_scorecard'), highlight: true },
    { id: 'analytics', label: t('nav_analytics') },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-teal-800/40 text-white shadow-lg">
      {/* Top micro-bar: Network status, PWA offline status, Accessibility, Language selector */}
      <div className="bg-slate-950/80 px-3 sm:px-6 py-1.5 border-b border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium">
            {isOnline ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Wifi className="w-3.5 h-3.5" />
                <span>{t('online_status')}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400 font-semibold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-700/50">
                <WifiOff className="w-3.5 h-3.5" />
                <span>{t('offline_pwa')}</span>
              </span>
            )}
          </div>

          {pendingSyncCount > 0 && (
            <button
              onClick={onSync}
              className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded border border-amber-500/30 transition-colors cursor-pointer"
            >
              <Clock className="w-3 h-3 animate-spin" />
              <span>
                {pendingSyncCount} {t('pending_sync')}
              </span>
            </button>
          )}

          {/* Push alerts trigger */}
          {permissionStatus !== 'granted' && (
            <button
              onClick={requestPermission}
              className="hidden sm:inline-flex items-center gap-1 text-teal-300 hover:text-teal-200 underline text-[11px]"
            >
              <Bell className="w-3 h-3" />
              <span>{t('enable_push')}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Audio narration toggle */}
          <button
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded transition text-[11px] cursor-pointer ${
              speechEnabled
                ? 'text-teal-300 bg-teal-950/50 border border-teal-800/60'
                : 'text-slate-400'
            }`}
            title="Toggle Spoken Voice Audio"
          >
            {speechEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-teal-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            <span className="hidden md:inline">
              {speechEnabled ? t('audio_on') : t('audio_off')}
            </span>
          </button>

          {/* Accessibility Settings Trigger */}
          <button
            onClick={() => setAccessibilityModalOpen(!accessibilityModalOpen)}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] transition cursor-pointer"
            title="Accessibility: Font Size & High Contrast"
          >
            <Sliders className="w-3 h-3 text-teal-400" />
            <span className="hidden sm:inline">{t('accessibility_settings')}</span>
          </button>

          {/* Multilingual Selector Dropdown (Supports 6 Indian Languages) */}
          <div className="relative">
            <button
              onClick={() => {
                setLangMenuOpen(!langMenuOpen);
                setRoleMenuOpen(false);
                setNotifDrawerOpen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-teal-700 to-emerald-600 hover:from-teal-600 hover:to-emerald-500 text-white font-black text-xs shadow-md transition active:scale-95 cursor-pointer ring-2 ring-teal-500/20"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{currentLanguageConfig.name}</span>
              <span className="text-[10px] text-teal-200 opacity-80">
                ({currentLanguageConfig.englishName})
              </span>
              <ChevronDown className="w-3 h-3 text-teal-200" />
            </button>

            {/* Language Selection Popover */}
            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-teal-600/50 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider border-b border-slate-800 mb-1 flex items-center justify-between">
                  <span>{t('select_language')}</span>
                  <span className="text-teal-400">6 Indian Languages</span>
                </div>

                <div className="space-y-1">
                  {supportedLanguages.map((lang) => {
                    const isSelected = language === lang.code;
                    return (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setLangMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-slate-950 font-black shadow-md'
                            : 'text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{lang.flag}</span>
                          <span className="font-bold text-sm">{lang.name}</span>
                          <span
                            className={`text-[11px] ${
                              isSelected ? 'text-slate-950 font-semibold' : 'text-slate-400'
                            }`}
                          >
                            ({lang.englishName})
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-slate-950" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
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
                {t('brand_tag')}
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`relative px-3 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
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
              <span>{t('voice_assistant_title')}</span>
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
                        {t('notifications')} (FCM)
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
                      <span>FCM Device Active</span>
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
                      🔔 Test User Alert
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
                      ⚠️ Test ASHA Alert
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800 p-1">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-slate-400">
                        {t('no_notifications')}
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markAsRead(n.id);
                            if (n.actionUrl) {
                              if (
                                n.actionUrl.includes('referrals') ||
                                n.actionUrl.includes('followups')
                              ) {
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
                            {new Date(n.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Role Switcher Button */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-teal-200 transition cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-teal-400" />
                <span className="hidden sm:inline max-w-[100px] truncate">
                  {currentUser.name.split(' ')[0]}
                </span>
                <span className="px-1 py-0.2 rounded bg-teal-900 text-teal-300 text-[10px] uppercase font-bold">
                  {currentUser.role}
                </span>
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50">
                  <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {t('select_role')}
                  </div>
                  {availableRoles.map((r) => (
                    <button
                      key={r.role}
                      onClick={() => {
                        setRole(r.role);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs transition mb-1 flex items-start gap-2.5 cursor-pointer ${
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

            {/* EMERGENCY 108 BUTTON */}
            <button
              onClick={onOpenEmergency}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-rose-600/30 transition-transform active:scale-95 animate-pulse cursor-pointer border border-rose-400"
            >
              <PhoneCall className="w-4 h-4" />
              <span>108 {t('nav_emergency')}</span>
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-200 cursor-pointer"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Accessibility Settings Modal */}
      {accessibilityModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-teal-600/50 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-teal-400">
                <Sliders className="w-5 h-5" />
                <h3 className="font-black text-lg text-white">
                  {t('accessibility_settings')}
                </h3>
              </div>
              <button
                onClick={() => setAccessibilityModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Font Size Scaling */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                {t('font_size')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'normal', label: t('font_normal') },
                  { id: 'large', label: t('font_large') },
                  { id: 'xlarge', label: t('font_xlarge') },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFontSize(item.id as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      fontSize === item.id
                        ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-md'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* High Contrast Mode */}
            <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
              <div>
                <span className="font-bold text-sm text-white block">
                  {t('high_contrast')}
                </span>
                <span className="text-[11px] text-slate-400">
                  Enhanced visibility for low-vision rural users
                </span>
              </div>
              <button
                onClick={() => setHighContrast(!highContrast)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  highContrast ? 'bg-teal-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    highContrast ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Speech Rate Controls */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                {t('speech_speed')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSpeechRate(0.82)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    speechRate < 0.9
                      ? 'bg-teal-500 text-slate-950 border-teal-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {t('speech_speed_slow')}
                </button>
                <button
                  onClick={() => setSpeechRate(0.98)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    speechRate >= 0.9
                      ? 'bg-teal-500 text-slate-950 border-teal-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {t('speech_speed_normal')}
                </button>
              </div>
            </div>

            <button
              onClick={() => setAccessibilityModalOpen(false)}
              className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-2xl text-sm transition cursor-pointer"
            >
              {t('save')} & {t('close')}
            </button>
          </div>
        </div>
      )}

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
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-between cursor-pointer ${
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
