import { api } from './axios'

export function createRoom(headCount) {
  return api.post('/api/rooms', { headCount }).then((res) => res.data)
}

export function fetchRoom(roomId) {
  return api.get(`/api/rooms/${roomId}`).then((res) => res.data)
}

export function createParticipant(roomId, nickname, lat, lng) {
  return api.post(`/api/rooms/${roomId}/participants`, { nickname, lat, lng }).then((res) => res.data)
}

export function deleteParticipant(roomId, participantId) {
  return api.delete(`/api/rooms/${roomId}/participants/${participantId}`).then((res) => res.data)
}

export function updateParticipantLocation(roomId, participantId, lat, lng) {
  return api
    .patch(`/api/rooms/${roomId}/participants/${participantId}/location`, { lat, lng })
    .then((res) => res.data)
}

export function updateRoomMode(roomId, mode) {
  return api.patch(`/api/rooms/${roomId}/mode`, { mode }).then((res) => res.data)
}

export function updateRoomMidpoint(roomId) {
  return api.post(`/api/rooms/${roomId}/midpoint`).then((res) => res.data)
}

export function updateRoomRelocation(roomId) {
  return api.post(`/api/rooms/${roomId}/relocation-request`).then((res) => res.data)
}

export function updateParticipantRestaurant(roomId, participantId, restaurant) {
  return api
    .post(`/api/rooms/${roomId}/participants/${participantId}/restaurant`, restaurant)
    .then((res) => res.data)
}

export function updateRoomResolution(roomId) {
  return api.post(`/api/rooms/${roomId}/resolve`).then((res) => res.data)
}

export function deleteRoom(roomId) {
  return api.delete(`/api/rooms/${roomId}`).then((res) => res.data)
}
