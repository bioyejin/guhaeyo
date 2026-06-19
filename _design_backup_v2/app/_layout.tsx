import React, { createContext, useContext, useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts, Jua_400Regular } from '@expo-google-fonts/jua';
import { loadCSV } from '../utils/csvParser';
import type { SurveyAnswers, ScoredJob, JobEntry } from '../utils/types';

interface AppContextType {
  surveyAnswers: SurveyAnswers | null;
  setSurveyAnswers: (a: SurveyAnswers) => void;
  results: ScoredJob[] | null;
  setResults: (r: ScoredJob[]) => void;
  csvData: JobEntry[];
}

export const AppContext = createContext<AppContextType>({
  surveyAnswers: null,
  setSurveyAnswers: () => {},
  results: null,
  setResults: () => {},
  csvData: [],
});

export function useAppContext() {
  return useContext(AppContext);
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Jua_400Regular });
  const [surveyAnswers, setSurveyAnswers] = useState<SurveyAnswers | null>(null);
  const [results, setResults] = useState<ScoredJob[] | null>(null);
  const [csvData, setCsvData] = useState<JobEntry[]>([]);

  useEffect(() => {
    loadCSV()
      .then((data) => setCsvData(data))
      .catch((e) => console.error('[CSV] init error:', e));
  }, []);

  if (!fontsLoaded) return null;

  return (
    <AppContext.Provider
      value={{ surveyAnswers, setSurveyAnswers, results, setResults, csvData }}
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
