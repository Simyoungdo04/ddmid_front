import { useEffect, useRef, useState } from 'react'

const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const SEOUL_CITY_HALL = { lat: 37.5665, lng: 126.978 }
const MODE_LABELS = { walk: '도보', transit: '대중교통' }
const POINT_COLOR = '#2563eb'

function App() {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)

  // 클릭 로직은 지도 이벤트 리스너(최초 1회 등록) 안에서 항상 최신 값을 읽어야 하므로
  // state가 아니라 ref로 지점 목록을 관리한다.
  const pointsRef = useRef([]) // [{lat, lng}, ...]
  const pointMarkersRef = useRef([]) // [{marker, overlay}, ...]
  const stationMarkerRef = useRef(null)
  const restaurantMarkersRef = useRef([])
  const nameSearchMarkersRef = useRef([])
  const stageRef = useRef('idle') // handleMapClick 안에서 최신 stage를 읽기 위한 ref (state는 클로저에 갇힘)

  const [stage, setStage] = useState('idle') // 'idle' | 'collecting' | 'result'
  const [pointCount, setPointCount] = useState(0) // 버튼 활성화 판단용, 실제 값은 pointsRef
  const [options, setOptions] = useState(null) // { walk: {station,restaurants}, transit: {station,restaurants} }
  const [mode, setMode] = useState('transit') // 'walk' | 'transit'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [nameQuery, setNameQuery] = useState('')
  const [nameSearchResults, setNameSearchResults] = useState(null) // null = 아직 검색 안 함
  const [nameSearching, setNameSearching] = useState(false)
  const [nameSearchError, setNameSearchError] = useState(null)

  const activeOption = options ? options[mode] : null

  useEffect(() => {
    if (!KAKAO_JS_KEY) {
      setError('front/.env 의 VITE_KAKAO_JS_KEY 를 설정해주세요.')
      return
    }

    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false`
    script.async = true
    script.onload = () => {
      window.kakao.maps.load(() => {
        const map = new window.kakao.maps.Map(mapContainerRef.current, {
          center: new window.kakao.maps.LatLng(SEOUL_CITY_HALL.lat, SEOUL_CITY_HALL.lng),
          level: 5,
        })
        mapRef.current = map

        window.kakao.maps.event.addListener(map, 'click', handleMapClick)
      })
    }
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  function addLabeledMarker(latlng, label, color) {
    const marker = new window.kakao.maps.Marker({ position: latlng, map: mapRef.current })
    const overlay = new window.kakao.maps.CustomOverlay({
      position: latlng,
      yAnchor: 1.8,
      content: `<div style="background:${color};color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;white-space:nowrap;">${label}</div>`,
    })
    overlay.setMap(mapRef.current)
    return { marker, overlay }
  }

  function removeLabeledMarker(ref) {
    if (ref.current) {
      ref.current.marker.setMap(null)
      ref.current.overlay.setMap(null)
      ref.current = null
    }
  }

  function clearPointMarkers() {
    pointMarkersRef.current.forEach(({ marker, overlay }) => {
      marker.setMap(null)
      overlay.setMap(null)
    })
    pointMarkersRef.current = []
  }

  function clearRestaurantMarkers() {
    restaurantMarkersRef.current.forEach((marker) => marker.setMap(null))
    restaurantMarkersRef.current = []
  }

  function clearNameSearchMarkers() {
    nameSearchMarkersRef.current.forEach((marker) => marker.setMap(null))
    nameSearchMarkersRef.current = []
  }

  function updateStage(next) {
    stageRef.current = next
    setStage(next)
  }

  function resetAll() {
    clearPointMarkers()
    removeLabeledMarker(stationMarkerRef)
    clearRestaurantMarkers()
    clearNameSearchMarkers()
    pointsRef.current = []
    setPointCount(0)
    setOptions(null)
    setError(null)
    updateStage('idle')
    setNameQuery('')
    setNameSearchResults(null)
    setNameSearchError(null)
  }

  function handleMapClick(mouseEvent) {
    const latlng = mouseEvent.latLng

    if (stageRef.current === 'result') {
      // 이미 결과가 나온 상태에서 다시 클릭하면 처음부터 새로 시작한다.
      resetAll()
    }

    const point = { lat: latlng.getLat(), lng: latlng.getLng() }
    pointsRef.current = [...pointsRef.current, point]
    pointMarkersRef.current.push(addLabeledMarker(latlng, String(pointsRef.current.length), POINT_COLOR))
    setPointCount(pointsRef.current.length)
    updateStage('collecting')
  }

  // 선택된 모드(도보/대중교통)의 중간지점 마커 + 식당 마커들을 지도에 다시 그린다.
  function renderOption(option, modeKey) {
    removeLabeledMarker(stationMarkerRef)
    const stationLatLng = new window.kakao.maps.LatLng(option.station.lat, option.station.lng)
    stationMarkerRef.current = addLabeledMarker(
      stationLatLng,
      `중간지점(${MODE_LABELS[modeKey]}): ${option.station.name}`,
      '#059669'
    )
    mapRef.current.panTo(stationLatLng)

    clearRestaurantMarkers()
    option.restaurants.forEach((restaurant) => {
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(restaurant.lat, restaurant.lng),
        map: mapRef.current,
      })

      const infoWindow = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:6px 8px;font-size:12px;white-space:nowrap;">${restaurant.name}</div>`,
      })
      window.kakao.maps.event.addListener(marker, 'click', () => {
        infoWindow.open(mapRef.current, marker)
      })

      restaurantMarkersRef.current.push(marker)
    })
  }

  function handleModeChange(newMode) {
    if (newMode === mode || !options) return
    setMode(newMode)
    clearNameSearchMarkers()
    setNameQuery('')
    setNameSearchResults(null)
    setNameSearchError(null)
    renderOption(options[newMode], newMode)
  }

  function sortByDistance(restaurants) {
    return [...restaurants].sort((x, y) => x.distanceMeters - y.distanceMeters)
  }

  async function handleFindMidpoint() {
    const points = pointsRef.current
    if (points.length < 2) return

    setLoading(true)
    setError(null)
    clearNameSearchMarkers()
    setNameQuery('')
    setNameSearchResults(null)
    setNameSearchError(null)
    try {
      let data
      if (points.length === 2) {
        const [a, b] = points
        const res = await fetch(
          `${API_BASE_URL}/api/midpoint?ax=${a.lng}&ay=${a.lat}&bx=${b.lng}&by=${b.lat}`
        )
        data = await res.json()
        if (!res.ok) throw new Error(data.error || `백엔드 요청 실패 (${res.status})`)
      } else {
        const res = await fetch(`${API_BASE_URL}/api/midpoint/multi`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(points.map((p) => ({ x: p.lng, y: p.lat }))),
        })
        data = await res.json()
        if (!res.ok) throw new Error(data.error || `백엔드 요청 실패 (${res.status})`)
      }

      const nextOptions = {
        walk: { station: data.walk.station, restaurants: sortByDistance(data.walk.restaurants) },
        transit: { station: data.transit.station, restaurants: sortByDistance(data.transit.restaurants) },
      }
      setOptions(nextOptions)
      setMode('transit')
      updateStage('result')
      renderOption(nextOptions.transit, 'transit')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleNameSearchSubmit(e) {
    e.preventDefault()
    if (!activeOption || !nameQuery.trim()) return

    setNameSearching(true)
    setNameSearchError(null)
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/restaurants/search?query=${encodeURIComponent(nameQuery.trim())}&x=${activeOption.station.lng}&y=${activeOption.station.lat}`
      )
      if (!res.ok) throw new Error(`백엔드 요청 실패 (${res.status})`)
      const data = await res.json()

      clearNameSearchMarkers()

      if (data.length === 0) {
        setNameSearchResults([])
        setNameSearchError('반경 1km 이내에 검색 결과가 없습니다.')
        return
      }

      setNameSearchResults(data)
      data.forEach((restaurant) => {
        const marker = new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(restaurant.lat, restaurant.lng),
          map: mapRef.current,
        })

        const infoWindow = new window.kakao.maps.InfoWindow({
          content: `<div style="padding:6px 8px;font-size:12px;white-space:nowrap;">${restaurant.name}</div>`,
        })
        window.kakao.maps.event.addListener(marker, 'click', () => {
          infoWindow.open(mapRef.current, marker)
        })

        nameSearchMarkersRef.current.push(marker)
      })

      mapRef.current.panTo(new window.kakao.maps.LatLng(data[0].lat, data[0].lng))
    } catch (e) {
      setNameSearchError(e.message)
    } finally {
      setNameSearching(false)
    }
  }

  const station = activeOption?.station
  const isMulti = station && Array.isArray(station.timesFromEachMinutes)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header style={{ padding: '12px 16px', borderBottom: '1px solid #ddd' }}>
        <h1 style={{ margin: 0, fontSize: 18 }}>
          지도를 클릭해서 사람 수만큼 지점을 찍고 "중간지점 찾기"를 눌러보세요 (2명 이상)
        </h1>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleFindMidpoint}
            disabled={pointCount < 2 || loading}
            style={{ fontSize: 13, padding: '4px 10px' }}
          >
            중간지점 찾기 ({pointCount}명)
          </button>
          <button type="button" onClick={resetAll} style={{ fontSize: 13, padding: '4px 10px' }}>
            초기화
          </button>
          {loading && <span style={{ color: '#888', fontSize: 13 }}>중간지점 찾는 중...</span>}
          {!loading && error && <span style={{ color: 'crimson', fontSize: 13 }}>{error}</span>}
          {!loading && !error && stage === 'idle' && (
            <span style={{ color: '#888', fontSize: 13 }}>지도를 클릭해 지점을 추가하세요</span>
          )}
          {!loading && !error && stage === 'collecting' && (
            <span style={{ color: '#888', fontSize: 13 }}>
              {pointCount}명 선택됨 · 계속 클릭해서 추가하거나, 2명 이상이면 찾기를 누르세요
            </span>
          )}
        </div>
        {!loading && !error && stage === 'result' && activeOption && (
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {Object.keys(MODE_LABELS).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleModeChange(key)}
                  style={{
                    fontSize: 12,
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: '1px solid #059669',
                    background: mode === key ? '#059669' : '#fff',
                    color: mode === key ? '#fff' : '#059669',
                    cursor: 'pointer',
                  }}
                >
                  {MODE_LABELS[key]}
                </button>
              ))}
            </div>
            <p style={{ margin: 0, color: '#888', fontSize: 13 }}>
              중간지점: <b>{station.name}</b>{' '}
              {isMulti
                ? `· 인원별 ${station.timesFromEachMinutes.join(', ')}분 (최대 ${station.maxTimeMinutes}분)`
                : `· A에서 ${station.timeFromAMinutes}분 · B에서 ${station.timeFromBMinutes}분 (총 ${station.totalTimeMinutes}분)`}
              {' '}· 지도를 다시 클릭하면 새로 찾기
            </p>
          </div>
        )}
      </header>
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div ref={mapContainerRef} style={{ flex: 1 }} />
        <aside style={{ width: 280, borderLeft: '1px solid #ddd', padding: 12, overflowY: 'auto' }}>
          <h2 style={{ fontSize: 14, margin: '0 0 8px' }}>식당 이름으로 찾기</h2>
          <form onSubmit={handleNameSearchSubmit} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <input
              type="text"
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              disabled={!activeOption}
              placeholder={activeOption ? '식당 이름 입력' : '먼저 중간지점을 찾아주세요'}
              style={{ flex: 1, fontSize: 13, padding: '4px 6px' }}
            />
            <button type="submit" disabled={!activeOption || nameSearching || !nameQuery.trim()} style={{ fontSize: 13 }}>
              검색
            </button>
          </form>
          {nameSearching && <p style={{ margin: '0 0 8px', fontSize: 12, color: '#888' }}>검색 중...</p>}
          {!nameSearching && nameSearchError && (
            <p style={{ margin: '0 0 8px', fontSize: 12, color: 'crimson' }}>{nameSearchError}</p>
          )}
          {!nameSearching && nameSearchResults && nameSearchResults.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {nameSearchResults.map((r) => (
                <li key={r.id} style={{ fontSize: 13, borderBottom: '1px solid #eee', paddingBottom: 6 }}>
                  <div style={{ fontWeight: 600 }}>{r.name}</div>
                  <div style={{ color: '#666' }}>{r.roadAddress || r.address}</div>
                  <div style={{ color: '#999' }}>{r.distanceMeters}m</div>
                </li>
              ))}
            </ul>
          )}

          <h2 style={{ fontSize: 14, margin: '12px 0 8px', borderTop: '1px solid #ddd', paddingTop: 12 }}>
            중간지점 근처 식당 ({activeOption ? activeOption.restaurants.length : 0})
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeOption &&
              activeOption.restaurants.map((r) => (
                <li key={r.id} style={{ fontSize: 13, borderBottom: '1px solid #eee', paddingBottom: 8 }}>
                  <div style={{ fontWeight: 600 }}>{r.name}</div>
                  <div style={{ color: '#666' }}>{r.category}</div>
                  <div style={{ color: '#666' }}>{r.roadAddress || r.address}</div>
                  <div style={{ color: '#999' }}>{r.distanceMeters}m</div>
                </li>
              ))}
          </ul>
        </aside>
      </div>
    </div>
  )
}

export default App
