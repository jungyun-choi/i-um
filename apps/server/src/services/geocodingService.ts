export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  // Try Kakao first if key is available
  const kakaoKey = process.env.KAKAO_REST_API_KEY;
  if (kakaoKey && kakaoKey !== 'your-kakao-api-key') {
    try {
      const url = `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`;
      const res = await fetch(url, { headers: { Authorization: `KakaoAK ${kakaoKey}` } });
      if (res.ok) {
        const json = await res.json() as { documents: Array<{ address: { address_name: string } }> };
        const name = json.documents[0]?.address?.address_name;
        if (name) return name;
      }
    } catch { /* fall through */ }
  }

  // Fallback: OpenStreetMap Nominatim (free, no key required)
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ko`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'i-um-app/1.0 (baby diary app)' },
    });
    if (!res.ok) return null;
    const json = await res.json() as {
      address?: {
        amenity?: string;
        tourism?: string;
        leisure?: string;
        park?: string;
        suburb?: string;
        city?: string;
        county?: string;
        road?: string;
      };
      display_name?: string;
    };
    const a = json.address;
    if (!a) return null;

    // 특별한 장소명 우선 (공원, 관광지, 편의시설 등)
    const landmark = a.amenity ?? a.tourism ?? a.leisure;
    if (landmark) return landmark;

    // 그 외: 동네 + 도시
    const district = a.suburb ?? a.county;
    const city = a.city;
    if (district && city) return `${city} ${district}`;
    return city ?? district ?? a.road ?? null;
  } catch {
    return null;
  }
}
