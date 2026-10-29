import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  Mic,
  MapPin,
  Calendar,
  Users,
  BookOpen,
  PhoneCall,
  Trophy,
  Sparkles,
  ArrowRight,
  Activity,
  Globe,
  Check,
} from 'lucide-react';

interface HomeViewProps {
  onOpenVoice: () => void;
  onOpenEmergency: () => void;
  onNavigateTab: (tab: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenVoice,
  onOpenEmergency,
  onNavigateTab,
}) => {
  const { language, setLanguage, t, supportedLanguages } = useLanguage();
  const { currentUser } = useAuth();

  const actionCards = [
    {
      id: 'facilities',
      icon: MapPin,
      title: t('card_phc_title'),
      desc: t('card_phc_desc'),
      badge: t('card_phc_badge'),
      color: 'from-teal-900/60 to-slate-900',
      borderColor: 'hover:border-teal-500',
      iconColor: 'text-teal-400',
    },
    {
      id: 'appointments',
      icon: Calendar,
      title: t('card_book_title'),
      desc: t('card_book_desc'),
      badge: t('card_book_badge'),
      color: 'from-emerald-950/60 to-slate-900',
      borderColor: 'hover:border-emerald-500',
      iconColor: 'text-emerald-400',
    },
    {
      id: 'asha',
      icon: Users,
      title: t('card_asha_title'),
      desc: t('card_asha_desc'),
      badge: t('card_asha_badge'),
      color: 'from-cyan-950/60 to-slate-900',
      borderColor: 'hover:border-cyan-500',
      iconColor: 'text-cyan-400',
    },
    {
      id: 'health_info',
      icon: BookOpen,
      title: t('card_info_title'),
      desc: t('card_info_desc'),
      badge: t('card_info_badge'),
      color: 'from-sky-950/60 to-slate-900',
      borderColor: 'hover:border-sky-500',
      iconColor: 'text-sky-400',
    },
    {
      id: 'scorecard',
      icon: Trophy,
      title: t('card_scorecard_title'),
      desc: t('card_scorecard_desc'),
      badge: t('card_scorecard_badge'),
      color: 'from-amber-950/60 to-slate-900',
      borderColor: 'hover:border-amber-500',
      iconColor: 'text-amber-400',
      highlight: true,
    },
    {
      id: 'emergency',
      icon: PhoneCall,
      title: t('card_emergency_title'),
      desc: t('card_emergency_desc'),
      badge: t('card_emergency_badge'),
      color: 'from-rose-950/70 to-slate-900',
      borderColor: 'hover:border-rose-500',
      iconColor: 'text-rose-400',
      isEmergency: true,
    },
  ];

  return (
    <div className="space-y-10 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950 to-slate-950 border border-teal-800/40 p-6 sm:p-12 shadow-2xl">
        <div className="relative z-10 max-w-3xl">
          {/* Hackathon Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 font-extrabold text-xs uppercase tracking-wider mb-4 border border-teal-500/30">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>{t('hero_badge')}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            {t('hero_heading')}
          </h1>

          <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            {t('hero_description')}
          </p>

          {/* 1-Tap Language Quick Switcher Bar for Rural Accessibility */}
          <div className="mt-6 pt-4 border-t border-teal-900/40">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-300 mb-2.5">
              <Globe className="w-3.5 h-3.5 text-teal-400" />
              <span>{t('select_language')} / Choose Your Mother Tongue:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {supportedLanguages.map((lang) => {
                const isActive = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-black shadow-lg shadow-teal-500/30 ring-2 ring-white/20'
                        : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-teal-500'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                    {isActive && <Check className="w-3.5 h-3.5 text-slate-950" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Large Voice Action Button & Nearest Hospital Discovery */}
          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <button
              onClick={onOpenVoice}
              className="group relative flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-black text-base sm:text-lg shadow-xl shadow-teal-500/30 transition active:scale-98 cursor-pointer ring-4 ring-teal-500/20"
            >
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-900 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-slate-950"></span>
              </span>
              <Mic className="w-6 h-6 text-slate-950 group-hover:scale-110 transition-transform" />
              <span>{t('voice_assistant_btn')}</span>
            </button>

            <button
              onClick={() => onNavigateTab('facilities')}
              className="px-6 py-4 rounded-2xl bg-slate-800/90 hover:bg-slate-750 text-white font-bold text-sm sm:text-base border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <MapPin className="w-5 h-5 text-teal-400" />
              <span>{t('find_phc_btn')}</span>
            </button>
          </div>

          <div className="mt-3 text-xs text-teal-300/80 font-medium">
            💡 {t('voice_assistant_sub')}
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
      </section>

      {/* Quick Action Navigation Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-400" />
            <span>{t('core_workflows')}</span>
          </h2>
          <span className="text-xs text-slate-400 font-semibold">
            {t('select_to_navigate')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {actionCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => {
                  if (card.isEmergency) {
                    onOpenEmergency();
                  } else {
                    onNavigateTab(card.id);
                  }
                }}
                className={`bg-gradient-to-br ${card.color} border border-slate-800 ${card.borderColor} rounded-3xl p-6 transition-all hover:scale-102 hover:shadow-2xl cursor-pointer flex flex-col justify-between group relative overflow-hidden`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-center ${card.iconColor} group-hover:scale-110 transition-transform shadow-md`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-slate-950/60 text-teal-300 border border-slate-800">
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-white group-hover:text-teal-200 transition-colors">
                    {card.title}
                  </h3>

                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {card.desc}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-teal-400 group-hover:text-teal-300">
                  <span>{t('open_workflow')}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* District Impact / Verified Infrastructure Bar */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <span className="text-2xl sm:text-3xl font-black text-white">6</span>
            <span className="text-xs text-teal-300 block font-semibold mt-1">
              Indian Languages Active
            </span>
          </div>

          <div>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">
              24/7
            </span>
            <span className="text-xs text-emerald-300 block font-semibold mt-1">
              {t('card_phc_badge')}
            </span>
          </div>

          <div>
            <span className="text-2xl sm:text-3xl font-black text-amber-400">
              108
            </span>
            <span className="text-xs text-amber-300 block font-semibold mt-1">
              {t('card_emergency_badge')}
            </span>
          </div>

          <div>
            <span className="text-2xl sm:text-3xl font-black text-cyan-400">
              PWA
            </span>
            <span className="text-xs text-cyan-300 block font-semibold mt-1">
              {t('offline_pwa')} Sync
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
