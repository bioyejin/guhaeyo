import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Modal,
  ScrollView,
  Linking,
  Alert,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from './_layout';
import { filterByRegion, filterBySido } from '../utils/csvParser';
import type { JobEntry } from '../utils/types';
import { useFontScale } from '../contexts/FontScaleContext';
import FontScaleButtons from '../components/FontScaleButtons';
import { colors, primaryGradient, FONT } from '../constants/colors';

const { width: SCREEN_W } = Dimensions.get('window');
const MAX_MORE_JOBS = 15;

function buildJobSummary(job: JobEntry): string {
  const parts: string[] = [];
  if (job.모집직종) {
    parts.push(`이 공고는 ${job.모집직종} 분야의 일자리 공고입니다.`);
  } else {
    parts.push('지역 내 일자리 공고입니다.');
  }
  if (job.모집요강 && job.모집요강.trim()) {
    const text = job.모집요강.trim();
    const short = text.length > 90 ? text.slice(0, 90).trimEnd() + '...' : text;
    parts.push(short);
  }
  return parts.join(' ');
}

function buildConsiderations(job: JobEntry): string[] {
  const items: string[] = [];
  if (job.근무지역) items.push(`근무 장소는 ${job.근무지역}입니다.`);
  if (job.마감일 && job.마감일.trim()) items.push(`지원 마감일은 ${job.마감일}입니다.`);
  if (job.담당자연락처 && job.담당자연락처.trim()) {
    items.push(`문의는 ${job.담당자연락처}로 연락해 주세요.`);
  }
  return items;
}

export default function MoreJobsScreen() {
  const router = useRouter();
  const { csvData, surveyAnswers, results } = useAppContext();
  const { fontScale } = useFontScale();
  const [selectedJob, setSelectedJob] = useState<JobEntry | null>(null);

  type RegionScope = 'exact' | 'sido' | 'nationwide';

  const { moreJobs, regionScope } = useMemo(() => {
    if (!csvData || csvData.length === 0) return { moreJobs: [], regionScope: 'exact' as RegionScope };

    const regions = surveyAnswers?.regions ?? [];
    const excludedTitles = new Set(results?.map((r) => r.채용공고명) ?? []);

    let filtered = csvData;
    let regionScope: RegionScope = 'exact';

    if (regions.length > 0) {
      const exact = filterByRegion(csvData, regions);
      if (exact.length > 0) {
        filtered = exact;
        regionScope = 'exact';
      } else {
        const sido = filterBySido(csvData, regions);
        if (sido.length > 0) {
          filtered = sido;
          regionScope = 'sido';
        } else {
          filtered = csvData;
          regionScope = 'nationwide';
        }
      }
    }

    return {
      moreJobs: filtered.filter((j) => !excludedTitles.has(j.채용공고명)).slice(0, MAX_MORE_JOBS),
      regionScope,
    };
  }, [csvData, surveyAnswers, results]);

  const handleLink = (url: string) => {
    if (!url) { Alert.alert('안내', '공고 링크 정보가 없습니다.'); return; }
    if (Platform.OS === 'web') {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      Linking.openURL(url);
    }
  };

  const renderItem = ({ item }: { item: JobEntry }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => setSelectedJob(item)}
      activeOpacity={0.75}
    >
      <Text style={[styles.itemTitle, { fontSize: 17 * fontScale }]} numberOfLines={2}>
        {item.채용공고명 || '(제목 없음)'}
      </Text>
      <Text style={[styles.itemCompany, { fontSize: 14 * fontScale }]}>
        {item.회사명 || '회사명 정보 없음'}
      </Text>
      <View style={styles.itemMetaRow}>
        <View style={styles.itemTag}>
          <Text style={[styles.itemTagText, { fontSize: 12 * fontScale }]}>
            {item.모집직종 || '직종 정보 없음'}
          </Text>
        </View>
        <Text style={[styles.itemMeta, { fontSize: 12 * fontScale }]} numberOfLines={1}>
          {item.근무지역 || '지역 정보 없음'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <Image
        source={require('../assets/images/flower_bg.png')}
        style={[StyleSheet.absoluteFillObject, styles.flowerBg]}
        resizeMode="cover"
      />
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />

        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { fontSize: 20 * fontScale }]}>내 지역 공고 더보기</Text>
        </View>

        {/* 안내 배너 */}
        <View style={[styles.warningBanner, regionScope !== 'exact' && styles.warningBannerExpanded]}>
          <Text style={[styles.warningText, { fontSize: 13 * fontScale }]}>
            {regionScope === 'sido'
              ? `⚠️  ${surveyAnswers?.regions[0]?.sigungu || surveyAnswers?.regions[0]?.sido || '선택 지역'} 공고가 부족하여 ${surveyAnswers?.regions[0]?.sido ?? '해당 시도'} 전체로 범위를 넓혀 검색한 결과입니다. AI 맞춤 추천과 관계없는 목록입니다.`
              : regionScope === 'nationwide'
              ? '⚠️  해당 지역 공고가 부족하여 전국으로 범위를 넓혀 검색한 결과입니다. AI 맞춤 추천과 관계없는 목록입니다.'
              : '⚠️  아래 공고들은 AI 맞춤 추천과 관계없이 선택하신 지역의 공고를 보여드리는 목록입니다.'}
          </Text>
        </View>

        {/* 목록 */}
        {moreJobs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { fontSize: 17 * fontScale }]}>
              해당 지역의 추가 공고를 찾지 못했어요.
            </Text>
          </View>
        ) : (
          <FlatList
            data={moreJobs}
            keyExtractor={(item, idx) => `${item.채용공고명}_${idx}`}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* 하단 돌아가기 버튼 */}
        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.85}>
            <LinearGradient colors={primaryGradient} style={styles.backBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={[styles.backBtnText, { fontSize: 18 * fontScale }]}>← 결과로 돌아가기</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* 공고 상세 팝업 */}
        <Modal
          visible={!!selectedJob}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedJob(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSelectedJob(null)}
          >
            <TouchableOpacity
              style={styles.jobCard}
              activeOpacity={1}
              onPress={() => {}}
            >
              <ScrollView showsVerticalScrollIndicator={false} style={styles.jobCardScroll}>
                <Text style={[styles.popupTitle, { fontSize: 18 * fontScale }]}>
                  {selectedJob?.채용공고명 || '(제목 없음)'}
                </Text>
                <Text style={[styles.popupCompany, { fontSize: 14 * fontScale }]}>
                  {selectedJob?.회사명 || '정보 없음'}
                </Text>

                <View style={styles.popupDivider} />

                <Text style={[styles.popupLabel, { fontSize: 13 * fontScale }]}>공고 소개</Text>
                <Text style={[styles.popupBody, { fontSize: 14 * fontScale }]}>
                  {selectedJob ? buildJobSummary(selectedJob) : ''}
                </Text>

                {selectedJob && buildConsiderations(selectedJob).length > 0 && (
                  <>
                    <View style={styles.popupDivider} />
                    <Text style={[styles.popupLabel, { fontSize: 13 * fontScale }]}>지원 전 확인하세요</Text>
                    {buildConsiderations(selectedJob).map((c, i) => (
                      <View key={i} style={styles.considerItem}>
                        <Text style={[styles.considerBullet, { fontSize: 14 * fontScale }]}>•</Text>
                        <Text style={[styles.considerText, { fontSize: 14 * fontScale }]}>{c}</Text>
                      </View>
                    ))}
                  </>
                )}

                {Platform.OS === 'web' ? (
                  // @ts-ignore
                  <Text
                    href={selectedJob?.링크}
                    hrefAttrs={{ target: '_blank', rel: 'noopener noreferrer' }}
                    style={[styles.popupLinkBtn, styles.popupLinkBtnText,
                            { fontSize: 16 * fontScale, textAlign: 'center', textDecorationLine: 'none' }]}
                  >
                    공고 바로가기
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleLink(selectedJob?.링크 ?? '')}
                    activeOpacity={0.85}
                  >
                    <LinearGradient colors={primaryGradient} style={styles.popupLinkBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                      <Text style={[styles.popupLinkBtnText, { fontSize: 16 * fontScale }]}>
                        공고 바로가기
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                <View style={{ height: 16 }} />
              </ScrollView>

              <View style={styles.closeRow}>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setSelectedJob(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>

      <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        <FontScaleButtons topOffset={4} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  flowerBg: { opacity: 0.06 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  headerTitle: { fontFamily: FONT, color: colors.textDark },
  warningBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.yellowLight,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  warningBannerExpanded: {
    backgroundColor: colors.bgLight,
    borderColor: colors.yellow,
  },
  warningText: {
    fontFamily: FONT,
    color: colors.textDark,
    lineHeight: 20,
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 16 },
  listItem: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemTitle: {
    fontFamily: FONT,
    color: colors.textDark,
    lineHeight: 26,
    marginBottom: 4,
  },
  itemCompany: {
    fontFamily: FONT,
    color: colors.primary,
    marginBottom: 8,
  },
  itemMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  itemTag: {
    backgroundColor: colors.pinkLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemTagText: { fontFamily: FONT, color: colors.textMid },
  itemMeta: { fontFamily: FONT, color: colors.textLight },
  separator: { height: 10 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontFamily: FONT, color: colors.textMid, textAlign: 'center', lineHeight: 28 },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  backBtn: {
    borderRadius: 14,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  backBtnText: { fontFamily: FONT, color: '#FFFFFF' },
  // 팝업 모달
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(92,61,46,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  jobCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 24,
    width: SCREEN_W - 40,
    maxHeight: '80%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  jobCardScroll: { padding: 24 },
  popupTitle: {
    fontFamily: FONT,
    color: colors.textDark,
    lineHeight: 28,
    marginBottom: 6,
  },
  popupCompany: {
    fontFamily: FONT,
    color: colors.primary,
    marginBottom: 4,
  },
  popupDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  popupLabel: {
    fontFamily: FONT,
    color: colors.primary,
    marginBottom: 8,
  },
  popupBody: {
    fontFamily: FONT,
    color: colors.textDark,
    lineHeight: 22,
  },
  considerItem: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  considerBullet: {
    fontFamily: FONT,
    color: colors.primary,
    lineHeight: 22,
  },
  considerText: {
    fontFamily: FONT,
    color: colors.textDark,
    lineHeight: 22,
    flex: 1,
  },
  popupLinkBtn: {
    marginTop: 20,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  popupLinkBtnText: {
    fontFamily: FONT,
    color: '#FFFFFF',
  },
  closeRow: {
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  closeBtn: {
    width: 48, height: 48,
    borderRadius: 24,
    backgroundColor: colors.pinkLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  closeBtnText: {
    fontFamily: FONT,
    color: colors.textDark,
    fontSize: 18,
    lineHeight: 22,
  },
});
