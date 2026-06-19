import React, { createContext, useContext, useState, useEffect } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import { loadCSV } from '../utils/csvParser';
import type { SurveyAnswers, ScoredJob, JobEntry } from '../utils/types';
import { FontScaleProvider } from '../contexts/FontScaleContext';

const SESSION_RESULTS = 'guhaeyo_results';
const SESSION_NOTICE  = 'guhaeyo_notice';

function sessionRead(key: string): string | null {
  if (Platform.OS !== 'web') return null;
  try { return sessionStorage.getItem(key); } catch { return null; }
}

function sessionWrite(key: string, value: string | null) {
  if (Platform.OS !== 'web') return;
  try {
    if (value !== null) sessionStorage.setItem(key, value);
    else sessionStorage.removeItem(key);
  } catch {}
}

interface AppContextType {
  surveyAnswers: SurveyAnswers | null;
  setSurveyAnswers: (a: SurveyAnswers) => void;
  results: ScoredJob[] | null;
  setResults: (r: ScoredJob[] | null) => void;
  csvData: JobEntry[];
  regionNotice: string | null;
  setRegionNotice: (n: string | null) => void;
}

export const AppContext = createContext<AppContextType>({
  surveyAnswers: null,
  setSurveyAnswers: () => {},
  results: null,
  setResults: () => {},
  csvData: [],
  regionNotice: null,
  setRegionNotice: () => {},
});

export function useAppContext() {
  return useContext(AppContext);
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    JalnanGothic: require('../assets/fonts/JalnanGothicTTF.ttf'),
  });

  const [surveyAnswers, setSurveyAnswers] = useState<SurveyAnswers | null>(null);

  // 웹 페이지 재로드 시 sessionStorage에서 동기 복원
  const [results, setResultsState] = useState<ScoredJob[] | null>(() => {
    const saved = sessionRead(SESSION_RESULTS);
    if (saved) { try { return JSON.parse(saved) as ScoredJob[]; } catch {} }
    return null;
  });

  const [regionNotice, setRegionNoticeState] = useState<string | null>(
    () => sessionRead(SESSION_NOTICE)
  );

  const [csvData, setCsvData] = useState<JobEntry[]>([]);

  useEffect(() => {
    loadCSV()
      .then((data) => setCsvData(data))
      .catch((e) => console.error('[CSV] init error:', e));
  }, []);

  const setResults = (r: ScoredJob[] | null) => {
    setResultsState(r);
    if (r) {
      sessionWrite(SESSION_RESULTS, JSON.stringify(r));
    } else {
      // 홈으로 돌아가거나 재검색 시 세션 초기화
      sessionWrite(SESSION_RESULTS, null);
      sessionWrite(SESSION_NOTICE, null);
    }
  };

  const setRegionNotice = (n: string | null) => {
    setRegionNoticeState(n);
    sessionWrite(SESSION_NOTICE, n);
  };

  if (!fontsLoaded) return null;

  return (
    <FontScaleProvider>
      <AppContext.Provider
        value={{ surveyAnswers, setSurveyAnswers, results, setResults, csvData, regionNotice, setRegionNotice }}
      >
        <GestureHandlerRootView style={styles.root}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              animationDuration: 700,
            }}
          />
        </GestureHandlerRootView>
      </AppContext.Provider>
    </FontScaleProvider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
