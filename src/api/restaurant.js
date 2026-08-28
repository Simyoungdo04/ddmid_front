import { api } from './axios'

// 중간지점 근처 추천 식당. roomId는 검색 결과를 RESTAURANT 테이블에 방 단위로
// 남기기 위해 백엔드가 요구한다.
export function fetchNearbyRestaurantList(roomId, x, y) {
  return api.get('/api/restaurants', { params: { roomId, x, y } }).then((res) => res.data)
}

export function fetchRestaurantSearchList(roomId, query, x, y) {
  return api.get('/api/restaurants/search', { params: { roomId, query, x, y } }).then((res) => res.data)
}

// 방 맥락이 없는 순수 장소 검색(예: 출발지 이름 검색).
export function fetchPlaceSearchList(query) {
  return api.get('/api/places/search', { params: { query } }).then((res) => res.data)
}
