import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import RouteMap from "../components/map/RouteMap";
import ReviewModal from "../components/common/ReviewModal";
import Legend from "../components/result/Legend";
import TransitSteps from "../components/result/TransitSteps";
import { ROUTE_COLORS } from "../constants";
import { deleteRoom } from "../api/room";
import { useRoom } from "../hooks/useRoom";
import {
  lastCategory,
  legKind,
  buildTransitSteps,
  resolveRouteColors,
} from "../utils/route";
import {
  Wrapper,
  Title,
  SubText,
  ButtonRow,
  Button,
  LinkButton,
  ErrorText,
} from "../components/common";

// 식당이 확정된 뒤(RESOLVED) 참여자별 경로를 보여주는 화면.
function ResultPage() {
  const { roomId } = useParams();
  const navi = useNavigate();
  const { room, error, me, isHost, leave } = useRoom(roomId);

  const [reviewPlace, setReviewPlace] = useState(null);
  const [selectedLeg, setSelectedLeg] = useState(null);
  const [expandedVehicleLeg, setExpandedVehicleLeg] = useState(null);

  function toggleLeg(type) {
    setSelectedLeg((prev) => (prev === type ? null : type));
  }

  useEffect(() => {
    if (!room) return;
    if (!me) {
      navi(`/room/${roomId}`);
      return;
    }
    if (room.stage !== "RESOLVED") {
      navi(`/room/${roomId}/map`);
    }
  }, [room, me, roomId, navi]);

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

  if (error)
    return (
      <Wrapper>
        <ErrorText>{error}</ErrorText>
      </Wrapper>
    );
  if (!room || !me || room.stage !== "RESOLVED")
    return (
      <Wrapper>
        <SubText>불러오는 중...</SubText>
      </Wrapper>
    );

  const resolvedRestaurant = room.resolvedRestaurant;
  // 대중교통 모드인데 이 참여자만 대중교통 경로를 못 찾은 경우(예: 목적지 바로 앞이라
  // 대중교통 API가 경로를 안 주는 경우) - 도보 경로는 모드와 무관하게 항상 같이
  // 계산해두므로(RouteFiller), 있으면 그걸로 대신 보여준다.
  const transitUnavailable =
    room.mode !== "walk" && me.transitTimeMinutes == null;
  const showWalk =
    room.mode === "walk" || (transitUnavailable && me.walkTimeMinutes != null);

  return (
    <Wrapper>
      <SubText className="uppercase tracking-wide text-[11px]">
        확정된 식당
      </SubText>
      <Title className="mb-2">{resolvedRestaurant.name}</Title>
      <div className="bg-surface border border-mist rounded-lg p-3 mb-3">
        <SubText>종류: {lastCategory(resolvedRestaurant.category)}</SubText>
        <SubText>
          주소: {resolvedRestaurant.roadAddress || resolvedRestaurant.address}
        </SubText>
        {resolvedRestaurant.phone && (
          <SubText>전화번호: {resolvedRestaurant.phone}</SubText>
        )}
        {resolvedRestaurant.placeUrl && (
          <LinkButton
            className="mt-1"
            onClick={() => setReviewPlace(resolvedRestaurant)}
          >
            상세 정보 보기
          </LinkButton>
        )}
      </div>
      {showWalk ? (
        me.walkTimeMinutes != null ? (
          <>
            {transitUnavailable && (
              <SubText>
                대중교통 경로를 찾지 못해 도보 경로로 안내합니다.
              </SubText>
            )}
            <SubText>총 {me.walkTimeMinutes}분</SubText>
            <RouteMap
              routes={[
                { points: me.walkRoute, color: ROUTE_COLORS.walk, dash: false },
              ]}
              startPoint={{ lat: me.lat, lng: me.lng }}
              endPoint={{
                lat: resolvedRestaurant.lat,
                lng: resolvedRestaurant.lng,
              }}
              startLabel={me.nickname}
              endLabel={resolvedRestaurant.name}
            />
          </>
        ) : (
          <SubText>도보 경로를 찾을 수 없습니다.</SubText>
        )
      ) : me.transitTimeMinutes != null ? (
        (() => {
          const routeColors = resolveRouteColors(me.transitCoreLegs || []);
          const transitLegs = (me.transitCoreLegs || []).filter(
            (leg) => leg.type !== "WALKING",
          );
          const steps = buildTransitSteps(
            transitLegs,
            me.transitWalkToStationMinutes,
            me.transitWalkFromStationMinutes,
            routeColors,
            resolvedRestaurant.name,
          );
          return (
            <>
              <SubText className="font-semibold text-text">
                총 {me.transitTimeMinutes}분
              </SubText>
              {transitLegs.length > 0 ? (
                <TransitSteps
                  nodes={steps.nodes}
                  edges={steps.edges}
                  expandedLeg={expandedVehicleLeg}
                  onToggleLeg={(i) =>
                    setExpandedVehicleLeg((prev) => (prev === i ? null : i))
                  }
                />
              ) : (
                <SubText>{me.transitSummary || "경로 정보 없음"}</SubText>
              )}
              <SubText className="flex gap-1">
                <Legend
                  colors={[routeColors.walk]}
                  label="도보"
                  active={selectedLeg === "walk"}
                  onClick={() => toggleLeg("walk")}
                />
                <Legend
                  colors={[routeColors.bus]}
                  label="버스"
                  active={selectedLeg === "bus"}
                  onClick={() => toggleLeg("bus")}
                />
                <Legend
                  colors={
                    routeColors.subwayColors.length
                      ? routeColors.subwayColors
                      : [ROUTE_COLORS.subway]
                  }
                  label="지하철"
                  active={selectedLeg === "subway"}
                  onClick={() => toggleLeg("subway")}
                />
              </SubText>
              <RouteMap
                routes={[
                  {
                    points: me.transitWalkToStationRoute,
                    color: routeColors.walk,
                    dash: true,
                    highlight: selectedLeg === "walk",
                    dimmed: selectedLeg != null && selectedLeg !== "walk",
                    detail:
                      me.transitWalkToStationMinutes > 0
                        ? `도보 ${me.transitWalkToStationMinutes}분`
                        : null,
                  },
                  ...(me.transitCoreLegs || []).map((leg) => ({
                    points: leg.points,
                    color: routeColors.colorForLeg(leg),
                    dash: leg.type === "WALKING",
                    thick: leg.type === "SUBWAY",
                    highlight: selectedLeg === legKind(leg.type),
                    dimmed:
                      selectedLeg != null && selectedLeg !== legKind(leg.type),
                    detail:
                      leg.vehicles && leg.vehicles.length > 0
                        ? [leg.guidance, ...leg.vehicles].join("\n")
                        : leg.guidance || null,
                  })),
                  {
                    points: me.transitWalkFromStationRoute,
                    color: routeColors.walk,
                    dash: true,
                    detail:
                      me.transitWalkFromStationMinutes > 0
                        ? `도보 ${me.transitWalkFromStationMinutes}분`
                        : null,
                    highlight: selectedLeg === "walk",
                    dimmed: selectedLeg != null && selectedLeg !== "walk",
                  },
                ]}
                startPoint={{ lat: me.lat, lng: me.lng }}
                endPoint={{
                  lat: resolvedRestaurant.lat,
                  lng: resolvedRestaurant.lng,
                }}
                startLabel={me.nickname}
                endLabel={resolvedRestaurant.name}
              />
            </>
          );
        })()
      ) : (
        <SubText>이동 경로를 찾을 수 없습니다.</SubText>
      )}
      <ButtonRow>
        <Button onClick={handleLeave}>방 나가기</Button>
        {isHost && <Button onClick={handleDeleteRoom}>방 삭제 (테스트)</Button>}
      </ButtonRow>
      <ReviewModal
        reviewPlace={reviewPlace}
        onClose={() => setReviewPlace(null)}
      />
    </Wrapper>
  );
}

export default ResultPage;
