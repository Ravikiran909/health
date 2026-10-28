import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Facility } from '../types';
import { cacheFacilities, getCachedFacilities } from '../utils/indexedDB';
import {
  Search,
  MapPin,
  Phone,
  Clock,
  Bed,
  UserCheck,
  Navigation,
  Calendar,
  Filter,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface HospitalFinderProps {
  onBookFacility: (facility: Facility) => void;
  isOnline: boolean;
}

export const HospitalFinder: React.FC<HospitalFinderProps> = ({ onBookFacility, isOnline }) => {
  const { language, t } = useLanguage();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedTaluk, setSelectedTaluk] = useState<string>('ALL');
  const [only24x7, setOnly24x7] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFacilities();
  }, [searchQuery, selectedType, selectedTaluk, only24x7, isOnline]);

  const fetchFacilities = async () => {
    setIsLoading(true);
    try {
      if (isOnline) {
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (selectedType !== 'ALL') params.append('serviceType', selectedType);
        if (selectedTaluk !== 'ALL') params.append('taluk', selectedTaluk);
        if (only24x7) params.append('openNow', 'true');

        const res = await fetch(`/api/facilities?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setFacilities(data.facilities || []);
          cacheFacilities(data.facilities || []);
        }
      } else {
        // Retrieve from IndexedDB cache
        const cached = await getCachedFacilities();
        let filtered = cached;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(
            (f) =>
              f.name.toLowerCase().includes(q) ||
              f.kannadaName.includes(q) ||
              f.villageOrTown.toLowerCase().includes(q)
          );
        }
        if (selectedType !== 'ALL') filtered = filtered.filter((f) => f.type === selectedType);
        if (only24x7) filtered = filtered.filter((f) => f.isOpen24x7);
        setFacilities(filtered);
      }
    } catch {
      const cached = await getCachedFacilities();
      setFacilities(cached);
    } finally {
      setIsLoading(false);
    }
  };

  const facilityTypes = [
    { id: 'ALL', label: language === 'kn' ? 'ಎಲ್ಲಾ ಸೌಲಭ್ಯಗಳು' : 'All Facilities' },
    { id: 'PHC', label: language === 'kn' ? 'ಪ್ರಾಥಮಿಕ ಕೇಂದ್ರ (PHC)' : 'PHC (Primary Centre)' },
    { id: 'CHC', label: language === 'kn' ? 'ಸಮುದಾಯ ಕೇಂದ್ರ (CHC)' : 'CHC (Community Centre)' },
    { id: 'TALUK_HOSPITAL', label: language === 'kn' ? 'ತಾಲೂಕು ಆಸ್ಪತ್ರೆ' : 'Taluk Hospital' },
    { id: 'DISTRICT_HOSPITAL', label: language === 'kn' ? 'ಜಿಲ್ಲಾ ಆಸ್ಪತ್ರೆ' : 'District Hospital' },
    { id: 'MATERNAL_CARE', label: language === 'kn' ? 'ತಾಯಿ & ಮಕ್ಕಳ ಕೇಂದ್ರ' : 'Maternal Center' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="bg-gradient-to-br from-slate-900 to-teal-950 p-6 sm:p-8 rounded-3xl border border-teal-800/40 shadow-xl">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider mb-2">
            <MapPin className="w-4 h-4" />
            <span>
              {language === 'kn'
                ? 'ಕರ್ನಾಟಕ ಸಾರ್ವಜನಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರಗಳ ಮಾಹಿತಿ'
                : 'Karnataka Public Healthcare Network'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {language === 'kn'
              ? 'ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆ & ಪ್ರಾಥಮಿಕ ಕೇಂದ್ರ (PHC) ಹುಡುಕಿ'
              : 'Find Nearby PHCs, CHCs & Hospitals'}
          </h2>
          <p className="text-slate-300 text-sm mt-1.5 leading-relaxed">
            {language === 'kn'
              ? 'ಗ್ರಾಮ, ತಾಲೂಕು ಅಥವಾ ವೈದ್ಯಕೀಯ ಸೇವೆಗಳ ಆಧಾರದ ಮೇಲೆ ಹುಡುಕಿ. 24/7 ಹೆರಿಗೆ ಸೌಲಭ್ಯ, ತುರ್ತು ಚಿಕಿತ್ಸೆ ಮತ್ತು ದೂರದ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.'
              : 'Search verified government healthcare centres. Check 24/7 delivery services, doctor availability, distance, and direct emergency contacts.'}
          </p>
        </div>

        {/* Search input */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-teal-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search_placeholder')}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-800/90 border border-slate-700 focus:border-teal-500 rounded-2xl text-white text-sm placeholder-slate-400 outline-none shadow-inner"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setOnly24x7(!only24x7)}
              className={`px-4 py-3.5 rounded-2xl text-xs sm:text-sm font-bold border transition flex items-center gap-2 cursor-pointer ${
                only24x7
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{language === 'kn' ? '24/7 ಹೆರಿಗೆ & ತುರ್ತು ಮಾತ್ರ' : '24/7 Delivery & Emergency Only'}</span>
            </button>
          </div>
        </div>

        {/* Filter chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {facilityTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedType === type.id
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Facilities Count & Offline notice */}
      <div className="flex items-center justify-between px-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {facilities.length} {language === 'kn' ? 'ಸೌಲಭ್ಯಗಳು ದೊರೆತಿವೆ' : 'Facilities Found'}
        </span>
        {!isOnline && (
          <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{language === 'kn' ? 'ಆಫ್‌ಲೈನ್ ಕ್ಯಾಶ್‌ನಿಂದ ತೋರಿಸಲಾಗುತ್ತಿದೆ' : 'Showing offline cached facilities'}</span>
          </span>
        )}
      </div>

      {/* Facilities Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-teal-400 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-teal-400 border-t-transparent animate-spin" />
          <span className="text-sm font-medium">{t('loading')}</span>
        </div>
      ) : facilities.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/50 rounded-3xl border border-slate-800 text-slate-400">
          <p className="font-semibold text-base">
            {language === 'kn'
              ? 'ಯಾವುದೇ ಸೌಲಭ್ಯಗಳು ಕಂಡುಬಂದಿಲ್ಲ. ಹುಡುಕಾಟ ಪದಗಳನ್ನು ಬದಲಿಸಿ.'
              : 'No matching healthcare facilities found. Try broadening your search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {facilities.map((fac) => {
            const displayName = language === 'kn' ? fac.kannadaName : fac.name;
            const displayAddress = language === 'kn' ? fac.kannadaAddress : fac.address;
            const servicesList = language === 'kn' ? fac.kannadaServices : fac.services;

            return (
              <div
                key={fac.id}
                className="bg-slate-900 border border-slate-800 hover:border-teal-600/50 rounded-3xl p-5 sm:p-6 transition-all hover:shadow-xl hover:shadow-teal-950/40 flex flex-col justify-between"
              >
                <div>
                  {/* Card top badge row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                        {fac.type.replace('_', ' ')}
                      </span>
                      {fac.isOpen24x7 && (
                        <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>24/7 Normal Delivery</span>
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-black text-teal-400 bg-teal-950/60 px-2.5 py-1 rounded-xl border border-teal-800/40">
                      ~{fac.distanceKm} km
                    </span>
                  </div>

                  {/* Title & Location */}
                  <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                    {displayName}
                  </h3>
                  {language === 'kn' && (
                    <p className="text-xs text-slate-400 mt-0.5 font-sans">{fac.name}</p>
                  )}

                  <div className="mt-2 flex items-start gap-1.5 text-xs text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                    <span>{displayAddress}</span>
                  </div>

                  {/* Key Metrics: Beds, Doctors, Hours */}
                  <div className="mt-4 grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        {language === 'kn' ? 'ಹಾಸಿಗೆಗಳು' : 'Beds'}
                      </span>
                      <span className="font-extrabold text-white text-sm flex items-center gap-1">
                        <Bed className="w-3.5 h-3.5 text-teal-400" />
                        {fac.bedCount}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        {language === 'kn' ? 'ವೈದ್ಯರು' : 'Doctors'}
                      </span>
                      <span className="font-extrabold text-emerald-400 text-sm flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" />
                        {fac.availableDoctors}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        {language === 'kn' ? '108 ಸಂಪರ್ಕ' : '108 Tie-up'}
                      </span>
                      <span className="font-extrabold text-rose-400 text-sm">
                        {fac.emergency108Available ? 'Active' : 'No'}
                      </span>
                    </div>
                  </div>

                  {/* Opening hours */}
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-teal-200">
                    <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>{fac.openingHours}</span>
                  </div>

                  {/* Services tags */}
                  <div className="mt-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      {language === 'kn' ? 'ಲಭ್ಯವಿರುವ ಪ್ರಮುಖ ಸೇವೆಗಳು:' : 'Available Services:'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {servicesList.slice(0, 4).map((service, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-[11px] text-slate-200"
                        >
                          {service}
                        </span>
                      ))}
                      {servicesList.length > 4 && (
                        <span className="px-2 py-0.5 rounded-lg bg-slate-800/50 text-[11px] text-slate-400">
                          +{servicesList.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${fac.phone.replace(/[^0-9+]/g, '')}`}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
                      title="Call facility"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{t('call_btn')}</span>
                    </a>

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${fac.latitude},${fac.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
                      title="Google Maps Navigation"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>{t('directions_btn')}</span>
                    </a>
                  </div>

                  <button
                    onClick={() => onBookFacility(fac)}
                    className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{language === 'kn' ? 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ' : 'Book Checkup'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
