function ReviewModal({ reviewPlace, onClose }) {
  if (!reviewPlace) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90%',
          maxWidth: 480,
          height: '85%',
          background: '#fff',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #ddd' }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{reviewPlace.name}</span>
          <button type="button" onClick={onClose} style={{ fontSize: 13, padding: '2px 8px' }}>
            닫기 ✕
          </button>
        </div>
        <iframe src={reviewPlace.placeUrl} title={reviewPlace.name} style={{ flex: 1, border: 'none' }} />
      </div>
    </div>
  )
}

export default ReviewModal
