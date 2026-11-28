export interface GeoPoint {
  lat: number;
  lng: number;
  label: string;
}

const VN_CITY_COORDS: Array<{ keywords: string[]; lat: number; lng: number; label: string }> = [
  { keywords: ["hà nội", "ha noi", "long biên", "cầu giấy", "đống đa", "ba đình", "hoàng mai", "thanh xuân", "nam từ liêm", "bắc từ liêm", "tây hồ", "hà đông"], lat: 21.0285, lng: 105.8542, label: "Hà Nội" },
  { keywords: ["hồ chí minh", "ho chi minh", "tp.hcm", "tphcm", "sài gòn", "quận 1", "quận 3", "quận 7", "thủ đức", "bình thạnh", "tân bình", "gò vấp", "bình tân"], lat: 10.7769, lng: 106.7009, label: "TP. Hồ Chí Minh" },
  { keywords: ["đà nẵng", "da nang", "hải châu", "thanh khê", "sơn trà", "ngũ hành sơn"], lat: 16.0544, lng: 108.2022, label: "Đà Nẵng" },
  { keywords: ["hải phòng", "hai phong"], lat: 20.8449, lng: 106.6881, label: "Hải Phòng" },
  { keywords: ["cần thơ", "can tho"], lat: 10.0452, lng: 105.7469, label: "Cần Thơ" },
  { keywords: ["bắc ninh", "bac ninh"], lat: 21.1861, lng: 106.0763, label: "Bắc Ninh" },
  { keywords: ["hưng yên", "hung yen"], lat: 20.6464, lng: 106.0511, label: "Hưng Yên" },
  { keywords: ["hải dương", "hai duong"], lat: 20.9373, lng: 106.3146, label: "Hải Dương" },
  { keywords: ["vĩnh phúc", "vinh phuc"], lat: 21.3089, lng: 105.6049, label: "Vĩnh Phúc" },
  { keywords: ["quảng ninh", "quang ninh", "hạ long"], lat: 20.9712, lng: 107.0448, label: "Quảng Ninh" },
  { keywords: ["thái nguyên", "thai nguyen"], lat: 21.5672, lng: 105.8252, label: "Thái Nguyên" },
  { keywords: ["thanh hóa", "thanh hoa"], lat: 19.8067, lng: 105.7852, label: "Thanh Hóa" },
  { keywords: ["nghệ an", "nghe an", "vinh"], lat: 18.6796, lng: 105.6813, label: "Nghệ An" },
  { keywords: ["huế", "thừa thiên huế", "thua thien hue"], lat: 16.4637, lng: 107.5909, label: "Thừa Thiên Huế" },
  { keywords: ["khánh hòa", "khanh hoa", "nha trang"], lat: 12.2388, lng: 109.1967, label: "Khánh Hòa" },
  { keywords: ["lâm đồng", "lam dong", "đà lạt"], lat: 11.9404, lng: 108.4583, label: "Lâm Đồng" },
  { keywords: ["bình dương", "binh duong", "thủ dầu một", "dĩ an"], lat: 10.9804, lng: 106.6519, label: "Bình Dương" },
  { keywords: ["đồng nai", "dong nai", "biên hòa"], lat: 10.9574, lng: 106.8427, label: "Đồng Nai" },
  { keywords: ["bà rịa", "vũng tàu", "vung tau"], lat: 10.4114, lng: 107.1362, label: "Bà Rịa - Vũng Tàu" },
  { keywords: ["long an", "tân an"], lat: 10.533, lng: 106.4167, label: "Long An" },
];

export function resolveVietnamCoords(text: string | null | undefined, fallback: GeoPoint): GeoPoint {
  if (!text) return fallback;
  const normalized = text.toLowerCase();
  for (const city of VN_CITY_COORDS) {
    if (city.keywords.some((kw) => normalized.includes(kw))) {
      return { lat: city.lat, lng: city.lng, label: text };
    }
  }
  return { ...fallback, label: text };
}

export function interpolateGeoPoint(from: GeoPoint, to: GeoPoint, ratio: number, label: string): GeoPoint {
  const clamped = Math.max(0, Math.min(1, ratio));
  return {
    lat: from.lat + (to.lat - from.lat) * clamped,
    lng: from.lng + (to.lng - from.lng) * clamped,
    label,
  };
}
