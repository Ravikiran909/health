import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Appointment, Facility } from '../types';
import { addOfflineAppointment } from '../utils/indexedDB';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Phone,
  FileText,
  User,
  ShieldCheck,
  ChevronRight,
  XCircle,
} from 'lucide-react';

interface AppointmentsViewProps {
  isOnline: boolean;
  onRefreshSync: () => void;
  preselectedFacility?: Facility | null;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  isOnline,
  onRefreshSync,
  preselectedFacility,
}) => {
  const { language, t } = useLanguage();
  const { currentUser, isAsha } = useAuth();
  const { sendPushNotification, sendFcmAppointmentReminder, sendFcmAshaTaskAlert } = useNotifications();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [showFormModal, setShowFormModal] = useState<boolean>(Boolean(preselectedFacility));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Form state
  const [patientName, setPatientName] = useState(currentUser.name.split(' (')[0]);
  const [patientPhone, setPatientPhone] = useState(currentUser.phone);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(
    preselectedFacility?.id || 'fac-hun-02'
  );
  const [department, setDepartment] = useState('Antenatal Care (ANC) Clinic');
  const [preferredDate, setPreferredDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [slotTime, setSlotTime] = useState('10:00 AM - 11:30 AM');
  const [reason, setReason] = useState('Routine Maternal Checkup & Ultrasound');
  const [ashaAssisted, setAshaAssisted] = useState(isAsha);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
    fetchFacilitiesList();
  }, [isOnline]);

  useEffect(() => {
    if (preselectedFacility) {
      setSelectedFacilityId(preselectedFacility.id);
      setShowFormModal(true);
    }
  }, [preselectedFacility]);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/appointments');
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments || []);
      }
    } catch {
      // offline safe
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFacilitiesList = async () => {
    try {
      const res = await fetch('/api/facilities');
      if (res.ok) {
        const data = await res.json();
        setFacilities(data.facilities || []);
      }
    } catch {}
  };

  const handleSubmitAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !patientPhone || !selectedFacilityId) return;

    setSubmitting(true);
    setStatusMessage(null);

    const facility = facilities.find((f) => f.id === selectedFacilityId);
    const facilityName = facility ? facility.name : 'Primary Health Centre';

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      patientName,
      patientPhone,
      facilityId: selectedFacilityId,
      facilityName,
      facilityType: facility ? facility.type : 'PHC',
      department,
      preferredDate,
      slotTime,
      reason,
      status: 'REQUESTED_PENDING_CONFIRMATION',
      createdOffline: !isOnline,
      createdAt: new Date().toISOString(),
      ashaAssisted,
      ashaWorkerId: ashaAssisted ? 'KA-ASHA-042' : undefined,
    };

    if (!isOnline) {
      // Save into IndexedDB offline queue
      await addOfflineAppointment(newAppointment);
      setAppointments((prev) => [newAppointment, ...prev]);
      setStatusMessage(
        language === 'kn'
          ? 'ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ. ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕ ಬಂದಾಗ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಕಳುಹಿಸಲಾಗುತ್ತದೆ.'
          : 'Saved in offline storage. Will automatically sync when connection returns.'
      );
      onRefreshSync();
      setSubmitting(false);
      setShowFormModal(false);
      return;
    }

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAppointment),
      });

      if (res.ok) {
        const data = await res.json();
        setAppointments((prev) => [data.appointment, ...prev]);

        // Dispatch FCM Push Notification reminder to citizen device
        await sendFcmAppointmentReminder({
          patientName,
          facilityName,
          department,
        });

        // Also notify ASHA worker via FCM if assisted
        if (ashaAssisted) {
          await sendFcmAshaTaskAlert({
            patientName,
            taskType: 'NEW_REFERRAL',
            details: `Assisted appointment submitted for ${facilityName} (${department}).`,
          });
        }

        setStatusMessage(
          language === 'kn'
            ? 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ವಿನಂತಿ ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಕೆಯಾಗಿದೆ! (ಪರಿಶೀಲನೆ ಹಂತದಲ್ಲಿದೆ)'
            : 'Appointment request submitted successfully! (Pending medical officer review)'
        );
        setShowFormModal(false);
      }
    } catch {
      await addOfflineAppointment(newAppointment);
      setAppointments((prev) => [newAppointment, ...prev]);
      onRefreshSync();
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAppointment = async (id: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: 'CANCELLED' } : a))
        );
      }
    } catch {}
  };

  const departmentsList = [
    'Antenatal Care (ANC) Clinic',
    'Child Immunization / VHND',
    'General OPD Consultation',
    'NCD Screening (Diabetes & BP)',
    'Ultrasound Scan & Laboratory',
    'Eye & Dental Care',
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Request Button */}
      <div className="bg-gradient-to-br from-slate-900 to-teal-950 p-6 sm:p-8 rounded-3xl border border-teal-800/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider mb-2">
            <Calendar className="w-4 h-4" />
            <span>{t('card_book_badge')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {t('appointments_title')}
          </h2>
          <p className="text-slate-300 text-sm mt-1.5 max-w-2xl leading-relaxed">
            {t('appointments_desc')}
          </p>
        </div>

        <button
          onClick={() => setShowFormModal(true)}
          className="px-5 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-teal-500/20 transition active:scale-95 flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>{t('request_new_appointment')}</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-700/60 rounded-2xl text-xs sm:text-sm text-emerald-200 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Appointment History List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {language === 'kn' ? 'ದಾಖಲಾದ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು:' : 'Your Active & Past Requests:'}
          </span>
          <button
            onClick={fetchAppointments}
            className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{language === 'kn' ? 'ನವೀಕರಿಸಿ' : 'Refresh'}</span>
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-teal-400 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-teal-400 border-t-transparent animate-spin" />
            <span className="text-sm font-medium">{language === 'kn' ? 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...' : 'Loading appointments...'}</span>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-10 text-center bg-slate-900/60 rounded-3xl border border-slate-800 text-slate-400">
            <p className="font-semibold text-sm">
              {language === 'kn' ? 'ಯಾವುದೇ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ವಿನಂತಿಗಳಿಲ್ಲ.' : 'No appointment requests found.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((apt) => {
              const isPending = apt.status === 'REQUESTED_PENDING_CONFIRMATION';
              const isConfirmed = apt.status === 'CONFIRMED';
              const isCancelled = apt.status === 'CANCELLED';

              return (
                <div
                  key={apt.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 transition-all hover:border-teal-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-white text-base sm:text-lg">
                        {apt.patientName}
                      </span>

                      {/* Status Badges */}
                      {isPending && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{language === 'kn' ? 'ವಿನಂತಿ ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ (Unconfirmed)' : 'Requested (Pending Review)'}</span>
                        </span>
                      )}

                      {isConfirmed && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>{language === 'kn' ? 'ದೃಢಪಟ್ಟಿದೆ (Confirmed)' : 'Confirmed Slot'}</span>
                        </span>
                      )}

                      {isCancelled && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          {language === 'kn' ? 'ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ' : 'Cancelled'}
                        </span>
                      )}

                      {apt.createdOffline && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
                          Offline Queued
                        </span>
                      )}

                      {apt.ashaAssisted && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-800">
                          ASHA Assisted
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-teal-300 font-semibold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-teal-400" />
                      <span>{apt.facilityName} ({apt.facilityType})</span>
                    </div>

                    <div className="text-xs text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span><strong>{language === 'kn' ? 'ವಿಭಾಗ:' : 'Dept:'}</strong> {apt.department}</span>
                      <span><strong>{language === 'kn' ? 'ದಿನಾಂಕ:' : 'Date:'}</strong> {apt.preferredDate}</span>
                      <span><strong>{language === 'kn' ? 'ಸಮಯ:' : 'Time Slot:'}</strong> {apt.slotTime}</span>
                    </div>

                    <div className="text-xs text-slate-400 italic">
                      "{apt.reason}"
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <span className="text-[11px] text-slate-500">
                      ID: {apt.id.slice(0, 10)}
                    </span>

                    {!isCancelled && (
                      <button
                        onClick={() => handleCancelAppointment(apt.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-400 text-xs font-semibold border border-slate-700 transition"
                      >
                        {language === 'kn' ? 'ರದ್ದುಗೊಳಿಸಿ' : 'Cancel Request'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Appointment Request Modal Dialog */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-teal-600/50 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-950 to-slate-900 border-b border-teal-800/40 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-teal-400" />
                <h3 className="font-extrabold text-base sm:text-lg">
                  {t('request_new_appointment')}
                </h3>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAppointment} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-200">
              {/* Facility Selection */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  {t('facility_label')}:
                </label>
                <select
                  value={selectedFacilityId}
                  onChange={(e) => setSelectedFacilityId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-teal-500"
                >
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {language === 'kn' ? f.kannadaName : f.name} ({f.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Patient Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    {t('patient_name')}:
                  </label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    {t('phone_number')}:
                  </label>
                  <input
                    type="tel"
                    required
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  {t('department_label')}:
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-teal-500"
                >
                  {departmentsList.map((dept, idx) => (
                    <option key={idx} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Date & Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    {language === 'kn' ? 'ಆದ್ಯತೆಯ ದಿನಾಂಕ:' : 'Preferred Date:'}
                  </label>
                  <input
                    type="date"
                    required
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    {language === 'kn' ? 'ಆದ್ಯತೆಯ ಸಮಯ:' : 'Preferred Slot:'}
                  </label>
                  <select
                    value={slotTime}
                    onChange={(e) => setSlotTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-teal-500"
                  >
                    <option value="09:00 AM - 10:30 AM">09:00 AM - 10:30 AM</option>
                    <option value="10:30 AM - 12:00 PM">10:30 AM - 12:00 PM</option>
                    <option value="12:00 PM - 01:30 PM">12:00 PM - 01:30 PM</option>
                    <option value="02:30 PM - 04:00 PM">02:30 PM - 04:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  {language === 'kn' ? 'ಭೇಟಿಯ ಕಾರಣ / ಲಕ್ಷಣಗಳು:' : 'Reason / Symptoms:'}
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={language === 'kn' ? 'ಉದಾಹರಣೆಗೆ: ರಕ್ತದೊತ್ತಡ ತಪಾಸಣೆ, 3ನೇ ತ್ರೈಮಾಸಿಕ ಸ್ಕ್ಯಾನ್...' : 'e.g., Routine prenatal scan, blood pressure monitoring...'}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-teal-500"
                />
              </div>

              {/* ASHA assisted checkbox */}
              <div className="flex items-center gap-2 p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                <input
                  type="checkbox"
                  id="ashaAssist"
                  checked={ashaAssisted}
                  onChange={(e) => setAshaAssisted(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="ashaAssist" className="text-xs text-slate-300 cursor-pointer">
                  {language === 'kn'
                    ? 'ಆಶಾ ಕಾರ್ಯಕರ್ತೆಯರ ಸಹಯೋಗದೊಂದಿಗೆ ದಾಖಲಿಸಲಾಗಿದೆ (ASHA Assisted)'
                    : 'Assisted by village ASHA worker (Sunita Bai - KA-ASHA-042)'}
                </label>
              </div>

              <div className="p-3 bg-teal-950/40 border border-teal-800/40 rounded-xl text-[11px] text-teal-300">
                ℹ️ {language === 'kn'
                  ? 'ಗಮನಿಸಿ: ಇದು ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ವಿನಂತಿಯಾಗಿದ್ದು, ಪ್ರಾಥಮಿಕ ಕೇಂದ್ರದ ಸಿಬ್ಬಂದಿ ಪರಿಶೀಲಿಸಿ ದೃಢಪಡಿಸುತ್ತಾರೆ.'
                  : 'Notice: This request is registered as Pending Confirmation until acknowledged by facility staff.'}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  {language === 'kn' ? 'ರದ್ದು' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting
                    ? (language === 'kn' ? 'ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...' : 'Submitting...')
                    : (language === 'kn' ? 'ವಿನಂತಿ ಸಲ್ಲಿಸಿ' : 'Submit Appointment Request')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
