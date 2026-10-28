import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  PhoneCall,
  X,
  AlertTriangle,
  ShieldAlert,
  Heart,
  Activity,
  Phone,
  Info,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();

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
                108 {language === 'kn' ? 'ತುರ್ತು ವೈದ್ಯಕೀಯ ಸೇವೆ' : 'Emergency Ambulance Hub'}
              </h2>
              <p className="text-xs text-rose-200">
                {language === 'kn' ? 'ಉಚಿತ ಸರ್ಕಾರಿ ತುರ್ತು ಆಂಬುಲೆನ್ಸ್ ಸೇವೆ (24x7)' : 'Government 24/7 Free Emergency Helpline'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-black/20 hover:bg-black/40 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-200">
          {/* Big 1-Tap Call Button */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-950/90 to-red-950 border border-rose-600/60 text-center">
            <span className="text-xs font-bold text-rose-300 uppercase tracking-widest block mb-2">
              {language === 'kn' ? 'ತಕ್ಷಣ ಕರೆ ಮಾಡಲು ಸ್ಪರ್ಶಿಸಿ' : 'TAP TO LAUNCH PHONE DIALER'}
            </span>

            <a
              href="tel:108"
              className="inline-flex items-center justify-center gap-3 w-full py-4 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xl sm:text-2xl shadow-xl shadow-rose-600/40 transition active:scale-98 cursor-pointer border border-rose-300"
            >
              <PhoneCall className="w-7 h-7 animate-bounce" />
              <span>{language === 'kn' ? '108 ಕರೆ ಮಾಡಿ' : 'DIAL 108 NOW'}</span>
            </a>

            <p className="text-[11px] text-rose-200 mt-2 font-medium">
              {language === 'kn'
                ? 'ಮೊಬೈಲ್ ಡಯಲರ್‌ನಲ್ಲಿ 108 ನಮೂದಾಗುತ್ತದೆ. ಕರೆ ಉಚಿತ ಮತ್ತು ಸಿಮ್‌ನಲ್ಲಿ ಬ್ಯಾಲೆನ್ಸ್ ಇಲ್ಲದಿದ್ದರೂ ಸಂಪರ್ಕವಾಗುತ್ತದೆ.'
                : 'Free emergency call in India. Works even with zero SIM balance.'}
            </p>
          </div>

          {/* Critical Warning */}
          <div className="p-3 bg-amber-950/60 border border-amber-700/60 rounded-xl flex items-start gap-3 text-amber-200 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p>
              <strong className="block text-amber-300">
                {language === 'kn' ? 'ತುರ್ತು ಎಚ್ಚರಿಕೆ:' : 'Emergency Notice:'}
              </strong>
              {language === 'kn'
                ? 'ತೀವ್ರ ಎದೆನೋವು, ಹಾವು ಕಡಿತ, ಅಧಿಕ ರಕ್ತಸ್ರಾವ ಅಥವಾ ಪ್ರಜ್ಞಾಹೀನ ಸ್ಥಿತಿಯಲ್ಲಿ ಯಾವುದೇ ಆ್ಯಪ್ ಚಾಟ್ ಅಥವಾ ಹುಡುಕಾಟವನ್ನು ನಿಲ್ಲಿಸಿ ನೇರವಾಗಿ 108 ಕರೆ ಮಾಡಿ.'
                : 'Do not let AI chat or app navigation delay calling for ambulance help during heart distress, snakebites, or severe maternal emergencies.'}
            </p>
          </div>

          {/* Quick First-Aid Rules for Rural Emergencies */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              {language === 'kn' ? 'ಆಂಬುಲೆನ್ಸ್ ಬರುವವರೆಗೆ ಪ್ರಥಮ ಚಿಕಿತ್ಸಾ ನಿಯಮಗಳು:' : 'Immediate First Aid while Ambulance is En Route:'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="font-bold text-teal-300 block mb-1">
                  {language === 'kn' ? '🐍 ಹಾವು ಕಡಿತ (Snakebite)' : '🐍 Snakebite'}
                </span>
                <p className="text-slate-300">
                  {language === 'kn'
                    ? 'ಕಚ್ಚಿದ ಭಾಗವನ್ನು ಅಲುಗಾಡಿಸಬೇಡಿ. ಹಗ್ಗದಿಂದ ಬಿಗಿಯಾಗಿ ಕಟ್ಟಬೇಡಿ ಅಥವಾ ಬಾಯಿಯಿಂದ ಹೀರುವ ಪ್ರಯತ್ನ ಮಾಡಬೇಡಿ.'
                    : 'Immobilize limb below heart. Do NOT cut, suck venom, or tie tight tourniquets.'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="font-bold text-teal-300 block mb-1">
                  {language === 'kn' ? '🩸 ತೀವ್ರ ರಕ್ತಸ್ರಾವ (Bleeding)' : '🩸 Severe Bleeding'}
                </span>
                <p className="text-slate-300">
                  {language === 'kn'
                    ? 'ಶುದ್ಧ ಬಟ್ಟೆಯಿಂದ ಗಾಯದ ಮೇಲೆ ನಿರಂತರ ಒತ್ತಡ ಹಾಕಿ. ರೋಗಿಯನ್ನು ಮಲಗಿಸಿಡಿ.'
                    : 'Apply firm, continuous pressure with a clean cloth. Keep the person lying down.'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="font-bold text-teal-300 block mb-1">
                  {language === 'kn' ? '🤰 ಹೆರಿಗೆ ನೋವು (Maternal Labour)' : '🤰 Maternal Labour'}
                </span>
                <p className="text-slate-300">
                  {language === 'kn'
                    ? 'ತಾಯಿಯನ್ನು ಎಡ ಮಗ್ಗುಲಿಗೆ ಮಲಗಿಸಿ. ತಾಯಿ-ಮಗು ಕಾರ್ಡ್ (MCP Card) ಸಿದ್ಧವಾಗಿಡಿ.'
                    : 'Have mother lie on her left side. Keep MCP Card and clean warm cloths ready.'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="font-bold text-teal-300 block mb-1">
                  {language === 'kn' ? '❤️ ಎದೆನೋವು / ಹಾರ್ಟ್ ಅಟ್ಯಾಕ್' : '❤️ Sudden Chest Pain'}
                </span>
                <p className="text-slate-300">
                  {language === 'kn'
                    ? 'ರೋಗಿಯನ್ನು ಕುಳ್ಳಿರಿಸಿ ಸಮಾಧಾನಪಡಿಸಿ. ನಡೆಯಲು ಅಥವಾ ಆಯಾಸಗೊಳ್ಳಲು ಬಿಡಬೇಡಿ.'
                    : 'Keep patient resting comfortably in half-seated position. Loosen tight clothing.'}
                </p>
              </div>
            </div>
          </div>

          {/* Verified Karnataka State Helplines */}
          <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700 space-y-2 text-xs">
            <span className="font-extrabold text-slate-300 block uppercase tracking-wider text-[11px]">
              {language === 'kn' ? 'ದೃಢೀಕೃತ ಕರ್ನಾಟಕ ಸರ್ಕಾರಿ ತುರ್ತು ಸಂಖ್ಯೆಗಳು:' : 'Verified Karnataka State Emergency Helplines:'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href="tel:104"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 font-semibold transition"
              >
                <span>104 {language === 'kn' ? 'ಆರೋಗ್ಯ ಸಹಾಯವಾಣಿ' : 'Arogya Helpline'}</span>
                <Phone className="w-3.5 h-3.5" />
              </a>
              <a
                href="tel:102"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 font-semibold transition"
              >
                <span>102 {language === 'kn' ? 'ಗರ್ಭಿಣಿಯರ ವಾಹನ' : 'Maternal Transport (JSSK)'}</span>
                <Phone className="w-3.5 h-3.5" />
              </a>
              <a
                href="tel:08212420555"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 font-semibold transition sm:col-span-2"
              >
                <span>{language === 'kn' ? 'ಮೈಸೂರು ಕೆ.ಆರ್. ಆಸ್ಪತ್ರೆ ತುರ್ತು ವಿಭಾಗ' : 'Mysuru K.R. Hospital Casualty (0821-2420555)'}</span>
                <Phone className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Hackathon Safe Testing Note */}
          <div className="p-3 bg-teal-950/40 border border-teal-800/50 rounded-xl text-[11px] text-teal-200">
            <span className="font-bold block">
              {language === 'kn' ? 'ಹ್ಯಾಕಥಾನ್ ಮೌಲ್ಯಮಾಪನ ಪರೀಕ್ಷೆ:' : 'Hackathon Testing Safety Protocol:'}
            </span>
            {language === 'kn'
              ? 'ಪರೀಕ್ಷೆ ವೇಳೆ ಡಯಲರ್ ತೆರೆಯುವುದನ್ನು ಪರಿಶೀಲಿಸಲು ಬಟನ್ ಒತ್ತಿ, ಆದರೆ ನಿಜವಾದ ತುರ್ತುಸ್ಥಿತಿಯಿಲ್ಲದಿದ್ದರೆ ಕಾಲ್ ಸಂಪರ್ಕಿಸಬೇಡಿ.'
              : 'Evaluators can tap to verify that the device dialer opens with 108 pre-filled. Do not place an actual call unless there is a genuine life emergency.'}
          </div>
        </div>
      </div>
    </div>
  );
};
