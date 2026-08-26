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

type DevilGameWorldProps = {
  role:
    | "devil"
    | "survivor";

  /*
   * page.tsx에서 반드시 넘겨주기.
   */
  roomId?: string;
  nickname?: string;

  characterStyle?:
    CharacterStyle;
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

  roomId = "",
  nickname = "테스트",

  characterStyle,
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

  /* ======================================================
     Game identity
  ====================================================== */

  const [
    myPlayerId,
    setMyPlayerId,
  ] =
    useState("");

  const [
    playerState,
    setPlayerState,
  ] =
    useState<PlayerState>(
      "alive"
    );

  const [
    otherPlayers,
    setOtherPlayers,
  ] =
    useState<
      GamePlayer[]
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
    useState<Mission[]>(
      () =>
        INITIAL_MISSIONS.map(
          (mission) => ({
            ...mission,
          })
        )
    );

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
      !nickname
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

    const applyGameState = (
      state:
        GameStatePayload,
      selfId:
        string
    ) => {
      setOtherPlayers(
        state.players.filter(
          (player) =>
            player.id !==
            selfId
        )
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
            nickname,
          },

          (response: {
            ok: boolean;

            message?: string;

            self?: GamePlayer & {
              role:
                "devil" |
                "survivor";
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

            setMyPlayerId(
              response.self.id
            );

            setPlayerState(
              response.self.state
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
                response.self.id
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
        setCorpses(
          state.corpses ?? []
        );

        setOtherPlayers(
          state.players.filter(
            (player) =>
              player.id !==
              myPlayerId
          )
        );
      }
    );

    socket.on(
      "devilGame:player-moved",
      (data: {
        id: string;

        x: number;
        y: number;
      }) => {
        setOtherPlayers(
          (previous) =>
            previous.map(
              (player) =>
                player.id ===
                data.id
                  ? {
                      ...player,

                      x:
                        data.x,

                      y:
                        data.y,
                    }
                  : player
            )
        );
      }
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
          myPlayerId
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
          myPlayerId
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
    nickname,
    myPlayerId,
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
    () => {
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
        finalPosition
      );

      stopMovement();

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
        nextPosition
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

    setActiveMission(
      null
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

  const resetMissions =
    () => {
      setMissions(
        INITIAL_MISSIONS.map(
          (mission) => ({
            ...mission,
            completed:
              false,
          })
        )
      );

      setActiveMission(
        null
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

        if (
          nearbyMission
        ) {
          startMission();
        }

        return;
      }

      /* M = 지도 */

      if (
        event.code ===
        "KeyM"
      ) {
        event.preventDefault();

        setMapOpen(
          (previous) =>
            !previous
        );

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
        setBlackout(
          (previous) =>
            !previous
        );

        return;
      }

      if (
        event.code ===
        "KeyR"
      ) {
        resetMissions();
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
              player.x -
              cameraX;

            const screenY =
              player.y -
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
                  transition-[left,top]
                  duration-75
                  ease-linear
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
                      player.y
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
                nickname
              )
            }
            glasses={
              characterStyle
                ?.glasses ??
              "none"
            }
            hat={
              characterStyle
                ?.hat ??
              "none"
            }
            ribbon={
              characterStyle
                ?.ribbon ??
              false
            }
            tie={
              characterStyle
                ?.tie ??
              false
            }
            color={
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
            Controls
        ================================================= */}

        <div
          data-no-move
          className="
            absolute
            bottom-3
            left-1/2
            z-[8000]
            flex
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

          <Control>R : 미션 초기화</Control>

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