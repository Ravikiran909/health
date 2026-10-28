import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: UserProfile;
  setRole: (role: UserRole) => void;
  availableRoles: { role: UserRole; title: string; kannadaTitle: string; desc: string; kannadaDesc: string }[];
  isAsha: boolean;
  isAdmin: boolean;
  isDoctor: boolean;
  isCitizen: boolean;
}

const PRESET_USERS: Record<UserRole, UserProfile> = {
  citizen: {
    id: 'usr-cit-01',
    name: 'Kavitha M. Gowda (ಕವಿತಾ ಗೌಡ)',
    role: 'citizen',
    phone: '+91 94801 23451',
    village: 'Bilikere Village',
  },
  asha: {
    id: 'usr-asha-042',
    name: 'Sunita Bai (ಸುನಿತಾ ಬಾಯಿ - ಆಶಾ)',
    role: 'asha',
    phone: '+91 98451 10042',
    village: 'Bilikere Sub-Centre Area',
    ashaId: 'KA-ASHA-042',
    facilityName: 'Bilikere Primary Health Centre',
  },
  doctor: {
    id: 'usr-doc-08',
    name: 'Dr. Praveen Kumar, MBBS (ವೈದ್ಯಾಧಿಕಾರಿ)',
    role: 'doctor',
    phone: '+91 82222 52110',
    facilityName: 'Bilikere Primary Health Centre',
  },
  admin: {
    id: 'usr-admin-01',
    name: 'Dr. B. Manjunath (District Health Officer - DHO)',
    role: 'admin',
    phone: '+91 82124 20555',
    facilityName: 'District Health Administration Mysuru',
  },
};

const ROLES_LIST: { role: UserRole; title: string; kannadaTitle: string; desc: string; kannadaDesc: string }[] = [
  {
    role: 'citizen',
    title: 'Citizen / Patient',
    kannadaTitle: 'ನಾಗರಿಕ / ರೋಗಿ',
    desc: 'Access hospital finder, voice navigation, appointment booking, and emergency help.',
    kannadaDesc: 'ಆಸ್ಪತ್ರೆ ಹುಡುಕಿ, ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ವಿನಂತಿಸಿ ಮತ್ತು 108 ತುರ್ತು ಸಹಾಯ ಪಡೆಯಿರಿ.',
  },
  {
    role: 'asha',
    title: 'ASHA Saathi Worker',
    kannadaTitle: 'ಆಶಾ ಕಾರ್ಯಕರ್ತೆ (ಸಾಥಿ)',
    desc: 'Manage village maternal checkups, track immunizations, and create hospital referrals.',
    kannadaDesc: 'ಗರ್ಭಿಣಿಯರ ಆರೈಕೆ, ಲಸಿಕಾ ವೇಳಾಪಟ್ಟಿ ಮತ್ತು ಆಸ್ಪತ್ರೆ ರೆಫರಲ್ ನಿರ್ವಹಣೆ.',
  },
  {
    role: 'doctor',
    title: 'PHC Medical Officer',
    kannadaTitle: 'ಪ್ರಾಥಮಿಕ ಕೇಂದ್ರದ ವೈದ್ಯರು',
    desc: 'Review appointment requests, manage high-risk cases, and confirm referral admissions.',
    kannadaDesc: 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ದೃಢೀಕರಣ ಮತ್ತು ತುರ್ತು ರೋಗಿಗಳ ದಾಖಲಾತಿ ಪರಿಶೀಲನೆ.',
  },
  {
    role: 'admin',
    title: 'District Health Officer',
    kannadaTitle: 'ಜಿಲ್ಲಾ ಆರೋಗ್ಯಾಧಿಕಾರಿ',
    desc: 'Review public health analytics, language adoption rates, and facility utilization.',
    kannadaDesc: 'ಜಿಲ್ಲಾಮಟ್ಟದ ಆರೋಗ್ಯ ಅಂಕಿಅಂಶಗಳು ಮತ್ತು ಸೌಲಭ್ಯಗಳ ವಿಶ್ಲೇಷಣೆ.',
  },
];

const AuthContext = createContext<AuthContextType>({
  currentUser: PRESET_USERS.citizen,
  setRole: () => {},
  availableRoles: ROLES_LIST,
  isAsha: false,
  isAdmin: false,
  isDoctor: false,
  isCitizen: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('healthconnect_role');
    return (saved as UserRole) || 'citizen';
  });

  const setRole = (role: UserRole) => {
    setCurrentRole(role);
    localStorage.setItem('healthconnect_role', role);
  };

  const currentUser = PRESET_USERS[currentRole] || PRESET_USERS.citizen;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setRole,
        availableRoles: ROLES_LIST,
        isAsha: currentRole === 'asha',
        isAdmin: currentRole === 'admin',
        isDoctor: currentRole === 'doctor',
        isCitizen: currentRole === 'citizen',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
