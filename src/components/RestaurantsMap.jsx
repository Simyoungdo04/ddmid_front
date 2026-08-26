import { useEffect, useRef } from 'react'
import { KAKAO_JS_KEY } from '../constants'

// 중간지점 근처 식당 후보들을 지도에 마커로 보여준다. 리스트만으로는 위치 감이 안 와서
// 식당 고르는 화면에 같이 띄운다.
function RestaurantsMap({ midpoint, restaurants, chosenId, height = 260 }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!KAKAO_JS_KEY || !midpoint || !restaurants) return

    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false`
    script.async = true
    script.onload = () => {
      window.kakao.maps.load(() => {
        const center = new window.kakao.maps.LatLng(midpoint.lat, midpoint.lng)
        const map = new window.kakao.maps.Map(containerRef.current, { center, level: 5 })
        const bounds = new window.kakao.maps.LatLngBounds()
        bounds.extend(center)

        new window.kakao.maps.Marker({ position: center, map })
        new window.kakao.maps.CustomOverlay({
          position: center,
          map,
          yAnchor: 1.8,
          content: `<div style="background:#18181B;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;white-space:nowrap;">중간지점</div>`,
        })

        restaurants.forEach((restaurant) => {
          const position = new window.kakao.maps.LatLng(restaurant.lat, restaurant.lng)
          const isChosen = restaurant.id === chosenId
          new window.kakao.maps.Marker({ position, map })
          new window.kakao.maps.CustomOverlay({
            position,
            map,
            yAnchor: 1.8,
            content: `<div style="background:${isChosen ? '#0EA5E9' : '#64748B'};color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;white-space:nowrap;">${restaurant.name}</div>`,
          })
          bounds.extend(position)
        })

        map.relayout()
        map.setBounds(bounds)
      })
    }
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
    // midpoint는 RoomPage에서 매 렌더링(2초 폴링 포함)마다 새 객체로 만들어져서 넘어오기
    // 때문에, 객체 참조가 아니라 값 기준으로 비교해야 폴링할 때마다 지도가 다시 만들어져서
    // 사용자가 확대/이동한 걸 리셋시켜버리는 걸 막을 수 있다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(midpoint), JSON.stringify(restaurants), chosenId])

  return <div ref={containerRef} style={{ width: '100%', height }} />
}

export default RestaurantsMap
