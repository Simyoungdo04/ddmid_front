import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import LocationPicker from '../components/LocationPicker'
import ParticipantsMap from '../components/ParticipantsMap'
import RestaurantsMap from '../components/RestaurantsMap'
import ReviewModal from '../components/ReviewModal'
import RouteMap from '../components/RouteMap'
import { API_BASE_URL, MODE_LABELS, ROUTE_COLORS } from '../constants'
import { roomApi } from '../roomApi'
import { searchRestaurants } from '../searchApi'
import {
  Wrapper,
  Title,
  SubText,
  ParticipantList,
  ParticipantItem,
  ButtonRow,
  Button,
  RestaurantItem,
  ErrorText,
} from './RoomPage.styles'

function copyWithExecCommand(text) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  let succeeded = false
  try {
    succeeded = document.execCommand('copy')
  } catch (err) {
    succeeded = false
  }
  document.body.removeChild(textarea)
  return succeeded
}

function lastCategory(category) {
  if (!category) return category
  const parts = category.split('>').map((p) => p.trim())
  return parts[parts.length - 1]
}

function legKind(type) {
  if (type === 'BUS') return 'bus'
  if (type === 'SUBWAY') return 'subway'
  return 'walk'
}

function legColor(type) {
  return ROUTE_COLORS[legKind(type)]
}

function Legend({ color, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        border: 'none',
        background: active ? '#eef2ff' : 'transparent',
        borderRadius: 6,
        padding: '3px 8px',
        cursor: 'pointer',
        fontWeight: active ? 700 : 400,
        fontSize: 12,
        color: 'inherit',
      }}
    >
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {label}
    </button>
  )
}

function RoomPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState(null)
  const [error, setError] = useState(null)

  const [myParticipantId, setMyParticipantId] = useState(() => localStorage.getItem(`room:${roomId}:participantId`))
  const [nickname, setNickname] = useState('')
  const [location, setLocation] = useState(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [linkCopyError, setLinkCopyError] = useState(null)
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState(null)

  const [nearbyRestaurants, setNearbyRestaurants] = useState(null)
  const [searchResults, setSearchResults] = useState(null)
  const [restaurantQuery, setRestaurantQuery] = useState('')
  const [resolveError, setResolveError] = useState(null)
  const [reviewPlace, setReviewPlace] = useState(null)
  const [selectedLeg, setSelectedLeg] = useState(null)
  const [expandedVehicleLeg, setExpandedVehicleLeg] = useState(null)

  function toggleLeg(type) {
    setSelectedLeg((prev) => (prev === type ? null : type))
  }

  useEffect(() => {
    let cancelled = false
    async function poll() {
      try {
        const data = await roomApi.get(roomId)
        if (!cancelled) setRoom(data)
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    }
    poll()
    const id = setInterval(poll, 2000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [roomId])

  useEffect(() => {
    if (!room || nearbyRestaurants || !room.midpointLat) return
    fetch(`${API_BASE_URL}/api/restaurants?x=${room.midpointLng}&y=${room.midpointLat}`)
      .then((res) => res.json())
      .then(setNearbyRestaurants)
      .catch((err) => setError(err.message))
  }, [room, nearbyRestaurants])

  async function handleJoin(e) {
    e.preventDefault()
    if (!nickname.trim() || !location || joining) return
    setJoining(true)
    setJoinError(null)
    try {
      const participant = await roomApi.join(roomId, nickname.trim(), location.lat, location.lng)
      localStorage.setItem(`room:${roomId}:participantId`, participant.id)
      setMyParticipantId(participant.id)
    } catch (err) {
      setJoinError(err.message)
      setJoining(false)
    }
  }

  async function handleRestaurantSearch(e) {
    e.preventDefault()
    if (!restaurantQuery.trim() || !room.midpointLat) return
    setSearchResults(await searchRestaurants(restaurantQuery.trim(), room.midpointLng, room.midpointLat))
  }

  async function handleResolve() {
    setResolveError(null)
    try {
      setRoom(await roomApi.resolve(roomId))
    } catch (err) {
      setResolveError(err.message)
    }
  }

  async function handleCopyInviteLink() {
    const link = window.location.href
    try {
      // navigator.clipboard는 HTTPS/localhost 같은 "보안 컨텍스트"에서만 존재한다.
      // IP로 접속한 경우(http://<ip>:5173)는 다른 컴퓨터에서 이 객체 자체가 없어서
      // 아래 execCommand 방식으로 대체해야 한다.
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link)
      } else if (!copyWithExecCommand(link)) {
        throw new Error('복사 명령이 지원되지 않습니다.')
      }
      setLinkCopyError(null)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (err) {
      setLinkCopyError('링크 복사에 실패했습니다. 주소창의 링크를 직접 복사해주세요.')
    }
  }

  async function handleLeave() {
    if (!window.confirm('방에서 나가시겠습니까?')) return
    try {
      await roomApi.leave(roomId, myParticipantId)
    } catch (err) {
      // 이미 나간 상태 등은 무시하고 로컬 상태만 정리한다.
    }
    localStorage.removeItem(`room:${roomId}:participantId`)
    setMyParticipantId(null)
    setNickname('')
    setLocation(null)
  }

  if (error) return <Wrapper><ErrorText>{error}</ErrorText></Wrapper>
  if (!room) return <Wrapper><SubText>불러오는 중...</SubText></Wrapper>

  const me = room.participants.find((p) => p.id === myParticipantId)
  const isHost = myParticipantId === room.hostParticipantId

  if (!me) {
    const isCreating = room.participants.length === 0
    return (
      <Wrapper>
        <Title>{isCreating ? '방 생성하기' : '방 참여하기'}</Title>
        <SubText>{room.participants.length}/{room.capacity}명 참여 중</SubText>
        <form onSubmit={handleJoin}>
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="닉네임 입력" />
          <LocationPicker value={location} onChange={setLocation} />
          <Button type="submit" disabled={joining || !nickname.trim() || !location}>
            {joining ? (isCreating ? '만드는 중...' : '입장하는 중...') : isCreating ? '방 만들기' : '입장하기'}
          </Button>
          {joinError && <ErrorText>{joinError}</ErrorText>}
        </form>
        <ButtonRow>
          <Button onClick={() => navigate('/')}>뒤로가기</Button>
        </ButtonRow>
      </Wrapper>
    )
  }

  if (room.stage === 'WAITING' || room.stage === 'MODE_SELECTED') {
    return (
      <Wrapper>
        <Title>참여자 대기 중</Title>
        <SubText>{room.participants.length}/{room.capacity}명 · 링크를 공유해서 더 초대할 수 있어요</SubText>
        <ParticipantList>
          {room.participants.map((p) => (
            <ParticipantItem key={p.id}>{p.nickname}{p.id === room.hostParticipantId && ' (방장)'}</ParticipantItem>
          ))}
        </ParticipantList>
        <ParticipantsMap participants={room.participants} />
        {isHost && (
          <ButtonRow>
            <Button onClick={handleCopyInviteLink}>{linkCopied ? '복사됨!' : '초대 링크 복사'}</Button>
          </ButtonRow>
        )}
        {linkCopyError && <ErrorText>{linkCopyError}</ErrorText>}
        {isHost ? (
          <>
            <SubText>참여자 위치를 보고 이동 방법을 선택하세요</SubText>
            <ButtonRow>
              {Object.keys(MODE_LABELS).map((key) => (
                <Button key={key} $active={room.mode === key} onClick={() => roomApi.setMode(roomId, key).then(setRoom)}>
                  {MODE_LABELS[key]}
                </Button>
              ))}
            </ButtonRow>
            <ButtonRow>
              <Button disabled={!room.mode} onClick={() => roomApi.findMidpoint(roomId).then(setRoom)}>
                중간지점 찾기
              </Button>
            </ButtonRow>
          </>
        ) : (
          <SubText>방장이 이동 방법을 고르고 중간지점을 찾을 때까지 기다려주세요.</SubText>
        )}
        <ButtonRow>
          <Button onClick={handleLeave}>방 나가기</Button>
        </ButtonRow>
      </Wrapper>
    )
  }

  if (room.stage === 'MIDPOINT_FOUND' || room.stage === 'RESOLVING') {
    const chosenCount = room.participants.filter((p) => p.chosenRestaurant).length
    const allChosen = chosenCount === room.participants.length
    const allPins = [...(searchResults || []), ...(nearbyRestaurants || [])]

    const renderRestaurant = (restaurant) => (
      <RestaurantItem key={restaurant.id} $chosen={me.chosenRestaurant?.id === restaurant.id}>
        <div>
          <div>{restaurant.name}</div>
          <div style={{ fontSize: 12, color: '#888' }}>
            <div>종류: {lastCategory(restaurant.category)}</div>
            <div>주소: {restaurant.roadAddress || restaurant.address}</div>
            {restaurant.phone && <div>전화번호: {restaurant.phone}</div>}
          </div>
          {restaurant.placeUrl && (
            <button type="button" onClick={() => setReviewPlace(restaurant)} style={{ fontSize: 12 }}>
              상세 정보 보기
            </button>
          )}
        </div>
        <Button onClick={() => roomApi.chooseRestaurant(roomId, myParticipantId, restaurant).then(setRoom)}>
          선택
        </Button>
      </RestaurantItem>
    )

    return (
      <Wrapper>
        <Title>식당 선택</Title>
        <SubText>중간지점 근처 식당 중 하나를 골라주세요 ({chosenCount}/{room.participants.length}명 선택 완료)</SubText>
        <form onSubmit={handleRestaurantSearch} style={{ display: 'flex', gap: 6, margin: '8px 0' }}>
          <input
            value={restaurantQuery}
            onChange={(e) => setRestaurantQuery(e.target.value)}
            placeholder="식당 이름 검색"
            style={{ flex: 1 }}
          />
          <button type="submit">검색</button>
        </form>
        <RestaurantsMap
          midpoint={{ lat: room.midpointLat, lng: room.midpointLng }}
          restaurants={allPins}
          chosenId={me.chosenRestaurant?.id}
        />
        {searchResults && (
          <>
            <SubText>검색 결과</SubText>
            <ParticipantList>
              {searchResults.length === 0 && <SubText>검색 결과가 없습니다.</SubText>}
              {searchResults.map(renderRestaurant)}
            </ParticipantList>
          </>
        )}
        <SubText>추천 식당</SubText>
        <ParticipantList>{(nearbyRestaurants || []).map(renderRestaurant)}</ParticipantList>
        {isHost && (
          <>
            <ButtonRow>
              <Button disabled={!allChosen} onClick={handleResolve}>
                메뉴 확정하기{!allChosen && ' (전원 선택 대기 중)'}
              </Button>
            </ButtonRow>
            {resolveError && <ErrorText>{resolveError}</ErrorText>}
          </>
        )}
        <ButtonRow>
          <Button onClick={handleLeave}>방 나가기</Button>
        </ButtonRow>
        <ReviewModal reviewPlace={reviewPlace} onClose={() => setReviewPlace(null)} />
      </Wrapper>
    )
  }

  // RESOLVED
  return (
    <Wrapper>
      <Title>{room.resolvedRestaurant.name}로 결정!</Title>
      <SubText>종류: {lastCategory(room.resolvedRestaurant.category)}</SubText>
      <SubText>주소: {room.resolvedRestaurant.roadAddress || room.resolvedRestaurant.address}</SubText>
      {room.resolvedRestaurant.phone && <SubText>전화번호: {room.resolvedRestaurant.phone}</SubText>}
      {room.resolvedRestaurant.placeUrl && (
        <SubText>
          <button type="button" onClick={() => setReviewPlace(room.resolvedRestaurant)}>상세 정보 보기</button>
        </SubText>
      )}
      {room.mode === 'walk' ? (
        me.walkTimeMinutes != null ? (
          <>
            <SubText>총 {me.walkTimeMinutes}분</SubText>
            <RouteMap
              routes={[{ points: me.walkRoute, color: ROUTE_COLORS.walk, dash: false }]}
              startPoint={{ lat: me.lat, lng: me.lng }}
              endPoint={{ lat: room.resolvedRestaurant.lat, lng: room.resolvedRestaurant.lng }}
              startLabel={me.nickname}
              endLabel={room.resolvedRestaurant.name}
            />
          </>
        ) : (
          <SubText>도보 경로를 찾을 수 없습니다.</SubText>
        )
      ) : me.transitTimeMinutes != null ? (
        <>
          {(() => {
            const transitLegs = (me.transitCoreLegs || []).filter((leg) => leg.type !== 'WALKING')
            return (
              <>
                <SubText>
                  {me.transitWalkToStationMinutes > 0 && `도보 ${me.transitWalkToStationMinutes}분 → `}
                  {transitLegs.length > 0
                    ? transitLegs.map((leg, i) => (
                        <span key={i}>
                          {leg.vehicles && leg.vehicles.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => setExpandedVehicleLeg((prev) => (prev === i ? null : i))}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                font: 'inherit',
                                color: 'inherit',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                              }}
                            >
                              {leg.guidance}
                            </button>
                          ) : (
                            leg.guidance
                          )}
                          {i < transitLegs.length - 1 ? ' → ' : ''}
                        </span>
                      ))
                    : me.transitSummary || '경로 정보 없음'}
                  {me.transitWalkFromStationMinutes > 0 && ` → 도보 ${me.transitWalkFromStationMinutes}분`}
                  {' '}· 총 {me.transitTimeMinutes}분
                </SubText>
                {expandedVehicleLeg != null && transitLegs[expandedVehicleLeg]?.vehicles?.length > 0 && (
                  <SubText style={{ paddingLeft: 12 }}>
                    탑승 가능 노선: {transitLegs[expandedVehicleLeg].vehicles.join(', ')}
                  </SubText>
                )}
              </>
            )
          })()}
          <SubText style={{ display: 'flex', gap: 4 }}>
            <Legend
              color={ROUTE_COLORS.walk}
              label="도보"
              active={selectedLeg === 'walk'}
              onClick={() => toggleLeg('walk')}
            />
            <Legend
              color={ROUTE_COLORS.bus}
              label="버스"
              active={selectedLeg === 'bus'}
              onClick={() => toggleLeg('bus')}
            />
            <Legend
              color={ROUTE_COLORS.subway}
              label="지하철"
              active={selectedLeg === 'subway'}
              onClick={() => toggleLeg('subway')}
            />
          </SubText>
          <RouteMap
            routes={[
              {
                points: me.transitWalkToStationRoute,
                color: ROUTE_COLORS.walk,
                dash: true,
                highlight: selectedLeg === 'walk',
                dimmed: selectedLeg != null && selectedLeg !== 'walk',
                detail: me.transitWalkToStationMinutes > 0 ? `도보 ${me.transitWalkToStationMinutes}분` : null,
              },
              ...(me.transitCoreLegs || []).map((leg) => ({
                points: leg.points,
                color: legColor(leg.type),
                dash: leg.type === 'WALKING',
                highlight: selectedLeg === legKind(leg.type),
                dimmed: selectedLeg != null && selectedLeg !== legKind(leg.type),
                detail:
                  leg.vehicles && leg.vehicles.length > 0
                    ? [leg.guidance, ...leg.vehicles].join('\n')
                    : leg.guidance || null,
              })),
              {
                points: me.transitWalkFromStationRoute,
                color: ROUTE_COLORS.walk,
                dash: true,
                detail: me.transitWalkFromStationMinutes > 0 ? `도보 ${me.transitWalkFromStationMinutes}분` : null,
                highlight: selectedLeg === 'walk',
                dimmed: selectedLeg != null && selectedLeg !== 'walk',
              },
            ]}
            startPoint={{ lat: me.lat, lng: me.lng }}
            endPoint={{ lat: room.resolvedRestaurant.lat, lng: room.resolvedRestaurant.lng }}
            startLabel={me.nickname}
            endLabel={room.resolvedRestaurant.name}
          />
        </>
      ) : (
        <SubText>대중교통 경로를 찾을 수 없습니다.</SubText>
      )}
      <ButtonRow>
        <Button onClick={handleLeave}>방 나가기</Button>
      </ButtonRow>
      <ReviewModal reviewPlace={reviewPlace} onClose={() => setReviewPlace(null)} />
    </Wrapper>
  )
}

export default RoomPage
