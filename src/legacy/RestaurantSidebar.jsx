function RestaurantSidebar({
  activeOption,
  nameQuery,
  onNameQueryChange,
  onNameSearchSubmit,
  nameSearching,
  nameSearchError,
  nameSearchResults,
  onOpenReview,
}) {
  return (
    <aside style={{ width: 280, borderLeft: '1px solid #ddd', padding: 12, overflowY: 'auto' }}>
      <h2 style={{ fontSize: 14, margin: '0 0 8px' }}>식당 이름으로 찾기</h2>
      <form onSubmit={onNameSearchSubmit} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        <input
          type="text"
          value={nameQuery}
          onChange={(e) => onNameQueryChange(e.target.value)}
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
          {nameSearchResults.map((restaurant) => (
            <li
              key={restaurant.id}
              onClick={() => onOpenReview(restaurant)}
              title="클릭하면 카카오 플레이스 리뷰 페이지가 열립니다"
              style={{ fontSize: 13, borderBottom: '1px solid #eee', paddingBottom: 6, cursor: 'pointer' }}
            >
              <div style={{ fontWeight: 600, textDecoration: 'underline' }}>{restaurant.name}</div>
              <div style={{ color: '#666' }}>{restaurant.roadAddress || restaurant.address}</div>
              <div style={{ color: '#999' }}>{restaurant.distanceMeters}m</div>
            </li>
          ))}
        </ul>
      )}

      <h2 style={{ fontSize: 14, margin: '12px 0 8px', borderTop: '1px solid #ddd', paddingTop: 12 }}>
        중간지점 근처 식당 ({activeOption ? activeOption.restaurants.length : 0})
      </h2>
      {activeOption && activeOption.restaurants.length === 0 && (
        <p style={{ margin: 0, fontSize: 12, color: '#888' }}>반경 3km 이내에 식당이 없습니다.</p>
      )}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {activeOption &&
          activeOption.restaurants.map((restaurant) => (
            <li
              key={restaurant.id}
              onClick={() => onOpenReview(restaurant)}
              title="클릭하면 카카오 플레이스 리뷰 페이지가 열립니다"
              style={{ fontSize: 13, borderBottom: '1px solid #eee', paddingBottom: 8, cursor: 'pointer' }}
            >
              <div style={{ fontWeight: 600, textDecoration: 'underline' }}>{restaurant.name}</div>
              <div style={{ color: '#666' }}>{restaurant.category}</div>
              <div style={{ color: '#666' }}>{restaurant.roadAddress || restaurant.address}</div>
              <div style={{ color: '#999' }}>{restaurant.distanceMeters}m</div>
            </li>
          ))}
      </ul>
    </aside>
  )
}

export default RestaurantSidebar
