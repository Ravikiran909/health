import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { NearbyHospital, UserLocation, Facility } from '../types';
import L from 'leaflet';
import {
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  Search,
  Compass,
  AlertTriangle,
  Clock,
  Bed,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';

interface GpsHospitalFinderProps {
  onBookHospital?: (facility: Facility) => void;
  isOnline: boolean;
}

export const GpsHospitalFinder: React.FC<GpsHospitalFinderProps> = ({
  onBookHospital,
  isOnline,
}) => {
  const { language, t } = useLanguage();

  // Location and search state
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    'idle' | 'locating' | 'ready' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [hospitals, setHospitals] = useState<NearbyHospital[]>([]);
  const [isSearchingHospitals, setIsSearchingHospitals] = useState<boolean>(false);
  const [selectedRadiusKm, setSelectedRadiusKm] = useState<number>(5);
  const [activeRadiusKm, setActiveRadiusKm] = useState<number>(5);
  const [autoExpanded, setAutoExpanded] = useState<boolean>(false);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);

  // Leaflet map reference
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize or update Leaflet map when user location or hospitals change
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create map instance if not existing
    if (!mapInstanceRef.current) {
      const defaultCenter: [number, number] = userLocation
        ? [userLocation.latitude, userLocation.longitude]
        : [12.3168, 76.6548]; // Mysore/Hunsur default center

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 13,
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

    // Clear previous markers
    markersLayer.clearLayers();

    const boundsLatLngs: L.LatLngExpression[] = [];

    // Add user location marker if GPS resolved
    if (userLocation) {
      const userLatLng: [number, number] = [
        userLocation.latitude,
        userLocation.longitude,
      ];
      boundsLatLngs.push(userLatLng);

      const userIcon = L.divIcon({
        className: 'custom-user-gps-marker',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8">
            <span class="absolute w-8 h-8 rounded-full bg-teal-400/30 animate-ping"></span>
            <span class="absolute w-6 h-6 rounded-full bg-teal-500/50 animate-pulse"></span>
            <span class="relative w-4 h-4 rounded-full bg-teal-500 border-2 border-white shadow-lg"></span>
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
      userMarkerRef.current = userMarker;
    }

    // Add nearby hospital markers
    hospitals.forEach((hosp) => {
      const hospLatLng: [number, number] = [hosp.latitude, hosp.longitude];
      boundsLatLngs.push(hospLatLng);

      const isSelected = selectedHospitalId === hosp.id;
      const hospIcon = L.divIcon({
        className: 'custom-hospital-marker',
        html: `
          <div class="cursor-pointer transition-transform duration-200 ${
            isSelected ? 'scale-125 z-50' : 'hover:scale-110'
          }">
            <div class="w-8 h-8 rounded-full ${
              hosp.isOpen24x7 ? 'bg-rose-600' : 'bg-teal-700'
            } border-2 border-white shadow-xl flex items-center justify-center text-white text-xs font-black">
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
      marker.bindPopup(`
        <div class="p-1 font-sans text-xs max-w-[220px]">
          <strong class="text-slate-900 block font-bold text-sm leading-tight">${
            language === 'kn' ? hosp.kannadaName || hosp.name : hosp.name
          }</strong>
          <span class="text-teal-700 font-bold block mt-1">
            📍 ${hosp.distanceKm} km ${language === 'kn' ? 'ದೂರದಲ್ಲಿದೆ' : 'away'}
          </span>
          <span class="text-slate-600 text-[11px] block mt-0.5 leading-snug">
            ${hosp.address}
          </span>
          ${
            hosp.phone && hosp.phone !== '108 (Emergency)'
              ? `<a href="tel:${hosp.phone}" class="text-teal-600 font-bold block mt-1 underline">📞 ${hosp.phone}</a>`
              : ''
          }
          <div class="mt-2 pt-1.5 border-t border-slate-200 flex items-center gap-1">
            <a 
              href="https://www.google.com/maps/dir/?api=1&destination=${hosp.latitude},${hosp.longitude}" 
              target="_blank" 
              class="px-2 py-1 bg-teal-600 text-white rounded text-[10px] font-bold inline-block"
            >
              ${language === 'kn' ? 'ಮಾರ್ಗ ನೋಡಿ' : 'Directions'}
            </a>
          </div>
        </div>
      `);

      marker.on('click', () => {
        setSelectedHospitalId(hosp.id);
      });

      markersLayer.addLayer(marker);
    });

    // Auto-fit map bounds so user marker and hospitals are comfortably framed
    if (boundsLatLngs.length > 1) {
      map.fitBounds(L.latLngBounds(boundsLatLngs), {
        padding: [40, 40],
        maxZoom: 15,
      });
    } else if (boundsLatLngs.length === 1) {
      map.setView(boundsLatLngs[0], 14);
    }

    // Invalidate size in case of tab/layout shift
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [userLocation, hospitals, selectedHospitalId, language]);

  // Request GPS Location using the browser Geolocation API
  const handleDetectLocation = (requestedRadius: number = selectedRadiusKm) => {
    setErrorMessage(null);

    if (!('geolocation' in navigator)) {
      setLocationStatus('error');
      setErrorMessage(t('location_error_generic'));
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
        fetchNearbyHospitals(coords.latitude, coords.longitude, requestedRadius);
      },
      (err) => {
        setLocationStatus('error');
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setErrorMessage(t('location_error_denied'));
            break;
          case err.POSITION_UNAVAILABLE:
            setErrorMessage(t('location_error_unavailable'));
            break;
          case err.TIMEOUT:
            setErrorMessage(t('location_error_timeout'));
            break;
          default:
            setErrorMessage(t('location_error_generic'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000,
      }
    );
  };

  // Fetch nearby hospitals from backend API (querying Overpass & verified facilities)
  const fetchNearbyHospitals = async (
    lat: number,
    lng: number,
    radiusKm: number
  ) => {
    setIsSearchingHospitals(true);
    setAutoExpanded(false);

    try {
      const res = await fetch(
        `/api/nearby-hospitals?lat=${lat}&lng=${lng}&radius=${radiusKm}&autoExpand=true`
      );

      if (res.ok) {
        const data = await res.json();
        setHospitals(data.hospitals || []);
        setActiveRadiusKm(data.activeRadiusKm || radiusKm);
        setAutoExpanded(Boolean(data.autoExpanded));
      } else {
        throw new Error('Server returned error finding hospitals');
      }
    } catch (err: any) {
      console.warn('Nearby hospital search error:', err.message);
      // Fallback: If network failed or offline, fallback to standard facilities
      try {
        const fallbackRes = await fetch('/api/facilities');
        if (fallbackRes.ok) {
          const d = await fallbackRes.json();
          const mapped = (d.facilities || []).map((f: any) => ({
            id: f.id,
            name: f.name,
            kannadaName: f.kannadaName,
            type: f.type,
            address: f.address,
            kannadaAddress: f.kannadaAddress,
            phone: f.phone,
            distanceKm: f.distanceKm,
            latitude: f.latitude,
            longitude: f.longitude,
            isOpen24x7: f.isOpen24x7,
            emergencyAvailable: f.emergency108Available,
            source: 'Verified State Health Registry',
            openingHours: f.openingHours,
            bedCount: f.bedCount,
            services: f.services,
          }));
          setHospitals(mapped);
        }
      } catch {}
    } finally {
      setIsSearchingHospitals(false);
    }
  };

  // Radius change handler
  const handleRadiusChange = (radius: number) => {
    setSelectedRadiusKm(radius);
    if (userLocation) {
      fetchNearbyHospitals(userLocation.latitude, userLocation.longitude, radius);
    }
  };

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
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 to-teal-950 p-6 sm:p-8 rounded-3xl border border-teal-800/40 shadow-xl">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider mb-2">
            <Compass className="w-4 h-4 animate-spin" style={{ animationDuration: '8s' }} />
            <span>
              {language === 'kn'
                ? 'GPS ಆಧಾರಿತ ನೇರ ಆಸ್ಪತ್ರೆ ಶೋಧಕ'
                : 'GPS-Based Nearest Hospital Finder'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {language === 'kn'
              ? 'ನನ್ನ ಸಮೀಪದ ಆಸ್ಪತ್ರೆಗಳನ್ನು ಹುಡುಕಿ (GPS)'
              : 'Find Hospitals Near Me'}
          </h2>
          <p className="text-slate-300 text-sm mt-1.5 leading-relaxed">
            {language === 'kn'
              ? 'ನಿಮ್ಮ ಮೊಬೈಲ್ ಅಥವಾ ಕಂಪ್ಯೂಟರ್‌ನ ನೈಜ GPS ಲೊಕೇಶನ್ ಆಧಾರದ ಮೇಲೆ ಸಮೀಪದ ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರಗಳು, ಸಮುದಾಯ ಕೇಂದ್ರಗಳು ಹಾಗೂ ಸರ್ಕಾರಿ ಆಸ್ಪತ್ರೆಗಳನ್ನು ನಕ್ಷೆಯಲ್ಲಿ ನೇರವಾಗಿ ವೀಕ್ಷಿಸಿ.'
              : 'Detect your current GPS location to find nearest Primary Health Centres (PHCs), CHCs, and hospitals on an interactive OpenStreetMap. View accurate distances, direct dial, and turn-by-turn navigation.'}
          </p>
        </div>

        {/* Action Controls & GPS Trigger Button */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleDetectLocation()}
            disabled={locationStatus === 'locating'}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-black text-sm shadow-xl shadow-teal-500/25 transition active:scale-95 flex items-center gap-2.5 cursor-pointer disabled:opacity-60"
          >
            <Compass className={`w-5 h-5 ${locationStatus === 'locating' ? 'animate-spin' : ''}`} />
            <span>
              {locationStatus === 'locating'
                ? t('detecting_location')
                : t('find_hospitals_near_me')}
            </span>
          </button>

          {userLocation && (
            <button
              onClick={() => handleDetectLocation()}
              disabled={locationStatus === 'locating'}
              className="px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white border border-slate-700 text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${locationStatus === 'locating' ? 'animate-spin' : ''}`} />
              <span>{t('refresh_location')}</span>
            </button>
          )}

          {/* Search Radius Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 text-xs">
            <span className="text-[11px] font-bold text-slate-400 px-2">
              {t('radius_label')}:
            </span>
            {[5, 10, 20].map((radius) => (
              <button
                key={radius}
                onClick={() => handleRadiusChange(radius)}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  selectedRadiusKm === radius
                    ? 'bg-teal-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {radius} km
              </button>
            ))}
          </div>

          {userLocation && (
            <button
              onClick={() => handleDetectLocation()}
              className="px-3.5 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
            >
              {t('search_again')}
            </button>
          )}
        </div>

        {/* Location Status / Accuracy Display */}
        {userLocation && (
          <div className="mt-4 pt-3 border-t border-teal-900/40 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                <strong>{t('your_gps_coordinates')}:</strong>{' '}
                {userLocation.latitude.toFixed(4)}° N, {userLocation.longitude.toFixed(4)}° E
                {userLocation.accuracyMeters && (
                  <span className="text-slate-400 ml-1.5">
                    (±{Math.round(userLocation.accuracyMeters)}m {t('accuracy_label')})
                  </span>
                )}
              </span>
            </div>

            <span className="text-[11px] text-teal-300 font-medium">
              OpenStreetMap Overpass Engine Active
            </span>
          </div>
        )}

        {/* Error message card */}
        {errorMessage && (
          <div className="mt-4 p-4 bg-rose-950/80 border border-rose-700 rounded-2xl text-xs sm:text-sm text-rose-200 flex items-start gap-3 animate-in fade-in">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-rose-300 mb-0.5">
                {language === 'kn' ? 'ಸ್ಥಳ ಪತ್ತೆ ದೋಷ:' : 'Location Error:'}
              </strong>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Auto-expanded radius banner */}
        {autoExpanded && (
          <div className="mt-4 p-3 bg-teal-950/70 border border-teal-700/60 rounded-2xl text-xs text-teal-200 flex items-center gap-2.5 animate-in fade-in">
            <Info className="w-4 h-4 text-teal-400 shrink-0" />
            <span>
              {language === 'kn'
                ? `ಪ್ರಾರಂಭಿಕ ${selectedRadiusKm} km ವ್ಯಾಪ್ತಿಯಲ್ಲಿ 5 ಕ್ಕಿಂತ ಕಡಿಮೆ ಆಸ್ಪತ್ರೆಗಳಿದ್ದ ಕಾರಣ, ಹುಡುಕಾಟವನ್ನು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ${activeRadiusKm} km ಗೆ ವಿಸ್ತರಿಸಲಾಗಿದೆ.`
                : `Fewer than 5 facilities found within ${selectedRadiusKm} km. Search radius was automatically expanded to ${activeRadiusKm} km to ensure comprehensive coverage.`}
            </span>
          </div>
        )}
      </div>

      {/* Main Grid: Interactive Map (Left/Top) + Hospitals Results List (Right/Bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map Panel (7 columns on desktop) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between pb-3 px-1 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-400" />
              <span className="font-bold text-white">
                {language === 'kn' ? 'ಸಂವಾದಾತ್ಮಕ ನಕ್ಷೆ (OpenStreetMap)' : 'Interactive Hospital Map'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              {hospitals.length} {language === 'kn' ? 'ಆಸ್ಪತ್ರೆಗಳು ಗುರುತಿಸಲಾಗಿದೆ' : 'markers active'}
            </span>
          </div>

          {/* Leaflet Map DOM Container */}
          <div
            ref={mapContainerRef}
            className="w-full h-[380px] sm:h-[460px] rounded-2xl overflow-hidden z-10 border border-slate-700/80 shadow-inner"
          />

          {/* Map legend & user prompt */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 px-1">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-teal-500 border border-white inline-block"></span>
                <span>{language === 'kn' ? 'ನಿಮ್ಮ ಸ್ಥಳ (You)' : 'Your GPS'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-600 border border-white inline-block"></span>
                <span>24/7 Delivery & Hospital</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-teal-700 border border-white inline-block"></span>
                <span>PHC / Clinic</span>
              </span>
            </div>

            <span>{language === 'kn' ? 'ಆಸ್ಪತ್ರೆ ವಿವರಕ್ಕೆ ಮಾರ್ಕರ್ ಕ್ಲಿಕ್ ಮಾಡಿ' : 'Click marker for hospital card'}</span>
          </div>
        </div>

        {/* Hospital Results List Panel (5 columns on desktop) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {language === 'kn' ? 'ಸಮೀಪದ ಆಸ್ಪತ್ರೆಗಳ ಪಟ್ಟಿ (ದೂರದ ಆಧಾರದಲ್ಲಿ):' : 'Nearby Hospitals (Sorted by Distance):'}
            </span>
            <span className="text-xs text-teal-400 font-extrabold">
              {hospitals.length} {language === 'kn' ? 'ಲಭ್ಯ' : 'Found'}
            </span>
          </div>

          {isSearchingHospitals ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl text-teal-400 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-teal-400 border-t-transparent animate-spin" />
              <span className="text-xs sm:text-sm font-semibold">
                {language === 'kn'
                  ? 'OpenStreetMap ಮೂಲಕ ಆಸ್ಪತ್ರೆಗಳ ಹುಡುಕಾಟ ನಡೆಯುತ್ತಿದೆ...'
                  : 'Searching nearby hospitals via OpenStreetMap...'}
              </span>
            </div>
          ) : locationStatus === 'idle' ? (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-400 space-y-3">
              <div className="w-14 h-14 rounded-full bg-teal-950 border border-teal-800 flex items-center justify-center mx-auto text-teal-400">
                <Compass className="w-7 h-7" />
              </div>
              <h4 className="font-extrabold text-white text-base">
                {language === 'kn' ? 'GPS ಲೊಕೇಶನ್ ಪತ್ತೆಮಾಡಿ' : 'Detect Your Location'}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {language === 'kn'
                  ? 'ಮೇಲಿನ "ನನ್ನ ಸಮೀಪದ ಆಸ್ಪತ್ರೆ ಹುಡುಕಿ" ಬಟನ್ ಒತ್ತಿ ನಿಮ್ಮ ಸುತ್ತಲಿನ ನೈಜ ಆಸ್ಪತ್ರೆಗಳು ಮತ್ತು ತುರ್ತು ಕೇಂದ್ರಗಳನ್ನು ವೀಕ್ಷಿಸಿ.'
                  : 'Click "Find Hospitals Near Me" above to discover verified clinics, PHCs, and emergency hospitals closest to you.'}
              </p>
              <button
                onClick={() => handleDetectLocation()}
                className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition"
              >
                {language === 'kn' ? 'ಈಗ ಪ್ರಾರಂಭಿಸಿ' : 'Start Search Now'}
              </button>
            </div>
          ) : hospitals.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-400 space-y-3">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
              <h4 className="font-bold text-white text-sm">
                {language === 'kn'
                  ? `${activeRadiusKm} km ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಯಾವುದೇ ಆಸ್ಪತ್ರೆ ಕಂಡುಬಂದಿಲ್ಲ`
                  : `No hospitals found within ${activeRadiusKm} km.`}
              </h4>
              <p className="text-xs text-slate-400">
                {language === 'kn'
                  ? 'ಹುಡುಕಾಟದ ವ್ಯಾಪ್ತಿಯನ್ನು 10 km ಅಥವಾ 20 km ಗೆ ಹೆಚ್ಚಿಸಿ ಪ್ರಯತ್ನಿಸಿ.'
                  : 'Try expanding your search radius to 10 km or 20 km.'}
              </p>
              <div className="flex justify-center gap-2 pt-1">
                <button
                  onClick={() => handleRadiusChange(10)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-teal-300 border border-slate-700 text-xs font-bold hover:bg-slate-700"
                >
                  10 km Radius
                </button>
                <button
                  onClick={() => handleRadiusChange(20)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-teal-300 border border-slate-700 text-xs font-bold hover:bg-slate-700"
                >
                  20 km Radius
                </button>
              </div>
            </div>
          ) : (
            <div className="max-h-[580px] overflow-y-auto space-y-3 pr-1">
              {hospitals.map((hosp, idx) => {
                const isSelected = selectedHospitalId === hosp.id;
                const displayName =
                  language === 'kn' ? hosp.kannadaName || hosp.name : hosp.name;

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
                    {/* Top Row: Rank, Distance, Badges */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-extrabold text-[11px] flex items-center justify-center border border-slate-700">
                          {idx + 1}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase">
                          {hosp.type.replace('_', ' ')}
                        </span>
                        {hosp.isOpen24x7 && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                            24/7 Delivery
                          </span>
                        )}
                      </div>

                      <span className="text-xs font-black text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-800/40 shrink-0">
                        {hosp.distanceKm} km
                      </span>
                    </div>

                    {/* Hospital Name & Address */}
                    <h4 className="font-black text-white text-base leading-snug">
                      {displayName}
                    </h4>

                    <div className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{hosp.address}</span>
                    </div>

                    {/* Phone & Source Notice */}
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Source: <strong>{hosp.source}</strong></span>
                      {hosp.phone && (
                        <span className="text-teal-300 font-semibold">{hosp.phone}</span>
                      )}
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
                          <span>{language === 'kn' ? 'ಮಾರ್ಗ' : 'Directions'}</span>
                        </a>

                        {/* Call Hospital button */}
                        {hosp.phone && (
                          <a
                            href={`tel:${hosp.phone.replace(/[^0-9+]/g, '')}`}
                            onClick={(e) => e.stopPropagation()}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1 transition"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{language === 'kn' ? 'ಕರೆ' : 'Call'}</span>
                          </a>
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
                              district: 'Local District',
                              taluk: 'Local Taluk',
                              villageOrTown: hosp.address.split(',')[0] || 'Local',
                              address: hosp.address,
                              kannadaAddress: hosp.kannadaAddress || hosp.address,
                              phone: hosp.phone || '108',
                              emergency108Available: hosp.emergencyAvailable,
                              isOpen24x7: hosp.isOpen24x7,
                              openingHours: hosp.openingHours || '24 Hours Emergency',
                              services: hosp.services || ['General OPD', 'Maternal Checkup'],
                              kannadaServices: ['ಸಾಮಾನ್ಯ OPD', 'ಗರ್ಭಿಣಿಯರ ತಪಾಸಣೆ'],
                              bedCount: hosp.bedCount || 10,
                              availableDoctors: 3,
                              distanceKm: hosp.distanceKm ?? 0,
                              isSampleData: false,
                              latitude: hosp.latitude,
                              longitude: hosp.longitude,
                            });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-sm transition active:scale-95 flex items-center gap-1 cursor-pointer"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>{language === 'kn' ? 'ಭೇಟಿ ನಿಗದಿ' : 'Book Checkup'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Privacy and GPS Ethical Notice */}
      <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-300 block mb-0.5">
            {language === 'kn' ? 'GPS ಸ್ಥಳ ಗೌಪ್ಯತೆ ನೀತಿ:' : 'GPS Location Privacy & Security Notice:'}
          </strong>
          {language === 'kn'
            ? 'ನಿಮ್ಮ ಸ್ಥಳವನ್ನು ಸಮೀಪದ ಆಸ್ಪತ್ರೆಗಳನ್ನು ಕಂಡುಹಿಡಿಯಲು ಮಾತ್ರ ಪ್ರಸ್ತುತ ಸಮಯದಲ್ಲಿ ಬಳಸಲಾಗುತ್ತದೆ. ಹಿನ್ನೆಲೆಯಲ್ಲಿ ನಿರಂತರವಾಗಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಲಾಗುವುದಿಲ್ಲ ಅಥವಾ ಸ್ಥಳದ ವಿವರಗಳನ್ನು ಸಂಗ್ರಹಿಸಿಡಲಾಗುವುದಿಲ್ಲ.'
            : 'Your device location is requested strictly upon clicking "Find Hospitals Near Me" to calculate accurate distances using the Haversine formula and OpenStreetMap. We do not track your location continuously in the background or store your GPS data without explicit consent.'}
        </p>
      </div>
    </div>
  );
};
