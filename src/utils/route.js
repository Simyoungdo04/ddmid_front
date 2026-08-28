import { ROUTE_COLORS } from "../constants";

// 카카오 카테고리는 "음식점 > 한식 > 육류,고기 > 곱창,막창"처럼 계층으로 오는데,
// 화면에는 마지막 단계(가장 구체적인 이름)만 보여준다.
export function lastCategory(category) {
  if (!category) return category;
  const parts = category.split(">").map((p) => p.trim());
  return parts[parts.length - 1];
}

export function legKind(type) {
  if (type === "BUS") return "bus";
  if (type === "SUBWAY") return "subway";
  return "walk";
}

// 카카오 guidance는 "1호선 (종로3가 > 동대문)"처럼 "노선명 (탑승역 > 하차역)" 형식으로
// 온다 - 경로를 역 단위 스텝(정류장 → 정류장)으로 보여줄 때 이 형식에서 뽑아 쓴다.
// 형식이 안 맞으면(방어적으로) guidance 전체를 line으로 두고 역명은 비워둔다.
export function parseGuidance(guidance) {
  const match =
    guidance && guidance.match(/^(.*?)\s*\(([^()>]+)>([^()]+)\)\s*$/);
  if (!match) return { line: guidance || "", board: null, alight: null };
  return {
    line: match[1].trim(),
    board: match[2].trim(),
    alight: match[3].trim(),
  };
}

// 전철/도시철도 공식 노선색. 카카오 응답의 guidance/vehicles 문구엔 "1호선", "일반 3호선"
// 처럼 도시명 없이 노선 번호만 오기 때문에("대구 3호선"이 아니라 그냥 "3호선"), 노선명
// 문자열만으로는 서울/부산/대구를 구분할 수 없다 - 그래서 구간 좌표(leg.points)로 지역을
// 먼저 판단하고, 그 지역의 노선색표 안에서만 번호를 매칭한다.
// 색상은 서울 쪽만 확신이 있고 부산/대구는 근사치라 실제와 다르면 알려주면 바로 수정 가능.
const SEOUL_LINE_COLORS = {
  "1호선": "#0052A4",
  "2호선": "#00A84D",
  "3호선": "#EF7C1C",
  "4호선": "#00A5DE",
  "5호선": "#996CAC",
  "6호선": "#CD7C2F",
  "7호선": "#747D0F",
  "8호선": "#E6186C",
  "9호선": "#BDB092",
  경의중앙선: "#77C4A3",
  수인분당선: "#FABE00",
  신분당선: "#D4003B",
  공항철도: "#0090D2",
  경춘선: "#0C8E72",
  서해선: "#8FC31F",
  경강선: "#003DA5",
  우이신설선: "#B0CE18",
  신림선: "#6789CA",
  김포골드라인: "#A17800",
};

const BUSAN_LINE_COLORS = {
  "1호선": "#F06A00",
  "2호선": "#8FC31F",
  "3호선": "#B7882B",
  "4호선": "#009DC6",
  부산김해경전철: "#8B5FA3",
  동해선: "#006F62",
};

const DAEGU_LINE_COLORS = {
  "1호선": "#D93A49",
  "2호선": "#39A935",
  "3호선": "#F5A200",
};

// leg.points[0] 좌표로 대략적인 도시 권역을 가른다 - 정확한 행정구역 경계가 아니라
// 노선색표를 고르기 위한 넉넉한 사각 범위라서 걸치는 지점 오차는 감수한다.
function lineColorsFor(points) {
  const first = points && points[0];
  if (!first) return SEOUL_LINE_COLORS;
  const { lat, lng } = first;
  if (lat >= 35.0 && lat < 35.5 && lng >= 128.8 && lng < 129.3)
    return BUSAN_LINE_COLORS;
  if (lat >= 35.6 && lat < 36.1 && lng >= 128.4 && lng < 128.9)
    return DAEGU_LINE_COLORS;
  return SEOUL_LINE_COLORS;
}

function subwayLineColor(leg) {
  const colors = lineColorsFor(leg.points);
  const label = [leg.guidance, ...(leg.vehicles || [])].join(" ");
  const matched = Object.entries(colors)
    .sort(([a], [b]) => b.length - a.length)
    .find(([line]) => label.includes(line));
  return matched ? matched[1] : ROUTE_COLORS.subway;
}

function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: h * 60, s, l };
}

function hueDistance(h1, h2) {
  const diff = Math.abs(h1 - h2) % 360;
  return diff > 180 ? 360 - diff : diff;
}

// 색상환 기준 30도 이내 + 둘 다 무채색이 아니면 "같은 색 계열"로 본다(예: 도보 주황 vs
// 부산 1호선 주황).
const HUE_CLASH_THRESHOLD = 30;

function sameColorFamily(hexA, hexB) {
  const a = hexToHsl(hexA);
  const b = hexToHsl(hexB);
  if (a.s < 0.15 || b.s < 0.15) return false;
  return hueDistance(a.h, b.h) <= HUE_CLASH_THRESHOLD;
}

// 도보/버스 기본색과 겹치는 계열일 때 대신 쓸 색 - 나머지 팔레트와 안 겹치는 마젠타/인디고.
const WALK_FALLBACK_COLOR = "#DB2777";
const BUS_FALLBACK_COLOR = "#7C3AED";

// 참여자 한 명의 대중교통 구간 전체(legs)를 보고 도보/버스/지하철 색을 한 번에 정한다.
// 지하철은 노선마다 실제 색을 쓰다 보니 도보(주황)나 버스(하늘) 기본색과 우연히 같은
// 계열이 되는 경우가 있어서, 그럴 땐 도보/버스 쪽을 대체색으로 바꿔서 구분되게 한다.
export function resolveRouteColors(legs) {
  const subwayColors = [
    ...new Set(
      (legs || [])
        .filter((leg) => legKind(leg.type) === "subway")
        .map(subwayLineColor),
    ),
  ];

  const walk = subwayColors.some((c) => sameColorFamily(c, ROUTE_COLORS.walk))
    ? WALK_FALLBACK_COLOR
    : ROUTE_COLORS.walk;
  const bus = subwayColors.some((c) => sameColorFamily(c, ROUTE_COLORS.bus))
    ? BUS_FALLBACK_COLOR
    : ROUTE_COLORS.bus;

  function colorForLeg(leg) {
    const kind = legKind(leg.type);
    if (kind === "walk") return walk;
    if (kind === "bus") return bus;
    return subwayLineColor(leg);
  }

  return { walk, bus, subwayColors, colorForLeg };
}

// transitLegs(도보 환승 구간 제외)를 정류장 단위 노드/구간 목록으로 바꾼다 - 노드는
// "탑승역"/"하차역"/도착지 같은 지점, 구간(edges[i])은 nodes[i]->nodes[i+1]을 잇는 이동
// 수단(도보/버스/노선색)이다. 화면엔 노드-구간-노드-구간...으로 번갈아 그린다.
export function buildTransitSteps(
  transitLegs,
  walkToStationMinutes,
  walkFromStationMinutes,
  routeColors,
  destinationName,
) {
  const nodes = [];
  const edges = [];

  transitLegs.forEach((leg, i) => {
    const { line, board, alight } = parseGuidance(leg.guidance);
    if (i === 0) {
      if (walkToStationMinutes > 0) {
        nodes.push({ label: "출발" });
        edges.push({
          color: routeColors.walk,
          dashed: true,
          label: `도보 ${walkToStationMinutes}분`,
        });
      }
      nodes.push({ label: board || "탑승" });
    }
    edges.push({
      color: routeColors.colorForLeg(leg),
      dashed: false,
      label: line,
      vehicles: leg.vehicles,
      legIndex: i,
    });
    nodes.push({ label: alight || "하차" });
  });

  edges.push({
    color: routeColors.walk,
    dashed: true,
    label:
      walkFromStationMinutes > 0 ? `도보 ${walkFromStationMinutes}분` : null,
  });
  nodes.push({ label: destinationName, terminus: true });

  return { nodes, edges };
}
