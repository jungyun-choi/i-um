export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) return null;

  const url = `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`;
  const res = await fetch(url, { headers: { Authorization: `KakaoAK ${key}` } });
  if (!res.ok) return null;

  const json = await res.json() as { documents: Array<{ address: { address_name: string } }> };
  return json.documents[0]?.address?.address_name ?? null;
}
