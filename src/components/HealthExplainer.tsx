import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { HealthTopicDoc } from '../types';
import { speakText, stopSpeaking } from '../utils/speech';
import {
  BookOpen,
  Volume2,
  VolumeX,
  AlertTriangle,
  ShieldCheck,
  Search,
  Sparkles,
  ArrowRight,
  FileCheck,
  Send,
  HeartPulse,
} from 'lucide-react';

export const HealthExplainer: React.FC = () => {
  const { language, speechEnabled, speechRate, t } = useLanguage();
  const [topics, setTopics] = useState<HealthTopicDoc[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<HealthTopicDoc | null>(null);
  const [userQuestion, setUserQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const res = await fetch('/api/health-topics');
      if (res.ok) {
        const data = await res.json();
        setTopics(data.topics || []);
        if (data.topics && data.topics.length > 0) {
          setSelectedTopic(data.topics[0]);
        }
      }
    } catch {}
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopic || !userQuestion.trim()) return;

    setIsAnswering(true);
    setAiAnswer(null);

    try {
      const res = await fetch('/api/health-topics/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicKey: selectedTopic.topicKey,
          question: userQuestion,
          language: language,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiAnswer(data.explanation);
        setAiSource(data.source);

        if (speechEnabled && data.explanation) {
          setIsSpeaking(true);
          speakText(data.explanation, language, speechRate, () => setIsSpeaking(false));
        }
      }
    } catch {
      setAiAnswer(
        language === 'kn'
          ? selectedTopic.kannadaSummary
          : selectedTopic.summary
      );
    } finally {
      setIsAnswering(false);
    }
  };

  const handleReadAloud = (text: string) => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakText(text, language, speechRate, () => setIsSpeaking(false));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-slate-900 to-teal-950 p-6 sm:p-8 rounded-3xl border border-teal-800/40 shadow-xl">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider mb-2">
            <BookOpen className="w-4 h-4" />
            <span>{t('health_info_subtitle')} (RAG)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {t('health_info_title')}
          </h2>
          <p className="text-slate-300 text-sm mt-1.5 leading-relaxed">
            {t('health_info_desc')}
          </p>
        </div>

        {/* Topics Selector Pills */}
        <div className="mt-6 flex flex-wrap gap-2">
          {topics.map((tItem) => (
            <button
              key={tItem.id}
              onClick={() => {
                stopSpeaking();
                setIsSpeaking(false);
                setSelectedTopic(tItem);
                setAiAnswer(null);
                setUserQuestion('');
              }}
              className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                selectedTopic?.id === tItem.id
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>{language === 'kn' ? tItem.kannadaTitle : tItem.title}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedTopic && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Document Body */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {language === 'kn' ? selectedTopic.kannadaTitle : selectedTopic.title}
                </h3>
                <span className="text-xs text-teal-400 font-semibold block mt-1">
                  {t('verified_source')}: {selectedTopic.source}
                </span>
              </div>

              <button
                onClick={() =>
                  handleReadAloud(
                    language === 'kn'
                      ? selectedTopic.kannadaSummary
                      : selectedTopic.summary
                  )
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  isSpeaking
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-teal-900/60 hover:bg-teal-800 text-teal-300 border border-teal-700/50'
                }`}
              >
                {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{isSpeaking ? (language === 'kn' ? 'ನಿಲ್ಲಿಸಿ' : 'Stop') : (language === 'kn' ? 'ಧ್ವನಿ ಆಲಿಸಿ' : 'Listen')}</span>
              </button>
            </div>

            {/* Core Summary */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-slate-200 leading-relaxed text-sm sm:text-base">
              <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider block mb-1">
                {t('key_recommendations')}:
              </span>
              <p>
                {language === 'kn' ? selectedTopic.kannadaSummary : selectedTopic.summary}
              </p>
            </div>

            {/* Warning signs checklist */}
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/40 space-y-2">
              <h4 className="font-extrabold text-amber-300 text-xs sm:text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                {t('warning_signs')}:
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                {(language === 'kn'
                  ? selectedTopic.kannadaWarningSigns
                  : selectedTopic.warningSigns
                ).map((w, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Emergency Action */}
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-xs sm:text-sm text-rose-200 flex items-start gap-3">
              <HeartPulse className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-rose-300">
                  {language === 'kn' ? 'ತುರ್ತು ಕ್ರಮ (108):' : 'Emergency Action Plan (108):'}
                </strong>
                <span>{selectedTopic.emergencyAction}</span>
              </div>
            </div>

            {/* AI Custom Query Form */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-400" />
                {language === 'kn'
                  ? 'ಈ ವಿಷಯದ ಬಗ್ಗೆ ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಕೇಳಿ (Gemini AI RAG):'
                  : 'Ask a specific question about this guideline:'}
              </span>

              <form onSubmit={handleAskQuestion} className="flex items-center gap-2">
                <input
                  type="text"
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  placeholder={
                    language === 'kn'
                      ? 'ಉದಾಹರಣೆಗೆ: IFA ಮಾತ್ರೆಗಳನ್ನು ಹೇಗೆ ತೆಗೆದುಕೊಳ್ಳಬೇಕು?'
                      : 'e.g., When should the mother start taking IFA tablets?'
                  }
                  className="flex-1 bg-slate-800 border border-slate-700 focus:border-teal-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 outline-none"
                />
                <button
                  type="submit"
                  disabled={isAnswering || !userQuestion.trim()}
                  className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isAnswering ? (language === 'kn' ? 'ಹುಡುಕಲಾಗುತ್ತಿದೆ...' : 'Searching...') : (language === 'kn' ? 'ಕೇಳಿ' : 'Ask AI')}</span>
                </button>
              </form>

              {aiAnswer && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-950/70 to-slate-900 border border-teal-700/60 text-slate-100 text-xs sm:text-sm leading-relaxed space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-[11px] text-teal-300 font-bold">
                    <span>{language === 'kn' ? 'ಮಾರ್ಗದರ್ಶಿ ಉತ್ತರ:' : 'Grounded Answer:'}</span>
                    {aiSource && <span className="text-slate-400 italic">Source: {aiSource}</span>}
                  </div>
                  <p>{aiAnswer}</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Public Health Resources & Emergency Numbers */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 text-xs">
              <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                {language === 'kn' ? 'ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ಮಾಹಿತಿ:' : 'Associated Public Programs:'}
              </h4>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <strong className="text-teal-300 block mb-0.5">
                    Ayushman Bharat - Arogya Karnataka
                  </strong>
                  <p className="text-slate-400 text-[11px]">
                    Provides cashless tertiary care up to ₹5 Lakhs per family per year at empannelled public & private hospitals.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <strong className="text-teal-300 block mb-0.5">
                    Pradhan Mantri Matru Vandana (PMMVY)
                  </strong>
                  <p className="text-slate-400 text-[11px]">
                    Cash incentive of ₹5,000 in DBT installments for pregnant and lactating mothers meeting ANC checkup milestones.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <strong className="text-teal-300 block mb-0.5">
                    Universal Immunization Programme (UIP)
                  </strong>
                  <p className="text-slate-400 text-[11px]">
                    Free vaccination against 12 preventable diseases for every child at Anganwadi and PHC sessions every Wednesday.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-rose-950/30 border border-rose-800/40 rounded-3xl p-5 text-xs text-rose-200 space-y-2">
              <strong className="block text-rose-300 font-extrabold">
                {language === 'kn' ? 'ವೈದ್ಯಕೀಯ ಮುನ್ನೆಚ್ಚರಿಕೆ:' : 'Non-Diagnostic Policy:'}
              </strong>
              <p className="text-[11px] leading-relaxed">
                {language === 'kn'
                  ? 'ಈ ಮಾಹಿತಿಯು ಸಾರ್ವಜನಿಕ ಜಾಗೃತಿಗಾಗಿ ಮಾತ್ರ. ರೋಗಲಕ್ಷಣಗಳಿದ್ದರೆ ನಿಮ್ಮ ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರದ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.'
                  : 'HealthConnect AI strictly provides public health education and does not diagnose disease or prescribe drug treatments.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
