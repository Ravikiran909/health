import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Language, SUPPORTED_LANGUAGES } from '../types';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Send,
  Sparkles,
  MapPin,
  Calendar,
  AlertOctagon,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Globe,
  ChevronDown,
} from 'lucide-react';
import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  speakText,
  stopSpeaking,
  playChime,
  parseVoiceCommand,
} from '../utils/speech';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const {
    language,
    setLanguage,
    speechEnabled,
    setSpeechEnabled,
    speechRate,
    t,
    currentLanguageConfig,
    supportedLanguages,
  } = useLanguage();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [assistantReply, setAssistantReply] = useState<string>('');
  const [suggestedAction, setSuggestedAction] = useState<string>('NONE');
  const [sources, setSources] = useState<string[]>([]);
  const [isUrgent, setIsUrgent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const recognitionRef = useRef<any>(null);

  // Multilingual quick sample queries
  const quickPromptsByLang: Record<Language, string[]> = {
    en: [
      'Find nearest 24/7 delivery PHC near Bilikere',
      'Book an ANC prenatal checkup appointment',
      'What vaccines are given at 6 weeks?',
      'What is the emergency first aid for snakebite?',
      'Call 108 emergency ambulance',
      'Open ASHA Saathi dashboard',
    ],
    kn: [
      'ಬಿಳಿಕೆರೆ ಸಮೀಪದ 24/7 ಹೆರಿಗೆ ಆಸ್ಪತ್ರೆ ಯಾವುದು?',
      'ಗರ್ಭಿಣಿಯರ ತಪಾಸಣೆಗೆ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ',
      'ಮಕ್ಕಳ 6 ವಾರದ ಲಸಿಕಾ ಮಾಹಿತಿ ನೀಡಿ',
      'ಹಾವು ಕಚ್ಚಿದಾಗ ಏನು ಮಾಡಬೇಕು?',
      '108 ತುರ್ತು ಕರೆ ಮಾಡಿ',
      'ಆಶಾ ಸಾಥಿ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆಯಿರಿ',
    ],
    hi: [
      'बिलिकेरे के पास 24/7 प्रसव प्राथमिक स्वास्थ्य केंद्र खोजें',
      'गर्भवती महिला जांच के लिए अपॉइंटमेंट बुक करें',
      '6 सप्ताह में बच्चे को कौन से टीके लगते हैं?',
      'सांप के काटने पर क्या प्राथमिक उपचार करें?',
      '108 आपातकालीन एम्बुलेंस बुलाएं',
      'आशा साथी डैशबोर्ड खोलें',
    ],
    te: [
      'బిలికెరె వద్ద 24/7 డెలివరీ ఆసుపత్రిని కనుగొనండి',
      'గర్భిణీ స్త్రీల తనిఖీకి అపాయింట్‌మెంట్ బుక్ చేయండి',
      'శిశువులకు 6 వారాల టీకాల వివరాలు తెలపండి',
      'పాము కాటుకు ప్రథమ చికిత్స ఏమిటి?',
      '108 అత్యవసర అంబులెన్స్‌కు కాల్ చేయండి',
      'ఆశా సాథి పోర్టల్ తెరవండి',
    ],
    ml: [
      'ബിലികെരെ സമീപമുള്ള 24/7 പ്രസവ ആശുപത്രി ഏതാണ്?',
      'ഗർഭിണികളുടെ പരിശോധനയ്ക്ക് അപ്പോയിന്റ്മെന്റ് എടുക്കുക',
      'കുട്ടികൾക്ക് 6 ആഴ്ചയിൽ നൽകേണ്ട വാക്സിനുകൾ ഏവ?',
      'പാമ്പ് കടിയേറ്റാൽ ചെയ്യേണ്ട പ്രഥമശുശ്രൂഷ എന്താണ്?',
      '108 എമർജൻസി ആംബുലൻസ് വിളിക്കുക',
      'ആശ സാഥി ഡാഷ്‌ബോർഡ് തുറക്കുക',
    ],
    ta: [
      'பிலிகெரே அருகில் உள்ள 24/7 பிரசவ மருத்துவமனை எது?',
      'கர்ப்பிணிகள் பரிசோதனைக்கு முன்பதிவு செய்யவும்',
      'குழந்தைகளுக்கு 6 வார தடுப்பூசி விவரங்கள் என்ன?',
      'பாம்பு கடித்தால் என்ன முதலுதவி செய்ய வேண்டும்?',
      '108 அவசர ஆம்புலன்ஸை அழைக்கவும்',
      'ஆஷா சாதி போர்ட்டலைத் திறக்கவும்',
    ],
  };

  const quickPrompts = quickPromptsByLang[language] || quickPromptsByLang.en;

  // Initialize SpeechRecognition with current language locale
  useEffect(() => {
    if (!isOpen) {
      stopSpeaking();
      stopListening();
      return;
    }

    if (isSpeechRecognitionSupported()) {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = currentLanguageConfig.speechLang;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
        playChime('start');
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMessage(
            'Microphone access was denied. Please allow microphone permissions or type your question below.'
          );
        } else if (event.error !== 'no-speech') {
          setErrorMessage(
            'Could not clearly capture voice audio. Please try again or type below.'
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [isOpen, language, currentLanguageConfig.speechLang]);

  // When listening stops and we have transcript, query the assistant
  useEffect(() => {
    if (!isListening && transcript.trim().length > 1 && !isLoading) {
      handleProcessQuery(transcript.trim());
    }
  }, [isListening]);

  const startListening = () => {
    setTranscript('');
    setErrorMessage(null);
    if (!isSpeechRecognitionSupported()) {
      setErrorMessage(t('speech_not_supported_msg'));
      return;
    }

    try {
      recognitionRef.current?.start();
    } catch (e) {
      // already active
    }
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    setIsListening(false);
  };

  const handleProcessQuery = async (queryText: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    // Fast client-side intent matching for instant responsiveness
    const parsed = parseVoiceCommand(queryText, language);

    try {
      const response = await fetch('/api/ai/navigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: queryText,
          language: language,
        }),
      });

      if (!response.ok) {
        throw new Error('Server navigation response failed');
      }

      const data = await response.json();
      setAssistantReply(data.reply || '');
      setSuggestedAction(data.suggestedAction || 'NONE');
      setSources(data.sources || []);
      setIsUrgent(Boolean(data.isUrgent));

      playChime(data.isUrgent ? 'alert' : 'success');

      // Audio readout if speech is enabled
      if (speechEnabled && data.reply) {
        speakText(data.reply, language, speechRate);
      }
    } catch (err: any) {
      console.warn('AI Query fallback activated:', err);
      // Fallback intent execution using client-side parsed intents
      let fallbackReply = '';
      if (parsed.intent === 'EMERGENCY_108') {
        fallbackReply =
          'Emergency condition detected! Dial 108 ambulance immediately or visit the nearest hospital casualty.';
        setSuggestedAction('OPEN_108_EMERGENCY');
        setIsUrgent(true);
      } else if (parsed.intent === 'FIND_HOSPITAL') {
        fallbackReply =
          'Bilikere Primary Health Centre and Hunsur General Hospital are nearby. Opening facilities finder.';
        setSuggestedAction('OPEN_FACILITIES');
      } else if (parsed.intent === 'BOOK_APPOINTMENT') {
        fallbackReply =
          'Opening the appointment booking form for your Primary Health Centre checkup.';
        setSuggestedAction('OPEN_APPOINTMENT');
      } else {
        fallbackReply =
          'I am HealthConnect AI Assistant. Ask me about PHCs, appointments, or vaccinations in your language.';
      }
      setAssistantReply(fallbackReply);
      if (speechEnabled) speakText(fallbackReply, language, speechRate);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const q = textInput.trim();
    setTextInput('');
    setTranscript(q);
    handleProcessQuery(q);
  };

  const handleExecuteAction = () => {
    stopSpeaking();
    onClose();
    if (suggestedAction === 'OPEN_FACILITIES') {
      onNavigateTab('facilities');
    } else if (suggestedAction === 'OPEN_APPOINTMENT') {
      onNavigateTab('appointments');
    } else if (suggestedAction === 'OPEN_108_EMERGENCY') {
      onNavigateTab('home');
    } else if (suggestedAction === 'OPEN_ASHA_DASHBOARD') {
      onNavigateTab('asha');
    } else if (suggestedAction === 'OPEN_HEALTH_TOPICS') {
      onNavigateTab('health_info');
    } else if (suggestedAction === 'OPEN_SCORECARD') {
      onNavigateTab('scorecard');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-teal-600/50 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-950 via-slate-900 to-slate-950 border-b border-teal-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
              <Sparkles
                className="w-5 h-5 animate-spin"
                style={{ animationDuration: '6s' }}
              />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white">
                {t('voice_assistant_title')}
              </h3>
              <p className="text-xs text-teal-300/80">
                {currentLanguageConfig.name} ({currentLanguageConfig.englishName}) • {t('voice_assistant_tagline')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language dropdown in modal */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 text-teal-300 border border-slate-700 text-xs font-bold hover:bg-slate-750 transition cursor-pointer"
              >
                <span>{currentLanguageConfig.flag}</span>
                <span>{currentLanguageConfig.name}</span>
                <ChevronDown className="w-3 h-3 text-teal-400" />
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-teal-600/60 rounded-xl shadow-xl p-1 z-50">
                  {supportedLanguages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLanguage(l.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-between ${
                        language === l.code
                          ? 'bg-teal-500 text-slate-950 font-black'
                          : 'text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <span>
                        {l.flag} {l.name}
                      </span>
                      <span className="text-[10px] opacity-75">
                        {l.englishName}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Readout sound toggle */}
            <button
              onClick={() => setSpeechEnabled(!speechEnabled)}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              title="Toggle Voice Readout"
            >
              {speechEnabled ? (
                <Volume2 className="w-4 h-4 text-teal-400" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>

            {/* Close */}
            <button
              onClick={() => {
                stopSpeaking();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Central Microphone Animation Area */}
          <div className="flex flex-col items-center justify-center py-3 sm:py-5">
            <div className="relative">
              {isListening && (
                <>
                  <div className="absolute inset-0 rounded-full bg-teal-400/20 animate-ping" />
                  <div className="absolute -inset-4 rounded-full bg-teal-500/10 animate-pulse" />
                </>
              )}
              <button
                onClick={isListening ? stopListening : startListening}
                className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center text-white transition-all transform active:scale-95 shadow-2xl cursor-pointer ${
                  isListening
                    ? 'bg-rose-600 hover:bg-rose-500 ring-8 ring-rose-500/30'
                    : 'bg-gradient-to-tr from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 ring-8 ring-teal-500/20'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-9 h-9 animate-bounce" />
                    <span className="text-[11px] font-extrabold mt-1 uppercase tracking-wider">
                      {t('stop_listening_btn')}
                    </span>
                  </>
                ) : (
                  <>
                    <Mic className="w-10 h-10" />
                    <span className="text-[11px] font-extrabold mt-1 uppercase tracking-wider">
                      {t('speak_now_btn')}
                    </span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-3 text-center">
              <span className="text-xs sm:text-sm font-semibold text-teal-200">
                {isListening ? t('listening_prompt') : t('voice_assistant_tagline')}
              </span>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Locale: <code>{currentLanguageConfig.speechLang}</code> •{' '}
                {isSpeechRecognitionSupported()
                  ? 'Browser Speech Engine Ready'
                  : 'Text Input Active'}
              </div>
            </div>
          </div>

          {/* Transcript / Input text */}
          {transcript && (
            <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700 text-sm text-slate-200">
              <span className="text-[11px] uppercase font-bold text-teal-400 block mb-1">
                Your Query ({currentLanguageConfig.name}):
              </span>
              <p className="font-medium text-white italic">"{transcript}"</p>
            </div>
          )}

          {/* Error Message if any */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/60 rounded-xl text-xs text-rose-300">
              {errorMessage}
            </div>
          )}

          {/* Assistant Reply Card */}
          {isLoading ? (
            <div className="p-6 bg-slate-950/60 rounded-2xl border border-teal-800/30 flex items-center justify-center gap-3 text-teal-300 text-sm font-medium">
              <div className="w-5 h-5 rounded-full border-2 border-teal-400 border-t-transparent animate-spin" />
              <span>{t('processing_voice')}</span>
            </div>
          ) : assistantReply ? (
            <div
              className={`p-5 rounded-2xl border transition-all ${
                isUrgent
                  ? 'bg-rose-950/70 border-rose-600 shadow-xl shadow-rose-900/30'
                  : 'bg-teal-950/40 border-teal-700/60 shadow-lg'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    isUrgent ? 'text-rose-300' : 'text-teal-300'
                  }`}
                >
                  {isUrgent ? (
                    <AlertOctagon className="w-4 h-4 text-rose-400 animate-pulse" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-teal-400" />
                  )}
                  <span>
                    {isUrgent ? 'EMERGENCY ACTION REQUIRED' : 'HealthConnect AI'}
                  </span>
                </span>

                {speechEnabled && (
                  <button
                    onClick={() =>
                      speakText(assistantReply, language, speechRate)
                    }
                    className="p-1 rounded text-teal-300 hover:text-white"
                    title="Repeat Audio"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <p className="text-white text-sm sm:text-base leading-relaxed font-medium">
                {assistantReply}
              </p>

              {/* Action Button if navigation suggested */}
              {suggestedAction !== 'NONE' && (
                <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-semibold">
                    {t('suggested_action_label')}:
                  </span>
                  <button
                    onClick={handleExecuteAction}
                    className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition ${
                      isUrgent
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg'
                        : 'bg-teal-500 hover:bg-teal-400 text-slate-950'
                    }`}
                  >
                    <span>
                      {suggestedAction === 'OPEN_FACILITIES' &&
                        t('open_facilities_action')}
                      {suggestedAction === 'OPEN_APPOINTMENT' &&
                        t('open_appointments_action')}
                      {suggestedAction === 'OPEN_108_EMERGENCY' &&
                        t('open_emergency_action')}
                      {suggestedAction === 'OPEN_ASHA_DASHBOARD' &&
                        t('open_asha_action')}
                      {suggestedAction === 'OPEN_HEALTH_TOPICS' &&
                        t('open_health_action')}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Sources citations */}
              {sources.length > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  <span>Verified Public Health Source: {sources.join(', ')}</span>
                </div>
              )}
            </div>
          ) : null}

          {/* Quick Prompt Chips */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              💡 {t('voice_tips_title')} ({currentLanguageConfig.name}):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTranscript(prompt);
                    handleProcessQuery(prompt);
                  }}
                  className="p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-750 text-left text-xs text-slate-200 border border-slate-700/80 hover:border-teal-500/60 transition cursor-pointer flex items-center justify-between group"
                >
                  <span className="line-clamp-2">{prompt}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-teal-400 shrink-0 ml-1" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Text Input Fallback */}
        <form
          onSubmit={handleSubmitText}
          className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={t('type_instead_placeholder')}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
          <button
            type="submit"
            disabled={!textInput.trim() || isLoading}
            className="p-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl transition disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
