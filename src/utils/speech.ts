import { Language, SUPPORTED_LANGUAGES } from '../types';

export type VoiceIntent =
  | 'FIND_HOSPITAL'
  | 'BOOK_APPOINTMENT'
  | 'EMERGENCY_108'
  | 'ASHA_DASHBOARD'
  | 'HEALTH_INFO'
  | 'SCORECARD'
  | 'UNKNOWN';

// Web Audio gentle chime feedback
export function playChime(type: 'start' | 'success' | 'alert') {
  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'start') {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'success') {
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'alert') {
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.setValueAtTime(240, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    // AudioContext might be blocked until user gesture
  }
}

// Check speech recognition support
export function isSpeechRecognitionSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  );
}

// Check speech synthesis support
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// Check if a specific language voice is available in browser synthesis
export function getSynthesisVoiceForLanguage(
  lang: Language
): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const langConfig = SUPPORTED_LANGUAGES.find((l) => l.code === lang);
  const speechLang = langConfig?.speechLang || 'en-IN';
  const prefix = speechLang.split('-')[0];

  // 1. Try exact BCP-47 match (e.g. 'kn-IN', 'hi-IN')
  let matched = voices.find((v) => v.lang.toLowerCase() === speechLang.toLowerCase());
  if (matched) return matched;

  // 2. Try prefix match (e.g. 'kn', 'hi', 'te', 'ml', 'ta')
  matched = voices.find((v) =>
    v.lang.toLowerCase().startsWith(prefix.toLowerCase())
  );
  if (matched) return matched;

  // 3. Try name match (e.g. 'Hindi', 'Tamil')
  const engName = langConfig?.englishName.toLowerCase() || '';
  matched = voices.find((v) => v.name.toLowerCase().includes(engName));
  if (matched) return matched;

  // 4. Fallback to any Indian voice or English voice
  return (
    voices.find((v) => v.lang.toLowerCase().includes('in')) ||
    voices.find((v) => v.lang.toLowerCase().startsWith('en')) ||
    null
  );
}

// Spoken text response via SpeechSynthesis
export function speakText(
  text: string,
  language: Language = 'kn',
  rate: number = 0.95,
  onEnd?: () => void
) {
  if (!isSpeechSynthesisSupported()) {
    if (onEnd) onEnd();
    return;
  }

  window.speechSynthesis.cancel(); // Stop ongoing speech

  const langConfig = SUPPORTED_LANGUAGES.find((l) => l.code === language);
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langConfig?.speechLang || 'en-IN';
  utterance.rate = rate;
  utterance.pitch = 1.0;

  const matchedVoice = getSynthesisVoiceForLanguage(language);
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
}

// Stop any active speech
export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

// Command intent parser for multilingual voice recognition across all 6 Indian languages
export function parseVoiceCommand(
  transcript: string,
  _lang?: Language
): {
  intent: VoiceIntent;
  confidence: number;
  matchedKeyword: string;
} {
  const lower = transcript.toLowerCase().trim();

  // 1. Emergency 108
  if (
    lower.includes('108') ||
    // Kannada
    lower.includes('ತುರ್ತು') ||
    lower.includes('ಆಂಬುಲೆನ್ಸ್') ||
    lower.includes('ಆಂಬುಲೆನ್ಸ್‌') ||
    lower.includes('ಅಪಘಾತ') ||
    // Hindi
    lower.includes('आपातकाल') ||
    lower.includes('एम्बुलेंस') ||
    lower.includes('दुर्घटना') ||
    // Telugu
    lower.includes('అత్యవసరం') ||
    lower.includes('ఆంబులెన్స్') ||
    lower.includes('ప్రమాదం') ||
    // Malayalam
    lower.includes('അടിയന്തരം') ||
    lower.includes('ആംബുലൻസ്') ||
    lower.includes('അപകടം') ||
    // Tamil
    lower.includes('அவசரம்') ||
    lower.includes('ஆம்புலன்ஸ்') ||
    lower.includes('விபத்து') ||
    // English
    lower.includes('emergency') ||
    lower.includes('ambulance') ||
    lower.includes('accident')
  ) {
    return {
      intent: 'EMERGENCY_108',
      confidence: 0.95,
      matchedKeyword: '108 / Emergency',
    };
  }

  // 2. Hospital / PHC Finder
  if (
    // Kannada
    lower.includes('ಆಸ್ಪತ್ರೆ') ||
    lower.includes('ದವಾಖಾನೆ') ||
    lower.includes('ಪಿಹೆಚ್‌ಸಿ') ||
    lower.includes('ಹುಡುಕಿ') ||
    lower.includes('ಹೆರಿಗೆ') ||
    // Hindi
    lower.includes('अस्पताल') ||
    lower.includes('दवाखाना') ||
    lower.includes('डॉक्टर') ||
    lower.includes('डिलीवरी') ||
    lower.includes('प्रसव') ||
    // Telugu
    lower.includes('ఆసుపత్రి') ||
    lower.includes('వైద్యశాల') ||
    lower.includes('వైద్యుడు') ||
    lower.includes('ప్రసవం') ||
    // Malayalam
    lower.includes('ആശുപത്രി') ||
    lower.includes('ഡോക്ടർ') ||
    lower.includes('പ്രസവം') ||
    // Tamil
    lower.includes('மருத்துவமனை') ||
    lower.includes('டாக்டர்') ||
    lower.includes('பிரசவம்') ||
    // English
    lower.includes('hospital') ||
    lower.includes('phc') ||
    lower.includes('chc') ||
    lower.includes('clinic') ||
    lower.includes('doctor') ||
    lower.includes('delivery') ||
    lower.includes('near me')
  ) {
    return {
      intent: 'FIND_HOSPITAL',
      confidence: 0.9,
      matchedKeyword: 'Hospital Finder',
    };
  }

  // 3. Appointment Booking
  if (
    // Kannada
    lower.includes('ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್') ||
    lower.includes('ಅಪಾಯಿಂಟ್ಮೆಂಟ್') ||
    lower.includes('ದಿನಾಂಕ') ||
    lower.includes('ಬುಕ್') ||
    lower.includes('ಭೇಟಿ') ||
    // Hindi
    lower.includes('अपॉइंटमेंट') ||
    lower.includes('तारीख') ||
    lower.includes('समय') ||
    lower.includes('पंजीकरण') ||
    // Telugu
    lower.includes('అపాయింట్‌మెంట్') ||
    lower.includes('తేదీ') ||
    lower.includes('బుకింగ్') ||
    // Malayalam
    lower.includes('അപ്പോയിന്റ്മെന്റ്') ||
    lower.includes('തീയതി') ||
    lower.includes('ബുക്ക്') ||
    // Tamil
    lower.includes('முன்பதிவு') ||
    lower.includes('நேரம்') ||
    lower.includes('தேதி') ||
    // English
    lower.includes('appointment') ||
    lower.includes('book') ||
    lower.includes('schedule') ||
    lower.includes('slot')
  ) {
    return {
      intent: 'BOOK_APPOINTMENT',
      confidence: 0.9,
      matchedKeyword: 'Appointment Booking',
    };
  }

  // 4. ASHA Saathi Dashboard
  if (
    // All Indian languages share the name 'ASHA' / 'आशा' / 'ఆశా' / 'ആശ' / 'ஆஷா'
    lower.includes('ಆಶಾ') ||
    lower.includes('ಕಾರ್ಯಕರ್ತೆ') ||
    lower.includes('ಸಾಥಿ') ||
    lower.includes('आशा') ||
    lower.includes('कार्यकर्ता') ||
    lower.includes('ఆశా') ||
    lower.includes('కార్యకర్త') ||
    lower.includes('ആശ') ||
    lower.includes('പ്രവർത്തക') ||
    lower.includes('ஆஷா') ||
    lower.includes('பணியாளர்') ||
    lower.includes('asha') ||
    lower.includes('worker') ||
    lower.includes('saathi') ||
    lower.includes('referral')
  ) {
    return {
      intent: 'ASHA_DASHBOARD',
      confidence: 0.88,
      matchedKeyword: 'ASHA Saathi',
    };
  }

  // 5. Health Information / RAG Explainer
  if (
    // Kannada
    lower.includes('ಲಸಿಕೆ') ||
    lower.includes('ಗರ್ಭಿಣಿ') ||
    lower.includes('ಹಾವು') ||
    lower.includes('ಜ್ವರ') ||
    lower.includes('ಡೆಂಗ್ಯೂ') ||
    // Hindi
    lower.includes('टीका') ||
    lower.includes('टीकाकरण') ||
    lower.includes('गर्भावस्था') ||
    lower.includes('बुखार') ||
    lower.includes('सांप') ||
    lower.includes('डेंगू') ||
    // Telugu
    lower.includes('టీకా') ||
    lower.includes('గర్భం') ||
    lower.includes('జ్వరం') ||
    lower.includes('పాము') ||
    lower.includes('డెంగ్యూ') ||
    // Malayalam
    lower.includes('വാക്സിൻ') ||
    lower.includes('പനി') ||
    lower.includes('പാമ്പ്') ||
    lower.includes('ഡെങ്കി') ||
    // Tamil
    lower.includes('தடுப்பூசி') ||
    lower.includes('காய்ச்சல்') ||
    lower.includes('பாம்பு') ||
    lower.includes('டெங்கு') ||
    // English
    lower.includes('vaccine') ||
    lower.includes('fever') ||
    lower.includes('dengue') ||
    lower.includes('snake') ||
    lower.includes('pregnant') ||
    lower.includes('nutrition') ||
    lower.includes('diet') ||
    lower.includes('info')
  ) {
    return {
      intent: 'HEALTH_INFO',
      confidence: 0.85,
      matchedKeyword: 'Health Information',
    };
  }

  // 6. Usability Access Scorecard
  if (
    lower.includes('ಸ್ಕೋರ್') ||
    lower.includes('स्कोर') ||
    lower.includes('స్కోర్') ||
    lower.includes('സ്കോർ') ||
    lower.includes('மதிப்பெண்') ||
    lower.includes('scorecard') ||
    lower.includes('benchmark') ||
    lower.includes('usability')
  ) {
    return {
      intent: 'SCORECARD',
      confidence: 0.85,
      matchedKeyword: 'Access Scorecard',
    };
  }

  return {
    intent: 'UNKNOWN',
    confidence: 0.5,
    matchedKeyword: 'General AI Assistant',
  };
}
