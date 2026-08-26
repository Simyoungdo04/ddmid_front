import { useEffect, useRef, useState } from 'react'
import { KAKAO_JS_KEY, SEOUL_CITY_HALL } from '../constants'

// 지도를 클릭하거나 주소를 검색해서 좌표 하나를 고르는 용도. 방 만들기/입장 화면에서 재사용한다.
// 검색은 우리 백엔드(카카오 로컬 검색 API)를 거치지 않고, 카카오맵 JS SDK의 주소 검색
// 서비스(Geocoder)를 그대로 쓴다 - 지도 SDK 안에서 바로 좌표로 이동시키는 방식이다.
function LocationPicker({ value, onChange, height = 300 }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const geocoderRef = useRef(null)
  const placesRef = useRef(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState(null)

  useEffect(() => {
    if (!KAKAO_JS_KEY) return

    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&libraries=services&autoload=false`
    script.async = true
    script.onload = () => {
      window.kakao.maps.load(() => {
        const map = new window.kakao.maps.Map(containerRef.current, {
          center: new window.kakao.maps.LatLng(SEOUL_CITY_HALL.lat, SEOUL_CITY_HALL.lng),
          level: 5,
        })
        mapRef.current = map
        geocoderRef.current = new window.kakao.maps.services.Geocoder()
        placesRef.current = new window.kakao.maps.services.Places()

        window.kakao.maps.event.addListener(map, 'click', (mouseEvent) => {
          const latlng = mouseEvent.latLng
          placeMarker(latlng)
          onChangeRef.current({ lat: latlng.getLat(), lng: latlng.getLng() })
        })
      })
    }
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  function placeMarker(latlng) {
    if (markerRef.current) {
      markerRef.current.setPosition(latlng)
    } else {
      markerRef.current = new window.kakao.maps.Marker({ position: latlng, map: mapRef.current })
    }
    mapRef.current.panTo(latlng)
  }

  function moveTo(lat, lng) {
    const latlng = new window.kakao.maps.LatLng(lat, lng)
    placeMarker(latlng)
    onChangeRef.current({ lat, lng })
  }

  function handleSearch() {
    const q = query.trim()
    if (!q || !geocoderRef.current) return
    setSearching(true)
    setSearchError(null)

    // 지번/도로명 주소는 Geocoder로 먼저 찾고, 못 찾으면(역 이름 같은 장소명일 수 있으니)
    // 장소 검색(Places)으로 한 번 더 시도한다. 결과 목록을 보여주지 않고 1등 결과로 바로 이동한다.
    geocoderRef.current.addressSearch(q, (addressResults, status) => {
      if (status === window.kakao.maps.services.Status.OK && addressResults.length > 0) {
        moveTo(Number(addressResults[0].y), Number(addressResults[0].x))
        setSearching(false)
        return
      }

      placesRef.current.keywordSearch(q, (placeResults, placeStatus) => {
        setSearching(false)
        if (placeStatus === window.kakao.maps.services.Status.OK && placeResults.length > 0) {
          moveTo(Number(placeResults[0].y), Number(placeResults[0].x))
        } else {
          setSearchError('검색 결과가 없습니다.')
        }
      })
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleSearch()
            }
          }}
          placeholder="주소/장소 검색"
          style={{ flex: 1 }}
        />
        <button type="button" onClick={handleSearch} disabled={searching}>검색</button>
      </div>
      {searchError && <p style={{ fontSize: 13, color: '#dc2626', margin: '0 0 6px' }}>{searchError}</p>}
      <div ref={containerRef} style={{ width: '100%', height }}>
        {!KAKAO_JS_KEY && '지도를 불러오려면 VITE_KAKAO_JS_KEY 설정이 필요합니다.'}
      </div>
    </div>
  )
}

export default LocationPicker
