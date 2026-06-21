import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';
import { useAppContext } from './_layout';
import LoadingTips from '../components/LoadingTips';
import {
  loadCSV,
  getUniqueJobTypes,
  filterByJobTypes,
  filterByRegion,
  filterBySido,
  sampleJobs,
} from '../utils/csvParser';
import { step1SelectJobTypes, step1SelectJobTypesByVoice, step3ScoreJobs } from '../utils/llmService';
import { useFontScale } from '../contexts/FontScaleContext';
import { colors, FONT } from '../constants/colors';

// ── Canvas constants ──────────────────────────────────────────
const W = 300;
const H = 170;
const GY = H * 0.82; // groundY ≈ 139.4
const PI = Math.PI;

// ── Math helpers ──────────────────────────────────────────────
function posMod(a: number, b: number) {
  return ((a % b) + b) % b;
}

function gait(phase: number) {
  const s = Math.sin(phase);
  return s * (1 + 0.18 * s * s);
}

// SVG quadratic bezier path string
function quad(ax: number, ay: number, cx: number, cy: number, bx: number, by: number) {
  return `M ${ax} ${ay} Q ${cx} ${cy} ${bx} ${by}`;
}

// SVG arc path string (matches Flutter drawArc)
function arcPath(acx: number, acy: number, rx: number, ry: number, startAngle: number, sweepAngle: number) {
  const ea = startAngle + sweepAngle;
  const sx = acx + rx * Math.cos(startAngle);
  const sy = acy + ry * Math.sin(startAngle);
  const ex = acx + rx * Math.cos(ea);
  const ey = acy + ry * Math.sin(ea);
  const large = Math.abs(sweepAngle) > PI ? 1 : 0;
  const sweep = sweepAngle > 0 ? 1 : 0;
  return `M ${sx} ${sy} A ${rx} ${ry} 0 ${large} ${sweep} ${ex} ${ey}`;
}

// ── Flower ────────────────────────────────────────────────────
const FCOLS = ['#FF80AB', '#FFD54F', '#FF8A65', '#CE93D8', '#80CBC4', '#A5D6A7'];

function Flower({ fcx, gy, color, r }: { fcx: number; gy: number; color: string; r: number }) {
  const stemTop = gy - r * 2.6;
  return (
    <>
      <Line x1={fcx} y1={gy} x2={fcx} y2={stemTop} stroke="rgba(102,187,106,0.5)" strokeWidth={1.1} />
      {Array.from({ length: 6 }, (_, i) => {
        const a = i * PI / 3;
        return (
          <Circle
            key={i}
            cx={fcx + Math.cos(a) * r * 0.82}
            cy={stemTop + Math.sin(a) * r * 0.82}
            r={r * 0.76}
            fill={color}
            fillOpacity={0.5}
          />
        );
      })}
      <Circle cx={fcx} cy={stemTop} r={r * 0.52} fill="rgba(255,249,196,0.85)" />
    </>
  );
}

// ── Grandpa ───────────────────────────────────────────────────
function Grandpa({ cx, groundY, frame }: { cx: number; groundY: number; frame: number }) {
  const phase = frame * 2 * PI;
  const swing = gait(phase) * 12;
  const bob = Math.abs(Math.sin(phase * 2)) * 1.8;

  const SKIN = '#E3B48C', SKIN_S = '#CC9462', HAIR = '#B0BEC5';
  const SW = '#7B4F2E', PA = '#4A6270', SH = '#3E2723', CA = '#9C7B6B';

  const headR = 12;
  const top = groundY - 98 - bob;
  const headCY = top + headR;
  const shldrY = headCY + headR + 3;
  const hipY = shldrY + 34;
  const kneeY = hipY + 20;

  // Bezier midpoints (t=0.5 approximation for joint circles)
  const bKneeX = 0.25*(cx-2) + 0.5*(cx-2-swing*0.3) + 0.25*(cx-swing*0.82);
  const bKneeY = 0.25*hipY + 0.5*kneeY + 0.25*(groundY-6);
  const fKneeX = 0.25*(cx+2) + 0.5*(cx+2+swing*0.3) + 0.25*(cx+swing);
  const fKneeY = 0.25*hipY + 0.5*kneeY + 0.25*(groundY-6);
  const bElbX = 0.25*(cx-9) + 0.5*(cx-12-swing*0.22) + 0.25*(cx-10-swing*0.45);
  const bElbY = 0.25*(shldrY+4) + 0.5*(shldrY+16) + 0.25*(shldrY+24);
  const fWX = cx + 10 + swing * 0.45;
  const fWY = shldrY + 24;
  const fElbX = 0.25*(cx+9) + 0.5*(cx+12+swing*0.22) + 0.25*fWX;
  const fElbY = 0.25*(shldrY+4) + 0.5*(shldrY+16) + 0.25*fWY;

  return (
    <>
      {/* ① Back leg */}
      <Path d={quad(cx-2, hipY, cx-2-swing*0.3, kneeY, cx-swing*0.82, groundY-6)} stroke={PA} strokeWidth={10} fill="none" strokeLinecap="round" />
      <Circle cx={bKneeX} cy={bKneeY} r={5.5} fill={PA} />
      <Rect x={cx-swing*0.82+1-7} y={groundY-6.5} width={14} height={7} rx={4} fill={SH} />
      {/* ② Torso */}
      <Rect x={cx-11} y={shldrY} width={22} height={hipY-shldrY+5} rx={8} fill={SW} />
      <Circle cx={cx-2} cy={hipY} r={5.5} fill={PA} />
      <Circle cx={cx+2} cy={hipY} r={5.5} fill={PA} />
      <Ellipse cx={cx+1} cy={shldrY+4} rx={4.5} ry={3.5} fill="white" />
      {/* ③ Shoulders */}
      <Circle cx={cx-9} cy={shldrY+4} r={5.5} fill={SW} />
      <Circle cx={cx+9} cy={shldrY+4} r={5.5} fill={SW} />
      {/* ④ Back arm */}
      <Path d={quad(cx-9, shldrY+4, cx-12-swing*0.22, shldrY+16, cx-10-swing*0.45, shldrY+24)} stroke={SW} strokeWidth={9} fill="none" strokeLinecap="round" />
      <Circle cx={bElbX} cy={bElbY} r={4.5} fill={SW} />
      {/* ⑤ Front arm + cane */}
      <Path d={quad(cx+9, shldrY+4, cx+12+swing*0.22, shldrY+16, fWX, fWY)} stroke={SW} strokeWidth={9} fill="none" strokeLinecap="round" />
      <Circle cx={fElbX} cy={fElbY} r={4.5} fill={SW} />
      <Line x1={fWX+3} y1={fWY} x2={fWX+7} y2={groundY} stroke={CA} strokeWidth={2} strokeLinecap="round" />
      <Path d={arcPath(fWX+1, fWY-3, 4, 3, PI*0.4, PI*1.2)} stroke={CA} strokeWidth={2} fill="none" strokeLinecap="round" />
      {/* ⑥ Front leg */}
      <Path d={quad(cx+2, hipY, cx+2+swing*0.3, kneeY, cx+swing, groundY-6)} stroke={PA} strokeWidth={10} fill="none" strokeLinecap="round" />
      <Circle cx={fKneeX} cy={fKneeY} r={5.5} fill={PA} />
      <Rect x={cx+swing+2-7} y={groundY-6.5} width={14} height={7} rx={4} fill={SH} />
      {/* ⑦ Head */}
      <Ellipse cx={cx} cy={headCY} rx={headR} ry={headR*1.05} fill={SKIN} />
      <Path d={arcPath(cx-1, headCY-1, headR, headR, PI*0.72, PI*1.35)} stroke={HAIR} strokeWidth={5.5} fill="none" strokeLinecap="round" />
      <Circle cx={cx+6} cy={headCY+2} r={4.8} stroke="#6D4C41" strokeWidth={1.6} fill="none" />
      <Ellipse cx={cx+headR-0.5} cy={headCY+3.5} rx={2.5} ry={1.75} fill={SKIN_S} />
      <Ellipse cx={cx-headR+1} cy={headCY+1} rx={2.5} ry={3.5} fill={SKIN} />
    </>
  );
}

// ── Grandma ───────────────────────────────────────────────────
function Grandma({ cx, groundY, frame }: { cx: number; groundY: number; frame: number }) {
  const phase = frame * 2 * PI + PI;
  const swing = gait(phase) * 9.5;
  const bob = Math.abs(Math.sin(phase * 2)) * 1.8;

  const SKIN = '#EDC9A0', SKIN_S = '#CC9462', HAIR = '#CFD8DC';
  const DR = '#C0392B', DRD = '#922B21', SH = '#F0A500', DOT = '#E59A2F';

  const headR = 11;
  const top = groundY - 85 - bob;
  const headCY = top + headR;
  const shldrY = headCY + headR + 3;
  const hipY = shldrY + 31;
  const skirtHem = groundY - 6;
  const skirtTopY = shldrY + (hipY - shldrY) * 0.52;

  const bgKX = 0.25*(cx-2) + 0.5*(cx-2-swing*0.28) + 0.25*(cx-swing*0.78);
  const bgKY = 0.25*(hipY+4) + 0.5*(hipY+14) + 0.25*(groundY-6);
  const fgKX = 0.25*(cx+2) + 0.5*(cx+2+swing*0.28) + 0.25*(cx+swing);
  const fgKY = 0.25*(hipY+4) + 0.5*(hipY+14) + 0.25*(groundY-6);
  const bgElbX = 0.25*(cx-11) + 0.5*(cx-13-swing*0.18) + 0.25*(cx-10-swing*0.38);
  const bgElbY = 0.25*(shldrY+4) + 0.5*(shldrY+14) + 0.25*(shldrY+21);
  const fgElbX = 0.25*(cx+11) + 0.5*(cx+13+swing*0.18) + 0.25*(cx+10+swing*0.38);
  const fgElbY = 0.25*(shldrY+4) + 0.5*(shldrY+14) + 0.25*(shldrY+21);

  const STAR_OFFSETS = [[-5,10],[5,10],[-4,20],[4,20],[0,15]] as const;

  return (
    <>
      {/* ① Back leg (drawn first, skirt covers it) */}
      <Path d={quad(cx-2, hipY+4, cx-2-swing*0.28, hipY+14, cx-swing*0.78, groundY-6)} stroke={DRD} strokeWidth={9} fill="none" strokeLinecap="round" />
      <Circle cx={bgKX} cy={bgKY} r={5} fill={DRD} />
      <Rect x={cx-swing*0.78+1-6} y={groundY-6.25} width={12} height={6.5} rx={3} fill={SH} />
      {/* ② Front leg */}
      <Path d={quad(cx+2, hipY+4, cx+2+swing*0.28, hipY+14, cx+swing, groundY-6)} stroke={DRD} strokeWidth={9} fill="none" strokeLinecap="round" />
      <Circle cx={fgKX} cy={fgKY} r={5} fill={DRD} />
      <Rect x={cx+swing+1.5-6} y={groundY-6.25} width={12} height={6.5} rx={3} fill={SH} />
      {/* ③ Dress torso + skirt (covers leg tops) */}
      <Rect x={cx-13} y={shldrY} width={26} height={hipY-shldrY+5} rx={9} fill={DR} />
      <Path d={`M ${cx-13} ${skirtTopY} L ${cx-17} ${skirtHem} L ${cx+17} ${skirtHem} L ${cx+13} ${skirtTopY} Z`} fill={DR} />
      <Rect x={cx-17} y={skirtHem-2} width={34} height={3.5} rx={1.5} fill={DRD} />
      <Ellipse cx={cx+1} cy={shldrY+3} rx={4} ry={3} fill="white" />
      {/* Star pattern */}
      {STAR_OFFSETS.flatMap(([dx, dy], si) =>
        Array.from({ length: 6 }, (_, i) => {
          const a = i * PI / 3;
          return <Line key={`s${si}x${i}`} x1={cx+dx} y1={shldrY+dy} x2={cx+dx+Math.cos(a)*3} y2={shldrY+dy+Math.sin(a)*3} stroke={DOT} strokeWidth={1.2} />;
        })
      )}
      {/* ④ Shoulders */}
      <Circle cx={cx-11} cy={shldrY+4} r={5} fill={DR} />
      <Circle cx={cx+11} cy={shldrY+4} r={5} fill={DR} />
      {/* ⑤ Back arm */}
      <Path d={quad(cx-11, shldrY+4, cx-13-swing*0.18, shldrY+14, cx-10-swing*0.38, shldrY+21)} stroke={DR} strokeWidth={8.5} fill="none" strokeLinecap="round" />
      <Circle cx={bgElbX} cy={bgElbY} r={4} fill={DR} />
      {/* ⑥ Front arm */}
      <Path d={quad(cx+11, shldrY+4, cx+13+swing*0.18, shldrY+14, cx+10+swing*0.38, shldrY+21)} stroke={DR} strokeWidth={8.5} fill="none" strokeLinecap="round" />
      <Circle cx={fgElbX} cy={fgElbY} r={4} fill={DR} />
      {/* ⑦ Head */}
      <Ellipse cx={cx} cy={headCY} rx={headR} ry={headR*1.05} fill={SKIN} />
      <Path d={arcPath(cx-1, headCY-1, headR, headR, PI*0.68, PI*1.42)} stroke={HAIR} strokeWidth={5} fill="none" strokeLinecap="round" />
      <Circle cx={cx-headR+2} cy={headCY-headR+1} r={5} fill={HAIR} />
      <Circle cx={cx+5} cy={headCY+2} r={4} stroke="#6D4C41" strokeWidth={1.5} fill="none" />
      <Ellipse cx={cx+headR-0.5} cy={headCY+3} rx={2} ry={1.5} fill={SKIN_S} />
      <Ellipse cx={cx-headR+1} cy={headCY+1} rx={2.25} ry={3} fill={SKIN} />
    </>
  );
}

// ── Walking scene + fade dots ─────────────────────────────────
function GrandparentWalkScene() {
  const walkRef = useRef(0);
  const bgRef = useRef(0);
  const dotRef = useRef(0);
  const startRef = useRef(Date.now());
  const rafRef = useRef<number | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const loop = () => {
      const e = Date.now() - startRef.current;
      walkRef.current = (e % 900) / 900;
      bgRef.current = (e % 6000) / 6000;
      dotRef.current = (e % 1200) / 1200;
      setTick(t => (t + 1) % 1000);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current); };
  }, []);

  const walk = walkRef.current;
  const bg = bgRef.current;
  const dot = dotRef.current;

  // Dot fade: Flutter formula (v < 0.5 ? v*2 : (1-v)*2) clamped [0.2, 1.0]
  const dotOpacity = [0, 1, 2].map(i => {
    const v = posMod(dot + 1 - i / 3, 1);
    return Math.max(0.2, Math.min(1, v < 0.5 ? v * 2 : (1 - v) * 2));
  });

  const BACK_POS  = [0.09, 0.22, 0.35, 0.49, 0.62, 0.75, 0.88, 1.01];
  const FRONT_POS = [0.03, 0.15, 0.28, 0.41, 0.56, 0.69, 0.82, 0.95, 1.08];

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={W} height={H}>
        {/* Ground line */}
        <Line x1={0} y1={GY} x2={W} y2={GY} stroke="rgba(129,199,132,0.20)" strokeWidth={1.5} />

        {/* Back flowers (behind characters) */}
        {BACK_POS.map((pos, i) => {
          const x = posMod(pos - bg * 0.6, 1.1) * W;
          if (x > W + 10) return null;
          return <Flower key={`bf${i}`} fcx={x} gy={GY - 8} color={FCOLS[(i + 2) % 6]} r={3.0} />;
        })}

        {/* Characters — grandpa first, grandma on top (matches Flutter draw order) */}
        <Grandpa cx={W * 0.55} groundY={GY} frame={walk} />
        <Grandma cx={W * 0.43} groundY={GY} frame={walk} />

        {/* Front flowers (in front of characters) */}
        {FRONT_POS.map((pos, i) => {
          const x = posMod(pos - bg, 1.15) * W;
          if (x > W + 14) return null;
          return <Flower key={`ff${i}`} fcx={x} gy={GY} color={FCOLS[i % 6]} r={4.2} />;
        })}

      </Svg>

      {/* Sequential fade dots */}
      <View style={walkStyles.dots}>
        {dotOpacity.map((op, i) => (
          <View key={i} style={[walkStyles.dot, { opacity: op }]} />
        ))}
      </View>
    </View>
  );
}

const walkStyles = StyleSheet.create({
  dots: { flexDirection: 'row', gap: 8, marginTop: 16 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
});

// ── Loading screen ────────────────────────────────────────────
export default function LoadingScreen() {
  const router = useRouter();
  const { surveyAnswers, setResults, setRegionNotice, csvData } = useAppContext();
  const { fontScale } = useFontScale();
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (surveyAnswers) runPipeline();
  }, [surveyAnswers]);

  const runPipeline = async () => {
    if (!surveyAnswers) return;
    setErrorMsg('');

    if (surveyAnswers.voiceMode && surveyAnswers.voiceText) {
      await runVoicePipeline();
      return;
    }

    try {
      const jobs = csvData.length > 0 ? csvData : await loadCSV();

      const uniqueTypes = getUniqueJobTypes(jobs);
      const selectedTypes = await step1SelectJobTypes(
        surveyAnswers.personality,
        surveyAnswers.workplace.map((w) => w.llm),
        uniqueTypes
      );

      let candidates = filterByJobTypes(jobs, selectedTypes);

      const exactFiltered = filterByRegion(candidates, surveyAnswers.regions);
      if (exactFiltered.length >= 5) {
        candidates = exactFiltered;
        setRegionNotice(null);
      } else {
        const sidoFiltered = filterBySido(candidates, surveyAnswers.regions);
        if (sidoFiltered.length >= 5) {
          candidates = sidoFiltered;
          const sido = surveyAnswers.regions[0]?.sido ?? '해당 지역';
          setRegionNotice(`해당 지역 공고가 부족하여 '${sido}'에서 검색한 결과입니다.`);
        } else {
          setRegionNotice("해당 지역 공고가 부족하여 '전국'에서 검색한 결과입니다.");
        }
      }

      candidates = sampleJobs(candidates, 60);
      const scored = await step3ScoreJobs(candidates, surveyAnswers);

      setResults(scored);
      router.replace('/result');
    } catch (e: any) {
      console.error('[Pipeline]', e);
      setErrorMsg('분석 중 오류가 발생했어요. 다시 시도해 주세요.');
    }
  };

  const runVoicePipeline = async () => {
    try {
      const jobs = csvData.length > 0 ? csvData : await loadCSV();

      const uniqueTypes = getUniqueJobTypes(jobs);
      const selectedTypes = await step1SelectJobTypesByVoice(
        surveyAnswers!.voiceText!,
        uniqueTypes
      );
      let candidates = filterByJobTypes(jobs, selectedTypes);

      const regions = surveyAnswers!.regions;
      if (regions.length > 0) {
        const exactFiltered = filterByRegion(candidates, regions);
        if (exactFiltered.length >= 5) {
          candidates = exactFiltered;
          setRegionNotice(null);
        } else {
          const sidoFiltered = filterBySido(candidates, regions);
          if (sidoFiltered.length >= 5) {
            candidates = sidoFiltered;
            const sido = regions[0]?.sido ?? '해당 지역';
            setRegionNotice(`해당 지역 공고가 부족하여 '${sido}'에서 검색한 결과입니다.`);
          } else {
            setRegionNotice("해당 지역 공고가 부족하여 '전국'에서 검색한 결과입니다.");
          }
        }
      } else {
        setRegionNotice(null);
      }

      candidates = sampleJobs(candidates, 60);
      const scored = await step3ScoreJobs(candidates, surveyAnswers!);

      setResults(scored);
      router.replace('/result');
    } catch (e: any) {
      console.error('[VoicePipeline]', e);
      setErrorMsg('분석 중 오류가 발생했어요. 다시 시도해 주세요.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <Image
        source={require('../assets/images/flower_bg.png')}
        style={[StyleSheet.absoluteFillObject, styles.flowerBg]}
        resizeMode="cover"
      />
      <View style={styles.container}>
        <GrandparentWalkScene />

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={[styles.errorText, { fontSize: 22 * fontScale }]}>{errorMsg}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={runPipeline}
              activeOpacity={0.8}
            >
              <Text style={[styles.retryBtnText, { fontSize: 22 * fontScale }]}>다시 시도하기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <LoadingTips />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flowerBg: { opacity: 0.06 },
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 36, paddingHorizontal: 28,
  },
  errorBox: { alignItems: 'center', gap: 16 },
  errorText: { fontFamily: FONT, color: colors.error, textAlign: 'center', lineHeight: 32 },
  retryBtn: {
    backgroundColor: colors.primary, borderRadius: 10,
    paddingVertical: 18, paddingHorizontal: 40,
    shadowColor: colors.primaryDark, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  retryBtnText: { fontFamily: FONT, color: '#fff' },
});
