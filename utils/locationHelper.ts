import { Platform } from 'react-native';
import * as Location from 'expo-location';
import type { Region } from './types';

export async function getCurrentRegion(): Promise<Region | null> {
  if (Platform.OS === 'web') {
    return getCurrentRegionWeb();
  }

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const geocode = await Location.reverseGeocodeAsync({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

    if (geocode.length === 0) return null;

    const place = geocode[0];
    const sido = normalizeSido(place.region ?? place.country ?? '');
    const sigungu = place.subregion ?? place.city ?? '';

    return sido ? { sido, sigungu } : null;
  } catch (e) {
    console.error('[Location]', e);
    return null;
  }
}

async function getCurrentRegionWeb(): Promise<Region | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json&accept-language=ko`
          );
          const data = await res.json();
          const addr = data.address ?? {};
          const sido = normalizeSidoKo(addr.state ?? addr.province ?? '');
          const sigungu = addr.city ?? addr.county ?? addr.town ?? addr.village ?? '';
          resolve(sido ? { sido, sigungu } : null);
        } catch {
          resolve(null);
        }
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 }
    );
  });
}

function normalizeSido(raw: string): string {
  const map: Record<string, string> = {
    Seoul: '서울특별시',
    Busan: '부산광역시',
    Daegu: '대구광역시',
    Incheon: '인천광역시',
    Gwangju: '광주광역시',
    Daejeon: '대전광역시',
    Ulsan: '울산광역시',
    Sejong: '세종특별자치시',
    'Gyeonggi-do': '경기도',
    Gyeonggi: '경기도',
    'Gangwon-do': '강원특별자치도',
    Gangwon: '강원특별자치도',
    'Chungcheongbuk-do': '충청북도',
    'North Chungcheong': '충청북도',
    'Chungcheongnam-do': '충청남도',
    'South Chungcheong': '충청남도',
    'Jeollabuk-do': '전북특별자치도',
    'North Jeolla': '전북특별자치도',
    'Jeollanam-do': '전라남도',
    'South Jeolla': '전라남도',
    'Gyeongsangbuk-do': '경상북도',
    'North Gyeongsang': '경상북도',
    'Gyeongsangnam-do': '경상남도',
    'South Gyeongsang': '경상남도',
    'Jeju-do': '제주특별자치도',
    Jeju: '제주특별자치도',
  };
  return map[raw] ?? raw;
}

// Nominatim이 한국어로 반환하는 시/도명 → 표준 SIDO_LIST 값으로 정규화
function normalizeSidoKo(raw: string): string {
  const map: Record<string, string> = {
    '서울': '서울특별시',
    '서울특별시': '서울특별시',
    '부산': '부산광역시',
    '부산광역시': '부산광역시',
    '대구': '대구광역시',
    '대구광역시': '대구광역시',
    '인천': '인천광역시',
    '인천광역시': '인천광역시',
    '광주': '광주광역시',
    '광주광역시': '광주광역시',
    '대전': '대전광역시',
    '대전광역시': '대전광역시',
    '울산': '울산광역시',
    '울산광역시': '울산광역시',
    '세종': '세종특별자치시',
    '세종특별자치시': '세종특별자치시',
    '경기': '경기도',
    '경기도': '경기도',
    '강원': '강원특별자치도',
    '강원도': '강원특별자치도',
    '강원특별자치도': '강원특별자치도',
    '충북': '충청북도',
    '충청북도': '충청북도',
    '충남': '충청남도',
    '충청남도': '충청남도',
    '전북': '전북특별자치도',
    '전라북도': '전북특별자치도',
    '전북특별자치도': '전북특별자치도',
    '전남': '전라남도',
    '전라남도': '전라남도',
    '경북': '경상북도',
    '경상북도': '경상북도',
    '경남': '경상남도',
    '경상남도': '경상남도',
    '제주': '제주특별자치도',
    '제주도': '제주특별자치도',
    '제주특별자치도': '제주특별자치도',
  };
  return map[raw] ?? raw;
}
