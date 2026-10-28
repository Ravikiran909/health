export type Language = 'kn' | 'en';

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
