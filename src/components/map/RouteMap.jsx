import { useEffect, useRef } from 'react'
import { useKakaoMapsLoader } from '../../hooks/useKakaoMapsLoader'

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

// routes: [{ points, color, dash, highlight, dimmed, detail }] - 여러 구간(도보/대중교통)을 한
// 지도에 같이 그린다. detail이 있는 구간은 클릭하면 그 안내 문구(예: "146 (정류장1 > 정류장2)")를
// 말풍선으로 띄운다 - 지도 다른 곳을 클릭하거나 다른 구간을 클릭하면 닫힌다.
// highlight/dimmed는 범례를 눌렀을 때만 바뀌는데, 그때마다 지도 전체를 다시
// 그리면 확대/이동 상태가 초기화돼서 거슬린다 - 그래서 지도/스크립트는 경로 좌표나
// 시작·끝 지점이 바뀔 때만 새로 만들고, highlight/dimmed는 이미 그려진 Polyline의
// 옵션만 갈아끼운다(별도 useEffect).
// startPoint/endPoint를 따로 받는 이유: 대중교통은 "출발지->타는 역"/"대중교통"/
// "내리는 역->목적지" 세 구간으로 나눠서 그리는데, 첫/마지막 구간의 첫/끝 좌표만으로는
// 실제 출발지·목적지를 못 잡기 때문이다(구간 순서가 항상 보장되지 않는다).
function RouteMap({ routes, startPoint, endPoint, startLabel = '출발', endLabel = '도착', height = 320 }) {
  const containerRef = useRef(null)
  const polylinesRef = useRef([])
  const glowsRef = useRef([])
  const detailOverlayRef = useRef(null)
  const ignoreNextMapClickRef = useRef(false)

  const validRoutes = (routes || []).filter((r) => r.points && r.points.length > 1)

  function styleFor(route) {
    const base = route.thick ? 8 : 6
    return {
      strokeWeight: route.highlight ? base + 3 : base,
      strokeOpacity: route.dimmed ? 0.35 : 0.85,
    }
  }

  function showDetail(map, position, text) {
    if (detailOverlayRef.current) {
      detailOverlayRef.current.setMap(null)
    }
    detailOverlayRef.current = new window.kakao.maps.CustomOverlay({
      position,
      map,
      yAnchor: 1.4,
      content: `<div style="background:var(--color-navy);color:#fff;padding:6px 10px;border-radius:8px;font-size:12px;max-width:220px;box-shadow:0 2px 8px rgba(0,0,0,.3);">${escapeHtml(text).replace(/\n/g, '<br/>')}</div>`,
    })
  }

  function addLabeledMarker(map, position, label, color) {
    new window.kakao.maps.Marker({ position, map })
    new window.kakao.maps.CustomOverlay({
      position,
      map,
      yAnchor: 1.8,
      content: `<div style="background:${color};color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;white-space:nowrap;">${label}</div>`,
    })
  }

  function applyHighlights() {
    validRoutes.forEach((route, i) => {
      const polyline = polylinesRef.current[i]
      if (!polyline || !window.kakao) return
      polyline.setOptions(styleFor(route))

      const existingGlow = glowsRef.current[i]
      if (route.highlight && !existingGlow) {
        glowsRef.current[i] = new window.kakao.maps.Polyline({
          map: polyline.getMap(),
          path: polyline.getPath(),
          strokeWeight: 16,
          strokeColor: route.color,
          strokeOpacity: 0.25,
          strokeStyle: 'solid',
        })
      } else if (!route.highlight && existingGlow) {
        existingGlow.setMap(null)
        glowsRef.current[i] = null
      }
    })
  }

  useKakaoMapsLoader(
    () => {
      const center = startPoint
        ? new window.kakao.maps.LatLng(startPoint.lat, startPoint.lng)
        : new window.kakao.maps.LatLng(validRoutes[0].points[0].lat, validRoutes[0].points[0].lng)
      const map = new window.kakao.maps.Map(containerRef.current, { center, level: 5 })
      const bounds = new window.kakao.maps.LatLngBounds()

      polylinesRef.current = []
      glowsRef.current = []
      validRoutes.forEach((route) => {
        const path = route.points.map((p) => new window.kakao.maps.LatLng(p.lat, p.lng))
        const polyline = new window.kakao.maps.Polyline({
          map,
          path,
          strokeColor: route.color,
          strokeStyle: route.dash ? 'shortdash' : 'solid',
          ...styleFor(route),
        })
        if (route.detail) {
          window.kakao.maps.event.addListener(polyline, 'click', (mouseEvent) => {
            ignoreNextMapClickRef.current = true
            showDetail(map, mouseEvent.latLng, route.detail)
          })
        }
        polylinesRef.current.push(polyline)
        glowsRef.current.push(null)
        path.forEach((latlng) => bounds.extend(latlng))
      })

      window.kakao.maps.event.addListener(map, 'click', () => {
        if (ignoreNextMapClickRef.current) {
          ignoreNextMapClickRef.current = false
          return
        }
        if (detailOverlayRef.current) {
          detailOverlayRef.current.setMap(null)
          detailOverlayRef.current = null
        }
      })

      if (startPoint) {
        const startLatLng = new window.kakao.maps.LatLng(startPoint.lat, startPoint.lng)
        addLabeledMarker(map, startLatLng, startLabel, 'var(--color-navy)')
        bounds.extend(startLatLng)
      }
      if (endPoint) {
        const endLatLng = new window.kakao.maps.LatLng(endPoint.lat, endPoint.lng)
        addLabeledMarker(map, endLatLng, endLabel, 'var(--color-success)')
        bounds.extend(endLatLng)
      }

      // 컨테이너가 막 렌더링된 시점엔 지도가 자기 크기를 못 알고 있을 수 있어서, 크기를
      // 다시 계산시킨 뒤에 bounds를 맞춘다 - 안 하면 확대/맞춤이 어긋난다.
      map.relayout()
      map.setBounds(bounds)

      applyHighlights()
    },
    [
      JSON.stringify(validRoutes.map((r) => ({ points: r.points, color: r.color, dash: r.dash, detail: r.detail }))),
      JSON.stringify(startPoint),
      JSON.stringify(endPoint),
      startLabel,
      endLabel,
    ],
    { enabled: validRoutes.length > 0 || !!startPoint }
  )

  // highlight/dimmed만 바뀌었을 때: 지도를 새로 만들지 않고 기존 선의 굵기·투명도만
  // 갱신하고, 선택된 구간엔 같은 색의 넓고 옅은 선을 하나 더 깔아 "빛나는" 느낌을 낸다.
  useEffect(() => {
    applyHighlights()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(validRoutes.map((r) => ({ highlight: r.highlight, dimmed: r.dimmed })))])

  return <div ref={containerRef} className="w-full" style={{ height }} />
}

export default RouteMap
