import { useEffect } from 'react'
import { KAKAO_JS_KEY } from '../constants'

// 카카오맵 JS SDK를 <script> 태그로 로드하고, 로드가 끝나면 onReady를 한 번 호출한다.
// RestaurantsMap/ParticipantsMap/RouteMap/LocationPicker가 전부 이 로딩 방식을 그대로
// 반복해서 썼던 걸 여기로 뺐다.
// enabled: 아직 지도를 그릴 데이터가 없으면(예: participants가 비어있음) 스크립트 자체를
// 안 붙이게 한다. deps: 이 배열이 바뀔 때만 스크립트를 다시 로드한다(보통 좌표를
// JSON.stringify한 값 - 폴링마다 새 객체가 와도 값이 같으면 지도를 다시 안 만들기 위함).
export function useKakaoMapsLoader(onReady, deps, { libraries, enabled = true } = {}) {
  useEffect(() => {
    if (!KAKAO_JS_KEY || !enabled) return

    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}${
      libraries ? `&libraries=${libraries}` : ''
    }&autoload=false`
    script.async = true
    script.onload = () => {
      window.kakao.maps.load(onReady)
    }
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
