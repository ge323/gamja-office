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

import Potato from "@/components/character/Potato";

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

  x: number;
  y: number;

  createdAt: number;
};

type GameStatePayload = {
  roomId: string;

  players:
    GamePlayer[];

  corpses:
    Corpse[];
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
  nickname: string
) {
  const cleaned =
    nickname.replace(
      /\s*감자\s*$/g,
      ""
    );

  return `${cleaned} 감자`;
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

  /* ======================================================
     Mission Progress
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

          return players
            .filter(
              (player) =>
                player.id !==
                selfId
            )
            .map(
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
      syncRemotePlayers(
        state.players,
        selfId,
        snap
      );

      setCorpses(
        state.corpses ?? []
      );
    };

    socket.on(
      "connect",
      () => {
        socket.emit(
          "devilGame:join",

          {
            roomId,
            playerId,
          },

          (response: {
            ok: boolean;

            message?: string;

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
              setCombatMessage(
                response.message ??
                  "게임에 다시 연결하지 못했습니다."
              );

              return;
            }

            myPlayerIdRef.current =
              response.self.id;

            setMyPlayerId(
              response.self.id
            );

            setSelfPlayer(
              response.self
            );

            setPlayerState(
              response.self.state
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

            setPosition(
              nextPosition
            );

            if (
              response.state
            ) {
              applyGameState(
                response.state,
                response.self.id,
                true
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

        setCorpses(
          state.corpses ?? []
        );

        /*
         * 서버 상태에서 내 캐릭터와 다른 캐릭터를 명확히 분리한다.
         * 참가자 전원이 같은 캐릭터처럼 보이는 문제를 방지한다.
         */
        if (selfId) {
          const nextSelf =
            state.players.find(
              (player) =>
                player.id ===
                selfId
            );

          if (nextSelf) {
            setSelfPlayer(
              (previous) => ({
                ...previous,
                ...nextSelf,
                missionIds:
                  previous?.missionIds,
                completedMissionIds:
                  previous?.completedMissionIds,
              })
            );

            setPlayerState(
              nextSelf.state
            );
          }
        }

        syncRemotePlayers(
          state.players,
          selfId
        );
      }
    );

    socket.on(
      "devilGame:player-moved",
      (data: {
        id: string;

        x: number;
        y: number;

        moving?: boolean;
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

                  lastUpdateAt:
                    performance.now(),
                };
              }
            )
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

      setGameResult(
        result
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
    myPlayerIdRef.current =
      playerId;

    setMyPlayerId(
      playerId
    );
  }, [
    playerId,
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
      deathOverlay
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
        !nearbyMission
      ) {
        return;
      }

      stopMovement();

      setActiveMission(
        nearbyMission
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
        cooldownRemaining > 0
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
        activeMission
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
        activeMission
      ) {
        return;
      }

      setBlackout(
        (previous) =>
          !previous
      );
    };

  const canUseMission =
    Boolean(
      nearbyMission
    ) &&
    !activeMission &&
    !mapOpen &&
    !deathOverlay;

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
    !deathOverlay;

  const canBlackout =
    role === "devil" &&
    playerState ===
      "alive" &&
    !activeMission &&
    !deathOverlay;

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
        deathOverlay
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
  ]);

  /* ======================================================
     Camera
  ====================================================== */

  const cameraX =
    clamp(
      position.x -
        VIEWPORT_WIDTH / 2,

      0,

      DEVIL_MAP_WIDTH -
        VIEWPORT_WIDTH
    );

  const cameraY =
    clamp(
      position.y -
        VIEWPORT_HEIGHT / 2,

      0,

      DEVIL_MAP_HEIGHT -
        VIEWPORT_HEIGHT
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
      deathOverlay
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

  /* ======================================================
     Render
  ====================================================== */

  return (
    <div
      className="
        flex
        min-h-screen
        items-center
        justify-center
        bg-zinc-950
        p-4
      "
    >
      <div
        ref={
          viewportRef
        }
        onClick={
          handleWorldClick
        }
        className="
          relative
          cursor-pointer
          overflow-hidden
          rounded-xl
          border-[6px]
          border-zinc-800
          bg-black
          shadow-2xl
        "
        style={{
          width:
            VIEWPORT_WIDTH,

          height:
            VIEWPORT_HEIGHT,
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
                  color={
                    player
                      .characterStyle
                      ?.color ??
                    "default"
                  }
                  moving={
                    Boolean(
                      player.moving
                    )
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
            color={
              selfPlayer
                ?.characterStyle
                ?.color ??
              characterStyle
                ?.color ??
              "default"
            }
            moving={
              moving
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
          playerState !==
            "ghost" && (
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
          className="
            absolute
            left-4
            top-4
            z-[8000]
            w-[190px]
            rounded-xl
            border
            border-white/10
            bg-black/80
            px-4
            py-3
            text-white
            shadow-lg
            backdrop-blur-sm
          "
        >
          <div
            className={`
              text-[12px]
              font-black

              ${
                playerState ===
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

          <div className="mt-1 text-[8px] text-white/45">
            같은 게임 참가자 {otherPlayers.length + 1}명
          </div>

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

          <div className="mt-3">
            <div
              className="
                flex
                items-center
                justify-between
                text-[9px]
              "
            >
              <span
                className="
                  font-semibold
                  text-white/55
                "
              >
                업무 진행도
              </span>

              <span
                className="
                  font-black
                  text-emerald-300
                "
              >
                {
                  missionProgress
                }
                %
              </span>
            </div>

            <div
              className="
                mt-2
                h-[8px]
                overflow-hidden
                rounded-full
                bg-white/10
              "
            >
              <div
                className="
                  h-full
                  rounded-full
                  bg-emerald-400
                  transition-all
                  duration-500
                "
                style={{
                  width:
                    `${missionProgress}%`,
                }}
              />
            </div>

            <div
              className="
                mt-2
                flex
                justify-between
                text-[9px]
              "
            >
              <span className="text-white/40">
                완료
              </span>

              <span className="text-amber-300">
                {
                  completedMissionCount
                }
                {" / "}
                {
                  totalMissionCount
                }
              </span>
            </div>

            <div
              className="
                mt-1
                text-[9px]
                text-white/35
              "
            >
              남은 미션{" "}
              {
                remainingMissionCount
              }
              개
            </div>
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

                  ${
                    cooldownRemaining >
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
            Kill interaction
        ================================================= */}

        {role === "devil" &&
          playerState ===
            "alive" &&
          nearbyKillTarget &&
          !activeMission &&
          !mapOpen && (
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
          !deathOverlay && (
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

        {!deathOverlay && (
          <div
            data-no-move
            className="
              absolute
              bottom-4
              right-4
              z-[9000]
              flex
              flex-col
              items-end
              gap-2

              max-[700px]:bottom-3
              max-[700px]:right-3
              max-[700px]:gap-1.5
            "
          >
            {/* 지도 */}

            <ActionButton
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
                    label={
                      cooldownRemaining >
                      0
                        ? `처치 ${
                            Math.ceil(
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
            📍 중앙 사무실 회의 테이블 : 긴급회의 장소
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
            피해자 화면
        ================================================= */}

        {deathOverlay && (
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
          Game Result
      ================================================= */}

      {gameResult && (
        <div
          data-no-move
          className="
            fixed
            inset-0
            z-[70000]
            flex
            items-center
            justify-center
            bg-black/80
            p-4
            backdrop-blur-md
          "
        >
          <div
            className="
              w-full
              max-w-[520px]
              overflow-hidden
              rounded-[30px]
              border
              border-white/10
              bg-zinc-950
              text-center
              text-white
              shadow-[0_30px_100px_rgba(0,0,0,0.7)]
            "
          >
            <div
              className={
                gameResult.winningTeam ===
                "devil"
                  ? "bg-red-500/10 px-6 py-8"
                  : "bg-emerald-500/10 px-6 py-8"
              }
            >
              <div className="text-5xl">
                {gameResult.winningTeam ===
                "devil"
                  ? "😈"
                  : "🎉"}
              </div>

              <div className="mt-4 text-[9px] font-black tracking-[0.28em] text-white/35">
                GAME OVER
              </div>

              <div
                className={
                  gameResult.winningTeam ===
                  "devil"
                    ? "mt-3 text-sm font-black text-red-300"
                    : "mt-3 text-sm font-black text-emerald-300"
                }
              >
                {gameResult.winningTeam ===
                "devil"
                  ? "- 악마팀 -"
                  : "- 생존팀 -"}
              </div>

              <div className="mt-5 text-2xl font-black leading-tight">
                {gameResult.winners.length >
                0
                  ? `${gameResult.winners
                      .map((winner) =>
                        getDisplayName(
                          winner.nickname
                        )
                      )
                      .join(" · ")} 승리!`
                  : "승리!"}
              </div>

              <div className="mt-3 text-[10px] leading-5 text-white/45">
                {gameResult.reason}
              </div>
            </div>

            <div className="p-6">
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
                    "devilGame:returnOffice",
                    {
                      roomId,
                      playerId:
                        myPlayerIdRef.current,
                    },
                    () => {
                      onReturnToOffice();
                    }
                  );
                }}
                className="
                  w-full
                  rounded-2xl
                  bg-white
                  px-5
                  py-4
                  text-[11px]
                  font-black
                  text-zinc-950
                  transition
                  hover:bg-amber-100
                "
              >
                🏢 사무실로 돌아가기
              </button>
            </div>
          </div>
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
        min-w-[112px]
        items-center
        justify-between
        gap-2
        rounded-2xl
        border
        px-3
        py-2.5
        text-[10px]
        font-black
        shadow-xl
        backdrop-blur-sm
        transition
        active:scale-95

        max-[700px]:min-w-[94px]
        max-[700px]:rounded-xl
        max-[700px]:px-2.5
        max-[700px]:py-2
        max-[700px]:text-[9px]

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
          className="
            text-[14px]
            max-[700px]:text-[12px]
          "
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

      {shortcut && (
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
      <div
        className="
          rotate-90
          text-[32px]
          drop-shadow-lg
        "
      >
        🥔
      </div>

      <div
        className="
          -mt-2
          rounded-full
          bg-black/70
          px-2
          py-1
          text-[8px]
          font-bold
          text-white/70
        "
      >
        💀{" "}
        {
          getDisplayName(
            corpse.nickname
          )
        }
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