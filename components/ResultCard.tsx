import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Share,
  ScrollView,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import type { ScoredJob } from '../utils/types';
import { useFontScale } from '../contexts/FontScaleContext';
import { colors, FONT } from '../constants/colors';

interface Props {
  job: ScoredJob;
}

export default function ResultCard({ job }: Props) {
  const { fontScale } = useFontScale();
  const [showContactOptions, setShowContactOptions] = useState(false);

  const hasPhone = !!(job.담당자전화 && job.담당자전화 !== '정보 없음');

  const handleCall = () => {
    if (!hasPhone) {
      Alert.alert('안내', '전화번호 정보가 없습니다.');
      return;
    }
    Linking.openURL(`tel:${job.담당자전화}`);
  };

  const handleSMS = () => {
    if (!hasPhone) {
      Alert.alert('안내', '전화번호 정보가 없습니다.');
      return;
    }
    Linking.openURL(`sms:${job.담당자전화}`);
  };

  const handleLink = () => {
    if (!job.링크) {
      Alert.alert('안내', '공고 링크 정보가 없습니다.');
      return;
    }
    if (Platform.OS === 'web') {
      const a = document.createElement('a');
      a.href = job.링크;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      Linking.openURL(job.링크);
    }
  };

  const handleShare = async () => {
    const text = `[구해요 요기서] ${job.채용공고명}\n회사: ${job.회사명}\n급여: ${job.급여정보}\n${job.링크}`;
    await Share.share({ message: text });
  };

  const similarityColor =
    job.유사도 >= 80 ? '#5F9B62' : job.유사도 >= 60 ? '#B87A10' : colors.error;

  return (
    <ScrollView style={styles.card} showsVerticalScrollIndicator={false}>
      {/* 1. 제목 / 회사명 / 유사도 */}
      <View style={styles.section}>
        <Text style={[styles.jobTitle, { fontSize: 24 * fontScale }]} numberOfLines={2}>
          {job.채용공고명}
        </Text>
        <Text style={[styles.companyName, { fontSize: 18 * fontScale }]}>{job.회사명}</Text>
        <View style={styles.similarityRow}>
          <Text style={[styles.similarityLabel, { color: similarityColor, fontSize: 20 * fontScale }]}>
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
        <InfoChip label="급여" text={job.급여정보} chipIndex={0} fontScale={fontScale} />
        <InfoChip label="요일" text={job.주N일} chipIndex={1} fontScale={fontScale} />
        <InfoChip label="시간" text={job.근무시간대} chipIndex={2} fontScale={fontScale} />
      </View>

      <View style={styles.divider} />

      {/* 3. 공고 요약 */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: 17 * fontScale }]}>공고 내용</Text>
        <Text style={[styles.bodyText, { fontSize: 20 * fontScale }]}>{job.공고요약}</Text>
      </View>

      {/* 4. 추천 이유 */}
      <View style={[styles.section, styles.highlightBox]}>
        <Text style={[styles.sectionTitle, { fontSize: 17 * fontScale }]}>추천 이유</Text>
        <Text style={[styles.bodyText, { fontSize: 20 * fontScale }]}>{job.추천이유}</Text>
      </View>

      {/* 5. 유의사항 */}
      <View style={[styles.section, styles.warningBox]}>
        <Text style={[styles.sectionTitle, styles.warningTitle, { fontSize: 17 * fontScale }]}>지원 시 유의사항</Text>
        <Text style={[styles.bodyText, styles.warningText, { fontSize: 20 * fontScale }]}>{job.유의사항}</Text>
      </View>

      {/* 6. 마감일 / 연락처 */}
      <View style={styles.metaRow}>
        <Text style={[styles.metaText, { fontSize: 17 * fontScale }]}>마감일: {job.마감일 || '정보 없음'}</Text>
        <Text style={[styles.metaText, { fontSize: 17 * fontScale }]}>담당자: {job.담당자전화 || '정보 없음'}</Text>
      </View>

      {/* 7. 바로 지원하기 버튼 */}
      <TouchableOpacity
        style={[styles.btn, styles.btnCall]}
        onPress={() => setShowContactOptions(true)}
        activeOpacity={0.8}
      >
        <Text style={[styles.btnText, { fontSize: 22 * fontScale }]}>바로 지원하기</Text>
      </TouchableOpacity>

      {Platform.OS === 'web' ? (
        // @ts-ignore
        <Text
          href={job.링크}
          hrefAttrs={{ target: '_blank', rel: 'noopener noreferrer' }}
          style={[styles.btn, styles.btnLink, styles.btnText, styles.btnLinkText,
                  { fontSize: 22 * fontScale, textAlign: 'center', textDecorationLine: 'none' }]}
        >
          공고 확인하기
        </Text>
      ) : (
        <TouchableOpacity style={[styles.btn, styles.btnLink]} onPress={handleLink} activeOpacity={0.8}>
          <Text style={[styles.btnText, styles.btnLinkText, { fontSize: 22 * fontScale }]}>공고 확인하기</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={[styles.btn, styles.btnShare]} onPress={handleShare} activeOpacity={0.8}>
        <Text style={[styles.btnText, styles.btnShareText, { fontSize: 22 * fontScale }]}>공유하기</Text>
      </TouchableOpacity>

      <View style={{ height: 24 }} />

      {/* 연락 수단 선택 모달 */}
      <Modal
        visible={showContactOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowContactOptions(false)}
      >
        <TouchableOpacity
          style={styles.contactOverlay}
          activeOpacity={1}
          onPress={() => setShowContactOptions(false)}
        >
          <View style={styles.contactBox}>
            <Text style={[styles.contactTitle, { fontSize: 18 * fontScale }]}>
              지원 방법을 선택해 주세요
            </Text>
            <TouchableOpacity
              style={[styles.contactBtn, styles.contactBtnCall, !hasPhone && styles.contactBtnDisabled]}
              onPress={() => {
                setShowContactOptions(false);
                handleCall();
              }}
              disabled={!hasPhone}
              activeOpacity={0.8}
            >
              <Text style={[styles.contactBtnText, { fontSize: 20 * fontScale }]}>
                📞  전화 지원하기
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contactBtn, styles.contactBtnSMS, !hasPhone && styles.contactBtnDisabled]}
              onPress={() => {
                setShowContactOptions(false);
                handleSMS();
              }}
              disabled={!hasPhone}
              activeOpacity={0.8}
            >
              <Text style={[styles.contactBtnSMSText, { fontSize: 20 * fontScale }]}>
                💬  문자 지원하기
              </Text>
            </TouchableOpacity>
            {!hasPhone && (
              <Text style={[styles.contactDisabledNote, { fontSize: 14 * fontScale }]}>
                담당자 연락처 정보가 없습니다
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const CHIP_COLORS = [
  { bg: colors.bgLight,   labelColor: colors.textMid },      // 급여 — 가장 연함
  { bg: colors.pinkLight, labelColor: colors.primary },      // 요일 — 중간
  { bg: colors.pink,      labelColor: colors.primaryDark },  // 시간 — 가장 진함
];

function InfoChip({
  label, text, chipIndex, fontScale,
}: {
  label: string; text: string; chipIndex: number; fontScale: number;
}) {
  const { bg, labelColor } = CHIP_COLORS[chipIndex] ?? CHIP_COLORS[0];
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.chipLabel, { color: labelColor, fontSize: 14 * fontScale }]}>{label}</Text>
      <Text style={[styles.chipText, { fontSize: 17 * fontScale }]}>
        {text || '정보 없음'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 14,
  },
  section: {
    paddingHorizontal: 22,
    paddingVertical: 16,
  },
  jobTitle: {
    fontFamily: FONT,
    color: colors.textDark,
    lineHeight: 34,
    marginBottom: 5,
    letterSpacing: 0.1,
  },
  companyName: {
    fontFamily: FONT,
    color: colors.textMid,
    marginBottom: 12,
  },
  similarityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  similarityLabel: {
    fontFamily: FONT,
  },
  similarityTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  similarityFill: {
    height: '100%',
    borderRadius: 3,
  },
  infoRow: {
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipLabel: {
    fontFamily: FONT,
    letterSpacing: 0.5,
  },
  chipText: { fontFamily: FONT, color: colors.textDark, flexShrink: 1, lineHeight: 24 },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 22,
    marginVertical: 2,
  },
  sectionTitle: {
    fontFamily: FONT,
    color: colors.primary,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  bodyText: {
    fontFamily: FONT,
    color: colors.textDark,
    lineHeight: 32,
  },
  highlightBox: {
    backgroundColor: colors.bgLight,
    marginHorizontal: 14,
    borderRadius: 10,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  warningBox: {
    backgroundColor: colors.yellowLight,
    marginHorizontal: 14,
    borderRadius: 10,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: colors.yellow,
  },
  warningTitle: { color: colors.textMid },
  warningText: { color: colors.textDark },
  metaRow: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaText: {
    fontFamily: FONT,
    color: colors.textLight,
  },
  btn: {
    marginHorizontal: 18,
    marginVertical: 5,
    paddingVertical: 19,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnCall: {
    backgroundColor: colors.primary,
    shadowColor: colors.primaryDark, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  btnLink: { backgroundColor: colors.bgCard, borderWidth: 2, borderColor: colors.primary },
  btnShare: { backgroundColor: colors.pinkLight, borderWidth: 1, borderColor: colors.border },
  btnText: { fontFamily: FONT, color: '#FFFFFF' },
  btnLinkText: { color: colors.primary },
  btnShareText: { color: colors.textMid },
  contactOverlay: {
    flex: 1,
    backgroundColor: 'rgba(92,61,46,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactBox: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 24,
    width: '90%',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  contactTitle: {
    fontFamily: FONT,
    color: colors.textDark,
    marginBottom: 4,
  },
  contactBtn: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 17,
    alignItems: 'center',
  },
  contactBtnCall: {
    backgroundColor: colors.primary,
    shadowColor: colors.primaryDark, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  contactBtnSMS: {
    backgroundColor: colors.bgCard,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  contactBtnDisabled: {
    opacity: 0.4,
  },
  contactBtnText: {
    fontFamily: FONT,
    color: '#FFFFFF',
  },
  contactBtnSMSText: {
    fontFamily: FONT,
    color: colors.primary,
  },
  contactDisabledNote: {
    fontFamily: FONT,
    color: colors.textLight,
    marginTop: 4,
  },
});
