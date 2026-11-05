import React, { createContext, useContext, useState, useEffect } from 'react';

const UnitContext = createContext(null);

const STORAGE_KEY = 'secondskin_setting_units';
const DEFAULT_UNITS = 'Hệ mét (m/s², km/h, cm)';

export function UnitProvider({ children }) {
  const [unitsSetting, setUnitsSetting] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || DEFAULT_UNITS;
    } catch {
      return DEFAULT_UNITS;
    }
  });

  const isImperial = typeof unitsSetting === 'string' && (
    unitsSetting.includes('Hệ Anh-Mỹ') || unitsSetting.toLowerCase().includes('imperial')
  );

  // Synchronize unit changes across components and storage
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (stored && stored !== unitsSetting) {
          setUnitsSetting(stored);
        }
      } catch {
        // ignore JSON parse errors
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('secondskin_units_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('secondskin_units_updated', handleStorageChange);
    };
  }, [unitsSetting]);

  const updateUnits = (newSetting) => {
    setUnitsSetting(newSetting);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSetting));
    window.dispatchEvent(new Event('secondskin_units_updated'));
  };

  // Measurement unit labels
  const unitLabels = {
    accel: isImperial ? 'G' : 'm/s²',
    speed: isImperial ? 'mph' : 'km/h',
    height: isImperial ? 'in' : 'cm',
    distance: isImperial ? 'mi' : 'km',
  };

  // Convert acceleration (input is in SI m/s²)
  const convertAccel = (mps2) => {
    const val = Number(mps2) || 0;
    if (isImperial) {
      return +(val / 9.81).toFixed(2);
    }
    return +val.toFixed(2);
  };

  const formatAccel = (mps2, decimals) => {
    const dec = decimals ?? (isImperial ? 2 : 1);
    const converted = convertAccel(mps2);
    return `${converted.toFixed(dec)} ${unitLabels.accel}`;
  };

  // Convert speed (input is in km/h)
  const convertSpeed = (kmh) => {
    const val = Number(kmh) || 0;
    if (isImperial) {
      return +(val * 0.621371).toFixed(1);
    }
    return +val.toFixed(1);
  };

  const formatSpeed = (kmh, decimals = 1) => {
    const converted = convertSpeed(kmh);
    return `${converted.toFixed(decimals)} ${unitLabels.speed}`;
  };

  // Convert jump height (input is in cm)
  const convertHeight = (cm) => {
    const val = Number(cm) || 0;
    if (isImperial) {
      return +(val * 0.3937).toFixed(1);
    }
    return +val.toFixed(0);
  };

  const formatHeight = (cm, decimals) => {
    const dec = decimals ?? (isImperial ? 1 : 0);
    const converted = convertHeight(cm);
    return `${converted.toFixed(dec)} ${unitLabels.height}`;
  };

  const value = {
    unitsSetting,
    isImperial,
    unitLabels,
    convertAccel,
    formatAccel,
    convertSpeed,
    formatSpeed,
    convertHeight,
    formatHeight,
    updateUnits
  };

  return <UnitContext.Provider value={value}>{children}</UnitContext.Provider>;
}

export function useUnit() {
  const ctx = useContext(UnitContext);
  if (!ctx) {
    return {
      unitsSetting: DEFAULT_UNITS,
      isImperial: false,
      unitLabels: { accel: 'm/s²', speed: 'km/h', height: 'cm', distance: 'km' },
      convertAccel: (v) => +Number(v || 0).toFixed(2),
      formatAccel: (v, d = 1) => `${Number(v || 0).toFixed(d)} m/s²`,
      convertSpeed: (v) => +Number(v || 0).toFixed(1),
      formatSpeed: (v, d = 1) => `${Number(v || 0).toFixed(d)} km/h`,
      convertHeight: (v) => +Number(v || 0).toFixed(0),
      formatHeight: (v, d = 0) => `${Number(v || 0).toFixed(d)} cm`,
      updateUnits: () => {}
    };
  }
  return ctx;
}
