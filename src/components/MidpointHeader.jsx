import { MODE_LABELS } from '../constants'

function MidpointHeader({
  pointCount,
  loading,
  error,
  stage,
  onFindMidpoint,
  onReset,
  mode,
  onModeChange,
  activeOption,
  focusedParticipant,
  onFocusParticipant,
  onShowAllRoutes,
}) {
  const station = activeOption?.station

  return (
    <header style={{ padding: '12px 16px', borderBottom: '1px solid #ddd' }}>
      <h1 style={{ margin: 0, fontSize: 18 }}>
        지도를 클릭해서 사람 수만큼 지점을 찍고 "중간지점 찾기"를 눌러보세요 (2명 이상)
      </h1>
      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onFindMidpoint}
          disabled={pointCount < 2 || loading}
          style={{ fontSize: 13, padding: '4px 10px' }}
        >
          중간지점 찾기 ({pointCount}명)
        </button>
        <button type="button" onClick={onReset} style={{ fontSize: 13, padding: '4px 10px' }}>
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
          {Object.keys(MODE_LABELS).length > 1 && (
            <div style={{ display: 'flex', gap: 4 }}>
              {Object.keys(MODE_LABELS).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onModeChange(key)}
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
          )}
          <p style={{ margin: 0, color: '#888', fontSize: 13 }}>
            중간지점: <b>{station.name}</b>{' '}
            · 인원별 {station.timesFromEachMinutes.join(', ')}분 (최대 {station.maxTimeMinutes}분)
            {' '}· 지도를 다시 클릭하면 새로 찾기
          </p>
        </div>
      )}
      {!loading && !error && stage === 'result' && activeOption && (
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#888' }}>경로 보기:</span>
          {station.timesFromEachMinutes.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onFocusParticipant(index)}
              style={{
                fontSize: 12,
                padding: '3px 9px',
                borderRadius: 999,
                border: '1px solid #2563eb',
                background: focusedParticipant === index ? '#2563eb' : '#fff',
                color: focusedParticipant === index ? '#fff' : '#2563eb',
                cursor: 'pointer',
              }}
            >
              {index + 1}번
            </button>
          ))}
          <button
            type="button"
            onClick={onShowAllRoutes}
            style={{
              fontSize: 12,
              padding: '3px 9px',
              borderRadius: 999,
              border: '1px solid #888',
              background: focusedParticipant === null ? '#888' : '#fff',
              color: focusedParticipant === null ? '#fff' : '#888',
              cursor: 'pointer',
            }}
          >
            전체
          </button>
        </div>
      )}
      {!loading && !error && stage === 'result' && mode === 'transit' && station?.transitSummariesFromEach?.length > 0 && (
        <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {station.transitSummariesFromEach.map((summary, index) => (
            <span key={index} style={{ fontSize: 12, color: '#666' }}>
              {index + 1}번: {summary || '경로 정보 없음'}
            </span>
          ))}
        </div>
      )}
    </header>
  )
}

export default MidpointHeader
