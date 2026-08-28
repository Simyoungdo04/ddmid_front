import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LocationPicker from "../components/map/LocationPicker";
import { createParticipant } from "../api/room";
import { useRoom } from "../hooks/useRoom";
import {
  Wrapper,
  Title,
  SubText,
  ButtonRow,
  Button,
  Input,
  ErrorText,
} from "../components/common";

// 닉네임·위치 입력 화면. 이미 입장한 사람(localStorage에 participantId가 있음)이면
// 곧장 다음 화면으로 넘긴다 - 새로고침해도 다시 입장 폼이 뜨면 안 되기 때문이다.
function RoomEnterPage() {
  const { roomId } = useParams();
  const navi = useNavigate();
  const { room, error, me, rememberParticipant } = useRoom(roomId);

  const [nickname, setNickname] = useState("");
  const [location, setLocation] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);

  useEffect(() => {
    if (!room || !me) return;
    navi(
      room.stage === "RESOLVED"
        ? `/room/${roomId}/result`
        : `/room/${roomId}/map`,
    );
  }, [room, me, roomId, navi]);

  async function handleJoin(e) {
    e.preventDefault();
    if (!nickname.trim() || !location || joining) return;
    setJoining(true);
    setJoinError(null);
    try {
      const participant = await createParticipant(
        roomId,
        nickname.trim(),
        location.lat,
        location.lng,
      );
      rememberParticipant(participant.id);
    } catch (err) {
      setJoinError(err.message);
      setJoining(false);
    }
  }

  if (error)
    return (
      <Wrapper>
        <ErrorText>{error}</ErrorText>
      </Wrapper>
    );
  if (!room)
    return (
      <Wrapper>
        <SubText>불러오는 중...</SubText>
      </Wrapper>
    );
  if (me)
    return (
      <Wrapper>
        <SubText>불러오는 중...</SubText>
      </Wrapper>
    );

  const isCreating = room.participants.length === 0;

  return (
    <Wrapper>
      <Title>{isCreating ? "방 생성하기" : "방 참여하기"}</Title>
      <SubText>
        {room.participants.length}/{room.capacity}명 참여 중
      </SubText>
      <form onSubmit={handleJoin}>
        <Input
          className="w-full mb-2"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="닉네임 입력"
        />
        <LocationPicker value={location} onChange={setLocation} />
        <Button
          type="submit"
          disabled={joining || !nickname.trim() || !location}
        >
          {joining
            ? isCreating
              ? "만드는 중..."
              : "입장하는 중..."
            : isCreating
              ? "방 만들기"
              : "입장하기"}
        </Button>
        {joinError && <ErrorText>{joinError}</ErrorText>}
      </form>
      <ButtonRow>
        <Button onClick={() => navi("/")}>뒤로가기</Button>
      </ButtonRow>
    </Wrapper>
  );
}

export default RoomEnterPage;
