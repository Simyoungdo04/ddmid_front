import { API_BASE_URL } from './constants'

async function request(path, options) {
  const res = await fetch(`${API_BASE_URL}/api/rooms${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || `요청 실패 (${res.status})`)
  return data
}

export const roomApi = {
  create: (headCount) => request(`?headCount=${headCount}`, { method: 'POST' }),
  get: (roomId) => request(`/${roomId}`),
  join: (roomId, nickname, lat, lng) =>
    request(`/${roomId}/participants`, { method: 'POST', body: JSON.stringify({ nickname, lat, lng }) }),
  leave: (roomId, participantId) => request(`/${roomId}/participants/${participantId}`, { method: 'DELETE' }),
  setMode: (roomId, mode) => request(`/${roomId}/mode`, { method: 'PATCH', body: JSON.stringify({ mode }) }),
  findMidpoint: (roomId) => request(`/${roomId}/midpoint`, { method: 'POST' }),
  chooseRestaurant: (roomId, participantId, restaurant) =>
    request(`/${roomId}/participants/${participantId}/restaurant`, {
      method: 'POST',
      body: JSON.stringify(restaurant),
    }),
  resolve: (roomId) => request(`/${roomId}/resolve`, { method: 'POST' }),
}
