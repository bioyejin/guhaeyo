import { Asset } from 'expo-asset';
import Papa from 'papaparse';
import type { JobEntry, Region } from './types';

let cachedJobs: JobEntry[] | null = null;

function normalizeWorkDays(input: string): string {
  const match = input.match(/주\s*(\d+)\s*일/);
  if (match) return `주${match[1]}일`;
  if (input.includes('주5일') || input.includes('5일')) return '주5일';
  return input.trim() || '정보 없음';
}

export async function loadCSV(): Promise<JobEntry[]> {
  if (cachedJobs) return cachedJobs;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const asset = Asset.fromModule(require('../assets/고용24_고령우대_통합.csv'));
    await asset.downloadAsync();

    const uri = asset.localUri ?? asset.uri;
    const response = await fetch(uri);
    const text = await response.text();

    const result = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    });

    cachedJobs = result.data.map((row) => ({
      채용공고명: row['채용공고명'] ?? '',
      자격면허: row['자격면허(자격증)'] ?? row['자격면허'] ?? '',
      근무형태: row['근무형태(주N일)'] ?? row['고용형태_근무형태'] ?? row['근무형태'] ?? '',
      근무지역: row['근무지역'] ?? row['근무조건_지역'] ?? '',
      모집요강: row['모집요강'] ?? '',
      모집직종: row['모집직종'] ?? '',
      링크: row['링크'] ?? '',
      주N일: normalizeWorkDays(row['근무형태(주N일)'] ?? row['고용형태_근무형태'] ?? row['근무형태'] ?? ''),
      회사명: row['회사명'] ?? row['사업체명'] ?? row['업체명'] ?? row['회사'] ?? '',
      마감일: row['마감일'] ?? row['접수마감일'] ?? row['채용마감일'] ?? row['모집마감일'] ?? '',
      담당자연락처: row['담당자연락처'] ?? row['담당자 전화번호'] ?? row['전화번호'] ?? row['담당자전화번호'] ?? row['연락처'] ?? row['담당자전화'] ?? '',
    }));

    return cachedJobs;
  } catch (e) {
    console.error('[CSV] 로딩 실패:', e);
    return [];
  }
}

export function getUniqueJobTypes(jobs: JobEntry[]): string[] {
  const types = new Set(jobs.map((j) => j.모집직종).filter(Boolean));
  return Array.from(types);
}

export function filterByJobTypes(jobs: JobEntry[], jobTypes: string[]): JobEntry[] {
  if (jobTypes.length === 0) return jobs;
  const set = new Set(jobTypes);
  return jobs.filter((j) => set.has(j.모집직종));
}

export function filterByRegion(jobs: JobEntry[], regions: Region[]): JobEntry[] {
  if (regions.length === 0) return jobs;
  return jobs.filter((j) =>
    regions.some((r) => {
      const inSido = j.근무지역.includes(r.sido);
      const inSigungu = r.sigungu ? j.근무지역.includes(r.sigungu) : true;
      return inSido && inSigungu;
    })
  );
}

export function filterBySido(jobs: JobEntry[], regions: Region[]): JobEntry[] {
  if (regions.length === 0) return jobs;
  return jobs.filter((j) =>
    regions.some((r) => j.근무지역.includes(r.sido))
  );
}

export function sampleJobs(jobs: JobEntry[], max: number): JobEntry[] {
  if (jobs.length <= max) return jobs;
  const shuffled = [...jobs].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, max);
}
