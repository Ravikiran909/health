import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
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
  const { language, setLanguage, speechEnabled, setSpeechEnabled } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [assistantReply, setAssistantReply] = useState<string>('');
  const [suggestedAction, setSuggestedAction] = useState<string>('NONE');
  const [sources, setSources] = useState<string[]>([]);
  const [isUrgent, setIsUrgent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  const quickPrompts =
    language === 'kn'
      ? [
          'ಬಿಳಿಕೆರೆ ಸಮೀಪದ 24/7 ಹೆರಿಗೆ ಆಸ್ಪತ್ರೆ ಯಾವುದು?',
          'ಗರ್ಭಿಣಿಯರ ತಪಾಸಣೆಗೆ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ',
          'ಮಕ್ಕಳ 6 ವಾರದ ಲಸಿಕಾ ಮಾಹಿತಿ ನೀಡಿ',
          'ಹಾವು ಕಚ್ಚಿದಾಗ ಏನು ಮಾಡಬೇಕು?',
          '108 ತುರ್ತು ಕರೆ ಮಾಡಿ',
          'ಆಶಾ ಸಾಥಿ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆಯಿರಿ',
        ]
      : [
          'Find nearest 24/7 delivery PHC near Bilikere',
          'Book an ANC prenatal checkup appointment',
          'What vaccines are given at 6 weeks?',
          'What is the emergency first aid for snakebite?',
          'Call 108 emergency ambulance',
          'Open ASHA Saathi dashboard',
        ];

  // Initialize SpeechRecognition on mount
  useEffect(() => {
    if (!isOpen) {
      stopSpeaking();
      stopListening();
      return;
    }

    if (isSpeechRecognitionSupported()) {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'kn' ? 'kn-IN' : 'en-IN';

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
            language === 'kn'
              ? 'ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಬ್ರೌಸರ್ ಸೆಟ್ಟಿಂಗ್ಸ್‌ನಲ್ಲಿ ಅನುಮತಿ ನೀಡಿ ಅಥವಾ ಕೆಳಗೆ ಟೈಪ್ ಮಾಡಿ.'
              : 'Microphone permission denied. Please allow microphone in browser or type your question below.'
          );
        } else if (event.error !== 'no-speech') {
          setErrorMessage(
            language === 'kn'
              ? 'ಧ್ವನಿ ಸರಿಯಾಗಿ ಗ್ರಹಿಸಲಿಲ್ಲ. ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಕೆಳಗೆ ಟೈಪ್ ಮಾಡಿ.'
              : 'Could not catch your voice clearly. Please try again or type below.'
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [isOpen, language]);

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
      setErrorMessage(
        language === 'kn'
          ? 'ನಿಮ್ಮ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆ ಬೆಂಬಲಿಸುವುದಿಲ್ಲ. ದಯವಿಟ್ಟು ಪ್ರಶ್ನೆಯನ್ನು ಟೈಪ್ ಮಾಡಿ.'
          : 'Voice speech recognition is not supported in this browser. Please type below.'
      );
      return;
    }

    try {
      recognitionRef.current?.start();
    } catch (e) {
      // might already be started
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
    const parsed = parseVoiceCommand(queryText);

    try {
      const response = await fetch('/api/ai/navigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: queryText,
          language: language === 'kn' ? 'kannada' : 'english',
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
        speakText(data.reply, language);
      }
    } catch (err: any) {
      console.warn('AI Query failed:', err);
      // Fallback intent execution
      let fallbackReply = '';
      if (parsed.intent === 'EMERGENCY_108') {
        fallbackReply =
          language === 'kn'
            ? 'ಇದು ತುರ್ತು ಪರಿಸ್ಥಿತಿ. ತಕ್ಷಣ 108 ಆಂಬುಲೆನ್ಸ್‌ಗೆ ಕರೆ ಮಾಡಿ.'
            : 'Emergency detected. Please dial 108 ambulance immediately.';
        setSuggestedAction('OPEN_108_EMERGENCY');
        setIsUrgent(true);
      } else if (parsed.intent === 'FIND_HOSPITAL') {
        fallbackReply =
          language === 'kn'
            ? 'ಬಿಳಿಕೆರೆ ಪ್ರಾಥಮಿಕ ಕೇಂದ್ರ ಮತ್ತು ಹುಣಸೂರು ಸಾರ್ವಜನಿಕ ಆಸ್ಪತ್ರೆ ಸನಿಹದಲ್ಲಿವೆ. ಆಸ್ಪತ್ರೆಗಳ ಪಟ್ಟಿ ತೆರೆಯಲಾಗುತ್ತಿದೆ.'
            : 'Bilikere PHC and Hunsur Hospital are nearby. Opening facilities finder.';
        setSuggestedAction('OPEN_FACILITIES');
      } else {
        fallbackReply =
          language === 'kn'
            ? 'ನಾನು ಆರೋಗ್ಯ ಸಂಪರ್ಕ ಸಹಾಯಕ. ಆಸ್ಪತ್ರೆ, ಲಸಿಕೆ ಅಥವಾ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬಗ್ಗೆ ಕೇಳಿ.'
            : 'I am HealthConnect Assistant. Ask me about PHCs, appointments, or vaccinations.';
      }
      setAssistantReply(fallbackReply);
      if (speechEnabled) speakText(fallbackReply, language);
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
      onNavigateTab('home'); // or opens emergency modal
    } else if (suggestedAction === 'OPEN_ASHA_DASHBOARD') {
      onNavigateTab('asha');
    } else if (suggestedAction === 'OPEN_HEALTH_TOPICS') {
      onNavigateTab('health_info');
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
              <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white">
                {language === 'kn' ? 'ಆರೋಗ್ಯ ಸಂಪರ್ಕ ಧ್ವನಿ ಸಹಾಯಕ' : 'HealthConnect Voice Assistant'}
              </h3>
              <p className="text-xs text-teal-300/80">
                {language === 'kn' ? 'ಕನ್ನಡ ಹಾಗೂ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಮಾತನಾಡಿ' : 'Speak in Kannada or English'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language toggle inside assistant */}
            <button
              onClick={() => setLanguage(language === 'kn' ? 'en' : 'kn')}
              className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-teal-300 border border-slate-700 hover:bg-slate-700"
            >
              {language === 'kn' ? 'ಕನ್ನಡ (kn)' : 'English (en)'}
            </button>

            {/* Readout sound toggle */}
            <button
              onClick={() => setSpeechEnabled(!speechEnabled)}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              title="Toggle Voice Readout"
            >
              {speechEnabled ? <Volume2 className="w-4 h-4 text-teal-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={() => {
                stopSpeaking();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Central Microphone Animation Area */}
          <div className="flex flex-col items-center justify-center py-4 sm:py-6">
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
                      {language === 'kn' ? 'ನಿಲ್ಲಿಸಿ' : 'Stop'}
                    </span>
                  </>
                ) : (
                  <>
                    <Mic className="w-10 h-10" />
                    <span className="text-[11px] font-extrabold mt-1 uppercase tracking-wider">
                      {language === 'kn' ? 'ಮಾತನಾಡಿ' : 'Tap & Speak'}
                    </span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-3 text-center">
              <span className="text-xs sm:text-sm font-semibold text-teal-200">
                {isListening
                  ? language === 'kn'
                    ? '🎙️ ನಿಮ್ಮ ಮಾತನ್ನು ಆಲಿಸಲಾಗುತ್ತಿದೆ...'
                    : '🎙️ Listening to your voice now...'
                  : language === 'kn'
                  ? 'ಬಟನ್ ಒತ್ತಿ ಪ್ರಶ್ನೆ ಕೇಳಿ ಅಥವಾ ಕೆಳಗೆ ಟೈಪ್ ಮಾಡಿ'
                  : 'Tap the mic to ask or pick a suggestion below'}
              </span>
            </div>
          </div>

          {/* Transcript / Input text */}
          {transcript && (
            <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700 text-sm text-slate-200">
              <span className="text-[11px] uppercase font-bold text-teal-400 block mb-1">
                {language === 'kn' ? 'ನೀವು ಕೇಳಿದ್ದು / Your Query:' : 'Your Voice Query:'}
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
            <div className="p-4 bg-teal-950/40 border border-teal-800/40 rounded-2xl flex items-center gap-3 animate-pulse">
              <div className="w-6 h-6 rounded-full border-2 border-teal-400 border-t-transparent animate-spin" />
              <span className="text-xs text-teal-200 font-medium">
                {language === 'kn' ? 'ಸರ್ಕಾರಿ ಮಾರ್ಗಸೂಚಿಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...' : 'Navigating healthcare resources with Gemini AI...'}
              </span>
            </div>
          ) : assistantReply ? (
            <div
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                isUrgent
                  ? 'bg-rose-950/70 border-rose-700/80 text-rose-100 shadow-rose-900/40 shadow-xl'
                  : 'bg-gradient-to-br from-teal-950/60 to-slate-900 border-teal-700/50 text-slate-100 shadow-xl'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  {language === 'kn' ? 'ಆರೋಗ್ಯ ಸಂಪರ್ಕ ಮಾರ್ಗದರ್ಶನ' : 'HealthConnect AI Guidance'}
                </span>
                {speechEnabled && (
                  <button
                    onClick={() => speakText(assistantReply, language)}
                    className="p-1.5 rounded-lg bg-teal-900/60 hover:bg-teal-800 text-teal-300 text-xs flex items-center gap-1"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{language === 'kn' ? 'ಮತ್ತೊಮ್ಮೆ ಆಲಿಸಿ' : 'Replay Audio'}</span>
                  </button>
                )}
              </div>

              <p className="text-sm sm:text-base leading-relaxed font-normal text-white">
                {assistantReply}
              </p>

              {/* Source citations */}
              {sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-teal-800/40 text-[11px] text-teal-300/80">
                  <span className="font-bold">
                    {language === 'kn' ? 'ದೃಢೀಕೃತ ಮೂಲ: ' : 'Verified Source: '}
                  </span>
                  <span>{sources.join(', ')}</span>
                </div>
              )}

              {/* Quick Action Button */}
              {suggestedAction !== 'NONE' && (
                <div className="mt-4">
                  <button
                    onClick={handleExecuteAction}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                  >
                    <span>
                      {suggestedAction === 'OPEN_FACILITIES' && (language === 'kn' ? 'ಆಸ್ಪತ್ರೆಗಳ ಪಟ್ಟಿ ನೋಡಿ' : 'View Matching PHCs & Hospitals')}
                      {suggestedAction === 'OPEN_APPOINTMENT' && (language === 'kn' ? 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ನಮೂನೆ ತೆರೆಯಿರಿ' : 'Open Appointment Request Form')}
                      {suggestedAction === 'OPEN_108_EMERGENCY' && (language === 'kn' ? '108 ತುರ್ತು ಕರೆ ಪರದೆಗೆ ಹೋಗಿ' : 'Open 108 Emergency Dialer')}
                      {suggestedAction === 'OPEN_ASHA_DASHBOARD' && (language === 'kn' ? 'ಆಶಾ ಸಾಥಿ ಪೋರ್ಟಲ್ ತೆರೆಯಿರಿ' : 'Open ASHA Saathi Dashboard')}
                      {suggestedAction === 'OPEN_HEALTH_TOPICS' && (language === 'kn' ? 'ಆರೋಗ್ಯ ಶಿಕ್ಷಣ ವಿಷಯಗಳು' : 'Explore Health Topics')}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {/* Quick Prompts Chips */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              {language === 'kn' ? 'ತ್ವರಿತ ಧ್ವನಿ ಪ್ರಶ್ನೆಗಳು:' : 'Suggested Voice Queries:'}
            </span>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {quickPrompts.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTranscript(q);
                    handleProcessQuery(q);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-teal-900/50 hover:text-teal-200 border border-slate-700 text-slate-300 text-xs text-left transition cursor-pointer"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>

          {/* Text Input Fallback */}
          <form onSubmit={handleSubmitText} className="pt-2 flex items-center gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={
                language === 'kn'
                  ? 'ಇಲ್ಲಿ ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಟೈಪ್ ಮಾಡಿ...'
                  : 'Or type your health query here...'
              }
              className="flex-1 bg-slate-800 border border-slate-700 focus:border-teal-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 outline-none"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition cursor-pointer disabled:opacity-50"
              disabled={!textInput.trim() || isLoading}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Disclaimer */}
          <p className="text-[10px] text-slate-500 text-center">
            {language === 'kn'
              ? 'ಆರೋಗ್ಯ ಸಂಪರ್ಕ AI ವೈದ್ಯಕೀಯ ರೋಗನಿರ್ಣಯ ಅಥವಾ ಔಷಧಿ ಶಿಫಾರಸು ಮಾಡುವುದಿಲ್ಲ. ತುರ್ತು ಸ್ಥಿತಿಯಲ್ಲಿ 108 ಕರೆ ಮಾಡಿ.'
              : 'HealthConnect AI strictly provides public healthcare navigation and does not diagnose or prescribe medicines. Call 108 in emergencies.'}
          </p>
        </div>
      </div>
    </div>
  );
};
