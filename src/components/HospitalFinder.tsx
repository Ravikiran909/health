import React from 'react';
import { Facility } from '../types';
import { AllIndiaHospitalFinder } from './AllIndiaHospitalFinder';

interface HospitalFinderProps {
  onBookFacility: (facility: Facility) => void;
  isOnline: boolean;
  initialMode?: 'gps' | 'directory';
}

export const HospitalFinder: React.FC<HospitalFinderProps> = ({
  onBookFacility,
  isOnline,
}) => {
  return (
    <AllIndiaHospitalFinder
      onBookHospital={onBookFacility}
      isOnline={isOnline}
    />
  );
};
