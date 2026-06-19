import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Share,
  ScrollView,
  Alert,
} from 'react-native';
import type { ScoredJob } from '../utils/types';

interface Props {
  job: ScoredJob;
}

export default function ResultCard({ job }: Props) {
  const handleCall = () => {
    if (!job.담당자전화 || job.담당자전화 === '정보 없음') {
      Alert.alert('안내', '전화번호 정보가 없습니다.');
      return;
    }
    Linking.openURL(`tel:${job.담당자전화}`);
  };

  const handleLink = () => {
    if (!job.링크) {
      Alert.alert('안내', '공고 링크 정보가 없습니다.');
      return;
    }
    Linking.openURL(job.링크);
  };

  const handleShare = async () => {
    const text = `[구해요 요기서] ${job.채용공고명}\n회사: ${job.회사명}\n급여: ${job.급여정보}\n${job.링크}`;
    await Share.share({ message: text });
  };

  const similarityColor =
    job.유사도 >= 80 ? '#2E7D32' : job.유사도 >= 60 ? '#F9A825' : '#E64A19';

  return (
    <ScrollView style={styles.card} showsVerticalScrollIndicator={false}>
      {/* 1. 제목 / 회사명 / 유사도 */}
      <View style={styles.section}>
        <Text style={styles.jobTitle} numberOfLines={2}>
          {job.채용공고명}
        </Text>
        <Text style={styles.companyName}>{job.회사명}</Text>
        <View style={styles.similarityRow}>
          <Text style={[styles.similarityLabel, { color: similarityColor }]}>
            AI 적합도 {job.유사도}%
          </Text>
        </View>
        <View style={styles.similarityTrack}>
          <View
            style={[
              styles.similarityFill,
              { width: `${job.유사도}%`, backgroundColor: similarityColor },
            ]}
          />
        </View>
      </View>

      {/* 2. 급여 / 근무일 / 시간대 */}
      <View style={styles.infoRow}>
        <InfoChip icon="💰" text={job.급여정보} />
        <InfoChip icon="📅" text={job.주N일} />
        <InfoChip icon="🕐" text={job.근무시간대} />
      </View>

      <View style={styles.divider} />

      {/* 3. 공고 요약 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>공고 내용</Text>
        <Text style={styles.bodyText}>{job.공고요약}</Text>
      </View>

      {/* 4. 추천 이유 */}
      <View style={[styles.section, styles.highlightBox]}>
        <Text style={styles.sectionTitle}>추천 이유</Text>
        <Text style={styles.bodyText}>{job.추천이유}</Text>
      </View>

      {/* 5. 유의사항 */}
      <View style={[styles.section, styles.warningBox]}>
        <Text style={[styles.sectionTitle, styles.warningTitle]}>지원 시 유의사항</Text>
        <Text style={[styles.bodyText, styles.warningText]}>{job.유의사항}</Text>
      </View>

      {/* 6. 마감일 / 연락처 */}
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>마감일: {job.마감일}</Text>
        <Text style={styles.metaText}>담당자: {job.담당자전화}</Text>
      </View>

      {/* 7. 버튼 3개 */}
      <TouchableOpacity style={[styles.btn, styles.btnCall]} onPress={handleCall} activeOpacity={0.8}>
        <Text style={styles.btnText}>📞 바로 전화 지원하기</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.btnLink]} onPress={handleLink} activeOpacity={0.8}>
        <Text style={[styles.btnText, styles.btnLinkText]}>🔍 공고 확인하기</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.btnShare]} onPress={handleShare} activeOpacity={0.8}>
        <Text style={[styles.btnText, styles.btnShareText]}>📤 공유하기</Text>
      </TouchableOpacity>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

function InfoChip({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipIcon}>{icon}</Text>
      <Text style={styles.chipText}>
        {text || '정보 없음'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1B5E20',
    lineHeight: 32,
    marginBottom: 6,
  },
  companyName: {
    fontSize: 20,
    color: '#555',
    marginBottom: 10,
  },
  similarityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  similarityLabel: {
    fontSize: 22,
    fontWeight: '700',
  },
  similarityTrack: {
    height: 10,
    backgroundColor: '#E8F5E9',
    borderRadius: 5,
    overflow: 'hidden',
  },
  similarityFill: {
    height: '100%',
    borderRadius: 5,
  },
  infoRow: {
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  chipIcon: { fontSize: 18, lineHeight: 26 },
  chipText: { fontSize: 18, color: '#2E7D32', fontWeight: '600', flexShrink: 1, lineHeight: 26 },
  divider: {
    height: 1,
    backgroundColor: '#E8F5E9',
    marginHorizontal: 20,
    marginVertical: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#388E3C',
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 20,
    color: '#333',
    lineHeight: 30,
  },
  highlightBox: {
    backgroundColor: '#F1F8E9',
    marginHorizontal: 12,
    borderRadius: 16,
    marginVertical: 6,
  },
  warningBox: {
    backgroundColor: '#FFF8E1',
    marginHorizontal: 12,
    borderRadius: 16,
    marginVertical: 6,
  },
  warningTitle: { color: '#F57F17' },
  warningText: { color: '#5D4037' },
  metaRow: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 4,
  },
  metaText: {
    fontSize: 18,
    color: '#666',
  },
  btn: {
    marginHorizontal: 16,
    marginVertical: 6,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
  },
  btnCall: { backgroundColor: '#43A047' },
  btnLink: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#43A047' },
  btnShare: { backgroundColor: '#E8F5E9' },
  btnText: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  btnLinkText: { color: '#43A047' },
  btnShareText: { color: '#2E7D32' },
});
