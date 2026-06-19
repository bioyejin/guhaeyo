import React, { createContext, useContext, useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from '@expo-google-fonts/jua';
import { loadCSV } from '../utils/csvParser';
import type { SurveyAnswers, ScoredJob, JobEntry } from '../utils/types';

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
    Jua_400Regular: require('../assets/fonts/Jua_400Regular.ttf'),
    BlackHanSans_400Regular: require('../assets/fonts/BlackHanSans_400Regular.ttf'),
  });
  const [surveyAnswers, setSurveyAnswers] = useState<SurveyAnswers | null>(null);
  const [results, setResults] = useState<ScoredJob[] | null>(null);
  const [csvData, setCsvData] = useState<JobEntry[]>([]);
  const [regionNotice, setRegionNotice] = useState<string | null>(null);

  useEffect(() => {
    loadCSV()
      .then((data) => setCsvData(data))
      .catch((e) => console.error('[CSV] init error:', e));
  }, []);

  if (!fontsLoaded) return null;

  return (
    <AppContext.Provider
      value={{ surveyAnswers, setSurveyAnswers, results, setResults, csvData, regionNotice, setRegionNotice }}
    >
      <GestureHandlerRootView style={styles.root}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            animationDuration: 400,
          }}
        />
      </GestureHandlerRootView>
    </AppContext.Provider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
