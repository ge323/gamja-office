"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import Potato from "@/components/character/Potato";

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

type DevilGameWorldProps = {
  role:
    | "devil"
    | "survivor";
};

/* =========================================================
   Viewport
========================================================= */

const VIEWPORT_WIDTH =
  1100;

const VIEWPORT_HEIGHT =
  650;

/* =========================================================
   Player
========================================================= */

const PLAYER_SPEED =
  260;

const ARRIVAL_DISTANCE =
  2;

const COLLISION_STEP =
  4;

/*
 * 미션 오브젝트와 상호작용 가능한 거리
 */
const INTERACTION_DISTANCE =
  115;

/* =========================================================
   Rect Check
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

/* =========================================================
   Walkable
========================================================= */

function isWalkable(
  x: number,
  y: number
) {
  const areas = [
    ...WALKABLE_AREAS,
    ...DOOR_AREAS,
  ];

  return areas.some(
    area =>
      isInsideRect(
        x,
        y,
        area
      )
  );
}

/* =========================================================
   Path Walkable
========================================================= */

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

/* =========================================================
   Clamp
========================================================= */

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

/* =========================================================
   Distance
========================================================= */

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

/* =========================================================
   DevilGameWorld
========================================================= */

export default function DevilGameWorld({
  role,
}: DevilGameWorldProps) {
  /* ======================================================
     Refs
  ====================================================== */

  const viewportRef =
    useRef<HTMLDivElement | null>(
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

  /* ======================================================
     Moving
  ====================================================== */

  const [
    moving,
    setMoving,
  ] =
    useState(false);

  /* ======================================================
     Map
  ====================================================== */

  const [
    mapOpen,
    setMapOpen,
  ] =
    useState(false);

  /* ======================================================
     Blackout
  ====================================================== */

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
          mission => ({
            ...mission,
          })
        )
    );

  /*
   * 현재 실행 중인 미션
   */
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
      mission =>
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
     Nearby Mission
  ====================================================== */

  const nearbyMission =
    missions.find(
      mission => {
        if (
          mission.completed
        ) {
          return false;
        }

        const distance =
          getDistance(
            position,
            {
              x:
                mission.x,

              y:
                mission.y,
            }
          );

        return (
          distance <=
          INTERACTION_DISTANCE
        );
      }
    ) ?? null;

  /* ======================================================
     Map Mission Conversion
  ====================================================== */

  const mapMissions:
    MissionMarker[] =
    missions.map(
      mission => ({
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
     Stop Movement
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
     Movement Animation
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

    /* =====================================
       첫 프레임
    ===================================== */

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

    /* =====================================
       Delta Time
    ===================================== */

    const deltaTime =
      Math.min(
        40,
        timestamp -
          lastFrameTimeRef.current
      ) /
      1000;

    lastFrameTimeRef.current =
      timestamp;

    /* =====================================
       Distance
    ===================================== */

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

    /* =====================================
       도착
    ===================================== */

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

      stopMovement();

      return;
    }

    /* =====================================
       이번 프레임 이동거리
    ===================================== */

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

    /* =====================================
       충돌
    ===================================== */

    if (
      !isWalkable(
        nextX,
        nextY
      )
    ) {
      stopMovement();

      return;
    }

    /* =====================================
       좌표 반영
    ===================================== */

    const nextPosition = {
      x:
        nextX,

      y:
        nextY,
    };

    positionRef.current =
      nextPosition;

    setPosition(
      nextPosition
    );

    /* =====================================
       다음 프레임
    ===================================== */

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
      mapOpen
    ) {
      return;
    }

    const current =
      positionRef.current;

    /* 목적지 확인 */

    if (
      !isWalkable(
        targetX,
        targetY
      )
    ) {
      return;
    }

    /* 직선 경로 확인 */

    if (
      !isPathWalkable(
        current.x,
        current.y,
        targetX,
        targetY
      )
    ) {
      return;
    }

    const dx =
      targetX -
      current.x;

    const dy =
      targetY -
      current.y;

    const distance =
      Math.sqrt(
        dx * dx +
          dy * dy
      );

    if (
      distance <
      ARRIVAL_DISTANCE
    ) {
      return;
    }

    /* 이전 애니메이션 취소 */

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

    targetPositionRef.current = {
      x:
        targetX,

      y:
        targetY,
    };

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
     Mission Complete
  ====================================================== */

  const completeMission = (
    missionId: string
  ) => {
    setMissions(
      previous =>
        previous.map(
          mission =>
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

  /* ======================================================
     Mission Start
  ====================================================== */

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
     Reset Missions
  ====================================================== */

  const resetMissions =
    () => {
      setMissions(
        INITIAL_MISSIONS.map(
          mission => ({
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
     Keyboard
  ====================================================== */

  useEffect(() => {
    const handleKeyDown = (
      event:
        KeyboardEvent
    ) => {
      const target =
        event.target as HTMLElement;

      /*
       * 미션 내부 입력 필드 보호
       */
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

      /* =====================================
         미션 열려 있을 때
      ===================================== */

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

      /* =====================================
         E = 업무
      ===================================== */

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

      /* =====================================
         M = 지도
      ===================================== */

      if (
        event.code ===
        "KeyM"
      ) {
        event.preventDefault();

        setMapOpen(
          previous =>
            !previous
        );

        return;
      }

      /* =====================================
         ESC = 지도 닫기
      ===================================== */

      if (
        event.code ===
        "Escape"
      ) {
        setMapOpen(
          false
        );

        return;
      }

      /* =====================================
         B = 정전 테스트
      ===================================== */

      if (
        event.code ===
        "KeyB"
      ) {
        setBlackout(
          previous =>
            !previous
        );

        return;
      }

      /* =====================================
         R = 미션 초기화
      ===================================== */

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
    nearbyMission,
  ]);

  /* ======================================================
     Camera
  ====================================================== */

  const cameraX =
    clamp(
      position.x -
        VIEWPORT_WIDTH /
          2,
      0,
      DEVIL_MAP_WIDTH -
        VIEWPORT_WIDTH
    );

  const cameraY =
    clamp(
      position.y -
        VIEWPORT_HEIGHT /
          2,
      0,
      DEVIL_MAP_HEIGHT -
        VIEWPORT_HEIGHT
    );

  /* ======================================================
     Player Screen Position
  ====================================================== */

  const playerScreenX =
    position.x -
    cameraX;

  const playerScreenY =
    position.y -
    cameraY;

  /* ======================================================
     World Click
  ====================================================== */

  const handleWorldClick = (
    event:
      React.MouseEvent<HTMLDivElement>
  ) => {
    if (
      activeMission ||
      mapOpen
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

    const targetX =
      cameraX +
      clickX;

    const targetY =
      cameraY +
      clickY;

    moveTo(
      targetX,
      targetY
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
      {/* =================================================
          Viewport
      ================================================= */}

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
        {/* =============================================
            World
        ============================================= */}

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

            willChange:
              "transform",
          }}
        >
          {/* =========================================
              Office
          ========================================= */}

          <DevilOfficeMap />

          {/* =========================================
              Mission Markers
          ========================================= */}

          {missions.map(
            mission => {
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
                  {/* Marker */}

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

                  {/* Name */}

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
        </div>

        {/* =============================================
            Player
        ============================================= */}

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

            willChange:
              "left, top",
          }}
        >
          <Potato
            name="테스트 감자"
            glasses="sunglasses"
            moving={
              moving
            }
          />
        </div>

        {/* =============================================
            Blackout
        ============================================= */}

        {blackout && (
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

                  rgba(0,0,0,0.03) 90px,

                  rgba(0,0,0,0.18) 125px,

                  rgba(0,0,0,0.62) 165px,

                  rgba(0,0,0,0.95) 210px,

                  rgba(0,0,0,1) 270px
                )
              `,
            }}
          />
        )}

        {/* =============================================
            Game Status
        ============================================= */}

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
          {/* =====================================
              Role
          ===================================== */}

          <div
            className={`
              text-[12px]
              font-black

              ${
                role ===
                "devil"
                  ? "text-red-400"
                  : "text-emerald-400"
              }
            `}
          >
            {role ===
            "devil"
              ? "😈 악마 감자"
              : "🥔 생존 감자"}
          </div>

          {/* =====================================
              Mission Progress
          ===================================== */}

          <div
            className="
              mt-3
            "
          >
            {/* Label */}

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

            {/* Progress */}

            <div
              className="
                mt-2
                h-[8px]
                w-full
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

            {/* Count */}

            <div
              className="
                mt-2
                flex
                items-center
                justify-between
                text-[9px]
              "
            >
              <span
                className="
                  text-white/40
                "
              >
                완료
              </span>

              <span
                className="
                  font-semibold
                  text-amber-300
                "
              >
                {
                  completedMissionCount
                }
                {" / "}
                {
                  totalMissionCount
                }
              </span>
            </div>

            {/* Remaining */}

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
        </div>

        {/* =============================================
            Mission Interaction
        ============================================= */}

        {nearbyMission &&
          !activeMission &&
          !mapOpen && (
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
                backdrop-blur-sm
                transition
                hover:bg-black
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

              <span
                className="
                  ml-2
                  text-white/40
                "
              >
                ·{" "}
                {
                  nearbyMission.room
                }
              </span>
            </button>
          )}

        {/* =============================================
            Blackout Alert
        ============================================= */}

        {blackout && (
          <div
            data-no-move
            className="
              absolute
              left-1/2
              top-5
              z-[9000]
              -translate-x-1/2
              rounded-full
              border
              border-red-400/20
              bg-red-950/90
              px-5
              py-2
              text-[11px]
              font-bold
              text-red-200
              shadow-lg
            "
          >
            ⚡ 정전 발생
          </div>
        )}

        {/* =============================================
            Controls
        ============================================= */}

        <div
          data-no-move
          className="
            absolute
            bottom-4
            right-4
            z-[8000]
            flex
            gap-2
          "
        >
          <Control>
            E : 업무
          </Control>

          <Control>
            M : 지도
          </Control>

          <Control>
            B : 정전
          </Control>

          <Control>
            R : 미션 초기화
          </Control>
        </div>

        {/* =============================================
            Map
        ============================================= */}

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