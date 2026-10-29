import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  PhoneCall,
  X,
  AlertTriangle,
  ShieldAlert,
  Phone,
} from 'lucide-react';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { language, t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border-2 border-rose-500 rounded-3xl max-w-xl w-full shadow-2xl shadow-rose-950/50 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Urgent Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-900 via-rose-800 to-red-900 border-b border-rose-600/50 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 animate-pulse">
              <PhoneCall className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                108 {t('emergency_modal_title')}
              </h2>
              <p className="text-xs text-rose-200">
                {t('emergency_modal_subtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-black/20 hover:bg-black/40 text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-200">
          {/* Big 1-Tap Call Button */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-950/90 to-red-950 border border-rose-600/60 text-center">
            <span className="text-xs font-bold text-rose-300 uppercase tracking-widest block mb-2">
              {t('emergency_toll_free')}
            </span>

            <a
              href="tel:108"
              className="inline-flex items-center justify-center gap-3 w-full py-4 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xl sm:text-2xl shadow-xl shadow-rose-600/40 transition active:scale-98 cursor-pointer border border-rose-300"
            >
              <PhoneCall className="w-7 h-7 animate-bounce" />
              <span>{t('call_108_now')}</span>
            </a>

            <p className="text-[11px] text-rose-200 mt-2 font-medium">
              {t('emergency_instruction')}
            </p>
          </div>

          {/* Critical Warning */}
          <div className="p-3 bg-amber-950/60 border border-amber-700/60 rounded-xl flex items-start gap-3 text-amber-200 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p>
              <strong className="block text-amber-300">
                {t('emergency_disclaimer')}
              </strong>
              In life-threatening distress (acute chest pain, snakebite, severe hemorrhage, or unconsciousness), call 108 immediately without waiting for app responses.
            </p>
          </div>

          {/* Quick First-Aid Rules for Rural Emergencies */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>{t('first_aid_title')}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="font-bold text-teal-300 block mb-1">
                  🐍 Snakebite First Aid
                </span>
                <p className="text-slate-300">
                  Keep patient calm and immobilize bitten limb below heart level. Do NOT cut, suck venom, or apply tight tourniquets.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="font-bold text-teal-300 block mb-1">
                  🩸 Severe Bleeding
                </span>
                <p className="text-slate-300">
                  Apply continuous firm pressure with a clean cloth. Keep the patient lying flat with legs slightly elevated.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="font-bold text-teal-300 block mb-1">
                  🤰 Maternal Labor & Delivery
                </span>
                <p className="text-slate-300">
                  Have the mother lie on her left side to maximize fetal oxygenation. Keep the MCP Card and clean warm linens ready for arrival.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="font-bold text-teal-300 block mb-1">
                  ❤️ Chest Pain / Cardiac Distress
                </span>
                <p className="text-slate-300">
                  Keep patient rested in half-sitting position. Loosen restrictive clothing and maintain calm airflow.
                </p>
              </div>
            </div>
          </div>

          {/* Verified Emergency Helplines */}
          <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700 space-y-2 text-xs">
            <span className="font-extrabold text-slate-300 block uppercase tracking-wider text-[11px]">
              {t('casualty_hospitals')} & Helplines:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href="tel:104"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 font-semibold transition"
              >
                <span>104 Health Information Helpline</span>
                <Phone className="w-3.5 h-3.5" />
              </a>
              <a
                href="tel:102"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 font-semibold transition"
              >
                <span>102 Maternal Transport (JSSK)</span>
                <Phone className="w-3.5 h-3.5" />
              </a>
              <a
                href="tel:08212420555"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 font-semibold transition sm:col-span-2"
              >
                <span>District Hospital 24/7 Casualty (0821-2420555)</span>
                <Phone className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
