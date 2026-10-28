import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Patient, Referral } from '../types';
import { addOfflinePatient, addOfflineReferral } from '../utils/indexedDB';
import {
  Users,
  Baby,
  Heart,
  AlertTriangle,
  Clock,
  Plus,
  Send,
  FileText,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  ArrowUpRight,
  Ambulance,
  RefreshCw,
  Search,
} from 'lucide-react';

interface AshaDashboardProps {
  isOnline: boolean;
  onRefreshSync: () => void;
}

export const AshaDashboard: React.FC<AshaDashboardProps> = ({ isOnline, onRefreshSync }) => {
  const { language } = useLanguage();
  const { currentUser } = useAuth();
  const { sendPushNotification, sendFcmAshaTaskAlert } = useNotifications();

  const [activeTab, setActiveTab] = useState<'patients' | 'maternal' | 'referrals' | 'reminders'>('maternal');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);

  // New Patient Form
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState('24');
  const [newGender, setNewGender] = useState<'Female' | 'Male' | 'Other'>('Female');
  const [newVillage, setNewVillage] = useState('Bilikere');
  const [newPhone, setNewPhone] = useState('+91 94801 ');
  const [newCategory, setNewCategory] = useState<'ANC_MATERNAL' | 'PEDIATRIC_IMMUNIZATION' | 'NCD_HYPERTENSION' | 'GENERAL'>('ANC_MATERNAL');
  const [newTrimester, setNewTrimester] = useState('2');
  const [newEdd, setNewEdd] = useState('2027-01-15');
  const [newHighRisk, setNewHighRisk] = useState(false);
  const [newHighRiskReason, setNewHighRiskReason] = useState('Mild anemia (Hb 9.8 g/dL)');
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [consentMethod, setConsentMethod] = useState<'digital_checkbox' | 'verbal_recorded' | 'written'>('verbal_recorded');

  // Referral Form
  const [refPatientName, setRefPatientName] = useState('');
  const [refAge, setRefAge] = useState('25');
  const [refVillage, setRefVillage] = useState('Bilikere');
  const [refFrom, setRefFrom] = useState('Bilikere Primary Health Centre (PHC)');
  const [refTo, setRefTo] = useState('Hunsur Taluk General Hospital');
  const [refReason, setRefReason] = useState('Suspected gestational hypertension, needs ultrasound scan');
  const [refUrgency, setRefUrgency] = useState<'EMERGENCY_CRITICAL' | 'URGENT_24H' | 'ROUTINE'>('URGENT_24H');
  const [refNeedsAmbulance, setRefNeedsAmbulance] = useState(false);

  // Action status message
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchAshaData();
  }, [isOnline]);

  const fetchAshaData = async () => {
    setIsLoading(true);
    try {
      const [patRes, refRes] = await Promise.all([
        fetch('/api/asha/patients?ashaId=KA-ASHA-042'),
        fetch('/api/referrals'),
      ]);

      if (patRes.ok) {
        const d = await patRes.json();
        setPatients(d.patients || []);
      }
      if (refRes.ok) {
        const r = await refRes.json();
        setReferrals(r.referrals || []);
      }
    } catch {
      // offline safe
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentConfirmed) {
      alert(language === 'kn' ? 'ದಯವಿಟ್ಟು ರೋಗಿಯ ಸಮ್ಮತಿಯನ್ನು ದೃಢೀಕರಿಸಿ.' : 'Please confirm patient consent before registering.');
      return;
    }

    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      name: newName,
      age: parseInt(newAge) || 25,
      gender: newGender,
      village: newVillage,
      contactPhone: newPhone,
      ashaWorkerId: 'KA-ASHA-042',
      consentRecorded: true,
      consentMethod,
      category: newCategory,
      ancTrimester: newCategory === 'ANC_MATERNAL' ? parseInt(newTrimester) : undefined,
      eddDate: newCategory === 'ANC_MATERNAL' ? newEdd : undefined,
      highRisk: newHighRisk,
      highRiskReason: newHighRisk ? newHighRiskReason : undefined,
      lastVisitDate: new Date().toISOString().split('T')[0],
      nextFollowUpDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      notes: `Registered with recorded ${consentMethod} consent by ASHA Sunita Bai.`,
    };

    if (!isOnline) {
      await addOfflinePatient(newPatient);
      setPatients((prev) => [newPatient, ...prev]);
      setBannerNotice(
        language === 'kn'
          ? 'ರೋಗಿ ವಿವರಗಳು ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಸಂಗ್ರಹವಾಗಿವೆ. ನೆಟ್‌ವರ್ಕ್ ಬಂದಾಗ ಸಿಂಕ್ ಆಗುತ್ತದೆ.'
          : 'Patient record saved offline. Will sync with health centre server on reconnection.'
      );
      onRefreshSync();
      setShowPatientModal(false);
      return;
    }

    try {
      const res = await fetch('/api/asha/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient),
      });

      if (res.ok) {
        const data = await res.json();
        setPatients((prev) => [data.patient, ...prev]);

        // Push alert for high risk registration
        if (newHighRisk) {
          await sendPushNotification({
            recipientRole: 'asha',
            recipientId: 'KA-ASHA-042',
            title: `High-Risk Maternal Tagged: ${newName}`,
            kannadaTitle: `ಅಪಾಯಕಾರಿ ಗರ್ಭಾವಸ್ಥೆ ಗುರುತಿಸಲಾಗಿದೆ: ${newName}`,
            body: `Reason: ${newHighRiskReason}. Scheduled follow-up in 7 days.`,
            kannadaBody: `ಕಾರಣ: ${newHighRiskReason}. 7 ದಿನಗಳಲ್ಲಿ ಮುಂದಿನ ತಪಾಸಣೆ ನಿಗದಿಯಾಗಿದೆ.`,
            type: 'NEW_REFERRAL',
          });
        }

        setBannerNotice(
          language === 'kn'
            ? 'ರೋಗಿಯ ನೋಂದಣಿ ಯಶಸ್ವಿಯಾಗಿದೆ (ಸಮ್ಮತಿಯನ್ನು ದಾಖಲಿಸಲಾಗಿದೆ).'
            : 'Patient successfully registered with verified consent.'
        );
        setShowPatientModal(false);
      }
    } catch {
      await addOfflinePatient(newPatient);
      setPatients((prev) => [newPatient, ...prev]);
      onRefreshSync();
      setShowPatientModal(false);
    }
  };

  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refPatientName || !refTo || !refReason) return;

    const newRef: Referral = {
      id: `ref-${Date.now()}`,
      patientId: `pat-${Date.now()}`,
      patientName: refPatientName,
      age: parseInt(refAge) || 25,
      village: refVillage,
      fromFacility: refFrom,
      toFacility: refTo,
      reason: refReason,
      urgency: refUrgency,
      status: 'REFERRED_PENDING_TRAVEL',
      requiresAmbulance: refNeedsAmbulance,
      ashaEscortName: 'Sunita Bai (ASHA)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!isOnline) {
      await addOfflineReferral(newRef);
      setReferrals((prev) => [newRef, ...prev]);
      setBannerNotice(
        language === 'kn'
          ? 'ರೆಫರಲ್ ಸ್ಲಿಪ್ ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ.'
          : 'Referral slip created offline. Queued for server sync.'
      );
      onRefreshSync();
      setShowReferralModal(false);
      return;
    }

    try {
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRef),
      });

      if (res.ok) {
        const data = await res.json();
        setReferrals((prev) => [data.referral, ...prev]);

        // Trigger FCM Push Notification to ASHA workers and PHC Doctor
        await sendFcmAshaTaskAlert({
          patientName: refPatientName,
          taskType: 'NEW_REFERRAL',
          details: `Referred from ${refFrom} to ${refTo}. Priority: ${refUrgency}. Ambulance: ${refNeedsAmbulance ? 'Yes (108)' : 'No'}.`,
        });

        setBannerNotice(
          language === 'kn'
            ? 'ರೆಫರಲ್ ಸ್ಲಿಪ್ ಯಶಸ್ವಿಯಾಗಿ ರಚಿಸಲಾಗಿದೆ. ಆಸ್ಪತ್ರೆಗೆ ಸೂಚನೆ ಕಳುಹಿಸಲಾಗಿದೆ.'
            : 'Referral slip generated. Push notification dispatched to health workers.'
        );
        setShowReferralModal(false);
      }
    } catch {
      await addOfflineReferral(newRef);
      setReferrals((prev) => [newRef, ...prev]);
      onRefreshSync();
      setShowReferralModal(false);
    }
  };

  const handleSendReminder = async (patient: Patient) => {
    try {
      const res = await fetch('/api/asha/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          type: 'Voice SMS & Push Alert',
        }),
      });

      if (res.ok) {
        await sendPushNotification({
          recipientRole: 'citizen',
          title: `Follow-up Reminder for ${patient.name}`,
          kannadaTitle: `${patient.name} ರವರಿಗೆ ತಪಾಸಣಾ ನೆನಪೋಲೆ`,
          body: `Your scheduled checkup is due at Bilikere PHC on ${patient.nextFollowUpDate}. Please visit during OPD hours.`,
          kannadaBody: `${patient.nextFollowUpDate} ರಂದು ಬಿಳಿಕೆರೆ ಪ್ರಾಥಮಿಕ ಕೇಂದ್ರದಲ್ಲಿ ನಿಮ್ಮ ತಪಾಸಣೆ ನಿಗದಿಯಾಗಿದೆ. ದಯವಿಟ್ಟು ಭೇಟಿ ನೀಡಿ.`,
          type: 'OVERDUE_FOLLOWUP',
        });

        setBannerNotice(
          language === 'kn'
            ? `ನೆನಪೋಲೆ ಸಂದೇಶವನ್ನು ${patient.name} (${patient.contactPhone}) ಗೆ ಯಶಸ್ವಿಯಾಗಿ ಕಳುಹಿಸಲಾಗಿದೆ.`
            : `Simulated reminder notification dispatched to ${patient.name}.`
        );
      }
    } catch {}
  };

  const highRiskPatients = patients.filter((p) => p.highRisk);
  const maternalPatients = patients.filter((p) => p.category === 'ANC_MATERNAL');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 to-teal-950 p-6 sm:p-8 rounded-3xl border border-teal-800/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              {language === 'kn'
                ? 'ಆಶಾ ಸಾಥಿ ಸಮುದಾಯ ಆರೋಗ್ಯ ಪೋರ್ಟಲ್'
                : 'ASHA Saathi Community Health Hub'}
            </span>
            <span className="bg-teal-950 px-2 py-0.5 rounded text-[10px] text-teal-300 border border-teal-800">
              ID: KA-ASHA-042
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {language === 'kn' ? 'ಆಶಾ ಸಾಥಿ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್' : 'ASHA Saathi Worker Portal'}
          </h2>
          <p className="text-slate-300 text-sm mt-1.5 max-w-2xl leading-relaxed">
            {language === 'kn'
              ? 'ಗ್ರಾಮದ ಗರ್ಭಿಣಿಯರ ಆರೈಕೆ, ಲಸಿಕಾ ವೇಳಾಪಟ್ಟಿ, ಅಪಾಯಕಾರಿ ಪ್ರಕರಣಗಳ ಮುನ್ನೆಚ್ಚರಿಕೆ ಮತ್ತು ಆಸ್ಪತ್ರೆ ರೆಫರಲ್ ನಿರ್ವಹಣೆ.'
              : 'Empowering authorized community health workers to track maternal stages, high-risk flags, send reminders, and create verified hospital referral slips.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowPatientModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'kn' ? 'ಹೊಸ ರೋಗಿ ನೋಂದಣಿ (ಸಮ್ಮತಿ)' : 'Register Patient (Consent)'}</span>
          </button>

          <button
            onClick={() => setShowReferralModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-900/30 transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>{language === 'kn' ? 'ರೆಫರಲ್ ಸ್ಲಿಪ್ ರಚಿಸಿ' : 'Generate Referral Slip'}</span>
          </button>
        </div>
      </div>

      {/* Synthetic Demo Data Ethical Disclaimer Banner */}
      <div className="p-3 bg-slate-900/90 border border-teal-800/40 rounded-2xl text-[11px] text-slate-300 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
          <span>
            <strong>{language === 'kn' ? 'ಗೌಪ್ಯತೆ ರಕ್ಷಣೆ:' : 'Ethical Data Notice:'}</strong>{' '}
            {language === 'kn'
              ? 'ಡೆಮೊದಲ್ಲಿ ಪ್ರದರ್ಶಿಸಲಾದ ರೋಗಿಗಳ ವಿವರಗಳು ಸಾಂಕೇತಿಕ (Synthetic). ಯಾವುದೇ ನೈಜ ವೈಯಕ್ತಿಕ ವಿವರಗಳು ಬಹಿರಂಗವಾಗಿಲ್ಲ.'
              : 'Displayed patient records are synthetic demonstration data for hackathon evaluation with explicit consent protocol simulation.'}
          </span>
        </span>
        <button
          onClick={fetchAshaData}
          className="text-teal-400 hover:text-teal-300 flex items-center gap-1 font-bold shrink-0 ml-3 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>{language === 'kn' ? 'ನವೀಕರಿಸಿ' : 'Refresh'}</span>
        </button>
      </div>

      {bannerNotice && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-700/60 rounded-2xl text-xs sm:text-sm text-emerald-200 flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{bannerNotice}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block font-semibold uppercase">
            {language === 'kn' ? 'ನೋಂದಾಯಿತ ರೋಗಿಗಳು' : 'Total Registered'}
          </span>
          <span className="text-2xl font-black text-white mt-1 block">
            {patients.length}
          </span>
          <span className="text-[10px] text-teal-400 mt-0.5 block">
            100% Informed Consent
          </span>
        </div>

        <div className="bg-slate-900 border border-rose-900/40 p-4 rounded-2xl">
          <span className="text-[11px] text-rose-300 block font-semibold uppercase">
            {language === 'kn' ? 'ಅಪಾಯಕಾರಿ ಗರ್ಭಾವಸ್ಥೆ' : 'High-Risk Maternal'}
          </span>
          <span className="text-2xl font-black text-rose-400 mt-1 block">
            {highRiskPatients.length}
          </span>
          <span className="text-[10px] text-rose-300/80 mt-0.5 block">
            Weekly monitoring active
          </span>
        </div>

        <div className="bg-slate-900 border border-amber-900/40 p-4 rounded-2xl">
          <span className="text-[11px] text-amber-300 block font-semibold uppercase">
            {language === 'kn' ? 'ಗರ್ಭಿಣಿಯರ ಆರೈಕೆ (ANC)' : 'Maternal ANC Tracking'}
          </span>
          <span className="text-2xl font-black text-amber-400 mt-1 block">
            {maternalPatients.length}
          </span>
          <span className="text-[10px] text-amber-300/80 mt-0.5 block">
            PMMVY & IFA distribution
          </span>
        </div>

        <div className="bg-slate-900 border border-teal-900/40 p-4 rounded-2xl">
          <span className="text-[11px] text-teal-300 block font-semibold uppercase">
            {language === 'kn' ? 'ಆಸ್ಪತ್ರೆ ರೆಫರಲ್‌ಗಳು' : 'Active Referrals'}
          </span>
          <span className="text-2xl font-black text-teal-400 mt-1 block">
            {referrals.length}
          </span>
          <span className="text-[10px] text-teal-300/80 mt-0.5 block">
            Taluk & District level
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-2 sm:space-x-4">
        {[
          { id: 'maternal', label: language === 'kn' ? '🤰 ಗರ್ಭಿಣಿಯರ ಆರೈಕೆ (ANC)' : '🤰 Maternal Tracking' },
          { id: 'patients', label: language === 'kn' ? '👥 ರೋಗಿಗಳ ಪಟ್ಟಿ & ಸಮ್ಮತಿ' : '👥 Patient Registry' },
          { id: 'referrals', label: language === 'kn' ? '🏥 ರೆಫರಲ್ ಟ್ರ್ಯಾಕಿಂಗ್' : '🏥 Hospital Referrals' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 px-2 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer ${
              activeTab === tab.id
                ? 'border-teal-400 text-teal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Maternal Tracking */}
      {activeTab === 'maternal' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {maternalPatients.map((pat) => (
              <div
                key={pat.id}
                className={`p-5 rounded-2xl border transition-all ${
                  pat.highRisk
                    ? 'bg-rose-950/30 border-rose-800/60 shadow-lg shadow-rose-950/20'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-black text-white text-base sm:text-lg">
                      {pat.name} ({pat.age} yrs)
                    </h4>
                    <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <span>{pat.village} Village</span> • <span>{pat.contactPhone}</span>
                    </span>
                  </div>

                  {pat.highRisk ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/50 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span>{language === 'kn' ? 'ಅಪಾಯಕಾರಿ (High Risk)' : 'High Risk Tag'}</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Normal Progress
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-slate-950/60 rounded-xl text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      {language === 'kn' ? 'ತ್ರೈಮಾಸಿಕ ಹಂತ:' : 'ANC Trimester:'}
                    </span>
                    <span className="font-extrabold text-teal-300">
                      {pat.ancTrimester ? `${pat.ancTrimester}rd Trimester` : 'Registered'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      {language === 'kn' ? 'ನಿರೀಕ್ಷಿತ ಹೆರಿಗೆ ದಿನ:' : 'EDD Date:'}
                    </span>
                    <span className="font-extrabold text-white">
                      {pat.eddDate || '2026-11-20'}
                    </span>
                  </div>
                </div>

                {pat.highRiskReason && (
                  <div className="p-2.5 bg-rose-950/50 rounded-xl border border-rose-800/40 text-xs text-rose-200 mb-3">
                    <strong>{language === 'kn' ? 'ಅಪಾಯದ ಲಕ್ಷಣ:' : 'Clinical Alert:'}</strong> {pat.highRiskReason}
                  </div>
                )}

                <div className="text-xs text-slate-300 mb-4">
                  <span className="font-semibold text-slate-400 block mb-0.5">
                    {language === 'kn' ? 'ಆಶಾ ಟಿಪ್ಪಣಿ:' : 'ASHA Care Notes:'}
                  </span>
                  <p className="italic">"{pat.notes}"</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    Next Due: <strong>{pat.nextFollowUpDate}</strong>
                  </span>

                  <button
                    onClick={() => handleSendReminder(pat)}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{language === 'kn' ? 'ನೆನಪೋಲೆ ಕಳುಹಿಸಿ' : 'Send Reminder'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Patient Registry */}
      {activeTab === 'patients' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase">
                {patients.length} {language === 'kn' ? 'ನೋಂದಾಯಿತ ಗ್ರಾಮಸ್ಥರು' : 'Registered Village Residents'}
              </span>
              <span className="text-xs text-teal-400 font-semibold">
                Catchment: Bilikere PHC Sector 4
              </span>
            </div>

            <div className="divide-y divide-slate-800/80">
              {patients.map((pat) => (
                <div key={pat.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-white text-sm sm:text-base">{pat.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                        {pat.category.replace('_', ' ')}
                      </span>
                      {pat.highRisk && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-950 text-rose-400 border border-rose-800">
                          High Risk
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3">
                      <span>{pat.age} yrs • {pat.gender}</span>
                      <span>Village: {pat.village}</span>
                      <span>Phone: {pat.contactPhone}</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Consent: {pat.consentMethod}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSendReminder(pat)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-teal-900/60 text-teal-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{language === 'kn' ? 'ನೆನಪೋಲೆ' : 'Alert'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Hospital Referrals */}
      {activeTab === 'referrals' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {referrals.map((ref) => (
              <div
                key={ref.id}
                className="bg-slate-900 border border-slate-800 hover:border-teal-700/50 rounded-2xl p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-black text-white text-base">
                      {ref.patientName} ({ref.age} yrs)
                    </h4>
                    <span className="text-xs text-slate-400">{ref.village} Village</span>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                    ref.urgency === 'EMERGENCY_CRITICAL'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500'
                  }`}>
                    {ref.urgency.replace('_', ' ')}
                  </span>
                </div>

                <div className="p-3 bg-slate-950/70 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400 font-semibold">{language === 'kn' ? 'ಮೂಲ ಕೇಂದ್ರ:' : 'From:'}</span>
                    <span className="font-bold text-white">{ref.fromFacility}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400 font-semibold">{language === 'kn' ? 'ಉಲ್ಲೇಖಿತ ಆಸ್ಪತ್ರೆ:' : 'Referred To:'}</span>
                    <span className="font-bold text-teal-300">{ref.toFacility}</span>
                  </div>
                  {ref.requiresAmbulance && (
                    <div className="flex items-center gap-1.5 text-rose-400 font-bold mt-1">
                      <Ambulance className="w-3.5 h-3.5" />
                      <span>{language === 'kn' ? '108 ಆಂಬುಲೆನ್ಸ್ ಸಾರಿಗೆ ಅಗತ್ಯವಿದೆ' : '108 Ambulance Transit Requested'}</span>
                    </div>
                  )}
                </div>

                <div className="text-xs text-slate-300">
                  <strong>{language === 'kn' ? 'ಕಾರಣ:' : 'Clinical Reason:'}</strong> {ref.reason}
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Status: <strong className="text-emerald-400">{ref.status.replace(/_/g, ' ')}</strong></span>
                  <span>Escort: {ref.ashaEscortName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patient Registration Modal with Explicit Informed Consent */}
      {showPatientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-teal-600/50 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-950 to-slate-900 border-b border-teal-800/40 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-400" />
                <h3 className="font-black text-base sm:text-lg">
                  {language === 'kn' ? 'ಹೊಸ ರೋಗಿ ನೋಂದಣಿ & ಸಮ್ಮತಿ' : 'Register Patient with Consent'}
                </h3>
              </div>
              <button
                onClick={() => setShowPatientModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterPatient} className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    {language === 'kn' ? 'ಪೂರ್ಣ ಹೆಸರು:' : 'Full Name:'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Roopa Bai"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    {language === 'kn' ? 'ವಯಸ್ಸು:' : 'Age:'}
                  </label>
                  <input
                    type="number"
                    required
                    value={newAge}
                    onChange={(e) => setNewAge(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    {language === 'kn' ? 'ಗ್ರಾಮ / ಬಡಾವಣೆ:' : 'Village:'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newVillage}
                    onChange={(e) => setNewVillage(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    {language === 'kn' ? 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ:' : 'Contact Phone:'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  {language === 'kn' ? 'ಆರೋಗ್ಯ ವರ್ಗ:' : 'Health Category:'}
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-teal-500"
                >
                  <option value="ANC_MATERNAL">Antenatal Care (Maternal ANC)</option>
                  <option value="PEDIATRIC_IMMUNIZATION">Pediatric Immunization (Child)</option>
                  <option value="NCD_HYPERTENSION">NCD (Hypertension / Diabetes)</option>
                  <option value="GENERAL">General Public Care</option>
                </select>
              </div>

              {newCategory === 'ANC_MATERNAL' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-teal-950/40 rounded-xl border border-teal-800/40">
                  <div>
                    <label className="block text-teal-300 font-bold mb-1">Trimester (1, 2, 3):</label>
                    <select
                      value={newTrimester}
                      onChange={(e) => setNewTrimester(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                    >
                      <option value="1">1st Trimester</option>
                      <option value="2">2nd Trimester</option>
                      <option value="3">3rd Trimester</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-teal-300 font-bold mb-1">EDD Date:</label>
                    <input
                      type="date"
                      value={newEdd}
                      onChange={(e) => setNewEdd(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                    />
                  </div>
                </div>
              )}

              {/* High risk toggle */}
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="highRiskCheck"
                    checked={newHighRisk}
                    onChange={(e) => setNewHighRisk(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded"
                  />
                  <label htmlFor="highRiskCheck" className="font-bold text-rose-300 cursor-pointer">
                    {language === 'kn' ? 'ಅಪಾಯಕಾರಿ ಪ್ರಕರಣ ಎಂದು ಗುರುತಿಸಿ (High-Risk Tag)' : 'Flag as High-Risk Patient'}
                  </label>
                </div>
                {newHighRisk && (
                  <input
                    type="text"
                    value={newHighRiskReason}
                    onChange={(e) => setNewHighRiskReason(e.target.value)}
                    placeholder="Reason (e.g. BP 145/95 or Gestational Diabetes)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs"
                  />
                )}
              </div>

              {/* MANDATORY CONSENT CLAUSE */}
              <div className="p-3.5 bg-emerald-950/50 rounded-xl border border-emerald-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-emerald-300 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    {language === 'kn' ? 'ಮಾಹಿತಿ ಸಮ್ಮತಿ ನಿಯಮ (Mandatory Consent)' : 'Informed Consent Clause'}
                  </span>
                  <select
                    value={consentMethod}
                    onChange={(e) => setConsentMethod(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 text-emerald-200 text-xs rounded px-2 py-0.5"
                  >
                    <option value="verbal_recorded">Verbal Recorded Consent</option>
                    <option value="digital_checkbox">Digital Checkbox</option>
                    <option value="written">Written Consent Slip</option>
                  </select>
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="consentBox"
                    required
                    checked={consentConfirmed}
                    onChange={(e) => setConsentConfirmed(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 rounded mt-0.5"
                  />
                  <label htmlFor="consentBox" className="text-[11px] text-slate-200 cursor-pointer leading-tight">
                    {language === 'kn'
                      ? 'ರೋಗಿಯು ಅಥವಾ ಅವರ ಕುಟುಂಬದವರು ತಮ್ಮ ಆರೋಗ್ಯ ವಿವರಗಳನ್ನು ಆಶಾ ಸಾಥಿ ವೇದಿಕೆಯಲ್ಲಿ ತಪಾಸಣೆ ಮತ್ತು ಆಸ್ಪತ್ರೆ ರೆಫರಲ್‌ಗಾಗಿ ಬಳಸಲು ಸ್ಪಷ್ಟ ಸಮ್ಮತಿ ನೀಡಿದ್ದಾರೆ.'
                      : 'I certify that the patient/guardian has voluntarily provided informed consent to record their health data for community follow-up and clinical care under NHM guidelines.'}
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPatientModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!consentConfirmed}
                  className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  Register Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Referral Slip Creation Modal */}
      {showReferralModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-rose-600/50 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-950 to-slate-900 border-b border-rose-800/40 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-rose-400" />
                <h3 className="font-black text-base sm:text-lg">
                  {language === 'kn' ? 'ಆಸ್ಪತ್ರೆ ರೆಫರಲ್ ಸ್ಲಿಪ್ ರಚನೆ' : 'Clinical Referral Slip Generator'}
                </h3>
              </div>
              <button
                onClick={() => setShowReferralModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReferral} className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-200">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Patient Full Name:</label>
                <input
                  type="text"
                  required
                  value={refPatientName}
                  onChange={(e) => setRefPatientName(e.target.value)}
                  placeholder="e.g. Kavitha M. Gowda"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Origin (From Facility):</label>
                  <input
                    type="text"
                    required
                    value={refFrom}
                    onChange={(e) => setRefFrom(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Target Hospital (To):</label>
                  <select
                    value={refTo}
                    onChange={(e) => setRefTo(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-rose-500"
                  >
                    <option value="Hunsur Taluk General Hospital">Hunsur Taluk General Hospital</option>
                    <option value="Mysuru District Hospital (K.R. Hospital)">Mysuru District Hospital (K.R.)</option>
                    <option value="Hullahalli Community Health Centre (CHC)">Hullahalli CHC</option>
                    <option value="Mandya District Teaching Hospital">Mandya District Hospital</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Referral Reason / Diagnosis Note:</label>
                <textarea
                  rows={2}
                  required
                  value={refReason}
                  onChange={(e) => setRefReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Clinical Urgency:</label>
                  <select
                    value={refUrgency}
                    onChange={(e) => setRefUrgency(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="URGENT_24H">Urgent (Within 24 Hours)</option>
                    <option value="EMERGENCY_CRITICAL">Critical Emergency (Immediate 108)</option>
                    <option value="ROUTINE">Routine Specialist Review</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <div className="flex items-center gap-2 p-2.5 bg-slate-800 rounded-xl border border-slate-700">
                    <input
                      type="checkbox"
                      id="needsAmb"
                      checked={refNeedsAmbulance}
                      onChange={(e) => setRefNeedsAmbulance(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded"
                    />
                    <label htmlFor="needsAmb" className="text-xs text-rose-300 font-bold cursor-pointer">
                      Request 108 Ambulance
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReferralModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition"
                >
                  Issue Referral Slip & Notify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
