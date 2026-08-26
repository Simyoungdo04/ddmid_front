import { API_BASE_URL } from './constants'

export async function searchPlaces(query) {
  const res = await fetch(`${API_BASE_URL}/api/places/search?query=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error('장소 검색 실패')
  return res.json()
}

export async function searchRestaurants(query, x, y) {
  const res = await fetch(
    `${API_BASE_URL}/api/restaurants/search?query=${encodeURIComponent(query)}&x=${x}&y=${y}`
  )
  if (!res.ok) throw new Error('식당 검색 실패')
  return res.json()
}
