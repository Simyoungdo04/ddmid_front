import { useEffect, useState } from 'react'
import { fetchRoom, deleteParticipant } from '../api/room'

// 방 하나의 상태를 1초 간격 폴링으로 최신으로 유지한다. 나중에 폴링을 실제 웹소켓으로
// 바꿀 때(useSocket) 이 훅 안쪽만 바뀌고, 페이지 컴포넌트들은 그대로 쓸 수 있게 폴링
// 세부사항을 여기 안에 감춰둔다.
export function useRoom(roomId) {
  const [room, setRoom] = useState(null)
  const [error, setError] = useState(null)
  const [myParticipantId, setMyParticipantId] = useState(() => localStorage.getItem(`room:${roomId}:participantId`))

  useEffect(() => {
    let cancelled = false
    async function poll() {
      try {
        const data = await fetchRoom(roomId)
        if (!cancelled) setRoom(data)
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    }
    poll()
    const id = setInterval(poll, 1000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [roomId])

  // 수정 성공 API(updateXxx)는 데이터를 안 돌려주니(백엔드 ApiResponse.updated() 참고),
  // 방 상태를 바꾸는 동작 뒤에는 이걸로 최신 상태를 바로 다시 받아와서 화면에 반영한다 -
  // 안 부르면 다음 폴링(최대 1초)까지 화면이 그대로 있는다.
  async function refresh() {
    const data = await fetchRoom(roomId)
    setRoom(data)
    return data
  }

  function rememberParticipant(participantId) {
    localStorage.setItem(`room:${roomId}:participantId`, participantId)
    setMyParticipantId(participantId)
  }

  async function leave() {
    try {
      await deleteParticipant(roomId, myParticipantId)
    } catch (err) {
      // 이미 나간 상태 등은 무시하고 로컬 상태만 정리한다.
    }
    localStorage.removeItem(`room:${roomId}:participantId`)
    setMyParticipantId(null)
  }

  const me = room?.participants.find((p) => p.id === myParticipantId) ?? null
  const isHost = myParticipantId != null && myParticipantId === room?.hostParticipantId

  return { room, setRoom, refresh, error, myParticipantId, rememberParticipant, me, isHost, leave }
}
