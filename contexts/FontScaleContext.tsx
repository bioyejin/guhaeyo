import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@guhaeyo_font_scale';
const MIN_SCALE = 0.8;
const MAX_SCALE = 1.4;
const STEP = 0.1;

interface FontScaleContextType {
  fontScale: number;
  increaseFontScale: () => void;
  decreaseFontScale: () => void;
}

const FontScaleContext = createContext<FontScaleContextType>({
  fontScale: 1.0,
  increaseFontScale: () => {},
  decreaseFontScale: () => {},
});

export function FontScaleProvider({ children }: { children: React.ReactNode }) {
  const [fontScale, setFontScale] = useState(1.0);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val !== null) {
        const n = parseFloat(val);
        if (!isNaN(n) && n >= MIN_SCALE && n <= MAX_SCALE) {
          setFontScale(n);
        }
      }
    });
  }, []);

  const increaseFontScale = () => {
    setFontScale((prev) => {
      const next = Math.min(parseFloat((prev + STEP).toFixed(1)), MAX_SCALE);
      AsyncStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  const decreaseFontScale = () => {
    setFontScale((prev) => {
      const next = Math.max(parseFloat((prev - STEP).toFixed(1)), MIN_SCALE);
      AsyncStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  return (
    <FontScaleContext.Provider value={{ fontScale, increaseFontScale, decreaseFontScale }}>
      {children}
    </FontScaleContext.Provider>
  );
}

export function useFontScale() {
  return useContext(FontScaleContext);
}
