import { GoogleGenerativeAI } from '@google/generative-ai';
import Constants from 'expo-constants';
import type { JobEntry, ScoredJob, SurveyAnswers } from './types';

function getApiKey(): string {
  return (Constants.expoConfig?.extra?.GEMINI_API_KEY as string) ?? '';
}

const MODEL_PRIORITY = ['gemini-3.5-flash', 'gemini-3.1-flash-lite'];

async function generateWithFallback(prompt: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.');
  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError: unknown;
  for (const modelName of MODEL_PRIORITY) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

function stripCodeBlock(text: string): string {
  return text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
}

export async function step1SelectJobTypes(
  personality: string[],
  workplaceLlmTexts: string[],
  allJobTypes: string[]
): Promise<string[]> {
  const systemPrompt = `당신은 고령자·중장년층 일자리 매칭 전문가입니다.
사용자의 성격과 희망 일터 설명을 보고, 아래 직종 목록 중 어울리는 직종을 선별해주세요.
반드시 JSON만 반환하세요. 마크다운 코드블록 없이 순수 JSON만 출력하세요.`;

  const userPrompt = `## 사용자 성격
${personality.join(', ')}

## 사용자가 원하는 일터
${workplaceLlmTexts.join('\n')}

## CSV에 존재하는 전체 직종 목록
${JSON.stringify(allJobTypes)}

## 요청
위 직종 목록 중 사용자의 성격과 원하는 일터와 연관성이 높은 직종을 모두 선별하세요.
직접 일치하지 않더라도 유사한 직종은 모두 포함하세요.

## 응답 형식
{ "선별직종": ["직종명1", "직종명2", ...] }`;

  const raw = stripCodeBlock(await generateWithFallback(systemPrompt + '\n\n' + userPrompt));
  const parsed = JSON.parse(raw) as { 선별직종: string[] };
  return parsed['선별직종'] ?? [];
}

export async function step3ScoreJobs(
  candidates: JobEntry[],
  answers: SurveyAnswers
): Promise<ScoredJob[]> {
  const certText =
    answers.certifications.includes('없음') || answers.certifications.length === 0
      ? '보유 자격증 없음'
      : answers.certifications.join(', ');

  const systemPrompt = `당신은 고령자·중장년층 일자리 매칭 전문가입니다.
아래 규칙에 따라 각 공고를 평가하고 유사도 상위 5개를 JSON으로 반환하세요.
반드시 JSON만 반환하세요. 마크다운 코드블록 없이 순수 JSON만 출력하세요.

스코어링 규칙:

즉시 탈락 (유사도 0, 결과에서 제외):
자격면허(자격증) 컬럼에 특정 자격증이 "필수" 또는 "필수조건"으로 명시되어 있는데 사용자가 해당 자격증을 보유하지 않은 경우.
"우대" 또는 "우대사항"으로 표기된 경우는 탈락 아님.

기본 유사도 산정 (0~100):
직무 적합도 60%: 모집직종 및 모집요강이 사용자의 성격과 원하는 일터와 얼마나 맞는지.

조정 기준 (유사도 증감, 최대 -35점):
1. 근무강도 조정 (최대 -10점):
   사용자가 "주로 앉아서"인데 공고가 야외 활동, 육체노동, 현장 업무인 경우 -10점
   사용자가 "가볍게 걷기"인데 공고가 장시간 서있기, 중노동인 경우 -5점
   근무 환경(실내/실외) 불일치 시 -5점
2. 근무빈도 조정 (최대 -10점):
   사용자가 "짧게(1~3일)"인데 공고 근무형태가 주5일 이상인 경우 -10점
   사용자가 "4~5일"인데 공고가 주1~2일인 경우 -5점
   사용자가 "상관없음"인 경우 조정 없음
3. 지역 조정 (최대 -15점):
   공고 근무지역이 사용자 희망 지역의 시군구와 정확히 일치하면 0점
   같은 시도(광역시/도)이지만 다른 시군구인 경우 -5점
   다른 시도인 경우 -15점
   재택근무 또는 원격 근무인 경우 0점 (지역 무관)

출력 시 반드시 지켜야 할 규칙:
1. 추천이유와 유의사항은 반드시 "~입니다", "~에요", "~합니다", "~해요" 형태의 공손한 존댓말로 작성하세요.
2. "패널티", "감점", "불일치", "{직종명}을 원하는 사용자" 등 내부 평가 용어나 점수 계산 표현은 절대 사용하지 마세요.
3. 근무 조건이 맞지 않을 경우 "~하실 수 있어요", "~가 있을 수 있습니다" 처럼 자연스럽게 안내하세요.
4. 예시 (올바른 표현): "야외 활동이 많아 체력 소모가 클 수 있습니다." / "주 5일 근무로 희망하신 일수보다 많을 수 있습니다."
5. 예시 (잘못된 표현): "근무강도 불일치 패널티 적용" / "요양보호사를 원하는 사용자에게 추천"
6. 마감일, 급여정보, 담당자전화, 근무시간대 등 공고 데이터에 해당 정보가 없는 항목은 절대 공란으로 두지 말고 반드시 "정보 없음"으로 채워주세요.

근무 조건 불일치가 있으면 유의사항 필드에 자연스러운 말투로 서술할 것.
불일치가 없더라도 자격증 우대사항, 거리 등 지원 시 참고할 점이 있으면 서술할 것.`;

  const regionText =
    answers.regions.length > 0
      ? answers.regions.map((r) => `${r.sido} ${r.sigungu}`.trim()).join(', ')
      : '지역 무관';

  const userInfoSection =
    answers.voiceMode && answers.voiceText
      ? `아래는 사용자가 자유롭게 말한 내용입니다.\n${answers.voiceText}\n- 희망 근무지역: ${regionText}`
      : `- 성격: ${answers.personality.join(', ')}
- 원하는 일터: ${answers.workplace.map((w) => w.llm).join(' / ')}
- 하루 활동량: ${answers.activityLevel}
- 근무 환경 선호: ${answers.environment}
- 희망 근무일수: ${answers.workDays}
- 보유 자격증: ${certText}
- 희망 근무지역: ${regionText}`;

  const userPrompt = `## 사용자 정보
${userInfoSection}

## 후보 공고 목록
${JSON.stringify(
  candidates.map((c) => ({
    채용공고명: c.채용공고명,
    자격면허: c.자격면허,
    근무형태: c.근무형태,
    근무지역: c.근무지역,
    모집직종: c.모집직종,
    모집요강: c.모집요강.slice(0, 800),
    마감일: c.마감일,
    담당자연락처: c.담당자연락처,
    링크: c.링크,
  }))
)}

## 요청
위 스코어링 규칙에 따라 유사도 상위 5개를 선정하세요. 즉시 탈락 조건 해당 공고는 반드시 제외하세요.

## 응답 형식 (JSON 배열, 5개)
[
  {
    "rank": 1,
    "채용공고명": "",
    "회사명": "",
    "유사도": 87,
    "급여정보": "",
    "주N일": "",
    "근무시간대": "",
    "공고요약": "",
    "추천이유": "",
    "유의사항": "",
    "마감일": "",
    "담당자전화": "",
    "링크": ""
  }
]`;

  const raw = stripCodeBlock(await generateWithFallback(systemPrompt + '\n\n' + userPrompt));
  const parsed = JSON.parse(raw) as ScoredJob[];
  return parsed;
}

// 음성 모드 전용 STEP 1 — 자유 발화에서 직종 선별
export async function step1SelectJobTypesByVoice(
  voiceText: string,
  allJobTypes: string[]
): Promise<string[]> {
  const systemPrompt = `당신은 고령자·중장년층 일자리 매칭 전문가입니다.
사용자가 자유롭게 말한 내용을 보고, 아래 직종 목록 중 관련 있는 직종을 선별해주세요.
반드시 JSON만 반환하세요. 마크다운 코드블록 없이 순수 JSON만 출력하세요.`;

  const userPrompt = `## 사용자가 자유롭게 말한 내용
${voiceText}

## CSV에 존재하는 전체 직종 목록
${JSON.stringify(allJobTypes)}

## 요청
사용자의 발화 내용을 바탕으로 관련성이 높은 직종을 모두 선별하세요.
직접 일치하지 않더라도 유사한 직종은 모두 포함하세요.

## 응답 형식
{ "선별직종": ["직종명1", "직종명2", ...] }`;

  const raw = stripCodeBlock(await generateWithFallback(systemPrompt + '\n\n' + userPrompt));
  const parsed = JSON.parse(raw) as { 선별직종: string[] };
  return parsed['선별직종'] ?? [];
}
