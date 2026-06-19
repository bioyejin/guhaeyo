export interface Region {
  sido: string;
  sigungu: string;
}

export interface WorkplaceOption {
  display: string;
  llm: string;
}

export interface SurveyAnswers {
  regions: Region[];
  personality: string[];
  workplace: WorkplaceOption[];
  activityLevel: string;
  environment: string;
  workDays: string;
  certifications: string[];
}

export interface ScoredJob {
  rank: number;
  채용공고명: string;
  회사명: string;
  유사도: number;
  급여정보: string;
  주N일: string;
  근무시간대: string;
  공고요약: string;
  추천이유: string;
  유의사항: string;
  마감일: string;
  담당자전화: string;
  링크: string;
}

export interface JobEntry {
  채용공고명: string;
  자격면허: string;
  근무형태: string;
  근무지역: string;
  모집요강: string;
  모집직종: string;
  링크: string;
  주N일: string;
}
