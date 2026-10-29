export type Language = 'en' | 'kn' | 'hi' | 'te' | 'ml' | 'ta';

export interface LanguageConfig {
  code: Language;
  name: string;        // Native name (e.g., 'ಕನ್ನಡ', 'हिन्दी')
  englishName: string; // English name (e.g., 'Kannada', 'Hindi')
  speechLang: string;  // BCP 47 tag for SpeechRecognition & Synthesis (e.g., 'kn-IN')
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', englishName: 'English', speechLang: 'en-IN', flag: '🇬🇧' },
  { code: 'kn', name: 'ಕನ್ನಡ', englishName: 'Kannada', speechLang: 'kn-IN', flag: '🇮🇳' },
  { code: 'hi', name: 'हिन्दी', englishName: 'Hindi', speechLang: 'hi-IN', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు', englishName: 'Telugu', speechLang: 'te-IN', flag: '🇮🇳' },
  { code: 'ml', name: 'മലയാളം', englishName: 'Malayalam', speechLang: 'ml-IN', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ்', englishName: 'Tamil', speechLang: 'ta-IN', flag: '🇮🇳' },
];

export type UserRole = 'citizen' | 'asha' | 'doctor' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  village?: string;
  ashaId?: string;
  facilityName?: string;
}

export interface Facility {
  id: string;
  name: string;
  kannadaName: string;
  type: 'PHC' | 'CHC' | 'TALUK_HOSPITAL' | 'DISTRICT_HOSPITAL' | 'MATERNAL_CARE';
  district: string;
  taluk: string;
  villageOrTown: string;
  address: string;
  kannadaAddress: string;
  phone: string;
  emergency108Available: boolean;
  isOpen24x7: boolean;
  openingHours: string;
  services: string[];
  kannadaServices: string[];
  bedCount: number;
  availableDoctors: number;
  distanceKm: number;
  isSampleData: boolean;
  latitude: number;
  longitude: number;
}

export interface NearbyHospital {
  id: string;
  name: string;
  kannadaName?: string;
  hindiName?: string;
  ownership?: 'GOVERNMENT' | 'PRIVATE';
  type: string;
  state?: string;
  stateCode?: string;
  district?: string;
  cityOrTown?: string;
  address: string;
  kannadaAddress?: string;
  pinCode?: string;
  phone?: string;
  emergencyPhone?: string;
  distanceKm?: number;
  latitude: number;
  longitude: number;
  isOpen24x7: boolean;
  emergencyAvailable: boolean;
  source: string;
  verifiedDate?: string;
  openingHours?: string;
  bedCount?: number;
  availableDoctors?: number;
  specialties?: string[];
  services?: string[];
}

export interface HospitalSearchParams {
  lat?: number;
  lng?: number;
  radius?: number;
  state?: string;
  district?: string;
  city?: string;
  q?: string;
  ownership?: 'ALL' | 'GOVERNMENT' | 'PRIVATE';
  type?: string;
  specialty?: string;
  open24x7?: boolean;
  page?: number;
  limit?: number;
}


export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  timestamp: number;
  addressName?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Female' | 'Male' | 'Other';
  village: string;
  contactPhone: string;
  ashaWorkerId: string;
  consentRecorded: boolean;
  consentMethod: 'written' | 'verbal_recorded' | 'digital_checkbox';
  category: 'ANC_MATERNAL' | 'PEDIATRIC_IMMUNIZATION' | 'NCD_HYPERTENSION' | 'GENERAL';
  ancTrimester?: number;
  eddDate?: string;
  highRisk: boolean;
  highRiskReason?: string;
  lastVisitDate: string;
  nextFollowUpDate: string;
  notes: string;
}

export interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  facilityId: string;
  facilityName: string;
  facilityType: string;
  department: string;
  preferredDate: string;
  slotTime: string;
  reason: string;
  status: 'REQUESTED_PENDING_CONFIRMATION' | 'CONFIRMED' | 'RESCHEDULED' | 'CANCELLED';
  createdOffline: boolean;
  syncedAt?: string;
  createdAt: string;
  ashaAssisted: boolean;
  ashaWorkerId?: string;
}

export interface Referral {
  id: string;
  patientId: string;
  patientName: string;
  age: number;
  village: string;
  fromFacility: string;
  toFacility: string;
  reason: string;
  urgency: 'EMERGENCY_CRITICAL' | 'URGENT_24H' | 'ROUTINE';
  status: 'REFERRED_PENDING_TRAVEL' | 'REACHED_FACILITY' | 'ADMITTED' | 'DISCHARGED_RESOLVED';
  requiresAmbulance: boolean;
  ashaEscortName: string;
  createdAt: string;
  updatedAt: string;
}

export interface HealthTopicDoc {
  id: string;
  topicKey: string;
  title: string;
  kannadaTitle: string;
  source: string;
  summary: string;
  kannadaSummary: string;
  warningSigns: string[];
  kannadaWarningSigns: string[];
  emergencyAction: string;
}

export interface UsabilityTask {
  id: string;
  title: string;
  kannadaTitle: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  targetDurationSec: number;
}

export interface UsabilityRun {
  id: string;
  taskId: string;
  taskTitle: string;
  interfaceMode: 'voice' | 'standard_gui';
  language: 'kannada' | 'english';
  durationSeconds: number;
  assistanceNeededCount: number;
  completedSuccessfully: boolean;
  easeRating: number;
  userConsentGiven: boolean;
  timestamp: string;
  userType: 'rural_citizen' | 'asha_worker' | 'general_tester';
}

export interface UsabilityComparison {
  totalEvaluations: number;
  comparison: {
    voiceInterface: {
      totalTrials: number;
      avgDurationSec: number;
      avgEaseScore: number;
      completionRatePct: number;
      avgAssistancePrompts: number;
    };
    standardGUI: {
      totalTrials: number;
      avgDurationSec: number;
      avgEaseScore: number;
      completionRatePct: number;
      avgAssistancePrompts: number;
    };
    timeReductionPercentWithVoice: number;
  };
  recentRuns: UsabilityRun[];
}
