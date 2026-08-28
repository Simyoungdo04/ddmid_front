import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LocationPicker from "../components/map/LocationPicker";
import ParticipantsMap from "../components/map/ParticipantsMap";
import RestaurantsMap from "../components/map/RestaurantsMap";
import ReviewModal from "../components/common/ReviewModal";
import { MODE_LABELS } from "../constants";
import {
  deleteRoom,
  updateRoomMode,
  updateRoomMidpoint,
  updateRoomRelocation,
  updateParticipantLocation,
  updateParticipantRestaurant,
  updateRoomResolution,
} from "../api/room";
import { fetchNearbyRestaurantList, fetchRestaurantSearchList } from "../api/restaurant";
import { useRoom } from "../hooks/useRoom";
import { copyToClipboard } from "../utils/clipboard";
import { lastCategory } from "../utils/route";
import {
  Wrapper,
  Title,
  SubText,
  ParticipantList,
  ParticipantItem,
  ButtonRow,
  Button,
  Input,
  LinkButton,
  RestaurantItem,
  ErrorText,
} from "../components/common";

// 참여자 대기(모드 선택 → 중간지점 찾기)부터 식당 선택까지 - 둘 다 "지도"를 중심으로
// 진행되는 화면이라 한 페이지에서 stage에 따라 다르게 보여준다.
function MapPage() {
  const { roomId } = useParams();
  const navi = useNavigate();
  const { room, refresh, error, myParticipantId, me, isHost, leave } =
    useRoom(roomId);

  const [linkCopied, setLinkCopied] = useState(false);
  const [linkCopyError, setLinkCopyError] = useState(null);

  const [nearbyRestaurants, setNearbyRestaurants] = useState(null);
  const [nearbyError, setNearbyError] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [restaurantQuery, setRestaurantQuery] = useState("");
  const [resolveError, setResolveError] = useState(null);
  const [midpointError, setMidpointError] = useState(null);
  const [reviewPlace, setReviewPlace] = useState(null);
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationDraft, setLocationDraft] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [hasRelocated, setHasRelocated] = useState(false);
  const prevNeedsRelocationRef = useRef(false);

  useEffect(() => {
    if (!room) return;
    if (!me) {
      navi(`/room/${roomId}`);
      return;
    }
    if (room.stage === "RESOLVED") {
      navi(`/room/${roomId}/result`);
    }
  }, [room, me, roomId, navi]);

  // 방장이 "위치 재설정하기"를 누르면 room.needsRelocation이 true로 바뀌는데, 폴링 중인
  // 모든 참여자가 그 시점(false -> true)에 한 번만 "다시 재촉"당하게 한다 - 계속 true인
  // 동안 매번 리셋해버리면 저장/취소해도 바로 또 편집 화면이 튀어나온다.
  useEffect(() => {
    if (room?.needsRelocation && !prevNeedsRelocationRef.current) {
      setHasRelocated(false);
    }
    prevNeedsRelocationRef.current = !!room?.needsRelocation;
  }, [room?.needsRelocation]);

  useEffect(() => {
    if (!room || nearbyRestaurants || !room.midpointLat) return;
    fetchNearbyRestaurantList(roomId, room.midpointLng, room.midpointLat)
      .then(setNearbyRestaurants)
      .catch((err) => setNearbyError(err.message));
  }, [room, nearbyRestaurants, roomId]);

  async function handleRestaurantSearch(e) {
    e.preventDefault();
    if (!restaurantQuery.trim() || !room.midpointLat) return;
    setSearchResults(
      await fetchRestaurantSearchList(
        roomId,
        restaurantQuery.trim(),
        room.midpointLng,
        room.midpointLat,
      ),
    );
  }

  async function handleResolve() {
    setResolveError(null);
    try {
      await updateRoomResolution(roomId);
      await refresh();
    } catch (err) {
      setResolveError(err.message);
    }
  }

  async function handleFindMidpoint() {
    setMidpointError(null);
    try {
      await updateRoomMidpoint(roomId);
      await refresh();
    } catch (err) {
      setMidpointError(err.message);
    }
  }

  function handleStartEditLocation() {
    setLocationDraft(null);
    setLocationError(null);
    setEditingLocation(true);
  }

  function handleCloseLocationEditor() {
    setEditingLocation(false);
    setLocationDraft(null);
    setHasRelocated(true);
  }

  async function handleSaveLocation() {
    if (!locationDraft) return;
    try {
      await updateParticipantLocation(
        roomId,
        myParticipantId,
        locationDraft.lat,
        locationDraft.lng,
      );
      await refresh();
      setEditingLocation(false);
      setLocationDraft(null);
      setHasRelocated(true);
    } catch (err) {
      setLocationError(err.message);
    }
  }

  // 방장이 "중간지점을 못 찾았다" 에러를 보고 누르는 버튼 - 방 전체에 재설정 신호를 켜서
  // 나머지 참여자들도 폴링으로 자동으로 위치 수정 화면을 보게 만든다.
  async function handleRequestRelocation() {
    try {
      await updateRoomRelocation(roomId);
      await refresh();
    } catch (err) {
      setMidpointError(err.message);
      return;
    }
    handleStartEditLocation();
  }

  async function handleCopyInviteLink() {
    try {
      await copyToClipboard(window.location.href);
      setLinkCopyError(null);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      setLinkCopyError(
        "링크 복사에 실패했습니다. 주소창의 링크를 직접 복사해주세요.",
      );
    }
  }

  async function handleLeave() {
    if (!window.confirm("방에서 나가시겠습니까?")) return;
    await leave();
    navi("/");
  }

  // 테스트 단계 전용 - 자동 만료(3시간)를 기다리지 않고 방을 바로 지운다.
  async function handleDeleteRoom() {
    if (
      !window.confirm(
        "방을 완전히 삭제하시겠습니까? 모든 참여자에게 영향을 줍니다.",
      )
    )
      return;
    await deleteRoom(roomId);
    navi("/");
  }

  async function handleSetMode(key) {
    await updateRoomMode(roomId, key);
    await refresh();
  }

  async function handleChooseRestaurant(restaurant) {
    await updateParticipantRestaurant(roomId, myParticipantId, restaurant);
    await refresh();
  }

  if (error)
    return (
      <Wrapper>
        <ErrorText>{error}</ErrorText>
      </Wrapper>
    );
  if (!room || !me)
    return (
      <Wrapper>
        <SubText>불러오는 중...</SubText>
      </Wrapper>
    );

  if (room.stage === "WAITING" || room.stage === "MODE_SELECTED") {
    const showLocationEditor =
      editingLocation || (room.needsRelocation && !hasRelocated);
    return (
      <Wrapper>
        <Title>참여자 대기 중</Title>
        <SubText>
          {room.participants.length}/{room.capacity}명 · 링크를 공유해서 더
          초대할 수 있어요
        </SubText>
        <ParticipantList>
          {room.participants.map((p) => (
            <ParticipantItem key={p.id}>
              {p.nickname}
              {p.id === room.hostParticipantId && " (방장)"}
            </ParticipantItem>
          ))}
        </ParticipantList>
        {showLocationEditor ? (
          <>
            <SubText>
              {!editingLocation && room.needsRelocation
                ? "방장이 위치 재설정을 요청했습니다 - 내 위치를 다시 선택하세요"
                : "내 위치를 다시 선택하세요"}
            </SubText>
            <LocationPicker value={locationDraft} onChange={setLocationDraft} />
            <ButtonRow>
              <Button onClick={handleSaveLocation} disabled={!locationDraft}>
                위치 저장
              </Button>
              <Button onClick={handleCloseLocationEditor}>취소</Button>
            </ButtonRow>
            {locationError && <ErrorText>{locationError}</ErrorText>}
          </>
        ) : (
          <>
            <ParticipantsMap participants={room.participants} />
            <ButtonRow>
              <Button onClick={handleStartEditLocation}>내 위치 수정</Button>
            </ButtonRow>
          </>
        )}
        {isHost && (
          <ButtonRow>
            <Button onClick={handleCopyInviteLink}>
              {linkCopied ? "복사됨!" : "초대 링크 복사"}
            </Button>
          </ButtonRow>
        )}
        {linkCopyError && <ErrorText>{linkCopyError}</ErrorText>}
        {isHost ? (
          <>
            <SubText>참여자 위치를 보고 이동 방법을 선택하세요</SubText>
            <ButtonRow>
              {Object.keys(MODE_LABELS).map((key) => (
                <Button
                  key={key}
                  $active={room.mode === key}
                  onClick={() => handleSetMode(key)}
                >
                  {MODE_LABELS[key]}
                </Button>
              ))}
            </ButtonRow>
            <ButtonRow>
              <Button disabled={!room.mode} onClick={handleFindMidpoint}>
                중간지점 찾기
              </Button>
            </ButtonRow>
            {midpointError && (
              <>
                <ErrorText>{midpointError}</ErrorText>
                <ButtonRow>
                  <Button onClick={handleRequestRelocation}>
                    위치 재설정하기
                  </Button>
                </ButtonRow>
              </>
            )}
          </>
        ) : (
          <SubText>
            방장이 이동 방법을 고르고 중간지점을 찾을 때까지 기다려주세요.
          </SubText>
        )}
        <ButtonRow>
          <Button onClick={handleLeave}>방 나가기</Button>
          {isHost && (
            <Button onClick={handleDeleteRoom}>방 삭제 (테스트)</Button>
          )}
        </ButtonRow>
      </Wrapper>
    );
  }

  // MIDPOINT_FOUND | RESOLVING
  const chosenCount = room.participants.filter(
    (p) => p.chosenRestaurant,
  ).length;
  const allChosen = chosenCount === room.participants.length;

  // 다른 참여자가 검색해서 선택한 식당은 내 검색 결과/추천 목록에는 안 뜨니, 여기서
  // room.participants를 훑어서 따로 모아 보여준다 - 그래야 나도 같은 식당을 선택할 수 있다.
  const shownIds = new Set(
    [...(searchResults || []), ...(nearbyRestaurants || [])].map((r) => r.id),
  );
  const othersChosenRestaurants = [];
  const seenChosenIds = new Set();
  for (const p of room.participants) {
    const r = p.chosenRestaurant;
    if (r && !seenChosenIds.has(r.id)) {
      seenChosenIds.add(r.id);
      if (!shownIds.has(r.id)) othersChosenRestaurants.push(r);
    }
  }

  const allPins = [
    ...(searchResults || []),
    ...(nearbyRestaurants || []),
    ...othersChosenRestaurants,
  ];

  const renderRestaurant = (restaurant) => (
    <RestaurantItem
      key={restaurant.id}
      $chosen={me.chosenRestaurant?.id === restaurant.id}
    >
      <div>
        <div>{restaurant.name}</div>
        <div className="text-xs text-text-muted">
          <div>종류: {lastCategory(restaurant.category)}</div>
          <div>주소: {restaurant.roadAddress || restaurant.address}</div>
          {restaurant.phone && <div>전화번호: {restaurant.phone}</div>}
        </div>
        {restaurant.placeUrl && (
          <LinkButton onClick={() => setReviewPlace(restaurant)}>
            상세 정보 보기
          </LinkButton>
        )}
      </div>
      <Button onClick={() => handleChooseRestaurant(restaurant)}>선택</Button>
    </RestaurantItem>
  );

  return (
    <Wrapper>
      <Title>식당 선택</Title>
      <SubText>
        중간지점 근처 식당 중 하나를 골라주세요 ({chosenCount}/
        {room.participants.length}명 선택 완료)
      </SubText>
      <form onSubmit={handleRestaurantSearch} className="flex gap-1.5 my-2">
        <Input
          value={restaurantQuery}
          onChange={(e) => setRestaurantQuery(e.target.value)}
          placeholder="식당 이름 검색"
          className="flex-1"
        />
        <Button type="submit">검색</Button>
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
            {searchResults.length === 0 && (
              <SubText>검색 결과가 없습니다.</SubText>
            )}
            {searchResults.map(renderRestaurant)}
          </ParticipantList>
        </>
      )}
      {othersChosenRestaurants.length > 0 && (
        <>
          <SubText>다른 참여자가 선택한 식당</SubText>
          <ParticipantList>
            {othersChosenRestaurants.map(renderRestaurant)}
          </ParticipantList>
        </>
      )}
      <SubText>추천 식당</SubText>
      {nearbyError && <ErrorText>{nearbyError}</ErrorText>}
      <ParticipantList>
        {nearbyRestaurants === null && !nearbyError && (
          <SubText>불러오는 중...</SubText>
        )}
        {nearbyRestaurants?.length === 0 && (
          <SubText>주변에 추천할 식당이 없습니다.</SubText>
        )}
        {(nearbyRestaurants || []).map(renderRestaurant)}
      </ParticipantList>
      {isHost && (
        <>
          <ButtonRow>
            <Button disabled={!allChosen} onClick={handleResolve}>
              메뉴 확정하기{!allChosen && " (전원 선택 대기 중)"}
            </Button>
          </ButtonRow>
          {resolveError && <ErrorText>{resolveError}</ErrorText>}
        </>
      )}
      <ButtonRow>
        <Button onClick={handleLeave}>방 나가기</Button>
      </ButtonRow>
      <ReviewModal
        reviewPlace={reviewPlace}
        onClose={() => setReviewPlace(null)}
      />
    </Wrapper>
  );
}

export default MapPage;
