"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  io,
  type Socket,
} from "socket.io-client";

import Potato, {
  type PotatoDirection,
} from "@/components/character/Potato";

import type {
  CharacterStyle,
} from "@/components/character/CharacterCustomizer";

import DevilOfficeMap, {
  DEVIL_MAP_HEIGHT,
  DEVIL_MAP_WIDTH,
  DOOR_AREAS,
  WALKABLE_AREAS,
  type WalkableRect,
} from "./DevilOfficeMap";

import GameMapOverlay, {
  type MissionMarker,
} from "./GameMapOverlay";

import MissionModal from "./missions/MissionModal";

import {
  INITIAL_MISSIONS,
  type Mission,
} from "./missions/missionTypes";

/* =========================================================
   Types
========================================================= */

type Position = {
  x: number;
  y: number;
};

type PlayerState =
  | "alive"
  | "ghost";

type GamePlayer = {
  id: string;

  nickname: string;

  characterStyle?:
  CharacterStyle;

  state:
  PlayerState;

  x: number;
  y: number;

  /*
   * 서버가 마지막으로 알고 있는 이동 상태.
   * 다른 플레이어의 걷기 모션을 자연스럽게 보여주기 위해 사용한다.
   */
  moving?: boolean;

  /*
   * 감자가 현재 바라보는 방향.
   * 서버에 direction이 없더라도 클라이언트에서 좌표 변화로 계산해 유지한다.
   */
  direction?: PotatoDirection;

  missionIds?: string[];

  completedMissionIds?: string[];
};

type RemotePlayer =
  GamePlayer & {
    /* 실제 화면에 그려지는 보간 좌표 */
    renderX: number;
    renderY: number;

    /* 서버에서 받은 최신 목표 좌표 */
    targetX: number;
    targetY: number;

    lastUpdateAt: number;
  };

type Corpse = {
  id: string;

  victimId: string;
  nickname: string;

  /*
   * 죽은 순간의 실제 감자 외형.
   * 서버의 corpse.characterStyle을 받아
   * 시체도 🥔 이모지가 아니라 실제 캐릭터로 표시한다.
   */
  characterStyle?:
  CharacterStyle;

  x: number;
  y: number;

  createdAt: number;
};

type MeetingPhase =
  | "discussion"
  | "voting"
  | "result";

type MeetingChatMessage = {
  id: string;

  playerId: string;
  nickname: string;

  message: string;

  createdAt: number;
};

type MeetingState = {
  id: string;

  active: boolean;

  kind:
  | "corpse"
  | "emergency";

  phase:
  MeetingPhase;

  reporterId:
  string;

  reporterNickname?:
  string | null;

  corpseId?:
  string | null;

  victimId?:
  string | null;

  victimNickname?:
  string | null;

  startedAt:
  number;

  phaseEndsAt:
  number;

  messages:
  MeetingChatMessage[];

  votedPlayerIds:
  string[];
};

type MeetingResult = {
  roomId?: string;

  skipped:
  boolean;

  expelledPlayer:
  | {
    id: string;
    nickname: string;
    role:
    | "devil"
    | "survivor";
  }
  | null;

  voteCounts:
  Record<
    string,
    number
  >;

  resultEndsAt:
  number;
};

type TeamMissionProgress = {
  completed: number;
  total: number;
  percentage: number;
};

type GameStatePayload = {
  roomId: string;

  players:
  GamePlayer[];

  corpses:
  Corpse[];

  /*
   * 생존자 팀 전체 미션 진행도.
   * 서버에서 악마를 제외해 계산한 값이다.
   */
  missionProgress?:
  TeamMissionProgress;

  meeting?:
  MeetingState | null;
};

type KillConfirmedPayload = {
  roomId: string;

  killerId: string;
  victimId: string;

  corpse:
  Corpse;

  cooldownEndsAt:
  number;
};

type GameResultWinner = {
  id: string;

  nickname: string;

  characterStyle?:
  CharacterStyle;
};

type GameResultPayload = {
  roomId: string;

  winningTeam:
  | "devil"
  | "survivor";

  reason: string;

  winners:
  GameResultWinner[];

  finishedAt: number;
};

type DevilGameWorldProps = {
  role:
  | "devil"
  | "survivor";

  /*
   * 대기실에서 게임 시작 당시 사용하던 고정 플레이어 ID.
   * 게임 화면에서 Socket ID가 새로 만들어져도 이 값으로
   * 서버의 기존 gamePlayer에 정확히 다시 연결한다.
   */
  playerId: string;

  roomId: string;
  nickname: string;

  characterStyle:
  CharacterStyle;

  onReturnToOffice:
  () => void;
};

/* =========================================================
   Constants
========================================================= */

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  "http://localhost:4000";

const VIEWPORT_WIDTH =
  1100;

const VIEWPORT_HEIGHT =
  650;

const PLAYER_SPEED =
  260;

const ARRIVAL_DISTANCE =
  2;

const COLLISION_STEP =
  4;

const INTERACTION_DISTANCE =
  115;

const KILL_UI_DISTANCE =
  135;

/*
 * 시체에 이 거리 안으로 접근하면
 * 긴급회의 신고 버튼을 표시한다.
 */
const REPORT_DISTANCE =
  150;

const MOVE_EMIT_INTERVAL =
  50;

/*
 * 다른 플레이어 좌표는 네트워크 패킷이 들어올 때마다
 * 바로 점프시키지 않고 목표 좌표를 향해 보간한다.
 */
const REMOTE_SMOOTHING =
  14;

const REMOTE_STOP_DISTANCE =
  0.6;

/*
 * 재접속/스폰처럼 좌표 차이가 아주 큰 경우에는
 * 긴 시간 미끄러지지 않고 즉시 해당 위치로 맞춘다.
 */
const REMOTE_TELEPORT_DISTANCE =
  450;

/*
 * 처치 연출 전체 길이.
 * 마지막 처치와 동시에 게임이 끝나더라도
 * 이 연출이 끝난 뒤 결과 화면을 보여준다.
 */
const KILL_SEQUENCE_DURATION =
  2800;

/* =========================================================
   Mobile / Responsive
========================================================= */

const MOBILE_BREAKPOINT =
  768;

/*
 * 가로모드 휴대폰은 width가 768px을 넘는 경우가 많다.
 * 예: 844x390, 932x430.
 * 따라서 width 하나만으로 모바일 여부를 판단하지 않는다.
 */
const MOBILE_LANDSCAPE_MAX_WIDTH =
  1180;

const MOBILE_LANDSCAPE_MAX_HEIGHT =
  620;

const MOBILE_VIEWPORT_PADDING =
  0;

const MOBILE_PLAYER_SPEED_MULTIPLIER =
  0.92;

const MOBILE_JOYSTICK_SIZE =
  108;

const MOBILE_LANDSCAPE_JOYSTICK_SIZE =
  118;

/*
 * 중앙 회의 테이블 기준 위치.
 * 현재 맵의 중앙 회의 구역을 기준으로 한다.
 */
const EMERGENCY_MEETING_POSITION: Position = {
  /* 회의실 테이블(900,1110,390x100)의 중심점 */
  x: 1095,
  y: 1160,
};

const EMERGENCY_MEETING_DISTANCE =
  190;

/*
 * 긴급회의는 남발되지 않도록
 * 한 플레이어당 게임 중 1회만 요청 가능.
 */
const EMERGENCY_MEETING_MAX_USES =
  1;

/* =========================================================
   Helpers
========================================================= */

function isInsideRect(
  x: number,
  y: number,
  rect:
    WalkableRect
) {
  return (
    x >= rect.x &&
    x <=
    rect.x +
    rect.width &&
    y >= rect.y &&
    y <=
    rect.y +
    rect.height
  );
}

function isWalkable(
  x: number,
  y: number
) {
  const areas = [
    ...WALKABLE_AREAS,
    ...DOOR_AREAS,
  ];

  return areas.some(
    (area) =>
      isInsideRect(
        x,
        y,
        area
      )
  );
}

function isPathWalkable(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
) {
  const dx =
    toX -
    fromX;

  const dy =
    toY -
    fromY;

  const distance =
    Math.sqrt(
      dx * dx +
      dy * dy
    );

  const steps =
    Math.max(
      1,

      Math.ceil(
        distance /
        COLLISION_STEP
      )
    );

  for (
    let index = 1;
    index <= steps;
    index += 1
  ) {
    const ratio =
      index /
      steps;

    const x =
      fromX +
      dx *
      ratio;

    const y =
      fromY +
      dy *
      ratio;

    if (
      !isWalkable(
        x,
        y
      )
    ) {
      return false;
    }
  }

  return true;
}

function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.max(
    min,
    Math.min(
      max,
      value
    )
  );
}

function getDistance(
  a: Position,
  b: Position
) {
  const dx =
    a.x -
    b.x;

  const dy =
    a.y -
    b.y;

  return Math.sqrt(
    dx * dx +
    dy * dy
  );
}

function getDisplayName(
  nickname?: string | null
) {
  const cleaned =
    String(
      nickname ??
      ""
    )
      .replace(
        /\s*감자\s*$/g,
        ""
      )
      .trim();

  return cleaned
    ? `${cleaned} 감자`
    : "감자";
}

/*
 * 이동 벡터를 기준으로 감자의 상/하/좌/우 방향을 정한다.
 * 대각선 이동은 변화량이 더 큰 축을 우선한다.
 */
function getMoveDirection(
  dx: number,
  dy: number,
  fallback: PotatoDirection = "down"
): PotatoDirection {
  const absX =
    Math.abs(dx);

  const absY =
    Math.abs(dy);

  if (
    absX < 0.001 &&
    absY < 0.001
  ) {
    return fallback;
  }

  if (
    absX >= absY
  ) {
    return dx >= 0
      ? "right"
      : "left";
  }

  return dy >= 0
    ? "down"
    : "up";
}

/* =========================================================
   DevilGameWorld
========================================================= */

export default function DevilGameWorld({
  role,
  roomId,
  playerId,
  nickname,
  characterStyle,
  onReturnToOffice,
}: DevilGameWorldProps) {
  /* ======================================================
     Refs
  ====================================================== */

  const viewportRef =
    useRef<HTMLDivElement | null>(
      null
    );

  /*
   * 긴급회의 채팅이 새 메시지를 받을 때
   * 가장 아래 메시지로 자동 스크롤한다.
   */
  const meetingChatScrollRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const socketRef =
    useRef<Socket | null>(
      null
    );

  const animationFrameRef =
    useRef<number | null>(
      null
    );

  const remoteAnimationFrameRef =
    useRef<number | null>(
      null
    );

  const remoteLastFrameTimeRef =
    useRef<number | null>(
      null
    );

  const lastFrameTimeRef =
    useRef<number | null>(
      null
    );

  const lastMoveEmitRef =
    useRef(0);

  const positionRef =
    useRef<Position>({
      x: 1100,
      y: 700,
    });

  const directionRef =
    useRef<PotatoDirection>(
      "down"
    );

  const targetPositionRef =
    useRef<Position | null>(
      null
    );

  /*
   * Socket 이벤트 내부에서는 state 값이 오래된 값으로
   * 캡처될 수 있으므로 내 플레이어 ID를 ref로도 보관한다.
   */
  const myPlayerIdRef =
    useRef(playerId);

  /*
   * 마지막 처치 연출이 시작된 시각.
   * 게임 종료 이벤트가 같은 순간 도착하면 결과 화면을 지연한다.
   */
  const lastKillAnimationAtRef =
    useRef(0);

  /*
   * 결과 화면 지연 타이머.
   */
  const pendingResultTimeoutRef =
    useRef<number | null>(
      null
    );

  /*
   * 모바일 가상 조이스틱.
   */
  const joystickVectorRef =
    useRef<Position>({
      x: 0,
      y: 0,
    });

  const joystickAnimationFrameRef =
    useRef<number | null>(
      null
    );

  const joystickLastFrameRef =
    useRef<number | null>(
      null
    );

  const joystickPointerIdRef =
    useRef<number | null>(
      null
    );

  /* ======================================================
     Game identity
  ====================================================== */

  const [
    myPlayerId,
    setMyPlayerId,
  ] =
    useState(playerId);

  const [
    playerState,
    setPlayerState,
  ] =
    useState<PlayerState>(
      "alive"
    );

  /*
   * 게임 시작 뒤에는 page.tsx의 캐릭터 정보가 아니라
   * 서버가 돌려준 자기 자신의 GamePlayer를 기준으로 렌더링한다.
   * 이렇게 해야 각 참가자의 색/안경/모자/리본/넥타이가 섞이지 않는다.
   */
  const [
    selfPlayer,
    setSelfPlayer,
  ] =
    useState<GamePlayer | null>(
      null
    );

  const [
    otherPlayers,
    setOtherPlayers,
  ] =
    useState<
      RemotePlayer[]
    >([]);

  const [
    corpses,
    setCorpses,
  ] =
    useState<
      Corpse[]
    >([]);

  /* ======================================================
     Combat
  ====================================================== */

  const [
    attackEffect,
    setAttackEffect,
  ] =
    useState<{
      killerId: string;
      victimId: string;
    } | null>(
      null
    );

  /*
   * 처치 당사자(악마 / 피해자)에게만 보여주는
   * 짧은 처치 시네마틱.
   */
  const [
    killSequence,
    setKillSequence,
  ] =
    useState<{
      killerId: string;
      victimId: string;
    } | null>(
      null
    );

  const [
    deathOverlay,
    setDeathOverlay,
  ] =
    useState(false);

  const [
    killCooldownEndsAt,
    setKillCooldownEndsAt,
  ] =
    useState(0);

  const [
    cooldownNow,
    setCooldownNow,
  ] =
    useState(
      Date.now()
    );

  const [
    combatMessage,
    setCombatMessage,
  ] =
    useState("");

  const [
    gameResult,
    setGameResult,
  ] =
    useState<GameResultPayload | null>(
      null
    );

  const [
    leaveConfirmOpen,
    setLeaveConfirmOpen,
  ] =
    useState(false);

  const [
    leavingGame,
    setLeavingGame,
  ] =
    useState(false);

  /* ======================================================
     Emergency Meeting
  ====================================================== */

  const [
    meeting,
    setMeeting,
  ] =
    useState<MeetingState | null>(
      null
    );

  const [
    meetingMessages,
    setMeetingMessages,
  ] =
    useState<MeetingChatMessage[]>(
      []
    );

  const [
    meetingInput,
    setMeetingInput,
  ] =
    useState("");

  const [
    meetingResult,
    setMeetingResult,
  ] =
    useState<MeetingResult | null>(
      null
    );

  const [
    voted,
    setVoted,
  ] =
    useState(false);

  const [
    meetingNow,
    setMeetingNow,
  ] =
    useState(
      Date.now()
    );

  /* ======================================================
     Responsive / Mobile
  ====================================================== */

  const [
    isMobile,
    setIsMobile,
  ] =
    useState(false);

  const [
    isLandscapeMobile,
    setIsLandscapeMobile,
  ] =
    useState(false);

  const [
    viewportSize,
    setViewportSize,
  ] =
    useState({
      width:
        VIEWPORT_WIDTH,

      height:
        VIEWPORT_HEIGHT,
    });

  const [
    joystickKnob,
    setJoystickKnob,
  ] =
    useState<Position>({
      x: 0,
      y: 0,
    });

  const [
    emergencyMeetingUses,
    setEmergencyMeetingUses,
  ] =
    useState(0);

  /* ======================================================
     Position
  ====================================================== */

  const [
    position,
    setPosition,
  ] =
    useState<Position>({
      x: 1100,
      y: 700,
    });

  const [
    moving,
    setMoving,
  ] =
    useState(false);

  const [
    direction,
    setDirection,
  ] =
    useState<PotatoDirection>(
      "down"
    );

  /* ======================================================
     Map / blackout
  ====================================================== */

  const [
    mapOpen,
    setMapOpen,
  ] =
    useState(false);

  const [
    blackout,
    setBlackout,
  ] =
    useState(false);

  /* ======================================================
     Missions
  ====================================================== */

  const [
    missions,
    setMissions,
  ] =
    useState<Mission[]>([]);

  const [
    activeMission,
    setActiveMission,
  ] =
    useState<Mission | null>(
      null
    );

  const [
    teamMissionProgress,
    setTeamMissionProgress,
  ] =
    useState<TeamMissionProgress>({
      completed: 0,
      total: 0,
      percentage: 0,
    });

  /* ======================================================
     Personal Mission Progress
  ====================================================== */

  const totalMissionCount =
    missions.length;

  const completedMissionCount =
    missions.filter(
      (mission) =>
        mission.completed
    ).length;

  const remainingMissionCount =
    Math.max(
      0,

      totalMissionCount -
      completedMissionCount
    );

  const missionProgress =
    totalMissionCount === 0
      ? 0
      : Math.round(
        (
          completedMissionCount /
          totalMissionCount
        ) *
        100
      );

  /* ======================================================
     Nearby mission
  ====================================================== */

  const nearbyMission =
    missions.find(
      (mission) => {
        if (
          mission.completed
        ) {
          return false;
        }

        return (
          getDistance(
            position,
            {
              x:
                mission.x,

              y:
                mission.y,
            }
          ) <=
          INTERACTION_DISTANCE
        );
      }
    ) ?? null;

  const mapMissions:
    MissionMarker[] =
    missions.map(
      (mission) => ({
        id:
          mission.id,

        name:
          mission.title,

        x:
          mission.x,

        y:
          mission.y,

        completed:
          mission.completed,
      })
    );

  /* ======================================================
     Nearby corpse
  ====================================================== */

  const nearbyCorpse =
    playerState ===
      "alive" &&
      !meeting
      ? corpses
        .map(
          (corpse) => ({
            corpse,

            distance:
              getDistance(
                position,
                {
                  x:
                    corpse.x,

                  y:
                    corpse.y,
                }
              ),
          })
        )
        .filter(
          (entry) =>
            entry.distance <=
            REPORT_DISTANCE
        )
        .sort(
          (a, b) =>
            a.distance -
            b.distance
        )[0]
        ?.corpse ??
      null
      : null;

  const nearEmergencyMeetingTable =
    playerState ===
      "alive" &&
    !meeting &&
    getDistance(
      position,
      EMERGENCY_MEETING_POSITION
    ) <=
      EMERGENCY_MEETING_DISTANCE;

  const canCallEmergencyMeeting =
    nearEmergencyMeetingTable &&
    emergencyMeetingUses <
      EMERGENCY_MEETING_MAX_USES &&
    !activeMission &&
    !mapOpen &&
    !deathOverlay;

  /* ======================================================
     Nearby kill target

     다른 플레이어의 role은 클라이언트에 공개되지 않는다.
     실제 처치 가능 여부는 서버가 다시 검사한다.
  ====================================================== */

  const nearbyKillTarget =
    role === "devil" &&
      playerState === "alive"
      ? otherPlayers
        .filter(
          (player) =>
            player.state ===
            "alive"
        )
        .map(
          (player) => ({
            player,

            distance:
              getDistance(
                position,
                {
                  x:
                    player.x,

                  y:
                    player.y,
                }
              ),
          })
        )
        .filter(
          (entry) =>
            entry.distance <=
            KILL_UI_DISTANCE
        )
        .sort(
          (a, b) =>
            a.distance -
            b.distance
        )[0]
        ?.player ??
      null
      : null;

  const cooldownRemaining =
    Math.max(
      0,

      Math.ceil(
        (
          killCooldownEndsAt -
          cooldownNow
        ) /
        1000
      )
    );

  /* ======================================================
     Socket
  ====================================================== */

  useEffect(() => {
    if (
      !roomId ||
      !playerId
    ) {
      return;
    }

    const socket =
      io(
        SOCKET_URL,
        {
          transports: [
            "websocket",
          ],
        }
      );

    socketRef.current =
      socket;

    const syncRemotePlayers = (
      players:
        GamePlayer[],
      selfId:
        string,
      snap = false
    ) => {
      setOtherPlayers(
        (previous) => {
          const previousMap =
            new Map(
              previous.map(
                (player) => [
                  player.id,
                  player,
                ]
              )
            );

          const remotePlayers =
            (Array.isArray(players)
              ? players
              : []
            ).filter(
              (player) =>
                Boolean(player?.id) &&
                player.id !==
                  selfId
            );

          console.log(
            "👥 REMOTE PLAYERS SYNC",
            {
              selfId,
              total:
                players?.length ??
                0,
              remote:
                remotePlayers.length,
              remotePlayers:
                remotePlayers.map(
                  (player) => ({
                    id:
                      player.id,
                    nickname:
                      player.nickname,
                    x:
                      player.x,
                    y:
                      player.y,
                    state:
                      player.state,
                  })
                ),
            }
          );

          return remotePlayers.map(
            (player) => {
              const before =
                previousMap.get(
                  player.id
                );

              if (
                !before ||
                snap
              ) {
                return {
                  ...player,
                  renderX:
                    player.x,
                  renderY:
                    player.y,
                  targetX:
                    player.x,
                  targetY:
                    player.y,
                  moving:
                    Boolean(
                      player.moving
                    ),
                  direction:
                    player.direction ??
                    "down",
                  lastUpdateAt:
                    performance.now(),
                };
              }

              return {
                ...before,
                ...player,
                targetX:
                  player.x,
                targetY:
                  player.y,
                moving:
                  Boolean(
                    player.moving
                  ),
                direction:
                  before.direction ??
                  player.direction ??
                  "down",
                lastUpdateAt:
                  performance.now(),
              };
            }
          );
        }
      );
    };

    const applyGameState = (
      state:
        GameStatePayload,
      selfId:
        string,
      snap = false
    ) => {
      const gamePlayers =
        Array.isArray(
          state.players
        )
          ? state.players
          : [];

      syncRemotePlayers(
        gamePlayers,
        selfId,
        snap
      );

      setCorpses(
        Array.isArray(
          state.corpses
        )
          ? state.corpses
          : []
      );

      setTeamMissionProgress(
        state.missionProgress ?? {
          completed: 0,
          total: 0,
          percentage: 0,
        }
      );

      if (
        state.meeting?.active
      ) {
        setMeeting({
          ...state.meeting,
          kind:
            state.meeting.kind ??
            "corpse",
        });

        setMeetingMessages(
          state.meeting.messages ??
          []
        );
      } else {
        setMeeting(
          null
        );
      }
    };

    socket.on(
      "connect",
      () => {
        console.log(
          "🎮 GAME SOCKET CONNECTED",
          {
            socketId:
              socket.id,
            roomId,
            playerId,
            nickname,
          }
        );

        socket.emit(
          "devilGame:join",

          {
            roomId,
            playerId,
            nickname,
          },

          (response: {
            ok: boolean;
            message?: string;
            playerId?: string;

            self?: GamePlayer & {
              role:
              "devil" |
              "survivor";

              missionIds?: string[];

              completedMissionIds?: string[];
            };

            state?:
            GameStatePayload;
          }) => {
            if (
              !response.ok ||
              !response.self
            ) {
              console.error(
                "❌ GAME JOIN FAILED",
                response
              );

              setOtherPlayers(
                []
              );

              setCombatMessage(
                response.message ??
                "게임에 다시 연결하지 못했습니다."
              );

              return;
            }

            const resolvedPlayerId =
              response.playerId ??
              response.self.id;

            console.log(
              "✅ GAME JOIN SUCCESS",
              {
                resolvedPlayerId,
                nickname:
                  response.self.nickname,
                playerCount:
                  response.state
                    ?.players
                    ?.length ??
                  0,
                players:
                  response.state
                    ?.players
                    ?.map(
                      (player) => ({
                        id:
                          player.id,
                        nickname:
                          player.nickname,
                        state:
                          player.state,
                      })
                    ) ??
                  [],
              }
            );

            myPlayerIdRef.current =
              resolvedPlayerId;

            setMyPlayerId(
              resolvedPlayerId
            );

            setSelfPlayer(
              response.self
            );

            setPlayerState(
              response.self.state
            );

            const initialDirection =
              response.self.direction ??
              "down";

            directionRef.current =
              initialDirection;

            setDirection(
              initialDirection
            );

            const assignedMissionIds =
              response.self.missionIds ??
              [];

            const completedMissionIds =
              response.self.completedMissionIds ??
              [];

            const assignedMissions =
              INITIAL_MISSIONS
                .filter(
                  (mission) =>
                    assignedMissionIds.includes(
                      mission.id
                    )
                )
                .map(
                  (mission) => ({
                    ...mission,

                    completed:
                      completedMissionIds.includes(
                        mission.id
                      ),
                  })
                );

            setMissions(
              assignedMissions
            );

            const nextPosition = {
              x:
                response.self.x,

              y:
                response.self.y,
            };

            positionRef.current =
              nextPosition;

            targetPositionRef.current =
              null;

            setPosition(
              nextPosition
            );

            if (
              response.state
            ) {
              applyGameState(
                response.state,
                resolvedPlayerId,
                true
              );
            } else {
              console.error(
                "❌ GAME JOIN RESPONSE HAS NO STATE"
              );

              setOtherPlayers(
                []
              );

              setCombatMessage(
                "게임 참가자 정보를 불러오지 못했습니다."
              );
            }
          }
        );
      }
    );

    socket.on(
      "devilGame:state",
      (
        state:
          GameStatePayload
      ) => {
        const selfId =
          myPlayerIdRef.current;

        if (!selfId) {
          console.warn(
            "⚠️ game state received without selfId"
          );

          return;
        }

        console.log(
          "📡 GAME STATE",
          {
            selfId,
            count:
              state.players
                ?.length ??
              0,
            players:
              state.players
                ?.map(
                  (player) => ({
                    id:
                      player.id,
                    nickname:
                      player.nickname,
                    state:
                      player.state,
                  })
                ) ??
              [],
          }
        );

        applyGameState(
          state,
          selfId
        );

        const nextSelf =
          state.players.find(
            (player) =>
              player.id ===
              selfId
          );

        if (nextSelf) {
          setSelfPlayer(
            (previous) => {
              if (!previous) {
                return {
                  ...nextSelf,
                };
              }

              return {
                ...previous,
                ...nextSelf,
                missionIds:
                  previous.missionIds,
                completedMissionIds:
                  previous.completedMissionIds,
              };
            }
          );

          setPlayerState(
            nextSelf.state
          );

          if (
            nextSelf.direction
          ) {
            directionRef.current =
              nextSelf.direction;

            setDirection(
              nextSelf.direction
            );
          }
        } else {
          console.warn(
            "⚠️ self player missing from game state",
            {
              selfId,
              players:
                state.players.map(
                  (player) =>
                    player.id
                ),
            }
          );
        }
      }
    );

    socket.on(
      "devilGame:player-moved",
      (data: {
        id: string;

        x: number;
        y: number;

        moving?: boolean;
        direction?: PotatoDirection;
      }) => {
        setOtherPlayers(
          (previous) =>
            previous.map(
              (player) => {
                if (
                  player.id !==
                  data.id
                ) {
                  return player;
                }

                const dx =
                  data.x -
                  player.renderX;

                const dy =
                  data.y -
                  player.renderY;

                const distance =
                  Math.sqrt(
                    dx * dx +
                    dy * dy
                  );

                const teleport =
                  distance >
                  REMOTE_TELEPORT_DISTANCE;

                const nextDirection =
                  data.direction ??
                  getMoveDirection(
                    data.x -
                      player.x,
                    data.y -
                      player.y,
                    player.direction ??
                      "down"
                  );

                return {
                  ...player,

                  x:
                    data.x,

                  y:
                    data.y,

                  targetX:
                    data.x,

                  targetY:
                    data.y,

                  renderX:
                    teleport
                      ? data.x
                      : player.renderX,

                  renderY:
                    teleport
                      ? data.y
                      : player.renderY,

                  moving:
                    data.moving ??
                    true,

                  direction:
                    nextDirection,

                  lastUpdateAt:
                    performance.now(),
                };
              }
            )
        );
      }
    );

    /* =====================================
       Blackout

       서버가 같은 게임방 참가자에게 전달한 정전 상태를 받는다.
       실제 정전 화면은 생존자에게만 적용한다.
       악마는 정전 이벤트를 받아도 화면이 어두워지지 않는다.
    ===================================== */

    socket.on(
      "devilGame:blackout-changed",
      (data: {
        active?: boolean;
      }) => {
        setBlackout(
          role === "survivor"
            ? Boolean(
                data?.active
              )
            : false
        );
      }
    );

    /* =====================================
       Emergency Meeting
    ===================================== */

    socket.on(
      "devilGame:meeting-started",
      (
        data:
          MeetingState
      ) => {
        targetPositionRef.current =
          null;

        if (
          animationFrameRef.current !==
          null
        ) {
          cancelAnimationFrame(
            animationFrameRef.current
          );

          animationFrameRef.current =
            null;
        }

        setMoving(
          false
        );

        setMapOpen(
          false
        );

        setActiveMission(
          null
        );

        setAttackEffect(
          null
        );

        setKillSequence(
          null
        );

        setDeathOverlay(
          false
        );

        setMeeting({
          ...data,
          kind:
            data.kind ??
            "corpse",
        });

        setMeetingMessages(
          data.messages ??
          []
        );

        setMeetingResult(
          null
        );

        setVoted(
          false
        );

        setMeetingInput(
          ""
        );

        setMeetingNow(
          Date.now()
        );
      }
    );

    socket.on(
      "devilGame:meeting-chat",
      (
        message:
          MeetingChatMessage
      ) => {
        setMeetingMessages(
          (previous) => {
            if (
              previous.some(
                (item) =>
                  item.id ===
                  message.id
              )
            ) {
              return previous;
            }

            return [
              ...previous,
              message,
            ];
          }
        );
      }
    );

    socket.on(
      "devilGame:meeting-phase",
      (data: {
        phase:
        MeetingPhase;

        phaseEndsAt:
        number;
      }) => {
        setMeeting(
          (previous) =>
            previous
              ? {
                ...previous,

                phase:
                  data.phase,

                phaseEndsAt:
                  data.phaseEndsAt,
              }
              : previous
        );

        if (
          data.phase ===
          "voting"
        ) {
          setVoted(
            false
          );
        }
      }
    );

    socket.on(
      "devilGame:meeting-voted",
      (data: {
        playerId?: string;
        voterId?: string;
      }) => {
        const votedPlayerId =
          data.playerId ??
          data.voterId;

        if (!votedPlayerId) {
          return;
        }

        setMeeting(
          (previous) => {
            if (!previous) {
              return previous;
            }

            if (
              previous.votedPlayerIds.includes(
                votedPlayerId
              )
            ) {
              return previous;
            }

            return {
              ...previous,

              votedPlayerIds: [
                ...previous.votedPlayerIds,
                votedPlayerId,
              ],
            };
          }
        );
      }
    );

    socket.on(
      "devilGame:meeting-result",
      (
        data:
          MeetingResult
      ) => {
        setMeetingResult(
          data
        );

        setMeeting(
          (previous) =>
            previous
              ? {
                ...previous,

                phase:
                  "result",

                phaseEndsAt:
                  data.resultEndsAt,
              }
              : previous
        );
      }
    );

    socket.on(
      "devilGame:meeting-ended",
      () => {
        setMeeting(
          null
        );

        setMeetingMessages(
          []
        );

        setMeetingResult(
          null
        );

        setMeetingInput(
          ""
        );

        setVoted(
          false
        );
      }
    );

    const handleGameFinished = (
      rawResult:
        GameResultPayload |
        {
          roomId: string;
          winner: "devil" | "survivor";
          reason: string;
          winnerPlayers: GameResultWinner[];
          finishedAt: number;
        }
    ) => {
      const result: GameResultPayload =
        "winningTeam" in rawResult
          ? rawResult
          : {
            roomId:
              rawResult.roomId,
            winningTeam:
              rawResult.winner,
            reason:
              rawResult.reason,
            winners:
              rawResult.winnerPlayers ??
              [],
            finishedAt:
              rawResult.finishedAt,
          };

      targetPositionRef.current =
        null;

      if (
        animationFrameRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animationFrameRef.current
        );

        animationFrameRef.current =
          null;
      }

      setMoving(
        false
      );

      setMapOpen(
        false
      );

      setActiveMission(
        null
      );

      setLeaveConfirmOpen(
        false
      );

      setMeeting(
        null
      );

      setMeetingMessages(
        []
      );

      setMeetingResult(
        null
      );

      /*
       * 마지막 처치 직후 승리 조건이 만족되면
       * 서버의 게임 종료 이벤트가 처치 애니메이션보다 먼저 도착할 수 있다.
       *
       * 서버 판정은 즉시 유지하되,
       * 화면의 GAME OVER만 처치 시네마틱이 끝난 뒤 표시한다.
       *
       * 퇴장 / 인원 부족 등 처치와 관계없는 종료는 즉시 표시된다.
       */
      const elapsedSinceKill =
        Date.now() -
        lastKillAnimationAtRef.current;

      const shouldWaitForKillSequence =
        lastKillAnimationAtRef.current >
        0 &&
        elapsedSinceKill <
        KILL_SEQUENCE_DURATION;

      const resultDelay =
        shouldWaitForKillSequence
          ? Math.max(
            0,
            KILL_SEQUENCE_DURATION -
            elapsedSinceKill
          )
          : 0;

      if (
        pendingResultTimeoutRef.current !==
        null
      ) {
        window.clearTimeout(
          pendingResultTimeoutRef.current
        );

        pendingResultTimeoutRef.current =
          null;
      }

      if (
        resultDelay <=
        0
      ) {
        setGameResult(
          result
        );

        return;
      }

      pendingResultTimeoutRef.current =
        window.setTimeout(
          () => {
            setKillSequence(
              null
            );

            setGameResult(
              result
            );

            pendingResultTimeoutRef.current =
              null;
          },
          resultDelay
        );
    };

    socket.on(
      "devilGame:end",
      handleGameFinished
    );

    socket.on(
      "devilGame:finished",
      handleGameFinished
    );

    socket.on(
      "devilGame:kill-confirmed",
      (
        data:
          KillConfirmedPayload
      ) => {
        /*
         * 이 시각을 기록해두면 바로 이어서 GAME OVER 이벤트가 와도
         * 처치 장면이 먼저 끝까지 재생된다.
         */
        lastKillAnimationAtRef.current =
          Date.now();

        const isKillParticipant =
          data.killerId ===
          myPlayerIdRef.current ||
          data.victimId ===
          myPlayerIdRef.current;

        /*
         * 처치 시네마틱은 악마와 피해자에게만 보여준다.
         * 다른 생존자에게 전체 화면 시네마틱을 보여주면
         * 악마 정체가 노출될 수 있기 때문이다.
         */
        if (
          isKillParticipant
        ) {
          setKillSequence({
            killerId:
              data.killerId,

            victimId:
              data.victimId,
          });

          setMapOpen(
            false
          );

          setActiveMission(
            null
          );

          setMoving(
            false
          );

          window.setTimeout(
            () => {
              setKillSequence(
                null
              );
            },
            KILL_SEQUENCE_DURATION
          );
        }

        setAttackEffect({
          killerId:
            data.killerId,

          victimId:
            data.victimId,
        });

        if (
          data.killerId ===
          myPlayerIdRef.current
        ) {
          setKillCooldownEndsAt(
            data.cooldownEndsAt
          );
        }

        /*
         * 칼 모션을 먼저 보여주고
         * 약간 뒤에 시체를 남긴다.
         */
        window.setTimeout(
          () => {
            setCorpses(
              (previous) => {
                if (
                  previous.some(
                    (corpse) =>
                      corpse.id ===
                      data.corpse.id
                  )
                ) {
                  return previous;
                }

                return [
                  ...previous,
                  data.corpse,
                ];
              }
            );

            setOtherPlayers(
              (previous) =>
                previous.map(
                  (player) =>
                    player.id ===
                      data.victimId
                      ? {
                        ...player,

                        state:
                          "ghost",
                      }
                      : player
                )
            );
          },
          500
        );

        /*
         * 내가 피해자라면
         * 칼 모션 -> 잡혔습니다 -> 유령화
         */
        if (
          data.victimId ===
          myPlayerIdRef.current
        ) {
          window.setTimeout(
            () => {
              setDeathOverlay(
                true
              );

              setMoving(
                false
              );
            },
            480
          );

          window.setTimeout(
            () => {
              setDeathOverlay(
                false
              );

              setPlayerState(
                "ghost"
              );

              setCombatMessage(
                "👻 유령이 되었습니다. 이제 벽을 통과할 수 있습니다."
              );
            },
            1900
          );
        }

        window.setTimeout(
          () => {
            setAttackEffect(
              null
            );
          },
          750
        );
      }
    );

    return () => {
      if (
        pendingResultTimeoutRef.current !==
        null
      ) {
        window.clearTimeout(
          pendingResultTimeoutRef.current
        );

        pendingResultTimeoutRef.current =
          null;
      }

      socket.disconnect();

      socketRef.current =
        null;
    };
  }, [
    roomId,
    playerId,
  ]);

  /* ======================================================
     Remote player interpolation

     서버에서는 약 50ms 간격으로 좌표가 오기 때문에
     받은 좌표를 즉시 화면에 적용하면 다른 캐릭터가
     순간이동하듯 끊겨 보인다.

     renderX/renderY가 targetX/targetY를 매 프레임
     부드럽게 따라가도록 보간한다.
  ====================================================== */

  useEffect(() => {
    const animateRemotePlayers = (
      timestamp: number
    ) => {
      const previousTimestamp =
        remoteLastFrameTimeRef.current ??
        timestamp;

      const deltaTime =
        Math.min(
          50,
          timestamp -
          previousTimestamp
        ) / 1000;

      remoteLastFrameTimeRef.current =
        timestamp;

      const alpha =
        1 -
        Math.exp(
          -REMOTE_SMOOTHING *
          deltaTime
        );

      setOtherPlayers(
        (previous) =>
          previous.map(
            (player) => {
              const dx =
                player.targetX -
                player.renderX;

              const dy =
                player.targetY -
                player.renderY;

              const distance =
                Math.sqrt(
                  dx * dx +
                  dy * dy
                );

              if (
                distance <=
                REMOTE_STOP_DISTANCE
              ) {
                if (
                  player.renderX ===
                  player.targetX &&
                  player.renderY ===
                  player.targetY
                ) {
                  return player;
                }

                return {
                  ...player,
                  renderX:
                    player.targetX,
                  renderY:
                    player.targetY,
                };
              }

              if (
                distance >
                REMOTE_TELEPORT_DISTANCE
              ) {
                return {
                  ...player,
                  renderX:
                    player.targetX,
                  renderY:
                    player.targetY,
                };
              }

              return {
                ...player,
                renderX:
                  player.renderX +
                  dx * alpha,
                renderY:
                  player.renderY +
                  dy * alpha,
              };
            }
          )
      );

      remoteAnimationFrameRef.current =
        requestAnimationFrame(
          animateRemotePlayers
        );
    };

    remoteAnimationFrameRef.current =
      requestAnimationFrame(
        animateRemotePlayers
      );

    return () => {
      if (
        remoteAnimationFrameRef.current !==
        null
      ) {
        cancelAnimationFrame(
          remoteAnimationFrameRef.current
        );
      }

      remoteAnimationFrameRef.current =
        null;

      remoteLastFrameTimeRef.current =
        null;
    };
  }, []);

  /* ======================================================
     Stable player identity sync

     page.tsx에서 전달된 playerId가 바뀌는 경우에도
     Socket 이벤트가 참조하는 ID를 즉시 최신값으로 맞춘다.
  ====================================================== */

  useEffect(() => {
    /*
     * 최초 진입 때만 props의 playerId를 기준으로 한다.
     * 재접속 과정에서 서버가 nickname fallback으로 실제 고정 ID를
     * 복구한 뒤에는 socket join callback에서 myPlayerIdRef를 갱신한다.
     */
    if (
      !myPlayerIdRef.current
    ) {
      myPlayerIdRef.current =
        playerId;

      setMyPlayerId(
        playerId
      );
    }
  }, [
    playerId,
  ]);

  /* ======================================================
     Responsive viewport

     PC에서는 기존 1100 x 650을 유지하고,
     모바일에서는 실제 visual viewport 크기를 사용한다.
     그래서 고정 1100px 화면이 휴대폰 밖으로 밀려나지 않는다.
  ====================================================== */

  useEffect(() => {
    const updateViewport =
      () => {
        const visualViewport =
          window.visualViewport;

        const rawWidth =
          visualViewport?.width ??
          window.innerWidth;

        const rawHeight =
          visualViewport?.height ??
          window.innerHeight;

        const coarsePointer =
          window.matchMedia(
            "(pointer: coarse)"
          ).matches;

        const touchCapable =
          navigator.maxTouchPoints >
          0;

        const landscapePhone =
          rawWidth > rawHeight &&
          rawWidth <=
            MOBILE_LANDSCAPE_MAX_WIDTH &&
          rawHeight <=
            MOBILE_LANDSCAPE_MAX_HEIGHT;

        const touchSizedDevice =
          (coarsePointer ||
            touchCapable) &&
          Math.min(
            rawWidth,
            rawHeight
          ) <= 820;

        const mobile =
          rawWidth <=
            MOBILE_BREAKPOINT ||
          landscapePhone ||
          touchSizedDevice;

        const landscape =
          mobile &&
          rawWidth > rawHeight;

        setIsMobile(
          mobile
        );

        setIsLandscapeMobile(
          landscape
        );

        if (mobile) {
          /*
           * 가로모드에서 390px 높이인데도 최소 480px을 강제하면
           * 화면이 잘리고 브라우저 스크롤이 생긴다.
           * 실제 visualViewport 크기를 그대로 사용한다.
           */
          setViewportSize({
            width:
              Math.max(
                280,
                Math.floor(
                  rawWidth -
                  MOBILE_VIEWPORT_PADDING
                )
              ),

            height:
              Math.max(
                240,
                Math.floor(
                  rawHeight -
                  MOBILE_VIEWPORT_PADDING
                )
              ),
          });

          return;
        }

        /*
         * 데스크톱에서도 브라우저의 실제 가용 영역보다
         * 큰 최소 크기를 강제하지 않는다.
         * 작은 노트북/브라우저 툴바 환경에서도
         * 게임과 회의 화면이 위아래로 잘리지 않게 한다.
         */
        setViewportSize({
          width:
            Math.min(
              VIEWPORT_WIDTH,
              Math.max(
                320,
                Math.floor(
                  rawWidth -
                  12
                )
              )
            ),

          height:
            Math.min(
              VIEWPORT_HEIGHT,
              Math.max(
                280,
                Math.floor(
                  rawHeight -
                  12
                )
              )
            ),
        });
      };

    updateViewport();

    window.addEventListener(
      "resize",
      updateViewport
    );

    window.addEventListener(
      "orientationchange",
      updateViewport
    );

    window.visualViewport
      ?.addEventListener(
        "resize",
        updateViewport
      );

    return () => {
      window.removeEventListener(
        "resize",
        updateViewport
      );

      window.removeEventListener(
        "orientationchange",
        updateViewport
      );

      window.visualViewport
        ?.removeEventListener(
          "resize",
          updateViewport
        );
    };
  }, []);

  /* ======================================================
     Mobile viewport lock

     모바일 가로모드에서 브라우저 스크롤/당겨서 새로고침/
     텍스트 선택이 게임 조작을 방해하지 않도록 잠근다.
  ====================================================== */

  useEffect(() => {
    if (!isMobile) {
      return;
    }

    const body = document.body;
    const root = document.documentElement;

    const previousBodyOverflow =
      body.style.overflow;
    const previousBodyTouchAction =
      body.style.touchAction;
    const previousBodyUserSelect =
      body.style.userSelect;
    const previousRootOverscroll =
      root.style.overscrollBehavior;

    body.style.overflow =
      "hidden";
    body.style.touchAction =
      "none";
    body.style.userSelect =
      "none";
    root.style.overscrollBehavior =
      "none";

    return () => {
      body.style.overflow =
        previousBodyOverflow;
      body.style.touchAction =
        previousBodyTouchAction;
      body.style.userSelect =
        previousBodyUserSelect;
      root.style.overscrollBehavior =
        previousRootOverscroll;
    };
  }, [isMobile]);

  /* ======================================================
     Meeting timer
  ====================================================== */

  useEffect(() => {
    if (!meeting) {
      return;
    }

    setMeetingNow(
      Date.now()
    );

    const timer =
      window.setInterval(
        () => {
          setMeetingNow(
            Date.now()
          );
        },
        250
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [
    meeting?.id,
    meeting?.phase,
    meeting?.phaseEndsAt,
  ]);

  const meetingSeconds =
    meeting
      ? Math.max(
        0,
        Math.ceil(
          (
            meeting.phaseEndsAt -
            meetingNow
          ) /
          1000
        )
      )
      : 0;

  /* ======================================================
     Meeting Chat Auto Scroll
  ====================================================== */

  useEffect(() => {
    const element =
      meetingChatScrollRef.current;

    if (!element) {
      return;
    }

    element.scrollTop =
      element.scrollHeight;
  }, [
    meetingMessages,
    meeting?.phase,
  ]);

  /* ======================================================
     Cooldown timer
  ====================================================== */

  useEffect(() => {
    if (
      killCooldownEndsAt <=
      Date.now()
    ) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          setCooldownNow(
            Date.now()
          );
        },
        200
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [
    killCooldownEndsAt,
  ]);

  /* ======================================================
     Stop
  ====================================================== */

  const stopMovement =
    (
      notifyServer = true
    ) => {
      targetPositionRef.current =
        null;

      lastFrameTimeRef.current =
        null;

      if (
        animationFrameRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animationFrameRef.current
        );

        animationFrameRef.current =
          null;
      }

      setMoving(
        false
      );

      if (
        notifyServer
      ) {
        socketRef.current?.emit(
          "devilGame:move",
          {
            ...positionRef.current,
            moving:
              false,
            direction:
              directionRef.current,
          }
        );
      }
    };

  /* ======================================================
     Move animation
  ====================================================== */

  const animateMovement = (
    timestamp: number
  ) => {
    const target =
      targetPositionRef.current;

    if (!target) {
      stopMovement();
      return;
    }

    const current =
      positionRef.current;

    if (
      lastFrameTimeRef.current ===
      null
    ) {
      lastFrameTimeRef.current =
        timestamp;

      animationFrameRef.current =
        requestAnimationFrame(
          animateMovement
        );

      return;
    }

    const deltaTime =
      Math.min(
        40,

        timestamp -
        lastFrameTimeRef.current
      ) /
      1000;

    lastFrameTimeRef.current =
      timestamp;

    const dx =
      target.x -
      current.x;

    const dy =
      target.y -
      current.y;

    const distance =
      Math.sqrt(
        dx * dx +
        dy * dy
      );

    const nextDirection =
      getMoveDirection(
        dx,
        dy,
        directionRef.current
      );

    if (
      nextDirection !==
      directionRef.current
    ) {
      directionRef.current =
        nextDirection;

      setDirection(
        nextDirection
      );
    }

    if (
      distance <=
      ARRIVAL_DISTANCE
    ) {
      const finalPosition = {
        x:
          target.x,

        y:
          target.y,
      };

      positionRef.current =
        finalPosition;

      setPosition(
        finalPosition
      );

      socketRef.current?.emit(
        "devilGame:move",
        {
          ...finalPosition,
          moving:
            false,
          direction:
            directionRef.current,
        }
      );

      stopMovement(
        false
      );

      return;
    }

    const moveDistance =
      Math.min(
        PLAYER_SPEED *
        deltaTime,

        distance
      );

    const directionX =
      dx /
      distance;

    const directionY =
      dy /
      distance;

    const nextX =
      current.x +
      directionX *
      moveDistance;

    const nextY =
      current.y +
      directionY *
      moveDistance;

    /*
     * 살아있는 감자는 기존 충돌 판정.
     * 유령은 맵 바깥만 아니면 어디든 이동.
     */
    if (
      playerState !==
      "ghost" &&
      !isWalkable(
        nextX,
        nextY
      )
    ) {
      stopMovement();
      return;
    }

    const nextPosition = {
      x:
        clamp(
          nextX,
          0,
          DEVIL_MAP_WIDTH
        ),

      y:
        clamp(
          nextY,
          0,
          DEVIL_MAP_HEIGHT
        ),
    };

    positionRef.current =
      nextPosition;

    setPosition(
      nextPosition
    );

    const now =
      performance.now();

    if (
      now -
      lastMoveEmitRef.current >=
      MOVE_EMIT_INTERVAL
    ) {
      lastMoveEmitRef.current =
        now;

      socketRef.current?.emit(
        "devilGame:move",
        {
          ...nextPosition,
          moving:
            true,
          direction:
            directionRef.current,
        }
      );
    }

    animationFrameRef.current =
      requestAnimationFrame(
        animateMovement
      );
  };

  /* ======================================================
     Move To
  ====================================================== */

  const moveTo = (
    targetX: number,
    targetY: number
  ) => {
    if (
      activeMission ||
      mapOpen ||
      deathOverlay ||
      meeting
    ) {
      return;
    }

    const current =
      positionRef.current;

    const finalTarget = {
      x:
        clamp(
          targetX,
          0,
          DEVIL_MAP_WIDTH
        ),

      y:
        clamp(
          targetY,
          0,
          DEVIL_MAP_HEIGHT
        ),
    };

    if (
      playerState !==
      "ghost"
    ) {
      if (
        !isWalkable(
          finalTarget.x,
          finalTarget.y
        )
      ) {
        return;
      }

      if (
        !isPathWalkable(
          current.x,
          current.y,
          finalTarget.x,
          finalTarget.y
        )
      ) {
        return;
      }
    }

    const nextDirection =
      getMoveDirection(
        finalTarget.x -
          current.x,
        finalTarget.y -
          current.y,
        directionRef.current
      );

    directionRef.current =
      nextDirection;

    setDirection(
      nextDirection
    );

    if (
      animationFrameRef.current !==
      null
    ) {
      cancelAnimationFrame(
        animationFrameRef.current
      );
    }

    targetPositionRef.current =
      finalTarget;

    lastFrameTimeRef.current =
      null;

    setMoving(
      true
    );

    animationFrameRef.current =
      requestAnimationFrame(
        animateMovement
      );
  };

  /* ======================================================
     Missions
  ====================================================== */

  const completeMission = (
    missionId: string
  ) => {
    const socket =
      socketRef.current;

    if (
      !socket ||
      !socket.connected
    ) {
      setCombatMessage(
        "서버와 연결되어 있지 않아 미션을 완료할 수 없습니다."
      );

      return;
    }

    socket.emit(
      "devilGame:missionComplete",
      {
        roomId,

        playerId:
          myPlayerIdRef.current,

        missionId,
      },
      (response: {
        ok: boolean;

        message?: string;

        missionId?: string;

        alreadyCompleted?: boolean;

        completedMissionIds?: string[];

        completedCount?: number;

        totalCount?: number;
      }) => {
        if (
          !response.ok
        ) {
          setCombatMessage(
            response.message ??
            "미션 완료 처리에 실패했습니다."
          );

          return;
        }

        setMissions(
          (previous) =>
            previous.map(
              (mission) =>
                mission.id ===
                  missionId
                  ? {
                    ...mission,

                    completed:
                      true,
                  }
                  : mission
            )
        );

        if (
          response.completedMissionIds
        ) {
          setSelfPlayer(
            (previous) => {
              if (!previous) {
                return previous;
              }

              return {
                ...previous,

                completedMissionIds:
                  response.completedMissionIds,
              };
            }
          );
        }

        setActiveMission(
          null
        );

        setCombatMessage(
          response.alreadyCompleted
            ? "이미 완료한 업무입니다."
            : "✅ 업무 완료!"
        );

        window.setTimeout(
          () => {
            setCombatMessage(
              ""
            );
          },
          1800
        );
      }
    );
  };

  const startMission =
    () => {
      if (
        !nearbyMission ||
        meeting
      ) {
        return;
      }

      stopMovement();

      setActiveMission(
        nearbyMission
      );
    };

  /* ======================================================
     Emergency Meeting Actions
  ====================================================== */

  const reportCorpse =
    () => {
      if (
        !nearbyCorpse ||
        meeting ||
        playerState !==
        "alive"
      ) {
        return;
      }

      stopMovement();

      setCombatMessage(
        ""
      );

      socketRef.current?.emit(
        "devilGame:report-corpse",
        {
          roomId,

          corpseId:
            nearbyCorpse.id,
        },
        (response: {
          ok: boolean;
          message?: string;
        }) => {
          if (
            !response.ok
          ) {
            setCombatMessage(
              response.message ??
              "긴급회의를 소집하지 못했습니다."
            );
          }
        }
      );
    };

  const requestEmergencyMeeting =
    () => {
      if (
        !canCallEmergencyMeeting ||
        meeting ||
        playerState !==
          "alive"
      ) {
        return;
      }

      stopMovement();

      setCombatMessage(
        ""
      );

      socketRef.current?.emit(
        "devilGame:emergency-meeting",
        {
          roomId,

          playerId:
            myPlayerIdRef.current,
        },
        (response: {
          ok: boolean;
          message?: string;
        }) => {
          if (
            !response.ok
          ) {
            setCombatMessage(
              response.message ??
              "긴급회의를 소집하지 못했습니다."
            );

            return;
          }

          setEmergencyMeetingUses(
            (previous) =>
              previous + 1
          );
        }
      );
    };

  const sendMeetingMessage =
    () => {
      if (
        !meeting ||
        meeting.phase ===
        "result" ||
        playerState !==
        "alive"
      ) {
        return;
      }

      const message =
        meetingInput
          .trim()
          .slice(
            0,
            160
          );

      if (!message) {
        return;
      }

      socketRef.current?.emit(
        "devilGame:meeting-chat",
        {
          roomId,
          message,
        },
        (response: {
          ok: boolean;
          message?: string;
        }) => {
          if (
            !response.ok
          ) {
            setCombatMessage(
              response.message ??
              "회의 메시지를 보내지 못했습니다."
            );

            return;
          }

          setMeetingInput(
            ""
          );
        }
      );
    };

  const votePlayer =
    (
      targetId:
        string
    ) => {
      if (
        !meeting ||
        meeting.phase !==
        "voting" ||
        voted ||
        playerState !==
        "alive"
      ) {
        return;
      }

      socketRef.current?.emit(
        "devilGame:meeting-vote",
        {
          roomId,
          targetId,
        },
        (response: {
          ok: boolean;
          message?: string;
        }) => {
          if (
            !response.ok
          ) {
            setCombatMessage(
              response.message ??
              "투표하지 못했습니다."
            );

            return;
          }

          setVoted(
            true
          );
        }
      );
    };

  /* ======================================================
     Kill
  ====================================================== */

  const tryKill =
    () => {
      if (
        role !== "devil" ||
        playerState !==
        "alive" ||
        !nearbyKillTarget ||
        cooldownRemaining > 0 ||
        Boolean(meeting)
      ) {
        return;
      }

      setCombatMessage(
        ""
      );

      socketRef.current?.emit(
        "devilGame:kill",

        {
          victimId:
            nearbyKillTarget.id,
        },

        (response: {
          ok: boolean;

          message?: string;

          cooldownEndsAt?:
          number;

          remainingMs?:
          number;
        }) => {
          if (!response.ok) {
            setCombatMessage(
              response.message ??
              "처치에 실패했습니다."
            );

            if (
              response.remainingMs
            ) {
              setKillCooldownEndsAt(
                Date.now() +
                response.remainingMs
              );
            }

            return;
          }

          if (
            response.cooldownEndsAt
          ) {
            setKillCooldownEndsAt(
              response.cooldownEndsAt
            );
          }
        }
      );
    };

  /* ======================================================
     Leave Game
  ====================================================== */

  const handleLeaveGame =
    () => {
      if (
        leavingGame ||
        gameResult
      ) {
        return;
      }

      const socket =
        socketRef.current;

      if (
        !socket ||
        !socket.connected
      ) {
        onReturnToOffice();
        return;
      }

      setLeavingGame(
        true
      );

      socket.emit(
        "devilGame:leave",
        {
          roomId,
        },
        (response: {
          ok: boolean;
          message?: string;
        }) => {
          setLeavingGame(
            false
          );

          if (
            !response.ok
          ) {
            setCombatMessage(
              response.message ??
              "게임에서 나가지 못했습니다."
            );

            return;
          }

          setLeaveConfirmOpen(
            false
          );

          onReturnToOffice();
        }
      );
    };

  /* ======================================================
     Screen Actions

     PC 단축키와 모바일 터치 버튼이 같은 함수를 사용한다.
  ====================================================== */

  const handleMissionAction =
    () => {
      if (
        activeMission ||
        mapOpen ||
        deathOverlay ||
        meeting ||
        !nearbyMission
      ) {
        return;
      }

      startMission();
    };

  const handleMapAction =
    () => {
      if (
        deathOverlay ||
        activeMission ||
        meeting
      ) {
        return;
      }

      setMapOpen(
        (previous) =>
          !previous
      );
    };

  const handleBlackoutAction =
    () => {
      if (
        role !== "devil" ||
        playerState !==
        "alive" ||
        deathOverlay ||
        activeMission ||
        meeting
      ) {
        return;
      }

      const socket =
        socketRef.current;

      if (
        !socket ||
        !socket.connected
      ) {
        setCombatMessage(
          "서버에 연결되어 있지 않습니다."
        );

        return;
      }

      setCombatMessage(
        ""
      );

      socket.emit(
        "devilGame:blackout",
        {
          roomId,
        },
        (response: {
          ok: boolean;
          message?: string;
          active?: boolean;
        }) => {
          if (
            !response?.ok
          ) {
            setCombatMessage(
              response?.message ??
              "정전을 발생시키지 못했습니다."
            );
          }
        }
      );
    };

  const canUseMission =
    Boolean(
      nearbyMission
    ) &&
    !activeMission &&
    !mapOpen &&
    !deathOverlay &&
    !meeting;

  const canKill =
    role === "devil" &&
    playerState ===
    "alive" &&
    Boolean(
      nearbyKillTarget
    ) &&
    cooldownRemaining <= 0 &&
    !activeMission &&
    !mapOpen &&
    !deathOverlay &&
    !meeting;

  const canBlackout =
    role === "devil" &&
    playerState ===
    "alive" &&
    !activeMission &&
    !deathOverlay &&
    !meeting;

  /* ======================================================
     Mobile Joystick
  ====================================================== */

  const stopJoystick =
    (
      notifyServer = true
    ) => {
      joystickVectorRef.current = {
        x: 0,
        y: 0,
      };

      joystickLastFrameRef.current =
        null;

      joystickPointerIdRef.current =
        null;

      setJoystickKnob({
        x: 0,
        y: 0,
      });

      if (
        joystickAnimationFrameRef.current !==
        null
      ) {
        cancelAnimationFrame(
          joystickAnimationFrameRef.current
        );

        joystickAnimationFrameRef.current =
          null;
      }

      setMoving(
        false
      );

      if (
        notifyServer
      ) {
        socketRef.current?.emit(
          "devilGame:move",
          {
            ...positionRef.current,

            moving:
              false,

            direction:
              directionRef.current,
          }
        );
      }
    };

  const animateJoystick =
    (
      timestamp:
        number
    ) => {
      const vector =
        joystickVectorRef.current;

      const magnitude =
        Math.sqrt(
          vector.x *
            vector.x +
          vector.y *
            vector.y
        );

      if (
        magnitude <
          0.04 ||
        meeting ||
        deathOverlay ||
        activeMission ||
        mapOpen
      ) {
        stopJoystick();

        return;
      }

      const previousTimestamp =
        joystickLastFrameRef.current ??
        timestamp;

      const deltaTime =
        Math.min(
          40,
          timestamp -
            previousTimestamp
        ) /
        1000;

      joystickLastFrameRef.current =
        timestamp;

      const current =
        positionRef.current;

      const speed =
        PLAYER_SPEED *
        MOBILE_PLAYER_SPEED_MULTIPLIER;

      const desiredX =
        current.x +
        vector.x *
          speed *
          deltaTime;

      const desiredY =
        current.y +
        vector.y *
          speed *
          deltaTime;

      let nextX =
        clamp(
          desiredX,
          0,
          DEVIL_MAP_WIDTH
        );

      let nextY =
        clamp(
          desiredY,
          0,
          DEVIL_MAP_HEIGHT
        );

      /*
       * 벽에 대각선으로 닿았을 때 완전히 멈추지 않고
       * 벽을 따라 미끄러지듯 이동하도록 X/Y를 따로 검사한다.
       */
      if (
        playerState !==
          "ghost" &&
        !isWalkable(
          nextX,
          nextY
        )
      ) {
        const xOnlyWalkable =
          isWalkable(
            nextX,
            current.y
          );

        const yOnlyWalkable =
          isWalkable(
            current.x,
            nextY
          );

        if (
          xOnlyWalkable
        ) {
          nextY =
            current.y;
        } else if (
          yOnlyWalkable
        ) {
          nextX =
            current.x;
        } else {
          nextX =
            current.x;

          nextY =
            current.y;
        }
      }

      const nextPosition = {
        x:
          nextX,

        y:
          nextY,
      };

      const moveDx =
        nextPosition.x -
        current.x;

      const moveDy =
        nextPosition.y -
        current.y;

      const nextDirection =
        getMoveDirection(
          moveDx,
          moveDy,
          directionRef.current
        );

      if (
        nextDirection !==
        directionRef.current
      ) {
        directionRef.current =
          nextDirection;

        setDirection(
          nextDirection
        );
      }

      positionRef.current =
        nextPosition;

      setPosition(
        nextPosition
      );

      setMoving(
        true
      );

      const now =
        performance.now();

      if (
        now -
          lastMoveEmitRef.current >=
        MOVE_EMIT_INTERVAL
      ) {
        lastMoveEmitRef.current =
          now;

        socketRef.current?.emit(
          "devilGame:move",
          {
            ...nextPosition,

            moving:
              true,

            direction:
              directionRef.current,
          }
        );
      }

      joystickAnimationFrameRef.current =
        requestAnimationFrame(
          animateJoystick
        );
    };

  const updateJoystickFromPointer =
    (
      event:
        React.PointerEvent<HTMLDivElement>
    ) => {
      const element =
        event.currentTarget;

      const rect =
        element.getBoundingClientRect();

      const centerX =
        rect.left +
        rect.width / 2;

      const centerY =
        rect.top +
        rect.height / 2;

      const rawX =
        event.clientX -
        centerX;

      const rawY =
        event.clientY -
        centerY;

      const maxRadius =
        rect.width *
        0.34;

      const distance =
        Math.sqrt(
          rawX *
            rawX +
          rawY *
            rawY
        );

      const limitedDistance =
        Math.min(
          maxRadius,
          distance
        );

      const directionX =
        distance >
          0
          ? rawX /
            distance
          : 0;

      const directionY =
        distance >
          0
          ? rawY /
            distance
          : 0;

      const knobX =
        directionX *
        limitedDistance;

      const knobY =
        directionY *
        limitedDistance;

      setJoystickKnob({
        x:
          knobX,

        y:
          knobY,
      });

      const strength =
        maxRadius >
          0
          ? limitedDistance /
            maxRadius
          : 0;

      joystickVectorRef.current = {
        x:
          directionX *
          strength,

        y:
          directionY *
          strength,
      };
    };

  const startJoystick =
    (
      event:
        React.PointerEvent<HTMLDivElement>
    ) => {
      if (
        !isMobile ||
        meeting ||
        deathOverlay ||
        activeMission ||
        mapOpen
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      stopMovement(
        false
      );

      joystickPointerIdRef.current =
        event.pointerId;

      event.currentTarget.setPointerCapture(
        event.pointerId
      );

      updateJoystickFromPointer(
        event
      );

      joystickLastFrameRef.current =
        null;

      if (
        joystickAnimationFrameRef.current ===
        null
      ) {
        joystickAnimationFrameRef.current =
          requestAnimationFrame(
            animateJoystick
          );
      }
    };

  const moveJoystick =
    (
      event:
        React.PointerEvent<HTMLDivElement>
    ) => {
      if (
        joystickPointerIdRef.current !==
        event.pointerId
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      updateJoystickFromPointer(
        event
      );
    };

  const endJoystick =
    (
      event:
        React.PointerEvent<HTMLDivElement>
    ) => {
      if (
        joystickPointerIdRef.current !==
        event.pointerId
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      try {
        event.currentTarget.releasePointerCapture(
          event.pointerId
        );
      } catch {
        // 이미 pointer capture가 해제된 경우 무시.
      }

      stopJoystick();
    };

  useEffect(() => {
    if (
      meeting ||
      deathOverlay ||
      activeMission ||
      mapOpen ||
      !isMobile
    ) {
      stopJoystick();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    meeting,
    deathOverlay,
    activeMission,
    mapOpen,
    isMobile,
  ]);

  /* ======================================================
     Keyboard
  ====================================================== */

  useEffect(() => {
    const handleKeyDown = (
      event:
        KeyboardEvent
    ) => {
      const target =
        event.target as HTMLElement;

      if (
        target.tagName ===
        "INPUT" ||
        target.tagName ===
        "TEXTAREA" ||
        target.tagName ===
        "SELECT"
      ) {
        return;
      }

      if (
        deathOverlay ||
        meeting
      ) {
        return;
      }

      if (
        activeMission
      ) {
        if (
          event.code ===
          "Escape"
        ) {
          setActiveMission(
            null
          );
        }

        return;
      }

      /* Q = 처치 */

      if (
        event.code ===
        "KeyQ"
      ) {
        event.preventDefault();

        tryKill();
        return;
      }

      /* E = 업무 */

      if (
        event.code ===
        "KeyE"
      ) {
        event.preventDefault();

        handleMissionAction();

        return;
      }

      /* M = 지도 */

      if (
        event.code ===
        "KeyM"
      ) {
        event.preventDefault();

        handleMapAction();

        return;
      }

      if (
        event.code ===
        "Escape"
      ) {
        setMapOpen(
          false
        );

        return;
      }

      /* 테스트 */

      if (
        event.code ===
        "KeyB"
      ) {
        event.preventDefault();

        handleBlackoutAction();

        return;
      }

    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    activeMission,
    mapOpen,
    deathOverlay,
    nearbyMission,
    nearbyKillTarget,
    cooldownRemaining,
    role,
    playerState,
    meeting,
  ]);

  /* ======================================================
     Camera
  ====================================================== */

  const cameraX =
    clamp(
      position.x -
      viewportSize.width / 2,

      0,

      Math.max(
        0,
        DEVIL_MAP_WIDTH -
        viewportSize.width
      )
    );

  const cameraY =
    clamp(
      position.y -
      viewportSize.height / 2,

      0,

      Math.max(
        0,
        DEVIL_MAP_HEIGHT -
        viewportSize.height
      )
    );

  const playerScreenX =
    position.x -
    cameraX;

  const playerScreenY =
    position.y -
    cameraY;

  /* ======================================================
     Click
  ====================================================== */

  const handleWorldClick = (
    event:
      React.MouseEvent<HTMLDivElement>
  ) => {
    if (
      activeMission ||
      mapOpen ||
      deathOverlay ||
      meeting
    ) {
      return;
    }

    const targetElement =
      event.target as HTMLElement;

    if (
      targetElement.closest(
        "[data-no-move]"
      )
    ) {
      return;
    }

    const viewport =
      viewportRef.current;

    if (!viewport) {
      return;
    }

    const rect =
      viewport.getBoundingClientRect();

    const clickX =
      event.clientX -
      rect.left;

    const clickY =
      event.clientY -
      rect.top;

    moveTo(
      cameraX +
      clickX,

      cameraY +
      clickY
    );
  };

  /* ======================================================
     Cleanup
  ====================================================== */

  useEffect(() => {
    return () => {
      if (
        animationFrameRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animationFrameRef.current
        );
      }

      if (
        joystickAnimationFrameRef.current !==
        null
      ) {
        cancelAnimationFrame(
          joystickAnimationFrameRef.current
        );
      }
    };
  }, []);

  /* ======================================================
     Render helpers
  ====================================================== */

  const myAttacking =
    attackEffect?.killerId ===
    myPlayerId;

  const myHit =
    attackEffect?.victimId ===
    myPlayerId;

  /*
   * 처치 시네마틱에 사용할 실제 플레이어 정보.
   * 서버에서 받은 캐릭터 스타일을 그대로 사용하므로
   * 색 / 안경 / 모자 / 리본 / 넥타이도 유지된다.
   */
  const getCinematicPlayer = (
    targetPlayerId: string
  ): GamePlayer | null => {
    if (
      targetPlayerId ===
      myPlayerId
    ) {
      if (
        selfPlayer
      ) {
        return selfPlayer;
      }

      return {
        id:
          myPlayerId,

        nickname,

        characterStyle,

        state:
          playerState,

        x:
          position.x,

        y:
          position.y,
      };
    }

    return (
      otherPlayers.find(
        (player) =>
          player.id ===
          targetPlayerId
      ) ??
      null
    );
  };

  const cinematicKiller =
    killSequence
      ? getCinematicPlayer(
        killSequence.killerId
      )
      : null;

  const cinematicVictim =
    killSequence
      ? getCinematicPlayer(
        killSequence.victimId
      )
      : null;

  const meetingPlayers:
    GamePlayer[] = [
      ...(selfPlayer
        ? [selfPlayer]
        : []),
      ...otherPlayers,
    ];

  /* ======================================================
     Render
  ====================================================== */

  return (
    <div
      className="
        fixed
        inset-0
        flex
        h-[100dvh]
        w-[100vw]
        items-center
        justify-center
        overflow-hidden
        bg-zinc-950
      "
      style={{
        width: "100vw",
        height:
          "var(--game-vh, 100dvh)",
        maxWidth: "100vw",
        maxHeight:
          "var(--game-vh, 100dvh)",
        padding: 0,
        margin: 0,
        overflow: "hidden",
        overscrollBehavior: "none",
        touchAction:
          isMobile
            ? "none"
            : undefined,
      }}
    >
      <div
        ref={
          viewportRef
        }
        onClick={
          handleWorldClick
        }
        onContextMenu={(event) => {
          if (isMobile) {
            event.preventDefault();
          }
        }}
        className={`
          relative
          cursor-pointer
          touch-none
          overflow-hidden
          bg-black
          shadow-2xl

          ${
            isMobile
              ? "rounded-none border-0"
              : "rounded-xl border-[6px] border-zinc-800"
          }
        `}
        style={{
          width:
            viewportSize.width,

          height:
            viewportSize.height,

          maxWidth:
            "100vw",

          maxHeight:
            "100dvh",
        }}
      >
        {/* =================================================
            World
        ================================================= */}

        <div
          className="
            absolute
            left-0
            top-0
          "
          style={{
            width:
              DEVIL_MAP_WIDTH,

            height:
              DEVIL_MAP_HEIGHT,

            transform:
              `translate3d(
                ${-cameraX}px,
                ${-cameraY}px,
                0
              )`,
          }}
        >
          <DevilOfficeMap />

          {/* Mission markers */}

          {missions.map(
            (mission) => {
              if (
                mission.completed
              ) {
                return null;
              }

              return (
                <div
                  key={
                    mission.id
                  }
                  className="
                    pointer-events-none
                    absolute
                    z-[200]
                    flex
                    flex-col
                    items-center
                  "
                  style={{
                    left:
                      mission.x,

                    top:
                      mission.y,

                    transform:
                      "translate(-50%, -50%)",
                  }}
                >
                  <div
                    className="
                      flex
                      h-7
                      w-7
                      items-center
                      justify-center
                      rounded-full
                      border-2
                      border-amber-100
                      bg-amber-400
                      text-[13px]
                      font-black
                      text-zinc-900
                      shadow-[0_0_18px_rgba(251,191,36,0.85)]
                    "
                  >
                    !
                  </div>

                  <div
                    className="
                      mt-1
                      whitespace-nowrap
                      rounded-md
                      bg-black/75
                      px-2
                      py-1
                      text-[9px]
                      font-bold
                      text-white
                    "
                  >
                    {
                      mission.title
                    }
                  </div>
                </div>
              );
            }
          )}

          {/* 시체 */}

          {corpses.map(
            (corpse) => (
              <CorpseView
                key={
                  corpse.id
                }
                corpse={
                  corpse
                }
              />
            )
          )}
        </div>

        {/* =================================================
            Other players
        ================================================= */}

        {otherPlayers.map(
          (player) => {
            /*
             * 살아있는 사람에게 유령은 보이지 않는다.
             * 유령끼리는 서로 볼 수 있다.
             */
            if (
              player.state ===
              "ghost" &&
              playerState !==
              "ghost"
            ) {
              return null;
            }

            const screenX =
              player.renderX -
              cameraX;

            const screenY =
              player.renderY -
              cameraY;

            const attacking =
              attackEffect?.killerId ===
              player.id;

            const hit =
              attackEffect?.victimId ===
              player.id;

            return (
              <div
                key={
                  player.id
                }
                className="
                  pointer-events-none
                  absolute
                  z-[4900]
                "
                style={{
                  left:
                    screenX,

                  top:
                    screenY,

                  transform:
                    "translate(-50%, -100%)",

                  zIndex:
                    Math.round(
                      player.renderY
                    ) +
                    3000,
                }}
              >
                <Potato
                  name={
                    getDisplayName(
                      player.nickname
                    )
                  }
                  glasses={
                    player
                      .characterStyle
                      ?.glasses ??
                    "none"
                  }
                  hat={
                    player
                      .characterStyle
                      ?.hat ??
                    "none"
                  }
                  ribbon={
                    player
                      .characterStyle
                      ?.ribbon ??
                    false
                  }
                  tie={
                    player
                      .characterStyle
                      ?.tie ??
                    false
                  }
                  special={
                    player
                      .characterStyle
                      ?.special ??
                    "none"
                  }
                  color={
                    player
                      .characterStyle
                      ?.color ??
                    "default"
                  }
                  hair={player.characterStyle?.hair ?? "none"}
                  hairColor={player.characterStyle?.hairColor ?? "brown"}
                  eyes={player.characterStyle?.eyes ?? "dot"}
                  mouth={player.characterStyle?.mouth ?? "default"}
                  blush={player.characterStyle?.blush ?? true}
                  freckles={player.characterStyle?.freckles ?? false}
                  moving={
                    Boolean(
                      player.moving
                    )
                  }
                  direction={
                    player.direction ??
                    "down"
                  }
                  ghost={
                    player.state ===
                    "ghost"
                  }
                  attacking={
                    attacking
                  }
                  evil={
                    attacking
                  }
                  hit={
                    hit
                  }
                />
              </div>
            );
          }
        )}

        {/* =================================================
            Off-screen player indicators

            다른 참가자가 카메라 밖에 있어도 게임에 정상적으로
            존재한다는 것을 알 수 있도록 화면 가장자리에 방향을 표시한다.
        ================================================= */}

        {!meeting &&
          otherPlayers
            .filter(
              (player) =>
                !(
                  player.state === "ghost" &&
                  playerState !== "ghost"
                )
            )
            .map((player) => {
              const rawX =
                player.renderX -
                cameraX;
              const rawY =
                player.renderY -
                cameraY;
              const margin =
                isMobile ? 42 : 52;
              const inside =
                rawX >= margin &&
                rawX <= viewportSize.width - margin &&
                rawY >= margin &&
                rawY <= viewportSize.height - margin;

              if (inside) {
                return null;
              }

              const centerX =
                viewportSize.width / 2;
              const centerY =
                viewportSize.height / 2;
              const dx =
                rawX - centerX;
              const dy =
                rawY - centerY;
              const angle =
                Math.atan2(dy, dx);
              const edgeX =
                Math.min(
                  viewportSize.width - margin,
                  Math.max(margin, rawX)
                );
              const edgeY =
                Math.min(
                  viewportSize.height - margin,
                  Math.max(margin, rawY)
                );

              return (
                <div
                  key={`indicator-${player.id}`}
                  className="pointer-events-none absolute z-[4950] flex items-center gap-1 rounded-full border border-white/15 bg-black/65 px-2 py-1 text-[8px] font-black text-white shadow-lg backdrop-blur-sm"
                  style={{
                    left: edgeX,
                    top: edgeY,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <span
                    className="inline-block text-amber-300"
                    style={{
                      transform: `rotate(${angle * 180 / Math.PI + 90}deg)`,
                    }}
                  >
                    ▲
                  </span>
                  <span className="max-w-[72px] truncate">
                    {getDisplayName(player.nickname)}
                  </span>
                </div>
              );
            })}

        {/* =================================================
            Me
        ================================================= */}

        <div
          className="
            pointer-events-none
            absolute
            z-[5000]
          "
          style={{
            left:
              playerScreenX,

            top:
              playerScreenY,

            transform:
              "translate(-50%, -100%)",

            zIndex:
              Math.round(
                position.y
              ) +
              3100,
          }}
        >
          <Potato
            name={
              getDisplayName(
                selfPlayer
                  ?.nickname ??
                nickname
              )
            }
            glasses={
              selfPlayer
                ?.characterStyle
                ?.glasses ??
              characterStyle
                ?.glasses ??
              "none"
            }
            hat={
              selfPlayer
                ?.characterStyle
                ?.hat ??
              characterStyle
                ?.hat ??
              "none"
            }
            ribbon={
              selfPlayer
                ?.characterStyle
                ?.ribbon ??
              characterStyle
                ?.ribbon ??
              false
            }
            tie={
              selfPlayer
                ?.characterStyle
                ?.tie ??
              characterStyle
                ?.tie ??
              false
            }
            special={
              selfPlayer
                ?.characterStyle
                ?.special ??
              characterStyle
                ?.special ??
              "none"
            }
            color={
              selfPlayer
                ?.characterStyle
                ?.color ??
              characterStyle
                ?.color ??
              "default"
            }
            hair={selfPlayer?.characterStyle?.hair ?? characterStyle?.hair ?? "none"}
            hairColor={selfPlayer?.characterStyle?.hairColor ?? characterStyle?.hairColor ?? "brown"}
            eyes={selfPlayer?.characterStyle?.eyes ?? characterStyle?.eyes ?? "dot"}
            mouth={selfPlayer?.characterStyle?.mouth ?? characterStyle?.mouth ?? "default"}
            blush={selfPlayer?.characterStyle?.blush ?? characterStyle?.blush ?? true}
            freckles={selfPlayer?.characterStyle?.freckles ?? characterStyle?.freckles ?? false}
            moving={
              moving
            }
            direction={
              direction
            }
            ghost={
              playerState ===
              "ghost"
            }
            attacking={
              myAttacking
            }
            evil={
              myAttacking
            }
            hit={
              myHit
            }
          />
        </div>

        {/* =================================================
            Blackout
        ================================================= */}

        {blackout &&
          role === "survivor" &&
          playerState !== "ghost" && (
            <div
              className="
                pointer-events-none
                absolute
                inset-0
                z-[7000]
              "
              style={{
                background: `
                  radial-gradient(
                    circle 210px
                    at ${playerScreenX}px ${playerScreenY}px,

                    rgba(0,0,0,0) 0px,
                    rgba(0,0,0,0.04) 90px,
                    rgba(0,0,0,0.25) 130px,
                    rgba(0,0,0,0.7) 175px,
                    rgba(0,0,0,0.98) 235px
                  )
                `,
              }}
            />
          )}

        {/* =================================================
            Status HUD
        ================================================= */}

        <div
          data-no-move
          className={`
            absolute
            z-[8000]
            rounded-xl
            border
            border-white/10
            bg-black/80
            text-white
            shadow-lg
            backdrop-blur-sm

            ${
              isLandscapeMobile
                ? "left-2 top-2 w-[142px] px-2.5 py-2"
                : isMobile
                  ? "left-2 top-2 w-[155px] px-3 py-2"
                  : "left-4 top-4 w-[190px] px-4 py-3"
            }
          `}
        >
          <div
            className={`
              text-[12px]
              font-black

              ${playerState ===
                "ghost"
                ? "text-sky-300"
                : role ===
                  "devil"
                  ? "text-red-400"
                  : "text-emerald-400"
              }
            `}
          >
            {playerState ===
              "ghost"
              ? "👻 유령 감자"
              : role ===
                "devil"
                ? "😈 악마 감자"
                : "🥔 생존 감자"}
          </div>

          {!isLandscapeMobile && (
            <div className="mt-1 text-[8px] text-white/45">
              같은 게임 참가자 {otherPlayers.length + 1}명
            </div>
          )}

          {playerState ===
            "ghost" && (
              <div
                className="
                mt-1
                text-[8px]
                text-sky-100/55
              "
              >
                벽과 문을 자유롭게 통과할 수 있습니다.
              </div>
            )}

          {/* =====================================
              생존자 팀 전체 미션 진행도

              악마의 미션은 서버 계산에서 제외된다.
              악마도 이 게이지 자체는 볼 수 있다.
          ===================================== */}

          <div className="mt-3">
            <div
              className="
                flex
                items-center
                justify-between
                gap-2
                text-[9px]
              "
            >
              <span
                className="
                  truncate
                  font-semibold
                  text-white/65
                "
              >
                🗂 생존팀 업무
              </span>

              <span
                className="
                  shrink-0
                  font-black
                  text-emerald-300
                "
              >
                {teamMissionProgress.percentage}%
              </span>
            </div>

            <div
              className="
                mt-2
                h-[9px]
                overflow-hidden
                rounded-full
                bg-white/10
                ring-1
                ring-white/5
              "
            >
              <div
                className="
                  h-full
                  rounded-full
                  bg-emerald-400
                  transition-[width]
                  duration-500
                  ease-out
                "
                style={{
                  width:
                    `${teamMissionProgress.percentage}%`,
                }}
              />
            </div>

            <div
              className="
                mt-1.5
                flex
                items-center
                justify-between
                text-[8px]
              "
            >
              <span className="text-white/35">
                {isLandscapeMobile
                  ? "전체"
                  : "전체 생존자 기준"}
              </span>

              <span className="font-bold text-emerald-200/80">
                {teamMissionProgress.completed}
                {" / "}
                {teamMissionProgress.total}
              </span>
            </div>

            {role ===
              "survivor" && (
              <div
                className="
                  mt-2
                  border-t
                  border-white/10
                  pt-2
                  text-[8px]
                "
              >
                <div className="flex justify-between gap-2">
                  <span className="text-white/35">
                    내 업무
                  </span>

                  <span className="font-bold text-amber-300">
                    {completedMissionCount}
                    {" / "}
                    {totalMissionCount}
                  </span>
                </div>

                <div className="mt-1 text-white/30">
                  남은 미션 {remainingMissionCount}개
                </div>
              </div>
            )}
          </div>

          {role === "devil" &&
            playerState ===
            "alive" && (
              <div
                className="
                mt-3
                border-t
                border-white/10
                pt-2
                text-[9px]
              "
              >
                <span className="text-white/40">
                  처치
                </span>

                <span
                  className={`
                  float-right
                  font-bold

                  ${cooldownRemaining >
                      0
                      ? "text-zinc-400"
                      : "text-red-400"
                    }
                `}
                >
                  {cooldownRemaining >
                    0
                    ? `${cooldownRemaining}초`
                    : "준비 완료"}
                </span>
              </div>
            )}
        </div>

        {/* =================================================
            Corpse Report
        ================================================= */}

        {nearbyCorpse &&
          !meeting &&
          playerState ===
          "alive" && (
            <button
              type="button"
              data-no-move
              onClick={(event) => {
                event.stopPropagation();
                reportCorpse();
              }}
              className="
                absolute
                bottom-[86px]
                left-1/2
                z-[8850]
                -translate-x-1/2
                animate-pulse
                rounded-2xl
                border-2
                border-red-300/60
                bg-red-600
                px-5
                py-3
                text-[11px]
                font-black
                text-white
                shadow-[0_0_30px_rgba(239,68,68,0.5)]
                transition
                hover:bg-red-500
                active:scale-95
                max-[700px]:hidden
              "
            >
              🚨 {getDisplayName(
                nearbyCorpse.nickname
              )} 발견 · 긴급회의 소집
            </button>
          )}

        {/* =================================================
            Kill interaction
        ================================================= */}

        {role === "devil" &&
          playerState ===
          "alive" &&
          nearbyKillTarget &&
          !activeMission &&
          !mapOpen &&
          !meeting && (
            <button
              type="button"
              data-no-move
              disabled={
                cooldownRemaining >
                0
              }
              onClick={(
                event
              ) => {
                event.stopPropagation();
                tryKill();
              }}
              className="
                absolute
                bottom-20
                left-1/2
                z-[8700]
                -translate-x-1/2
                rounded-xl
                border
                border-red-400/20
                bg-red-950/90
                px-5
                py-3
                text-[11px]
                font-bold
                text-white
                shadow-xl
                disabled:opacity-40
                max-[700px]:hidden
              "
            >
              <span
                className="
                  mr-2
                  rounded-md
                  bg-red-500
                  px-2
                  py-1
                  text-[10px]
                  font-black
                  text-white
                "
              >
                Q
              </span>

              {cooldownRemaining >
                0
                ? `처치 대기 ${cooldownRemaining}초`
                : `${getDisplayName(
                  nearbyKillTarget.nickname
                )} 처치`}
            </button>
          )}

        {/* =================================================
            Mission interaction
        ================================================= */}

        {nearbyMission &&
          !activeMission &&
          !mapOpen &&
          !deathOverlay &&
          !meeting && (
            <button
              type="button"
              data-no-move
              onClick={(
                event
              ) => {
                event.stopPropagation();
                startMission();
              }}
              className="
                absolute
                bottom-5
                left-1/2
                z-[8500]
                -translate-x-1/2
                rounded-xl
                border
                border-white/10
                bg-black/85
                px-5
                py-3
                text-[11px]
                font-bold
                text-white
                shadow-xl
                max-[700px]:hidden
              "
            >
              <span
                className="
                  mr-2
                  rounded-md
                  bg-amber-400
                  px-2
                  py-1
                  text-[10px]
                  font-black
                  text-zinc-900
                "
              >
                E
              </span>

              {
                nearbyMission.title
              }

              <span className="ml-2 text-white/40">
                ·{" "}
                {
                  nearbyMission.room
                }
              </span>
            </button>
          )}

        {/* =================================================
            Leave Game
        ================================================= */}

        {!gameResult && (
          <button
            type="button"
            data-no-move
            onClick={(event) => {
              event.stopPropagation();

              setLeaveConfirmOpen(
                true
              );
            }}
            className="
              absolute
              right-4
              top-4
              z-[9200]
              max-[700px]:right-2
              max-[700px]:top-2
              rounded-xl
              border
              border-red-400/20
              bg-black/80
              px-3
              py-2
              text-[9px]
              font-black
              text-red-300
              shadow-lg
              backdrop-blur-sm
              transition
              hover:bg-red-950/80
            "
          >
            게임 퇴장
          </button>
        )}

        {/* =================================================
            Combat message
        ================================================= */}

        {combatMessage && (
          <div
            data-no-move
            className="
              absolute
              left-1/2
              top-5
              z-[9100]
              -translate-x-1/2
              rounded-full
              bg-black/85
              px-4
              py-2
              text-[10px]
              font-semibold
              text-white
            "
          >
            {combatMessage}
          </div>
        )}

        {/* =================================================
            Screen Action Buttons

            모바일에서는 키보드가 없으므로 화면 버튼으로
            업무 / 지도 / 처치 / 정전을 실행할 수 있다.
            PC에서도 동일하게 클릭할 수 있다.
        ================================================= */}

        {!deathOverlay &&
          !meeting && (
            <div
              data-no-move
              className={`
                absolute
                z-[9000]
                flex
                flex-col
                items-end

                ${
                  isLandscapeMobile
                    ? "bottom-[max(10px,env(safe-area-inset-bottom))] right-[max(10px,env(safe-area-inset-right))] grid grid-cols-2 gap-1.5"
                    : isMobile
                      ? "bottom-3 right-3 gap-1.5"
                      : "bottom-4 right-4 gap-2"
                }
              `}
            >
              {/* 시체 신고 */}

              {nearbyCorpse &&
                playerState ===
                  "alive" && (
                  <ActionButton
                    compact={isLandscapeMobile}
                    label="시체 신고"
                    icon="🚨"
                    shortcut=""
                    variant="danger"
                    onClick={
                      reportCorpse
                    }
                    active={true}
                  />
                )}

              {/* 중앙 회의 테이블 긴급회의 */}

              {(isMobile ||
                nearEmergencyMeetingTable) &&
                playerState ===
                  "alive" && (
                  <ActionButton
                    compact={isLandscapeMobile}
                    label={
                      emergencyMeetingUses >=
                      EMERGENCY_MEETING_MAX_USES
                        ? "회의 사용 완료"
                        : "긴급회의"
                    }
                    icon="📣"
                    shortcut=""
                    variant="danger"
                    onClick={
                      requestEmergencyMeeting
                    }
                    disabled={
                      !canCallEmergencyMeeting
                    }
                    active={
                      canCallEmergencyMeeting
                    }
                  />
                )}

              {/* 지도 */}

              <ActionButton
                compact={isLandscapeMobile}
                label={
                  mapOpen
                    ? "지도 닫기"
                    : "지도"
                }
                icon="🗺️"
                shortcut="M"
                onClick={
                  handleMapAction
                }
                disabled={
                  Boolean(
                    activeMission
                  )
                }
              />

              {/* 업무 */}

              {role ===
                "survivor" &&
                playerState ===
                "alive" && (
                  <ActionButton
                    compact={isLandscapeMobile}
                    label={
                      nearbyMission
                        ? nearbyMission.title
                        : "업무"
                    }
                    icon="📋"
                    shortcut="E"
                    onClick={
                      handleMissionAction
                    }
                    disabled={
                      !canUseMission
                    }
                    active={
                      canUseMission
                    }
                  />
                )}

              {/* 유령도 미션은 계속 수행 가능 */}

              {playerState ===
                "ghost" && (
                  <ActionButton
                    compact={isLandscapeMobile}
                    label={
                      nearbyMission
                        ? nearbyMission.title
                        : "업무"
                    }
                    icon="📋"
                    shortcut="E"
                    onClick={
                      handleMissionAction
                    }
                    disabled={
                      !canUseMission
                    }
                    active={
                      canUseMission
                    }
                  />
                )}

              {/* 악마 전용 */}

              {role === "devil" &&
                playerState ===
                "alive" && (
                  <>
                    <ActionButton
                      compact={isLandscapeMobile}
                      label={
                        cooldownRemaining >
                          0
                          ? `처치 ${Math.ceil(
                            cooldownRemaining /
                            100
                          ) / 10
                          }s`
                          : nearbyKillTarget
                            ? "처치"
                            : "대상 없음"
                      }
                      icon="🔪"
                      shortcut="Q"
                      variant="danger"
                      onClick={
                        tryKill
                      }
                      disabled={
                        !canKill
                      }
                      active={
                        canKill
                      }
                    />

                    <ActionButton
                      compact={isLandscapeMobile}
                      label={
                        blackout
                          ? "정전 해제"
                          : "정전"
                      }
                      icon="🌑"
                      shortcut="B"
                      variant="dark"
                      onClick={
                        handleBlackoutAction
                      }
                      disabled={
                        !canBlackout
                      }
                      active={
                        blackout
                      }
                    />
                  </>
                )}
            </div>
          )}

        {/* =================================================
            Mobile Joystick

            왼손 엄지로 이동하고 오른쪽 액션 버튼을 누르는 구조.
        ================================================= */}

        {isMobile &&
          !deathOverlay &&
          !meeting &&
          !activeMission &&
          !mapOpen && (
            <div
              data-no-move
              className={`
                absolute
                z-[9050]
                flex
                flex-col
                items-center

                ${
                  isLandscapeMobile
                    ? "bottom-[max(10px,env(safe-area-inset-bottom))] left-[max(12px,env(safe-area-inset-left))] gap-0"
                    : "bottom-[max(18px,env(safe-area-inset-bottom))] left-[max(18px,env(safe-area-inset-left))] gap-1"
                }
              `}
            >
              {!isLandscapeMobile && (
                <div
                  className="
                    text-[8px]
                    font-black
                    tracking-[0.12em]
                    text-white/45
                    drop-shadow
                  "
                >
                  MOVE
                </div>
              )}

              <div
                role="application"
                aria-label="이동 조이스틱"
                onPointerDown={
                  startJoystick
                }
                onPointerMove={
                  moveJoystick
                }
                onPointerUp={
                  endJoystick
                }
                onPointerCancel={
                  endJoystick
                }
                className="
                  relative
                  touch-none
                  select-none
                  rounded-full
                  border
                  border-white/15
                  bg-black/40
                  shadow-[0_8px_30px_rgba(0,0,0,0.45)]
                  backdrop-blur-sm
                "
                style={{
                  width:
                    isLandscapeMobile
                      ? MOBILE_LANDSCAPE_JOYSTICK_SIZE
                      : MOBILE_JOYSTICK_SIZE,
                  height:
                    isLandscapeMobile
                      ? MOBILE_LANDSCAPE_JOYSTICK_SIZE
                      : MOBILE_JOYSTICK_SIZE,
                }}
              >
                <div
                  className="
                    pointer-events-none
                    absolute
                    left-1/2
                    top-1/2
                    -translate-x-1/2
                    -translate-y-1/2
                    rounded-full
                    border
                    border-white/25
                    bg-white/25
                    shadow-lg
                  "
                  style={{
                    width:
                      isLandscapeMobile
                        ? 54
                        : 46,
                    height:
                      isLandscapeMobile
                        ? 54
                        : 46,
                    marginLeft:
                      joystickKnob.x,

                    marginTop:
                      joystickKnob.y,
                  }}
                />

                <span className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 text-[10px] text-white/25">
                  ▲
                </span>

                <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-white/25">
                  ▼
                </span>

                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-white/25">
                  ◀
                </span>

                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-white/25">
                  ▶
                </span>
              </div>
            </div>
          )}

        {/* =================================================
            Controls
        ================================================= */}

        <div
          data-no-move
          className="
            absolute
            bottom-3
            left-1/2
            z-[8000]
            hidden
            md:flex
            max-w-[calc(100%-24px)]
            -translate-x-1/2
            flex-wrap
            items-center
            justify-center
            gap-1.5
            rounded-2xl
            border
            border-white/10
            bg-black/80
            px-3
            py-2
            shadow-xl
            backdrop-blur-sm
          "
        >
          <span className="mr-1 text-[8px] font-bold tracking-[0.12em] text-white/35">
            CONTROLS
          </span>

          <Control>클릭 : 이동</Control>
          <Control>E : 업무</Control>
          <Control>M : 지도</Control>

          {role === "devil" &&
            playerState === "alive" && (
              <Control>Q : 생존자 처치</Control>
            )}

          {role === "devil" &&
            playerState === "alive" && (
              <Control>B : 정전</Control>
            )}

          <span className="rounded-lg bg-amber-400/15 px-2 py-1 text-[8px] font-bold text-amber-200">
            📍 회의실 회의 테이블 : 긴급회의 장소
          </span>

          {playerState === "ghost" && (
            <span className="rounded-lg bg-sky-400/15 px-2 py-1 text-[8px] font-bold text-sky-200">
              👻 유령 : 벽/문 통과 가능
            </span>
          )}
        </div>

        {/* =================================================
            Map
        ================================================= */}

        <GameMapOverlay
          open={
            mapOpen
          }
          playerX={
            position.x
          }
          playerY={
            position.y
          }
          missions={
            mapMissions
          }
          blackout={
            blackout
          }
          onClose={() => {
            setMapOpen(
              false
            );
          }}
        />

        {/* =================================================
            Kill Cinematic

            악마와 피해자에게만 표시되는 짧은 처치 장면.
            마지막 처치로 게임이 끝나는 경우에도 이 연출 후
            GAME OVER 화면으로 넘어간다.
        ================================================= */}

        {killSequence &&
          cinematicKiller &&
          cinematicVictim && (
            <div
              data-no-move
              className="
                pointer-events-none
                absolute
                inset-0
                z-[56000]
                overflow-hidden
                bg-black
              "
            >
              {/* 붉은 비네팅 */}

              <div
                className="
                  absolute
                  inset-0
                  animate-[killBackdrop_2.8s_ease-out_forwards]
                "
                style={{
                  background:
                    "radial-gradient(circle at center, rgba(80,0,0,0.12) 0%, rgba(10,0,0,0.82) 55%, rgba(0,0,0,1) 100%)",
                }}
              />

              {/* 경고 문구 */}

              <div
                className="
                  absolute
                  left-1/2
                  top-[12%]
                  -translate-x-1/2
                  text-center
                  text-white
                  animate-[killTitle_2.8s_ease-out_forwards]
                "
              >
                <div
                  className="
                    text-[9px]
                    font-black
                    tracking-[0.35em]
                    text-red-400/70
                  "
                >
                  DEVIL ATTACK
                </div>

                <div
                  className="
                    mt-2
                    text-[17px]
                    font-black
                    tracking-tight
                  "
                >
                  누군가 습격당했습니다
                </div>
              </div>

              {/* 캐릭터 연출 */}

              <div
                className="
                  absolute
                  inset-x-0
                  top-1/2
                  flex
                  -translate-y-1/2
                  items-end
                  justify-center
                  gap-[120px]
                "
              >
                {/* 악마 */}

                <div
                  className="
                    relative
                    animate-[killerLunge_2.8s_cubic-bezier(.22,.9,.3,1)_forwards]
                  "
                >
                  <div
                    style={{
                      transform:
                        "scale(1.28)",
                      transformOrigin:
                        "center bottom",
                    }}
                  >
                    <Potato
                      name={
                        getDisplayName(
                          cinematicKiller.nickname
                        )
                      }
                      glasses={
                        cinematicKiller
                          .characterStyle
                          ?.glasses ??
                        "none"
                      }
                      hat={
                        cinematicKiller
                          .characterStyle
                          ?.hat ??
                        "none"
                      }
                      ribbon={
                        cinematicKiller
                          .characterStyle
                          ?.ribbon ??
                        false
                      }
                      tie={
                        cinematicKiller
                          .characterStyle
                          ?.tie ??
                        false
                      }
                      color={
                        cinematicKiller
                          .characterStyle
                          ?.color ??
                        "default"
                      }
                      hair={cinematicKiller.characterStyle?.hair ?? "none"}
                      hairColor={cinematicKiller.characterStyle?.hairColor ?? "brown"}
                      eyes={cinematicKiller.characterStyle?.eyes ?? "dot"}
                      mouth={cinematicKiller.characterStyle?.mouth ?? "default"}
                      blush={cinematicKiller.characterStyle?.blush ?? true}
                      freckles={cinematicKiller.characterStyle?.freckles ?? false}
                      moving={false}
                      ghost={false}
                      attacking={true}
                      evil={true}
                      hit={false}
                    />
                  </div>

                  <div
                    className="
                      absolute
                      -right-7
                      top-[32px]
                      text-[34px]
                      opacity-0
                      drop-shadow-[0_0_12px_rgba(239,68,68,0.95)]
                      animate-[knifeSlash_2.8s_ease-out_forwards]
                    "
                  >
                    🔪
                  </div>
                </div>

                {/* 피해자 */}

                <div
                  className="
                    relative
                    animate-[victimHit_2.8s_cubic-bezier(.2,.8,.3,1)_forwards]
                  "
                >
                  <div
                    style={{
                      transform:
                        "scale(1.28)",
                      transformOrigin:
                        "center bottom",
                    }}
                  >
                    <Potato
                      name={
                        getDisplayName(
                          cinematicVictim.nickname
                        )
                      }
                      glasses={
                        cinematicVictim
                          .characterStyle
                          ?.glasses ??
                        "none"
                      }
                      hat={
                        cinematicVictim
                          .characterStyle
                          ?.hat ??
                        "none"
                      }
                      ribbon={
                        cinematicVictim
                          .characterStyle
                          ?.ribbon ??
                        false
                      }
                      tie={
                        cinematicVictim
                          .characterStyle
                          ?.tie ??
                        false
                      }
                      color={
                        cinematicVictim
                          .characterStyle
                          ?.color ??
                        "default"
                      }
                      hair={cinematicVictim.characterStyle?.hair ?? "none"}
                      hairColor={cinematicVictim.characterStyle?.hairColor ?? "brown"}
                      eyes={cinematicVictim.characterStyle?.eyes ?? "dot"}
                      mouth={cinematicVictim.characterStyle?.mouth ?? "default"}
                      blush={cinematicVictim.characterStyle?.blush ?? true}
                      freckles={cinematicVictim.characterStyle?.freckles ?? false}
                      moving={false}
                      ghost={false}
                      attacking={false}
                      evil={false}
                      hit={true}
                    />
                  </div>

                  <div
                    className="
                      absolute
                      left-1/2
                      top-1/2
                      -translate-x-1/2
                      -translate-y-1/2
                      text-[44px]
                      opacity-0
                      animate-[impactMark_2.8s_ease-out_forwards]
                    "
                  >
                    💥
                  </div>
                </div>
              </div>

              {/* 공격 순간 화면 플래시 */}

              <div
                className="
                  absolute
                  inset-0
                  bg-red-600
                  opacity-0
                  animate-[killFlash_2.8s_ease-out_forwards]
                "
              />

              {/* 마지막 사망 표시 */}

              <div
                className="
                  absolute
                  bottom-[13%]
                  left-1/2
                  -translate-x-1/2
                  text-center
                  opacity-0
                  animate-[killFinish_2.8s_ease-out_forwards]
                "
              >
                <div
                  className="
                    text-[34px]
                  "
                >
                  💀
                </div>

                <div
                  className="
                    mt-2
                    text-[10px]
                    font-black
                    tracking-[0.18em]
                    text-white/60
                  "
                >
                  ELIMINATED
                </div>
              </div>

              <style>{`
                @keyframes killBackdrop {
                  0% {
                    opacity: 0;
                  }
                  8% {
                    opacity: 1;
                  }
                  82% {
                    opacity: 1;
                  }
                  100% {
                    opacity: 0;
                  }
                }

                @keyframes killTitle {
                  0%,
                  8% {
                    opacity: 0;
                    transform: translate(-50%, -8px);
                  }
                  18%,
                  72% {
                    opacity: 1;
                    transform: translate(-50%, 0);
                  }
                  88%,
                  100% {
                    opacity: 0;
                    transform: translate(-50%, -4px);
                  }
                }

                @keyframes killerLunge {
                  0%,
                  15% {
                    transform: translateX(-70px) scale(1);
                  }
                  32% {
                    transform: translateX(28px) scale(1.08);
                  }
                  43% {
                    transform: translateX(48px) scale(1.12);
                  }
                  58% {
                    transform: translateX(16px) scale(1.04);
                  }
                  82% {
                    transform: translateX(8px) scale(1);
                  }
                  100% {
                    transform: translateX(8px) scale(0.98);
                    opacity: 0;
                  }
                }

                @keyframes victimHit {
                  0%,
                  29% {
                    transform: translateX(55px) rotate(0deg);
                    filter: brightness(1);
                  }
                  35% {
                    transform: translateX(70px) rotate(7deg);
                    filter: brightness(2.3);
                  }
                  41% {
                    transform: translateX(48px) rotate(-8deg);
                    filter: brightness(0.75);
                  }
                  55% {
                    transform: translateX(85px) translateY(12px)
                      rotate(18deg);
                  }
                  72% {
                    transform: translateX(95px) translateY(34px)
                      rotate(68deg);
                    opacity: 1;
                  }
                  88%,
                  100% {
                    transform: translateX(100px) translateY(48px)
                      rotate(88deg);
                    opacity: 0;
                  }
                }

                @keyframes knifeSlash {
                  0%,
                  24% {
                    opacity: 0;
                    transform: translate(-28px, 18px) rotate(-35deg)
                      scale(0.7);
                  }
                  31% {
                    opacity: 1;
                  }
                  41% {
                    opacity: 1;
                    transform: translate(42px, -14px) rotate(35deg)
                      scale(1.25);
                  }
                  50%,
                  100% {
                    opacity: 0;
                    transform: translate(58px, -22px) rotate(48deg)
                      scale(1.35);
                  }
                }

                @keyframes impactMark {
                  0%,
                  31% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.2)
                      rotate(-20deg);
                  }
                  36% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1.35)
                      rotate(8deg);
                  }
                  48% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(1.8)
                      rotate(18deg);
                  }
                  100% {
                    opacity: 0;
                  }
                }

                @keyframes killFlash {
                  0%,
                  30% {
                    opacity: 0;
                  }
                  34% {
                    opacity: 0.48;
                  }
                  38% {
                    opacity: 0;
                  }
                  42% {
                    opacity: 0.18;
                  }
                  46%,
                  100% {
                    opacity: 0;
                  }
                }

                @keyframes killFinish {
                  0%,
                  58% {
                    opacity: 0;
                    transform: translate(-50%, 8px);
                  }
                  70%,
                  87% {
                    opacity: 1;
                    transform: translate(-50%, 0);
                  }
                  100% {
                    opacity: 0;
                    transform: translate(-50%, -4px);
                  }
                }
              `}</style>
            </div>
          )}

        {/* =================================================
            피해자 화면
        ================================================= */}

        {deathOverlay &&
          !killSequence && (
            <div
              data-no-move
              className="
              absolute
              inset-0
              z-[50000]
              flex
              items-center
              justify-center
              bg-black
            "
            >
              <div
                className="
                text-center
                text-white
              "
              >
                <div
                  className="
                  text-5xl
                "
                >
                  💀
                </div>

                <div
                  className="
                  mt-5
                  text-2xl
                  font-black
                  tracking-tight
                "
                >
                  잡혔습니다...
                </div>

                <div
                  className="
                  mt-3
                  text-[11px]
                  text-white/40
                "
                >
                  잠시 후 유령이 됩니다.
                </div>
              </div>
            </div>
          )}
      </div>

      {/* =================================================
          Emergency Meeting

          모바일 가로모드에서는 회의실 테이블을 중심으로
          감자들이 둥글게 앉아 있는 형태로 표시한다.
          iOS 입력창 자동 확대를 막기 위해 모바일 input은
          16px 이상으로 유지한다.
      ================================================= */}

      {meeting && !gameResult && (
        <div
          data-no-move
          className="fixed inset-0 z-[65000] overflow-hidden bg-[#171310]"
          style={{
            width: "100vw",
            height:
              "var(--game-vh, 100dvh)",
            maxHeight:
              "var(--game-vh, 100dvh)",
            overscrollBehavior:
              "none",
            touchAction:
              isMobile
                ? "manipulation"
                : undefined,
          }}
        >
          <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
            {/* Compact Header */}
            <div
              className={`
                relative z-20 flex shrink-0 items-center justify-between
                border-b border-white/10 bg-[#211a16]/95 text-white
                ${isLandscapeMobile ? "h-[50px] px-3" : "h-[58px] px-4"}
              `}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[15px]">🚨</span>
                  <div className={`${isLandscapeMobile ? "text-[14px]" : "text-[18px]"} font-black text-red-300`}>
                    긴급회의
                  </div>
                </div>
                {!isLandscapeMobile && (
                  <div className="mt-1 text-[9px] font-semibold text-white/55">
                    {meeting.kind === "emergency"
                      ? `📣 ${getDisplayName(meeting.reporterNickname)}이(가) 긴급회의를 소집했습니다.`
                      : `💀 ${getDisplayName(meeting.victimNickname)}이(가) 발견되었습니다.`}
                  </div>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {isLandscapeMobile && (
                  <div className="max-w-[44vw] truncate text-right text-[8px] font-semibold text-white/45">
                    {meeting.kind === "emergency"
                      ? `${getDisplayName(meeting.reporterNickname)} 소집`
                      : `${getDisplayName(meeting.victimNickname)} 발견`}
                  </div>
                )}
                <div
                  className={`
                    rounded-full border border-white/10 bg-black/35 font-black
                    ${isLandscapeMobile ? "px-3 py-1.5 text-[9px]" : "px-4 py-2 text-[11px]"}
                  `}
                >
                  {meeting.phase === "discussion"
                    ? `토론 ${meetingSeconds}초`
                    : meeting.phase === "voting"
                      ? `투표 ${meetingSeconds}초`
                      : "투표 결과"}
                </div>
              </div>
            </div>

            {/* Main Meeting Stage */}
            <div
              className={`
                grid min-h-0 flex-1 overflow-hidden
                ${
                  isLandscapeMobile
                    ? "grid-cols-[minmax(0,1fr)_minmax(250px,36vw)] grid-rows-1"
                    : isMobile
                      ? "grid-cols-1 grid-rows-[minmax(250px,42%)_minmax(0,1fr)]"
                      : "grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-1 grid-rows-[minmax(300px,46%)_minmax(0,1fr)]"
                }
              `}
            >
              {/* Round table / voting stage */}
              <div
                className="relative min-h-0 overflow-hidden bg-[radial-gradient(circle_at_center,#46382f_0%,#2b211b_56%,#171310_100%)]"
              >
                {/* subtle floor grid */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.08]"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                  }}
                />

                <div
                  className={`absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-[5px] border-[#8d715d] bg-[#b79677] shadow-[0_18px_45px_rgba(0,0,0,.45),inset_0_8px_0_rgba(255,255,255,.12)] ${isMobile && !isLandscapeMobile ? "top-[51%] h-[30%] w-[58%]" : "top-[50%] h-[34%] w-[48%]"}`}
                />
                <div
                  className={`absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-white/10 bg-[#a98567]/35 ${isMobile && !isLandscapeMobile ? "top-[51%] h-[22%] w-[49%]" : "top-[50%] h-[26%] w-[40%]"}`}
                />

                <div className="absolute left-1/2 top-[50%] z-10 -translate-x-1/2 -translate-y-1/2 text-center">
                  <div className="text-[9px] font-black tracking-[0.18em] text-black/35">MEETING TABLE</div>
                  {meeting.phase === "voting" && !voted && playerState === "alive" && (
                    <div className="mt-2 rounded-full bg-red-700/90 px-3 py-1 text-[8px] font-black text-white shadow-lg">
                      감자를 눌러 투표
                    </div>
                  )}
                </div>

                {meetingPlayers.map((player, index) => {
                  const count = Math.max(1, meetingPlayers.length);
                  const angle = -Math.PI / 2 + (Math.PI * 2 * index) / count;
                  const portraitMeeting =
                    isMobile &&
                    !isLandscapeMobile;
                  const radiusX =
                    portraitMeeting
                      ? 39
                      : isLandscapeMobile
                        ? 34
                        : 35;
                  /*
                   * 플레이어 원형 배치를 화면 안쪽으로 당긴다.
                   * 기존 radiusY 34~36%는 상단 캐릭터가
                   * 헤더 뒤로 잘리는 경우가 있었다.
                   */
                  const radiusY =
                    portraitMeeting
                      ? 27
                      : isLandscapeMobile
                        ? 29
                        : 28;
                  const centerY =
                    portraitMeeting
                      ? 51
                      : 50;
                  const left = 50 + Math.cos(angle) * radiusX;
                  const top = centerY + Math.sin(angle) * radiusY;
                  const dead = player.state === "ghost";
                  const hasVoted = meeting.votedPlayerIds.includes(player.id);
                  const canVoteThis =
                    meeting.phase === "voting" &&
                    !dead &&
                    playerState === "alive" &&
                    !voted;
                  const style = player.characterStyle;

                  return (
                    <button
                      key={player.id}
                      type="button"
                      data-no-move
                      disabled={!canVoteThis}
                      onClick={() => {
                        if (canVoteThis) votePlayer(player.id);
                      }}
                      className={`
                        absolute z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center
                        rounded-2xl px-1.5 py-1 outline-none transition
                        ${canVoteThis ? "cursor-pointer hover:bg-red-500/10 active:scale-95" : "cursor-default"}
                        ${hasVoted ? "ring-2 ring-emerald-400/60" : ""}
                        ${dead ? "opacity-45 grayscale" : ""}
                      `}
                      style={{ left: `${left}%`, top: `${top}%` }}
                    >
                      <div
                        className={`
                          mb-0.5 max-w-[88px] truncate rounded-full px-2 py-0.5
                          text-[8px] font-black shadow
                          ${player.id === myPlayerId ? "bg-amber-300 text-zinc-950" : "bg-black/70 text-white"}
                        `}
                      >
                        {player.id === myPlayerId ? "나 · " : ""}
                        {getDisplayName(player.nickname)}
                      </div>

                      <div
                        className={`${
                          isMobile && !isLandscapeMobile
                            ? "scale-[0.48]"
                            : isLandscapeMobile
                              ? "scale-[0.54]"
                              : "scale-[0.64]"
                        } origin-top`}
                        style={{
                          marginBottom:
                            isMobile && !isLandscapeMobile
                              ? -45
                              : isLandscapeMobile
                                ? -38
                                : -25,
                        }}
                      >
                        <Potato
                          name=""
                          glasses={style?.glasses ?? "none"}
                          hat={style?.hat ?? "none"}
                          ribbon={style?.ribbon ?? false}
                          tie={style?.tie ?? false}
                          special={style?.special ?? "none"}
                          color={style?.color ?? "default"}
                          hair={style?.hair ?? "none"}
                          hairColor={style?.hairColor ?? "brown"}
                          eyes={style?.eyes ?? "dot"}
                          mouth={style?.mouth ?? "default"}
                          blush={style?.blush ?? true}
                          freckles={style?.freckles ?? false}
                          moving={false}
                          direction="down"
                          ghost={dead}
                          attacking={false}
                          evil={false}
                          hit={false}
                        />
                      </div>

                      <div className="mt-1 min-h-[14px] text-[7px] font-black">
                        {dead ? (
                          <span className="text-white/40">💀 사망</span>
                        ) : hasVoted ? (
                          <span className="text-emerald-300">✓ 투표 완료</span>
                        ) : canVoteThis ? (
                          <span className="rounded-full bg-red-600 px-2 py-0.5 text-white">투표</span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}

                {meeting.phase === "voting" && playerState === "alive" && !voted && (
                  <button
                    type="button"
                    data-no-move
                    onClick={() => votePlayer("skip")}
                    className="absolute bottom-3 left-3 z-30 rounded-full border border-white/15 bg-black/65 px-3 py-2 text-[8px] font-black text-white shadow-xl active:scale-95"
                  >
                    ⏭️ 건너뛰기
                  </button>
                )}

                {voted && meeting.phase === "voting" && (
                  <div className="absolute bottom-3 left-1/2 z-30 -translate-x-1/2 rounded-full bg-emerald-500/90 px-4 py-2 text-[8px] font-black text-white shadow-xl">
                    ✓ 투표 완료 · 기다리는 중
                  </div>
                )}

                {meeting.phase === "result" && meetingResult && (
                  <div className="absolute inset-x-[12%] bottom-4 z-40 rounded-2xl border border-white/10 bg-black/80 p-3 text-center text-white shadow-2xl backdrop-blur-md">
                    {meetingResult.skipped || !meetingResult.expelledPlayer ? (
                      <div className="text-[11px] font-black">🤝 아무도 퇴출되지 않았습니다.</div>
                    ) : (
                      <>
                        <div className="text-[12px] font-black">🚪 {getDisplayName(meetingResult.expelledPlayer.nickname)} 퇴출</div>
                        <div className={`mt-1 text-[9px] font-black ${meetingResult.expelledPlayer.role === "devil" ? "text-red-300" : "text-emerald-300"}`}>
                          {meetingResult.expelledPlayer.role === "devil" ? "😈 악마였습니다!" : "🥔 악마가 아니었습니다."}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Chat panel */}
              <div
                className={`flex min-h-0 flex-col bg-[#201a16] ${
                  isLandscapeMobile
                    ? "border-l border-white/10"
                    : "border-t border-white/10 lg:border-l lg:border-t-0"
                }`}
              >
                <div className={`${isLandscapeMobile ? "px-3 py-2" : "px-4 py-3"} flex shrink-0 items-center justify-between border-b border-white/10`}>
                  <div>
                    <div className="text-[10px] font-black text-white">💬 회의 채팅</div>
                    {!isLandscapeMobile && (
                      <div className="mt-0.5 text-[8px] font-semibold text-white/35">생존 참가자끼리 실시간 대화</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[7px] font-bold text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> LIVE
                  </div>
                </div>

                <div
                  ref={meetingChatScrollRef}
                  className={`${isLandscapeMobile ? "p-2" : "p-3"} min-h-0 flex-1 overflow-y-auto overscroll-contain`}
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  {meetingMessages.length === 0 ? (
                    <div className="flex h-full items-center justify-center px-4 text-center text-[9px] font-semibold leading-4 text-white/30">
                      아직 메시지가 없습니다.<br />발견 위치나 이동 경로를 이야기해보세요.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {meetingMessages.map((message) => {
                        const mine = message.playerId === myPlayerId;
                        return (
                          <div key={message.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                            <div
                              className={`
                                max-w-[86%] rounded-2xl px-3 py-2 shadow-sm
                                ${mine ? "rounded-br-[5px] bg-violet-600 text-white" : "rounded-bl-[5px] bg-white/10 text-white"}
                              `}
                            >
                              <div className="mb-0.5 text-[7px] font-black opacity-45">{getDisplayName(message.nickname)}</div>
                              <div className="break-words text-[10px] font-semibold leading-4">{message.message}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {meeting.phase !== "result" && (
                  <div
                    className={`${isLandscapeMobile ? "p-2" : "p-3"} shrink-0 border-t border-white/10 bg-black/20`}
                    style={{
                      paddingBottom: isMobile
                        ? "max(12px, env(safe-area-inset-bottom))"
                        : undefined,
                    }}
                  >
                    {playerState === "alive" ? (
                      <form
                        data-no-move
                        onSubmit={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          sendMeetingMessage();
                        }}
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={(event) => event.stopPropagation()}
                        className="flex items-center gap-2"
                      >
                        <input
                          value={meetingInput}
                          onChange={(event) => setMeetingInput(event.target.value)}
                          onKeyDown={(event) => event.stopPropagation()}
                          onKeyUp={(event) => event.stopPropagation()}
                          onPointerDown={(event) => event.stopPropagation()}
                          onClick={(event) => event.stopPropagation()}
                          onFocus={() => {
                            if (isMobile) {
                              window.setTimeout(() => {
                                window.scrollTo(0, 0);
                              }, 50);
                            }
                          }}
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="sentences"
                          enterKeyHint="send"
                          placeholder="메시지를 입력하세요..."
                          maxLength={160}
                          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white px-3 py-2.5 font-semibold text-zinc-900 outline-none focus:border-violet-400"
                          style={{ fontSize: isMobile ? 16 : 12 }}
                        />
                        <button
                          type="submit"
                          disabled={!meetingInput.trim()}
                          className="flex h-[42px] w-[44px] shrink-0 items-center justify-center rounded-xl bg-violet-600 text-[18px] font-black text-white shadow-lg transition active:scale-95 disabled:opacity-35"
                          aria-label="메시지 전송"
                        >
                          ➤
                        </button>
                      </form>
                    ) : (
                      <div className="py-2 text-center text-[9px] font-semibold text-white/35">
                        👻 유령은 회의를 볼 수 있지만 채팅과 투표에는 참여할 수 없습니다.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          Leave Confirm
      ================================================= */}

      {leaveConfirmOpen &&
        !gameResult && (
          <div
            data-no-move
            className="
              fixed
              inset-0
              z-[60000]
              flex
              items-center
              justify-center
              bg-black/70
              p-4
              backdrop-blur-sm
            "
          >
            <div
              className="
                w-full
                max-w-[360px]
                rounded-3xl
                border
                border-white/10
                bg-zinc-950
                p-6
                text-center
                text-white
                shadow-2xl
              "
            >
              <div className="text-4xl">🚪</div>

              <div className="mt-4 text-lg font-black">
                게임에서 나가시겠습니까?
              </div>

              <div className="mt-2 text-[10px] leading-5 text-white/45">
                퇴장하면 현재 게임으로 다시 돌아올 수 없습니다.
                <br />
                남은 인원이 3명 미만이 되면 게임이 즉시 종료됩니다.
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  disabled={
                    leavingGame
                  }
                  onClick={() => {
                    setLeaveConfirmOpen(
                      false
                    );
                  }}
                  className="
                    flex-1
                    rounded-xl
                    border
                    border-white/10
                    bg-white/5
                    px-4
                    py-3
                    text-[10px]
                    font-black
                    text-white/65
                    disabled:opacity-40
                  "
                >
                  취소
                </button>

                <button
                  type="button"
                  disabled={
                    leavingGame
                  }
                  onClick={
                    handleLeaveGame
                  }
                  className="
                    flex-1
                    rounded-xl
                    bg-red-500
                    px-4
                    py-3
                    text-[10px]
                    font-black
                    text-white
                    disabled:opacity-40
                  "
                >
                  {leavingGame
                    ? "퇴장 중..."
                    : "퇴장하기"}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* =================================================
          Victory Celebration

          서버가 winners에 내려준 characterStyle을 그대로 사용한다.
          즉, 각 유저가 직접 커스텀한 색상 / 안경 / 모자 / 리본 / 넥타이가
          승리 화면에도 동일하게 표시된다.
      ================================================= */}

      {/* =================================================
    Game Result / Victory Screen

    PC
    - 기존처럼 넉넉한 승리 화면

    Mobile Landscape
    - 제목 크기 축소
    - 캐릭터 영역 압축
    - 닉네임을 캐릭터 아래로 이동
    - 사무실 돌아가기 버튼 항상 노출
================================================= */}

{gameResult && (
  <div
    data-no-move
    className={`
      fixed
      inset-0
      z-[70000]
      overflow-hidden
      text-white
      backdrop-blur-md

      ${
        gameResult.winningTeam ===
        "devil"
          ? `
            bg-[radial-gradient(
              circle_at_center,
              rgba(127,29,29,0.72),
              rgba(9,9,11,0.97)_68%
            )]
          `
          : `
            bg-[radial-gradient(
              circle_at_center,
              rgba(5,150,105,0.45),
              rgba(9,9,11,0.96)_72%
            )]
          `
      }
    `}
  >
    {/* ===============================================
        Background Decoration
    =============================================== */}

    <div
      className="
        pointer-events-none
        absolute
        inset-0
        overflow-hidden
      "
    >
      {Array.from({
        length:
          isLandscapeMobile
            ? 14
            : 24,
      }).map(
        (
          _,
          index
        ) => (
          <span
            key={
              index
            }
            className="
              absolute
              animate-pulse
              opacity-60
            "
            style={{
              left: `${
                (
                  index *
                  37
                ) %
                100
              }%`,

              top: `${
                (
                  index *
                  53
                ) %
                92
              }%`,

              fontSize:
                isLandscapeMobile
                  ? 14
                  : 18,

              animationDelay: `${
                (
                  index %
                  7
                ) *
                120
              }ms`,

              animationDuration: `${
                900 +
                (
                  index %
                  5
                ) *
                  180
              }ms`,
            }}
          >
            {gameResult.winningTeam ===
            "devil"
              ? index %
                  3 ===
                0
                ? "🔥"
                : "✦"
              : index %
                    3 ===
                  0
                ? "🎊"
                : "✨"}
          </span>
        )
      )}
    </div>

    {/* ===============================================
        Main Result Layout
    =============================================== */}

    <div
      className={`
        relative
        z-10
        mx-auto
        flex
        h-full
        w-full
        max-w-[1000px]
        flex-col
        items-center
        text-center

        ${
          isLandscapeMobile
            ? `
              justify-between
              px-16
              pb-[max(14px,env(safe-area-inset-bottom))]
              pt-[max(10px,env(safe-area-inset-top))]
            `
            : `
              justify-center
              p-6
            `
        }
      `}
    >
      {/* ===============================================
          Header
      =============================================== */}

      <div
        className={`
          flex
          shrink-0
          flex-col
          items-center

          ${
            isLandscapeMobile
              ? "gap-1"
              : "gap-3"
          }
        `}
      >
        {!isLandscapeMobile && (
          <div
            className={`
              rounded-full
              border
              px-4
              py-2
              text-[9px]
              font-black
              tracking-[0.32em]

              ${
                gameResult.winningTeam ===
                "devil"
                  ? `
                    border-red-300/20
                    bg-red-500/10
                    text-red-200
                  `
                  : `
                    border-emerald-300/20
                    bg-emerald-500/10
                    text-emerald-100
                  `
              }
            `}
          >
            POTATO WAR · VICTORY
          </div>
        )}

        <div
          className={`
            font-black
            leading-none
            tracking-[-0.05em]
            drop-shadow-[0_8px_25px_rgba(0,0,0,0.55)]

            ${
              isLandscapeMobile
                ? `
                  text-[clamp(26px,5.2vh,46px)]
                `
                : `
                  mt-2
                  text-[clamp(30px,7vw,64px)]
                `
            }

            ${
              gameResult.winningTeam ===
              "devil"
                ? "text-red-300"
                : "text-emerald-200"
            }
          `}
        >
          {gameResult.winningTeam ===
          "devil"
            ? "😈 악마팀 승리!"
            : "🎉 생존자팀 승리!"}
        </div>

        <div
          className={`
            max-w-[620px]
            font-semibold
            text-white/55

            ${
              isLandscapeMobile
                ? `
                  mt-1
                  text-[10px]
                  leading-4
                `
                : `
                  mt-2
                  text-[11px]
                  leading-5
                `
            }
          `}
        >
          {gameResult.reason}
        </div>
      </div>

      {/* ===============================================
          Winners
      =============================================== */}

      <div
        className={`
          flex
          w-full
          flex-1
          flex-wrap
          items-center
          justify-center

          ${
            isLandscapeMobile
              ? `
                min-h-0
                gap-x-5
                gap-y-2
                py-1
              `
              : `
                min-h-[210px]
                gap-x-5
                gap-y-8
                py-4
              `
          }
        `}
      >
        {gameResult.winners.length >
        0 ? (
          gameResult.winners.map(
            (
              winner,
              index
            ) => {
              const winnerStyle =
                winner.characterStyle;

              return (
                <div
                  key={
                    winner.id
                  }
                  className={`
                    relative
                    flex
                    flex-col
                    items-center

                    ${
                      isLandscapeMobile
                        ? `
                          min-w-[82px]
                        `
                        : `
                          min-w-[120px]
                        `
                    }
                  `}
                  style={{
                    animation:
                      isLandscapeMobile
                        ? `potatoVictoryMobile 850ms ease-in-out ${
                            index *
                            90
                          }ms infinite alternate`
                        : `potatoVictoryBounce 900ms ease-in-out ${
                            index *
                            110
                          }ms infinite alternate`,
                  }}
                >
                  {/* =====================================
                      Potato

                      이름보다 먼저 렌더링하고
                      이름은 아래쪽으로 내려 겹침 제거
                  ===================================== */}

                  <div
                    className="
                      relative
                      z-10
                      origin-bottom
                    "
                    style={{
                      transform:
                        isLandscapeMobile
                          ? index %
                              2 ===
                            0
                            ? `
                              rotate(-2deg)
                              scale(0.82)
                            `
                            : `
                              rotate(2deg)
                              scale(0.82)
                            `
                          : index %
                                2 ===
                              0
                            ? `
                              rotate(-3deg)
                              scale(1.2)
                            `
                            : `
                              rotate(3deg)
                              scale(1.2)
                            `,
                    }}
                  >
                    <Potato
                      name=""
                      glasses={
                        winnerStyle?.glasses ??
                        "none"
                      }
                      hat={
                        winnerStyle?.hat ??
                        "none"
                      }
                      ribbon={
                        winnerStyle?.ribbon ??
                        false
                      }
                      tie={
                        winnerStyle?.tie ??
                        false
                      }
                      color={
                        winnerStyle?.color ??
                        "default"
                      }
                      hair={
                        winnerStyle?.hair ??
                        "none"
                      }
                      hairColor={
                        winnerStyle?.hairColor ??
                        "brown"
                      }
                      eyes={
                        winnerStyle?.eyes ??
                        "dot"
                      }
                      mouth={
                        winnerStyle?.mouth ??
                        "default"
                      }
                      blush={
                        winnerStyle?.blush ??
                        true
                      }
                      freckles={
                        winnerStyle?.freckles ??
                        false
                      }
                      moving={
                        true
                      }
                      ghost={
                        false
                      }
                      attacking={
                        false
                      }
                      evil={
                        gameResult.winningTeam ===
                        "devil"
                      }
                      hit={
                        false
                      }
                    />
                  </div>

                  {/* =====================================
                      Winner Name

                      기존 캐릭터 위 → 캐릭터 아래
                  ===================================== */}

                  <div
                    className={`
                      relative
                      z-20
                      rounded-full
                      border
                      font-black
                      shadow-lg
                      backdrop-blur-sm

                      ${
                        isLandscapeMobile
                          ? `
                            -mt-1
                            px-2.5
                            py-1
                            text-[8px]
                          `
                          : `
                            mt-3
                            px-3
                            py-1
                            text-[9px]
                          `
                      }

                      ${
                        gameResult.winningTeam ===
                        "devil"
                          ? `
                            border-red-300/20
                            bg-red-950/80
                            text-red-100
                          `
                          : `
                            border-emerald-300/20
                            bg-emerald-950/80
                            text-emerald-100
                          `
                      }
                    `}
                  >
                    {getDisplayName(
                      winner.nickname
                    )}
                  </div>
                </div>
              );
            }
          )
        ) : (
          <div
            className="
              text-sm
              font-black
              text-white/70
            "
          >
            승리! 🎉
          </div>
        )}
      </div>

      {/* ===============================================
          Bottom
      =============================================== */}

      <div
        className={`
          flex
          shrink-0
          flex-col
          items-center

          ${
            isLandscapeMobile
              ? "gap-2"
              : "gap-4"
          }
        `}
      >
        <div
          className={`
            font-semibold
            text-white/50

            ${
              isLandscapeMobile
                ? "text-[9px]"
                : "text-[10px]"
            }
          `}
        >
          {gameResult.winningTeam ===
          "devil"
            ? "악마 감자들이 사무실을 장악했습니다."
            : "생존 감자들이 악마의 위협에서 살아남았습니다."}
        </div>

        <button
          type="button"
          onClick={() => {
            const socket =
              socketRef.current;

            if (
              !socket ||
              !socket.connected
            ) {
              onReturnToOffice();
              return;
            }

            socket.emit(
              "devilGame:return-office",
              {
                roomId,

                playerId:
                  myPlayerIdRef
                    .current,
              },
              () => {
                onReturnToOffice();
              }
            );
          }}
          className={`
            rounded-2xl
            font-black
            shadow-xl
            transition
            hover:-translate-y-0.5

            ${
              isLandscapeMobile
                ? `
                  min-w-[190px]
                  px-5
                  py-2.5
                  text-[10px]
                `
                : `
                  min-w-[240px]
                  px-6
                  py-4
                  text-[11px]
                `
            }

            ${
              gameResult.winningTeam ===
              "devil"
                ? `
                  bg-red-100
                  text-red-950
                  hover:bg-red-50
                `
                : `
                  bg-emerald-100
                  text-emerald-950
                  hover:bg-emerald-50
                `
            }
          `}
        >
          🏢 사무실로 돌아가기
        </button>
      </div>
    </div>

    <style>{`
      @keyframes potatoVictoryBounce {
        0% {
          transform:
            translateY(0)
            rotate(-1deg);
        }

        45% {
          transform:
            translateY(-12px)
            rotate(1deg);
        }

        100% {
          transform:
            translateY(-22px)
            rotate(-1deg);
        }
      }

      @keyframes potatoVictoryMobile {
        0% {
          transform:
            translateY(0);
        }

        100% {
          transform:
            translateY(-7px);
        }
      }
    `}</style>
  </div>
)}

      {/* =================================================
          Mission Modal
      ================================================= */}

      <MissionModal
        mission={
          activeMission
        }
        onClose={() => {
          setActiveMission(
            null
          );
        }}
        onComplete={
          completeMission
        }
      />
    </div>
  );
}

/* =========================================================
   Action Button
========================================================= */

function ActionButton({
  label,
  icon,
  shortcut,
  onClick,
  disabled = false,
  active = false,
  variant = "default",
  compact = false,
}: {
  label: string;
  icon: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  variant?:
  | "default"
  | "danger"
  | "dark";
  compact?: boolean;
}) {
  const variantClass =
    variant === "danger"
      ? active
        ? "border-red-300 bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.35)]"
        : "border-red-900/50 bg-red-950/80 text-red-200"
      : variant === "dark"
        ? active
          ? "border-violet-300 bg-violet-700 text-white shadow-[0_0_20px_rgba(124,58,237,0.35)]"
          : "border-violet-900/50 bg-zinc-950/90 text-violet-200"
        : active
          ? "border-amber-200 bg-amber-400 text-zinc-950 shadow-[0_0_18px_rgba(251,191,36,0.3)]"
          : "border-white/15 bg-black/85 text-white";

  return (
    <button
      type="button"
      data-no-move
      disabled={
        disabled
      }
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={`
        flex
        items-center
        justify-between
        border
        font-black
        shadow-xl
        backdrop-blur-sm
        transition
        active:scale-95

        ${
          compact
            ? "min-h-[46px] min-w-[88px] gap-1.5 rounded-xl px-2 py-1.5 text-[9px]"
            : "min-w-[112px] gap-2 rounded-2xl px-3 py-2.5 text-[10px] max-[700px]:min-w-[94px] max-[700px]:rounded-xl max-[700px]:px-2.5 max-[700px]:py-2 max-[700px]:text-[9px]"
        }

        disabled:cursor-not-allowed
        disabled:opacity-35

        ${variantClass}
      `}
    >
      <span
        className="
          flex
          items-center
          gap-1.5
        "
      >
        <span
          className={
            compact
              ? "text-[13px]"
              : "text-[14px] max-[700px]:text-[12px]"
          }
        >
          {icon}
        </span>

        <span
          className="
            max-w-[82px]
            truncate
          "
        >
          {label}
        </span>
      </span>

      {shortcut && !compact && (
        <span
          className="
            rounded-md
            border
            border-current/20
            bg-white/10
            px-1.5
            py-0.5
            text-[7px]
            opacity-60

            max-[700px]:hidden
          "
        >
          {shortcut}
        </span>
      )}
    </button>
  );
}

/* =========================================================
   Corpse
========================================================= */

function CorpseView({
  corpse,
}: {
  corpse:
  Corpse;
}) {
  const corpseStyle =
    corpse.characterStyle;

  return (
    <div
      className="
        pointer-events-none
        absolute
        z-[2500]
        flex
        -translate-x-1/2
        -translate-y-1/2
        flex-col
        items-center
      "
      style={{
        left:
          corpse.x,

        top:
          corpse.y,
      }}
    >
      {/*
       * 예전처럼 🥔 이모지 하나로 바꾸지 않고,
       * 죽기 직전의 실제 캐릭터 외형을 그대로 눕혀서 보여준다.
       */}
      <div
        className="
          relative
          h-[78px]
          w-[92px]
        "
      >
        <div
          className="
            absolute
            left-1/2
            top-1/2
            origin-center
          "
          style={{
            transform:
              "translate(-50%, -50%) rotate(88deg) scale(0.92)",

            filter:
              "grayscale(0.15) brightness(0.82)",

            opacity:
              0.94,
          }}
        >
          <Potato
            name=""
            glasses={
              corpseStyle
                ?.glasses ??
              "none"
            }
            hat={
              corpseStyle
                ?.hat ??
              "none"
            }
            ribbon={
              corpseStyle
                ?.ribbon ??
              false
            }
            tie={
              corpseStyle
                ?.tie ??
              false
            }
            color={
              corpseStyle
                ?.color ??
              "default"
            }
            hair={corpseStyle?.hair ?? "none"}
            hairColor={corpseStyle?.hairColor ?? "brown"}
            eyes={corpseStyle?.eyes ?? "dot"}
            mouth={corpseStyle?.mouth ?? "default"}
            blush={corpseStyle?.blush ?? true}
            freckles={corpseStyle?.freckles ?? false}
            moving={false}
            ghost={false}
            attacking={false}
            evil={false}
            hit={false}
          />
        </div>

        {/* 사망 표시 */}
        <div
          className="
            absolute
            -right-1
            -top-1
            flex
            h-7
            w-7
            items-center
            justify-center
            rounded-full
            border
            border-white/15
            bg-black/80
            text-[15px]
            shadow-lg
          "
        >
          💀
        </div>
      </div>

      <div
        className="
          -mt-1
          rounded-full
          border
          border-white/10
          bg-black/75
          px-2.5
          py-1
          text-[8px]
          font-bold
          text-white/75
          shadow-lg
          backdrop-blur-sm
        "
      >
        {getDisplayName(
          corpse.nickname
        )}
      </div>
    </div>
  );
}

/* =========================================================
   Control
========================================================= */

function Control({
  children,
}: {
  children:
  React.ReactNode;
}) {
  return (
    <div
      className="
        rounded-lg
        border
        border-white/5
        bg-black/75
        px-3
        py-2
        text-[10px]
        text-white
      "
    >
      {children}
    </div>
  );
}