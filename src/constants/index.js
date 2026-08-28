export const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY
// VITE_API_BASE_URL을 localhost로 고정해두면, 다른 기기에서 IP로 접속했을 때 그 기기가
// "자기 자신의" localhost:8080을 호출하게 되어 API가 전부 실패한다. 그래서 명시적으로
// 설정된 게 없으면 지금 접속한 주소(hostname)를 그대로 백엔드 주소로 쓴다 - front/back이
// 같은 서버에 떠 있으므로 포트만 8080으로 바꾸면 된다.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8080`

export const SEOUL_CITY_HALL = { lat: 37.5665, lng: 126.978 }
export const MODE_LABELS = { walk: '도보', transit: '대중교통' }
export const POINT_COLOR = '#2563eb'
export const ROUTE_COLORS = { walk: '#f97316', transit: '#7c3aed', bus: '#0ea5e9', subway: '#4338ca' }
