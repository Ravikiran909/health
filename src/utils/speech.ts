// Web Speech API utility for Kannada (kn-IN) and English (en-IN) voice navigation (Step 3)

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
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
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
  return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

// Check speech synthesis support
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// Spoken text response via SpeechSynthesis
export function speakText(text: string, language: 'kn' | 'en' = 'kn', onEnd?: () => void) {
  if (!isSpeechSynthesisSupported()) {
    if (onEnd) onEnd();
    return;
  }

  window.speechSynthesis.cancel(); // Stop ongoing speech

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language === 'kn' ? 'kn-IN' : 'en-IN';
  utterance.rate = 0.95; // Slightly slower for clarity in rural healthcare contexts
  utterance.pitch = 1.0;

  // Attempt to select Indian voice if available
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find((v) =>
    language === 'kn'
      ? v.lang.startsWith('kn') || v.name.toLowerCase().includes('kannada')
      : v.lang.startsWith('en-IN') || v.name.toLowerCase().includes('india')
  );

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

// Command intent parser for bilingual voice recognition
export function parseVoiceCommand(transcript: string): {
  intent: VoiceIntent;
  confidence: number;
  matchedKeyword: string;
} {
  const lower = transcript.toLowerCase().trim();

  // 1. Emergency 108
  if (
    lower.includes('108') ||
    lower.includes('ತುರ್ತು') ||
    lower.includes('ಆಂಬುಲೆನ್ಸ್') ||
    lower.includes('ಆಂಬುಲೆನ್ಸ್‌') ||
    lower.includes('emergency') ||
    lower.includes('ambulance') ||
    lower.includes('accident') ||
    lower.includes('ಅಪಘಾತ')
  ) {
    return { intent: 'EMERGENCY_108', confidence: 0.95, matchedKeyword: '108 / Emergency' };
  }

  // 2. Hospital / PHC Finder
  if (
    lower.includes('ಆಸ್ಪತ್ರೆ') ||
    lower.includes('ದವಾಖಾನೆ') ||
    lower.includes('ಪಿಹೆಚ್‌ಸಿ') ||
    lower.includes('ಹುಡುಕಿ') ||
    lower.includes('hospital') ||
    lower.includes('phc') ||
    lower.includes('chc') ||
    lower.includes('clinic') ||
    lower.includes('doctor near') ||
    lower.includes('delivery') ||
    lower.includes('ಹೆರಿಗೆ')
  ) {
    return { intent: 'FIND_HOSPITAL', confidence: 0.9, matchedKeyword: 'Hospital Finder' };
  }

  // 3. Appointment Booking
  if (
    lower.includes('ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್') ||
    lower.includes('ಅಪಾಯಿಂಟ್ಮೆಂಟ್') ||
    lower.includes('ದಿನಾಂಕ') ||
    lower.includes('ಬುಕ್') ||
    lower.includes('ಭೇಟಿ') ||
    lower.includes('appointment') ||
    lower.includes('book slot') ||
    lower.includes('schedule')
  ) {
    return { intent: 'BOOK_APPOINTMENT', confidence: 0.9, matchedKeyword: 'Appointment Booking' };
  }

  // 4. ASHA Saathi Dashboard
  if (
    lower.includes('ಆಶಾ') ||
    lower.includes('ಕಾರ್ಯಕರ್ತೆ') ||
    lower.includes('ಸಾಥಿ') ||
    lower.includes('asha') ||
    lower.includes('worker') ||
    lower.includes('saathi') ||
    lower.includes('follow up') ||
    lower.includes('ಫಾಲೋ ಅಪ್')
  ) {
    return { intent: 'ASHA_DASHBOARD', confidence: 0.88, matchedKeyword: 'ASHA Saathi' };
  }

  // 5. Health Information / RAG Explainer
  if (
    lower.includes('ಲಸಿಕೆ') ||
    lower.includes('ಗರ್ಭಿಣಿ') ||
    lower.includes('ಹಾವು') ||
    lower.includes('ಜ್ವರ') ||
    lower.includes('ಡೆಂಗ್ಯೂ') ||
    lower.includes('ಬಿಪಿ') ||
    lower.includes('ಸಕ್ಕರೆ') ||
    lower.includes('ಮಾಹಿತಿ') ||
    lower.includes('vaccine') ||
    lower.includes('fever') ||
    lower.includes('dengue') ||
    lower.includes('snake') ||
    lower.includes('sugar') ||
    lower.includes('diet') ||
    lower.includes('nutrition')
  ) {
    return { intent: 'HEALTH_INFO', confidence: 0.85, matchedKeyword: 'Health Information' };
  }

  // 6. Usability Access Scorecard
  if (
    lower.includes('ಸ್ಕೋರ್') ||
    lower.includes('ಪರೀಕ್ಷೆ') ||
    lower.includes('scorecard') ||
    lower.includes('benchmark') ||
    lower.includes('usability')
  ) {
    return { intent: 'SCORECARD', confidence: 0.85, matchedKeyword: 'Access Scorecard' };
  }

  return { intent: 'UNKNOWN', confidence: 0.5, matchedKeyword: 'General AI Assistant' };
}
