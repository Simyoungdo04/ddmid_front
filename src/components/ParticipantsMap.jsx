import { useEffect, useRef } from 'react'
import { KAKAO_JS_KEY } from '../constants'

// 참여자들 위치를 마커로 보여주기만 하는 지도. 방장이 모드(도보/대중교통)를 정하기 전에
// 다들 얼마나 떨어져 있는지 보고 판단할 수 있게 한다.
function ParticipantsMap({ participants, height = 260 }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!KAKAO_JS_KEY || !participants || participants.length === 0) return

    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false`
    script.async = true
    script.onload = () => {
      window.kakao.maps.load(() => {
        const map = new window.kakao.maps.Map(containerRef.current, {
          center: new window.kakao.maps.LatLng(participants[0].lat, participants[0].lng),
          level: 6,
        })
        const bounds = new window.kakao.maps.LatLngBounds()

        participants.forEach((p) => {
          const position = new window.kakao.maps.LatLng(p.lat, p.lng)
          new window.kakao.maps.Marker({ position, map })
          new window.kakao.maps.CustomOverlay({
            position,
            yAnchor: 1.8,
            map,
            content: `<div style="background:#0EA5E9;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;white-space:nowrap;">${p.nickname}</div>`,
          })
          bounds.extend(position)
        })

        map.setBounds(bounds)
      })
    }
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
    // 참여자 배열은 폴링 때마다 새 객체로 갈아끼워지는데, 내용이 그대로면 지도를 다시 만들
    // 필요는 없다(만들면 사용자가 확대/이동해둔 걸 매번 리셋시켜버린다) - 값 기준으로 비교한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(participants)])

  return <div ref={containerRef} style={{ width: '100%', height }} />
}

export default ParticipantsMap
