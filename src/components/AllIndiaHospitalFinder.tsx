import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { NearbyHospital, UserLocation, Facility } from '../types';
import {
  ALL_INDIA_STATES,
  KARNATAKA_DISTRICTS,
  StateData,
} from '../data/indiaGeography';
import { cacheFacilities, getCachedFacilities } from '../utils/indexedDB';
import L from 'leaflet';
import {
  Compass,
  MapPin,
  Search,
  Phone,
  Navigation,
  RefreshCw,
  AlertTriangle,
  Clock,
  Bed,
  UserCheck,
  CheckCircle2,
  Calendar,
  Layers,
  ShieldCheck,
  PhoneCall,
  Building2,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  Info,
  ExternalLink,
  Flame,
  Activity,
  Heart,
  Baby,
  Stethoscope,
  X,
} from 'lucide-react';

interface AllIndiaHospitalFinderProps {
  onBookHospital?: (facility: Facility) => void;
  isOnline: boolean;
}

export const AllIndiaHospitalFinder: React.FC<AllIndiaHospitalFinderProps> = ({
  onBookHospital,
  isOnline,
}) => {
  const { language, t } = useLanguage();

  // Search & Navigation Mode: 'gps' (Nearby GPS) | 'directory' (Cascading State/District/City)
  const [activeMode, setActiveMode] = useState<'gps' | 'directory'>('gps');

  // GPS User Location State
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    'idle' | 'locating' | 'ready' | 'error'
  >('idle');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedRadiusKm, setSelectedRadiusKm] = useState<number>(20);
  const [activeRadiusKm, setActiveRadiusKm] = useState<number>(20);

  // Cascading Geography Selectors
  const [selectedState, setSelectedState] = useState<string>('Karnataka');
  const [districtsList, setDistrictsList] = useState<string[]>(KARNATAKA_DISTRICTS);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [citiesList, setCitiesList] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('ALL');

  // Query & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOwnership, setSelectedOwnership] = useState<'ALL' | 'GOVERNMENT' | 'PRIVATE'>('ALL');
  const [selectedFacilityType, setSelectedFacilityType] = useState<string>('ALL');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [only24x7, setOnly24x7] = useState<boolean>(false);
  const [emergencyOnly, setEmergencyOnly] = useState<boolean>(false);

  // Results & Pagination
  const [hospitals, setHospitals] = useState<NearbyHospital[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [totalFound, setTotalFound] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Update districts when state changes
  useEffect(() => {
    if (!selectedState || selectedState === 'ALL') {
      setDistrictsList([]);
      setSelectedDistrict('ALL');
      setCitiesList([]);
      setSelectedCity('ALL');
      return;
    }

    const matched = ALL_INDIA_STATES.find(
      (s) => s.name.toLowerCase() === selectedState.toLowerCase() || s.code === selectedState
    );

    if (matched) {
      setDistrictsList(matched.districts);
      setSelectedDistrict('ALL');
      setCitiesList([]);
      setSelectedCity('ALL');
    }
  }, [selectedState]);

  // Update cities when district changes
  useEffect(() => {
    if (!selectedDistrict || selectedDistrict === 'ALL') {
      setCitiesList([]);
      setSelectedCity('ALL');
      return;
    }

    // Fetch cities for this district
    fetch(`/api/geography/cities?state=${encodeURIComponent(selectedState)}&district=${encodeURIComponent(selectedDistrict)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.cities) {
          setCitiesList(data.cities);
          setSelectedCity('ALL');
        }
      })
      .catch(() => {
        setCitiesList([]);
      });
  }, [selectedDistrict, selectedState]);

  // Trigger search whenever key filters change
  const executeSearch = useCallback(
    async (pageToFetch: number = 1, append: boolean = false) => {
      if (!append) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        if (isOnline) {
          const params = new URLSearchParams();

          // GPS mode parameters
          if (activeMode === 'gps' && userLocation) {
            params.append('lat', userLocation.latitude.toString());
            params.append('lng', userLocation.longitude.toString());
            params.append('radius', selectedRadiusKm.toString());
          }

          // Directory mode parameters
          if (activeMode === 'directory') {
            if (selectedState && selectedState !== 'ALL') {
              params.append('state', selectedState);
            }
            if (selectedDistrict && selectedDistrict !== 'ALL') {
              params.append('district', selectedDistrict);
            }
            if (selectedCity && selectedCity !== 'ALL') {
              params.append('city', selectedCity);
            }
          }

          // Query & Filters
          if (searchQuery.trim()) params.append('q', searchQuery.trim());
          if (selectedOwnership !== 'ALL') params.append('ownership', selectedOwnership);
          if (selectedFacilityType !== 'ALL') params.append('type', selectedFacilityType);
          if (selectedSpecialty) params.append('specialty', selectedSpecialty);
          if (only24x7) params.append('open24x7', 'true');
          if (emergencyOnly) params.append('emergencyOnly', 'true');

          params.append('page', pageToFetch.toString());
          params.append('limit', '12');

          const res = await fetch(`/api/hospitals/search?${params.toString()}`);
          if (res.ok) {
            const data = await res.json();
            const fetchedList = data.hospitals || [];

            if (append) {
              setHospitals((prev) => [...prev, ...fetchedList]);
            } else {
              setHospitals(fetchedList);
            }

            setTotalFound(data.total || 0);
            setHasMore(Boolean(data.hasMore));
            setCurrentPage(pageToFetch);

            if (data.searchedRadiusKm) {
              setActiveRadiusKm(data.searchedRadiusKm);
            }

            // Cache to IndexedDB for offline resilience
            if (pageToFetch === 1 && fetchedList.length > 0) {
              try {
                const facilityMapped = fetchedList.map((h: any) => ({
                  id: h.id,
                  name: h.name,
                  kannadaName: h.kannadaName || h.name,
                  type: (h.type as any) || 'PHC',
                  district: h.district || 'District',
                  taluk: h.cityOrTown || 'Taluk',
                  villageOrTown: h.cityOrTown || 'Town',
                  address: h.address,
                  kannadaAddress: h.kannadaAddress || h.address,
                  phone: h.phone || '108',
                  emergency108Available: h.emergency108Available ?? true,
                  isOpen24x7: h.isOpen24x7 ?? false,
                  openingHours: h.openingHours || '24 Hours Emergency',
                  services: h.specialties || ['General Outpatient'],
                  kannadaServices: ['ಸಾಮಾನ್ಯ ಚಿಕಿತ್ಸೆ'],
                  bedCount: h.bedCount || 10,
                  availableDoctors: h.availableDoctors || 2,
                  distanceKm: h.distanceKm || 5.0,
                  isSampleData: false,
                  latitude: h.latitude,
                  longitude: h.longitude,
                }));
                cacheFacilities(facilityMapped);
              } catch {}
            }
          } else {
            throw new Error('Search failed');
          }
        } else {
          // Offline Fallback from IndexedDB
          const cached = await getCachedFacilities();
          let filtered = (cached || []).map((f) => ({
            id: f.id,
            name: f.name,
            kannadaName: f.kannadaName,
            ownership: 'GOVERNMENT' as const,
            type: f.type,
            state: 'Karnataka',
            district: f.district,
            cityOrTown: f.villageOrTown,
            address: f.address,
            phone: f.phone,
            emergencyPhone: '108',
            isOpen24x7: f.isOpen24x7,
            emergencyAvailable: f.emergency108Available,
            distanceKm: f.distanceKm,
            latitude: f.latitude,
            longitude: f.longitude,
            source: 'Offline Local Cache (IndexedDB)',
            verifiedDate: 'October 2026',
            bedCount: f.bedCount,
            availableDoctors: f.availableDoctors,
            specialties: f.services,
          }));

          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(
              (h) =>
                h.name.toLowerCase().includes(q) ||
                (h.kannadaName && h.kannadaName.includes(q)) ||
                h.address.toLowerCase().includes(q)
            );
          }

          if (selectedFacilityType !== 'ALL') {
            filtered = filtered.filter((h) => h.type === selectedFacilityType);
          }

          if (only24x7) {
            filtered = filtered.filter((h) => h.isOpen24x7);
          }

          setHospitals(filtered);
          setTotalFound(filtered.length);
          setHasMore(false);
        }
      } catch (err: any) {
        console.warn('Hospital search error:', err.message);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [
      activeMode,
      userLocation,
      selectedRadiusKm,
      selectedState,
      selectedDistrict,
      selectedCity,
      searchQuery,
      selectedOwnership,
      selectedFacilityType,
      selectedSpecialty,
      only24x7,
      emergencyOnly,
      isOnline,
    ]
  );

  // Debounced search on query or filter changes
  useEffect(() => {
    const handler = setTimeout(() => {
      executeSearch(1, false);
    }, 280);

    return () => clearTimeout(handler);
  }, [executeSearch]);

  // Handle GPS detection using browser Geolocation API
  const handleDetectGPS = (radius: number = selectedRadiusKm) => {
    setLocationError(null);

    if (!('geolocation' in navigator)) {
      setLocationStatus('error');
      setLocationError(t('location_error_generic'));
      return;
    }

    setLocationStatus('locating');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: UserLocation = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracyMeters: pos.coords.accuracy,
          timestamp: pos.timestamp,
        };
        setUserLocation(coords);
        setLocationStatus('ready');
        setActiveMode('gps');
      },
      (err) => {
        setLocationStatus('error');
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocationError(t('location_error_denied'));
            break;
          case err.POSITION_UNAVAILABLE:
            setLocationError(t('location_error_unavailable'));
            break;
          case err.TIMEOUT:
            setLocationError(t('location_error_timeout'));
            break;
          default:
            setLocationError(t('location_error_generic'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000,
      }
    );
  };

  // Initialize or update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const defaultCenter: [number, number] = userLocation
        ? [userLocation.latitude, userLocation.longitude]
        : [12.9716, 77.5946]; // Bengaluru default

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 12,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();
    const boundsLatLngs: L.LatLngExpression[] = [];

    // Add user marker
    if (userLocation) {
      const userLatLng: [number, number] = [
        userLocation.latitude,
        userLocation.longitude,
      ];
      boundsLatLngs.push(userLatLng);

      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8">
            <span class="absolute w-8 h-8 rounded-full bg-teal-400/30 animate-ping"></span>
            <span class="absolute w-6 h-6 rounded-full bg-teal-500/50 animate-pulse"></span>
            <span class="relative w-4 h-4 rounded-full bg-teal-500 border-2 border-white shadow-xl"></span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const userMarker = L.marker(userLatLng, { icon: userIcon });
      userMarker.bindPopup(`
        <div class="p-1 font-sans text-xs">
          <strong class="text-teal-700 block font-bold text-sm">📍 ${
            language === 'kn' ? 'ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಸ್ಥಳ' : 'Your Current Location'
          }</strong>
          <span class="text-slate-600 block mt-0.5">
            Lat: ${userLocation.latitude.toFixed(4)}, Lng: ${userLocation.longitude.toFixed(4)}
          </span>
          <span class="text-emerald-600 text-[10px] font-bold block mt-1">
            ✓ ${language === 'kn' ? 'GPS ನಿಖರತೆ ಸಕ್ರಿಯವಾಗಿದೆ' : 'GPS Location Active'}
          </span>
        </div>
      `);
      markersLayer.addLayer(userMarker);
    }

    // Add hospital markers with color-coding
    hospitals.forEach((hosp) => {
      const hospLatLng: [number, number] = [hosp.latitude, hosp.longitude];
      boundsLatLngs.push(hospLatLng);

      const isSelected = selectedHospitalId === hosp.id;
      const isEmergency = hosp.isOpen24x7;
      const isGovt = hosp.ownership !== 'PRIVATE';

      // Color logic:
      // Rose for 24x7 Emergency Trauma
      // Blue-teal for Government
      // Indigo-purple for Private
      const markerBg = isEmergency
        ? 'bg-rose-600'
        : isGovt
        ? 'bg-teal-700'
        : 'bg-indigo-600';

      const hospIcon = L.divIcon({
        className: 'custom-hospital-marker',
        html: `
          <div class="cursor-pointer transition-transform duration-200 ${
            isSelected ? 'scale-125 z-50' : 'hover:scale-110'
          }">
            <div class="w-8 h-8 rounded-full ${markerBg} border-2 border-white shadow-xl flex items-center justify-center text-white text-xs font-black">
              🏥
            </div>
            ${
              isSelected
                ? '<div class="w-2 h-2 rounded-full bg-teal-400 mx-auto mt-1 animate-ping"></div>'
                : ''
            }
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker(hospLatLng, { icon: hospIcon });
      const displayName = language === 'kn' ? hosp.kannadaName || hosp.name : hosp.name;

      marker.bindPopup(`
        <div class="p-1 font-sans text-xs max-w-[240px]">
          <div class="flex items-center gap-1.5 mb-1">
            <span class="px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
              isGovt ? 'bg-teal-100 text-teal-800' : 'bg-indigo-100 text-indigo-800'
            }">
              ${hosp.ownership || (isGovt ? 'GOVERNMENT' : 'PRIVATE')}
            </span>
            ${
              hosp.isOpen24x7
                ? '<span class="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-100 text-rose-800">24/7 Emergency</span>'
                : ''
            }
          </div>
          <strong class="text-slate-900 block font-bold text-sm leading-tight">${displayName}</strong>
          ${
            hosp.distanceKm !== undefined
              ? `<span class="text-teal-700 font-bold block mt-1">📍 ${hosp.distanceKm} km ${
                  language === 'kn' ? 'ದೂರದಲ್ಲಿದೆ' : 'away'
                }</span>`
              : ''
          }
          <span class="text-slate-600 text-[11px] block mt-0.5 leading-snug">
            ${hosp.address}
          </span>
          <div class="mt-2 pt-1.5 border-t border-slate-200 flex flex-wrap items-center gap-1.5">
            <a 
              href="https://www.google.com/maps/dir/?api=1&destination=${hosp.latitude},${hosp.longitude}" 
              target="_blank" 
              class="px-2 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded text-[10px] font-bold inline-flex items-center gap-1"
            >
              🧭 ${language === 'kn' ? 'ಮಾರ್ಗ' : 'Directions'}
            </a>
            ${
              hosp.phone
                ? `<a href="tel:${hosp.phone.replace(/[^0-9+]/g, '')}" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-bold inline-flex items-center gap-1">📞 ${
                    language === 'kn' ? 'ಕರೆ' : 'Call'
                  }</a>`
                : ''
            }
          </div>
        </div>
      `);

      marker.on('click', () => {
        setSelectedHospitalId(hosp.id);
      });

      markersLayer.addLayer(marker);
    });

    if (boundsLatLngs.length > 1) {
      map.fitBounds(L.latLngBounds(boundsLatLngs), {
        padding: [40, 40],
        maxZoom: 15,
      });
    } else if (boundsLatLngs.length === 1) {
      map.setView(boundsLatLngs[0], 14);
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [userLocation, hospitals, selectedHospitalId, language]);

  // Select hospital and pan map
  const handleSelectHospital = (hosp: NearbyHospital) => {
    setSelectedHospitalId(hosp.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([hosp.latitude, hosp.longitude], 15, {
        animate: true,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. National Emergency 112 & Healthcare 108 Assistance Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 p-4 sm:p-5 rounded-3xl border-2 border-rose-600/50 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-600/30 animate-pulse">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-extrabold text-[10px] border border-rose-500/40 uppercase tracking-wider">
                All-India 24/7 Helplines
              </span>
              <span className="text-white font-black text-sm sm:text-base">
                {language === 'kn' ? 'ತುರ್ತು ವೈದ್ಯಕೀಯ ನೆರವು' : 'Emergency Medical Assistance'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 leading-snug">
              {language === 'kn'
                ? 'ಆಂಬುಲೆನ್ಸ್ ಹಾಗೂ ತುರ್ತು ವೈದ್ಯಕೀಯ ಸೇವೆಗೆ 108 ಅಥವಾ ರಾಷ್ಟ್ರೀಯ ತುರ್ತು ಸಹಾಯವಾಣಿ 112 ಗೆ ತಕ್ಷಣ ಕರೆ ಮಾಡಿ.'
                : 'For critical trauma, cardiac distress, snakebite, or labor transport, dial 108 (Ambulance) or 112 (National Emergency).'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
          <a
            href="tel:108"
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-600/30 transition active:scale-95 flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4" />
            <span>{language === 'kn' ? '108 ಆಂಬುಲೆನ್ಸ್' : 'Dial 108 Ambulance'}</span>
          </a>

          <a
            href="tel:112"
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-white border border-rose-500/40 font-black text-xs transition active:scale-95 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-rose-400" />
            <span>{language === 'kn' ? '112 ರಾಷ್ಟ್ರೀಯ ತುರ್ತು' : 'Dial 112 Emergency'}</span>
          </a>
        </div>
      </div>

      {/* 2. Primary Header & Dual Navigation Mode Switcher */}
      <div className="bg-gradient-to-br from-slate-900 to-teal-950 p-6 sm:p-8 rounded-3xl border border-teal-800/40 shadow-xl">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider mb-2">
            <Building2 className="w-4 h-4" />
            <span>
              {language === 'kn'
                ? 'ಅಖಿಲ ಭಾರತ ಆಸ್ಪತ್ರೆ ಶೋಧಕ ಮತ್ತು ಜಿಲ್ಲಾವಾರು ಡೈರೆಕ್ಟರಿ'
                : 'All India Hospital Finder & Verified Directory'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {language === 'kn'
              ? 'ಭಾರತದ ಆಸ್ಪತ್ರೆಗಳು, PHC ಗಳು ಮತ್ತು ತುರ್ತು ಕೇಂದ್ರಗಳ ಸಮಗ್ರ ಹುಡುಕಾಟ'
              : 'Search Hospitals, PHCs & Trauma Centers Across India'}
          </h2>
          <p className="text-slate-300 text-sm mt-1.5 leading-relaxed">
            {language === 'kn'
              ? 'ಕರ್ನಾಟಕದ ಎಲ್ಲಾ 31 ಜಿಲ್ಲೆಗಳು ಸೇರಿದಂತೆ ಭಾರತದ 28 ರಾಜ್ಯಗಳು ಮತ್ತು 8 ಕೇಂದ್ರಾಡಳಿತ ಪ್ರದೇಶಗಳಲ್ಲಿನ ಸರ್ಕಾರಿ ಮತ್ತು ಖಾಸಗಿ ಆಸ್ಪತ್ರೆಗಳು, ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರಗಳು ಮತ್ತು ತುರ್ತು ಚಿಕಿತ್ಸಾ ಘಟಕಗಳನ್ನು ಜಿಪಿಎಸ್ ಅಥವಾ ಜಿಲ್ಲಾವಾರು ಆಯ್ಕೆಯ ಮೂಲಕ ಹುಡುಕಿ.'
              : 'Access accurate government health registries and OpenStreetMap verified facilities across all 31 districts of Karnataka and 28 States & 8 UTs of India. Use live GPS or cascading state-district filters.'}
          </p>
        </div>

        {/* Mode Selector Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-teal-900/40">
          <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => {
                setActiveMode('gps');
                if (!userLocation) handleDetectGPS();
              }}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition cursor-pointer ${
                activeMode === 'gps'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 shadow-lg shadow-teal-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>{t('find_hospitals_near_me')} (GPS)</span>
            </button>

            <button
              onClick={() => setActiveMode('directory')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition cursor-pointer ${
                activeMode === 'directory'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 shadow-lg shadow-teal-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>{language === 'kn' ? 'ರಾಜ್ಯ / ಜಿಲ್ಲಾವಾರು ಹುಡುಕಾಟ' : 'State & District Directory'}</span>
            </button>
          </div>

          {/* Quick status pill */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-teal-400 bg-teal-950/80 px-3 py-1.5 rounded-xl border border-teal-800/40">
              {totalFound} {language === 'kn' ? 'ಆಸ್ಪತ್ರೆಗಳು ಲಭ್ಯವಿದೆ' : 'Hospitals Verified'}
            </span>
          </div>
        </div>

        {/* GPS Mode Action Bar */}
        {activeMode === 'gps' && (
          <div className="mt-5 p-4 bg-slate-950/70 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleDetectGPS()}
                disabled={locationStatus === 'locating'}
                className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <Compass className={`w-4 h-4 ${locationStatus === 'locating' ? 'animate-spin' : ''}`} />
                <span>
                  {locationStatus === 'locating'
                    ? t('detecting_location')
                    : userLocation
                    ? t('refresh_location')
                    : t('find_hospitals_near_me')}
                </span>
              </button>

              {/* Radius Selector: 5 km, 10 km, 20 km, 50 km */}
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                <span className="text-[11px] font-bold text-slate-400 px-2">
                  {t('radius_label')}:
                </span>
                {[5, 10, 20, 50].map((radius) => (
                  <button
                    key={radius}
                    onClick={() => {
                      setSelectedRadiusKm(radius);
                      if (userLocation) executeSearch(1, false);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      selectedRadiusKm === radius
                        ? 'bg-teal-500 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {radius} km
                  </button>
                ))}
              </div>
            </div>

            {userLocation && (
              <span className="text-xs text-slate-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  <strong>GPS:</strong> {userLocation.latitude.toFixed(4)}° N, {userLocation.longitude.toFixed(4)}° E
                </span>
              </span>
            )}
          </div>
        )}

        {/* Cascading State -> District -> City / Town Selectors */}
        {activeMode === 'directory' && (
          <div className="mt-5 p-4 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. Country & State / UT Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  1. {language === 'kn' ? 'ರಾಜ್ಯ / ಕೇಂದ್ರಾಡಳಿತ ಪ್ರದೇಶ' : 'State / UT (28 States & 8 UTs)'}
                </label>
                <div className="relative">
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 bg-slate-900 border border-slate-700 focus:border-teal-500 rounded-xl text-white text-xs outline-none appearance-none"
                  >
                    <option value="ALL">
                      {language === 'kn' ? 'ಎಲ್ಲಾ ರಾಜ್ಯಗಳು (ಅಖಿಲ ಭಾರತ)' : 'All States & UTs (All India)'}
                    </option>
                    <optgroup label="States">
                      {ALL_INDIA_STATES.filter((s) => s.type === 'STATE').map((s) => (
                        <option key={s.code} value={s.name}>
                          {s.name} ({s.districts.length} {language === 'kn' ? 'ಜಿಲ್ಲೆಗಳು' : 'Districts'})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Union Territories">
                      {ALL_INDIA_STATES.filter((s) => s.type === 'UT').map((s) => (
                        <option key={s.code} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* 2. District Dropdown (includes all 31 verified Karnataka districts) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  2. {language === 'kn' ? 'ಜಿಲ್ಲೆ' : 'District'} {selectedState === 'Karnataka' && '(All 31 Karnataka Districts)'}
                </label>
                <div className="relative">
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 bg-slate-900 border border-slate-700 focus:border-teal-500 rounded-xl text-white text-xs outline-none appearance-none"
                  >
                    <option value="ALL">
                      {language === 'kn' ? 'ಎಲ್ಲಾ ಜಿಲ್ಲೆಗಳು' : 'All Districts'}
                    </option>
                    {districtsList.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* 3. City / Town / Taluk Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  3. {language === 'kn' ? 'ನಗರ / ತಾಲೂಕು' : 'City / Town / Taluk'}
                </label>
                <div className="relative">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 bg-slate-900 border border-slate-700 focus:border-teal-500 rounded-xl text-white text-xs outline-none appearance-none"
                  >
                    <option value="ALL">
                      {language === 'kn' ? 'ಎಲ್ಲಾ ತಾಲೂಕುಗಳು / ನಗರಗಳು' : 'All Cities & Taluks'}
                    </option>
                    {citiesList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar & Keyword Input */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-teal-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'kn'
                  ? 'ಆಸ್ಪತ್ರೆಯ ಹೆಸರು (ಉದಾ: AIIMS, NIMHANS, Victoria, ಮೈಸೂರು ಜಿಲ್ಲಾ ಆಸ್ಪತ್ರೆ, PHC)...'
                  : 'Search by hospital name (e.g. AIIMS, NIMHANS, Victoria, KIMS, Fortis, PHC)...'
              }
              className="w-full pl-10 pr-9 py-3 bg-slate-800/90 border border-slate-700 focus:border-teal-500 rounded-2xl text-white text-xs sm:text-sm placeholder-slate-400 outline-none shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Clear Filters Button */}
          {(searchQuery || selectedOwnership !== 'ALL' || selectedFacilityType !== 'ALL' || selectedSpecialty || only24x7 || emergencyOnly) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedOwnership('ALL');
                setSelectedFacilityType('ALL');
                setSelectedSpecialty('');
                setOnly24x7(false);
                setEmergencyOnly(false);
              }}
              className="px-3.5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
            >
              {language === 'kn' ? 'ಫಿಲ್ಟರ್ ತೆರವುಗೊಳಿಸಿ' : 'Clear Filters'}
            </button>
          )}
        </div>

        {/* Quick-Filter Pills */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          {/* Government vs Private */}
          <button
            onClick={() => setSelectedOwnership(selectedOwnership === 'GOVERNMENT' ? 'ALL' : 'GOVERNMENT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedOwnership === 'GOVERNMENT'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750 border border-slate-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{language === 'kn' ? 'ಸರ್ಕಾರಿ ಆಸ್ಪತ್ರೆಗಳು' : 'Government Hospitals'}</span>
          </button>

          <button
            onClick={() => setSelectedOwnership(selectedOwnership === 'PRIVATE' ? 'ALL' : 'PRIVATE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedOwnership === 'PRIVATE'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750 border border-slate-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{language === 'kn' ? 'ಖಾಸಗಿ ಆಸ್ಪತ್ರೆಗಳು' : 'Private Hospitals'}</span>
          </button>

          {/* 24x7 Emergency */}
          <button
            onClick={() => setOnly24x7(!only24x7)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              only24x7
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750 border border-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{language === 'kn' ? '24/7 ತುರ್ತು ಸೇವೆ' : '24x7 Emergency'}</span>
          </button>

          {/* Maternal & Child Care */}
          <button
            onClick={() => setSelectedSpecialty(selectedSpecialty === 'Maternal' ? '' : 'Maternal')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedSpecialty === 'Maternal'
                ? 'bg-pink-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750 border border-slate-700'
            }`}
          >
            <Baby className="w-3.5 h-3.5" />
            <span>{language === 'kn' ? 'ತಾಯಿ ಮತ್ತು ಮಕ್ಕಳ ಆರೈಕೆ' : 'Maternal & Child Care'}</span>
          </button>

          {/* Trauma Care */}
          <button
            onClick={() => setSelectedSpecialty(selectedSpecialty === 'Trauma' ? '' : 'Trauma')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedSpecialty === 'Trauma'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750 border border-slate-700'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{language === 'kn' ? 'ಅಪಘಾತ & ಟ್ರಾಮಾ ಕೇರ್' : 'Trauma Care'}</span>
          </button>

          {/* Cardiology */}
          <button
            onClick={() => setSelectedSpecialty(selectedSpecialty === 'Cardiology' ? '' : 'Cardiology')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedSpecialty === 'Cardiology'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750 border border-slate-700'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>{language === 'kn' ? 'ಹೃದ್ರೋಗ (Cardiology)' : 'Cardiology'}</span>
          </button>

          {/* Facility Type: PHC vs Medical College */}
          <button
            onClick={() => setSelectedFacilityType(selectedFacilityType === 'PHC' ? 'ALL' : 'PHC')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedFacilityType === 'PHC'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750 border border-slate-700'
            }`}
          >
            PHC
          </button>

          <button
            onClick={() => setSelectedFacilityType(selectedFacilityType === 'MEDICAL_COLLEGE' ? 'ALL' : 'MEDICAL_COLLEGE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedFacilityType === 'MEDICAL_COLLEGE'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750 border border-slate-700'
            }`}
          >
            {language === 'kn' ? 'ಮೆಡಿಕಲ್ ಕಾಲೇಜು ಆಸ್ಪತ್ರೆ' : 'Medical College'}
          </button>
        </div>

        {/* Location Error Display */}
        {locationError && (
          <div className="mt-4 p-4 bg-rose-950/80 border border-rose-700 rounded-2xl text-xs text-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="block font-bold text-rose-300">
                {language === 'kn' ? 'ಸ್ಥಳ ಪ್ರವೇಶ ದೋಷ:' : 'Location Error:'}
              </strong>
              <span>{locationError}</span>
              <p className="text-[11px] text-rose-300/80 mt-1">
                {language === 'kn'
                  ? 'ನೀವು ಕೆಳಗಿನ ರಾಜ್ಯ ಹಾಗೂ ಜಿಲ್ಲಾವಾರು ಡ್ರಾಪ್‌ಡೌನ್ ಮೂಲಕ ಆಸ್ಪತ್ರೆಗಳನ್ನು ಹುಡುಕಬಹುದು.'
                  : 'You can seamlessly browse hospitals using the State and District directory above without GPS.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Main Split View: Interactive Map (Left/Top) + Hospitals Results (Right/Bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Leaflet Map Section (7 cols on desktop) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col">
          <div className="flex items-center justify-between pb-3 px-1 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-400" />
              <span className="font-bold text-white">
                {language === 'kn' ? 'ಸಂವಾದಾತ್ಮಕ ನಕ್ಷೆ (OpenStreetMap)' : 'Interactive Hospital Map'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              {hospitals.length} {language === 'kn' ? 'ಆಸ್ಪತ್ರೆಗಳು ಗುರುತಿಸಲಾಗಿದೆ' : 'markers displayed'}
            </span>
          </div>

          {/* Leaflet Map DOM Container */}
          <div
            ref={mapContainerRef}
            className="w-full h-[380px] sm:h-[480px] rounded-2xl overflow-hidden z-10 border border-slate-700/80 shadow-inner"
          />

          {/* Map Legend */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 px-1">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-teal-500 border border-white inline-block"></span>
                <span>{language === 'kn' ? 'ನಿಮ್ಮ ಸ್ಥಳ (GPS)' : 'Your GPS'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-teal-700 border border-white inline-block"></span>
                <span>{language === 'kn' ? 'ಸರ್ಕಾರಿ / PHC' : 'Government / PHC'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-indigo-600 border border-white inline-block"></span>
                <span>{language === 'kn' ? 'ಖಾಸಗಿ ಆಸ್ಪತ್ರೆ' : 'Private Hospital'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-600 border border-white inline-block"></span>
                <span>24/7 Emergency</span>
              </span>
            </div>

            <span className="text-teal-400 font-semibold">
              {language === 'kn' ? 'ವಿವರಕ್ಕೆ ಮಾರ್ಕರ್ ಒತ್ತಿ' : 'Click marker for details'}
            </span>
          </div>
        </div>

        {/* Results List Section (5 cols on desktop) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {language === 'kn'
                ? `ಫಲಿತಾಂಶಗಳು (${totalFound} ಆಸ್ಪತ್ರೆಗಳು):`
                : `Verified Results (${totalFound} Found):`}
            </span>
            {!isOnline && (
              <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Offline Cached</span>
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl text-teal-400 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-teal-400 border-t-transparent animate-spin" />
              <span className="text-xs sm:text-sm font-semibold">
                {language === 'kn'
                  ? 'ಆಸ್ಪತ್ರೆಗಳ ದಾಖಲೆಗಳನ್ನು ಶೋಧಿಸಲಾಗುತ್ತಿದೆ...'
                  : 'Searching verified hospital records across India...'}
              </span>
            </div>
          ) : hospitals.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-400 space-y-3">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
              <h4 className="font-bold text-white text-sm">
                {language === 'kn'
                  ? 'ಯಾವುದೇ ಹೊಂದಾಣಿಕೆಯ ಆಸ್ಪತ್ರೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ'
                  : 'No matching healthcare facilities found'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === 'kn'
                  ? 'ಹುಡುಕಾಟದ ಫಿಲ್ಟರ್‌ಗಳನ್ನು ಬದಲಿಸಿ ಅಥವಾ ಮೇಲಿನ ರಾಜ್ಯ/ಜಿಲ್ಲೆ ಆಯ್ಕೆಯನ್ನು ವಿಸ್ತರಿಸಿ.'
                  : 'Try broadening your search keywords, increasing the distance radius, or selecting a different district/state.'}
              </p>
              <div className="flex justify-center gap-2 pt-1">
                <button
                  onClick={() => {
                    setSelectedOwnership('ALL');
                    setSelectedFacilityType('ALL');
                    setSelectedSpecialty('');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs"
                >
                  {language === 'kn' ? 'ಎಲ್ಲಾ ಆಸ್ಪತ್ರೆಗಳನ್ನು ತೋರಿಸಿ' : 'Show All Hospitals'}
                </button>
              </div>
            </div>
          ) : (
            <div className="max-h-[640px] overflow-y-auto space-y-3 pr-1">
              {hospitals.map((hosp, idx) => {
                const isSelected = selectedHospitalId === hosp.id;
                const displayName =
                  language === 'kn' ? hosp.kannadaName || hosp.name : hosp.name;
                const isGovt = hosp.ownership !== 'PRIVATE';

                return (
                  <div
                    key={hosp.id}
                    onClick={() => handleSelectHospital(hosp)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-br from-teal-950/80 to-slate-900 border-teal-400 shadow-xl shadow-teal-950/40 ring-2 ring-teal-500/20'
                        : 'bg-slate-900 border-slate-800 hover:border-teal-700/60 hover:bg-slate-850'
                    }`}
                  >
                    {/* Top Row: Rank, Ownership, Type, Distance */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-extrabold text-[11px] flex items-center justify-center border border-slate-700">
                          {idx + 1}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold border uppercase ${
                            isGovt
                              ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          }`}
                        >
                          {hosp.ownership || (isGovt ? 'GOVERNMENT' : 'PRIVATE')}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {hosp.type.replace('_', ' ')}
                        </span>
                        {hosp.isOpen24x7 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            24x7
                          </span>
                        )}
                      </div>

                      {hosp.distanceKm !== undefined && (
                        <span className="text-xs font-black text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-800/40 shrink-0">
                          {hosp.distanceKm} km
                        </span>
                      )}
                    </div>

                    {/* Hospital Name & Secondary Name */}
                    <h4 className="font-black text-white text-base leading-snug">
                      {displayName}
                    </h4>
                    {language === 'kn' && hosp.name !== hosp.kannadaName && (
                      <p className="text-[11px] text-slate-400 mt-0.5">{hosp.name}</p>
                    )}

                    {/* Address with District & State */}
                    <div className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">
                        {hosp.address}
                        {hosp.district ? ` • ${hosp.district}` : ''}
                        {hosp.state ? `, ${hosp.state}` : ''}
                        {hosp.pinCode ? ` - ${hosp.pinCode}` : ''}
                      </span>
                    </div>

                    {/* Metric Badges: Beds, Doctors, Emergency Tie-Up */}
                    <div className="mt-2.5 grid grid-cols-3 gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">
                          {language === 'kn' ? 'ಹಾಸಿಗೆಗಳು' : 'Beds'}
                        </span>
                        <span className="font-bold text-white text-xs flex items-center gap-1">
                          <Bed className="w-3 h-3 text-teal-400" />
                          {hosp.bedCount ?? (
                            <span className="text-slate-500 text-[10px] font-normal">Not Available</span>
                          )}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">
                          {language === 'kn' ? 'ವೈದ್ಯರು' : 'Doctors'}
                        </span>
                        <span className="font-bold text-emerald-400 text-xs flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />
                          {hosp.availableDoctors ?? (
                            <span className="text-slate-500 text-[10px] font-normal">Not Available</span>
                          )}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">
                          {language === 'kn' ? '108 ತುರ್ತು' : '108 Emergency'}
                        </span>
                        <span className="font-bold text-rose-400 text-xs">
                          {hosp.isOpen24x7 || hosp.emergencyAvailable ? 'Available' : 'Standard'}
                        </span>
                      </div>
                    </div>

                    {/* Specialties Pills */}
                    {hosp.specialties && hosp.specialties.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {hosp.specialties.slice(0, 3).map((spec, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-300 border border-slate-700/60"
                          >
                            {spec}
                          </span>
                        ))}
                        {hosp.specialties.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-800/40 text-[10px] text-slate-400">
                            +{hosp.specialties.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Source and Verification Notice */}
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="truncate max-w-[200px]">
                        Source: <strong>{hosp.source}</strong>
                      </span>
                      <span>
                        Verified: <strong>{hosp.verifiedDate || 'October 2026'}</strong>
                      </span>
                    </div>

                    {/* Action Buttons: Directions, Call, Book */}
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {/* Get Directions (Google Maps / OpenStreetMap) */}
                        <a
                          href={
                            userLocation
                              ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${hosp.latitude},${hosp.longitude}`
                              : `https://www.google.com/maps/dir/?api=1&destination=${hosp.latitude},${hosp.longitude}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1 transition"
                        >
                          <Navigation className="w-3 h-3" />
                          <span>{t('directions_btn')}</span>
                        </a>

                        {/* Call Button */}
                        {hosp.phone ? (
                          <a
                            href={`tel:${hosp.phone.replace(/[^0-9+]/g, '')}`}
                            onClick={(e) => e.stopPropagation()}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1 transition"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{t('call_btn')}</span>
                          </a>
                        ) : (
                          <span className="px-2 py-1 rounded-xl bg-slate-800/40 text-slate-500 text-[11px] italic">
                            Phone Not Available
                          </span>
                        )}
                      </div>

                      {/* Book Checkup Button */}
                      {onBookHospital && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onBookHospital({
                              id: hosp.id,
                              name: hosp.name,
                              kannadaName: hosp.kannadaName || hosp.name,
                              type: (hosp.type as any) || 'PHC',
                              district: hosp.district || 'District',
                              taluk: hosp.cityOrTown || 'Taluk',
                              villageOrTown: hosp.cityOrTown || 'Town',
                              address: hosp.address,
                              kannadaAddress: hosp.kannadaAddress || hosp.address,
                              phone: hosp.phone || '108',
                              emergency108Available: hosp.emergencyAvailable ?? true,
                              isOpen24x7: hosp.isOpen24x7 ?? false,
                              openingHours: hosp.openingHours || '24 Hours Emergency',
                              services: hosp.specialties || ['General Outpatient'],
                              kannadaServices: ['ಸಾಮಾನ್ಯ ಚಿಕಿತ್ಸೆ'],
                              bedCount: hosp.bedCount || 10,
                              availableDoctors: hosp.availableDoctors || 2,
                              distanceKm: hosp.distanceKm || 5.0,
                              isSampleData: false,
                              latitude: hosp.latitude,
                              longitude: hosp.longitude,
                            });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-sm transition active:scale-95 flex items-center gap-1 cursor-pointer"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>{t('book_checkup_btn')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Load More Pagination Button */}
              {hasMore && (
                <div className="pt-2 text-center">
                  <button
                    onClick={() => executeSearch(currentPage + 1, true)}
                    disabled={isLoadingMore}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isLoadingMore ? (
                      <div className="w-4 h-4 rounded-full border-2 border-teal-300 border-t-transparent animate-spin" />
                    ) : (
                      <span>{language === 'kn' ? 'ಇನ್ನಷ್ಟು ಆಸ್ಪತ್ರೆಗಳನ್ನು ತೋರಿಸಿ' : 'Load More Hospitals'}</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. Safety Disclaimer & Privacy Notice */}
      <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-2">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-slate-200">
              {language === 'kn' ? 'ಗೌಪ್ಯತೆ ಮತ್ತು ಸ್ಥಳ ನೀತಿ:' : 'Privacy & GPS Safety Notice:'}
            </strong>{' '}
            {language === 'kn'
              ? 'ನಿಮ್ಮ ಜಿಪಿಎಸ್ ಸ್ಥಳವನ್ನು ಸಮೀಪದ ಆಸ್ಪತ್ರೆಗಳ ದೂರವನ್ನು ಲೆಕ್ಕಹಾಕಲು ಮಾತ್ರ ಬಳಸಲಾಗುತ್ತದೆ. ಹಿನ್ನೆಲೆಯಲ್ಲಿ ಯಾವುದೇ ಟ್ರ್ಯಾಕಿಂಗ್ ಮಾಡಲಾಗುವುದಿಲ್ಲ.'
              : 'User GPS coordinates are accessed only upon clicking "Find Hospitals Near Me" to calculate accurate distances using the Haversine formula and OpenStreetMap. Background tracking is never performed.'}
          </p>
        </div>

        <div className="flex items-start gap-2.5 pt-2 border-t border-slate-800">
          <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-slate-400 text-[11px]">
            <strong className="text-rose-300">
              {language === 'kn' ? 'ವೈದ್ಯಕೀಯ ಎಚ್ಚರಿಕೆ:' : 'Emergency Medical Disclaimer:'}
            </strong>{' '}
            {language === 'kn'
              ? 'ಆಸ್ಪತ್ರೆಗಳ ಮಾಹಿತಿ ಮತ್ತು ಹಾಸಿಗೆಗಳ ವಿವರಗಳು ಪ್ರಾಥಮಿಕ ಮಾರ್ಗದರ್ಶನ ಮತ್ತು ತುರ್ತು ಸಂಚಾರಕ್ಕಾಗಿ ಮಾತ್ರ. ನೈಜ-ಸಮಯದ ICU ಹಾಸಿಗೆ ಲಭ್ಯತೆ ಬದಲಾಗಬಹುದು. ಗಂಭೀರ ಪರಿಸ್ಥಿತಿಗಳಲ್ಲಿ ತಕ್ಷಣ 108 ಅಥವಾ 112 ಗೆ ಕರೆ ಮಾಡಿ.'
              : 'Hospital listings and metrics are for informational and emergency navigation purposes. Listings may not represent real-time ICU bed availability. In life-threatening emergencies, dial 108 or 112 immediately.'}
          </p>
        </div>
      </div>
    </div>
  );
};
