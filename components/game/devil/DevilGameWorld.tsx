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

/* =========================================================
   Types
========================================================= */

type Position = {
  x: number;
  y: number;
};

type MissionSpawn = {
  id: string;

  name: string;

  positions: Position[];
};

/* =========================================================
   Viewport
========================================================= */

const VIEWPORT_WIDTH =
  1100;

const VIEWPORT_HEIGHT =
  650;

/* =========================================================
   Player Movement

   px / second
========================================================= */

const PLAYER_SPEED =
  260;

/*
 * 목표 지점과 이 거리 이하가 되면
 * 이동 완료로 처리
 */
const ARRIVAL_DISTANCE =
  2;

/*
 * 이동 중 충돌을 검사하는 최소 단위
 */
const COLLISION_STEP =
  4;

/* =========================================================
   Missions
========================================================= */

const MISSION_SPAWNS:
  MissionSpawn[] = [
  {
    id: "power",

    name: "전력 점검",

    positions: [
      {
        x: 200,
        y: 300,
      },

      {
        x: 470,
        y: 310,
      },
    ],
  },

  {
    id: "archive",

    name: "문서 찾기",

    positions: [
      {
        x: 170,
        y: 800,
      },

      {
        x: 490,
        y: 800,
      },
    ],
  },

  {
    id: "coffee",

    name: "커피 제조",

    positions: [
      {
        x: 1700,
        y: 790,
      },

      {
        x: 2020,
        y: 790,
      },
    ],
  },

  {
    id: "copy",

    name: "서류 복사",

    positions: [
      {
        x: 170,
        y: 1230,
      },

      {
        x: 490,
        y: 1230,
      },
    ],
  },

  {
    id: "server",

    name: "서버 점검",

    positions: [
      {
        x: 1680,
        y: 1220,
      },

      {
        x: 2020,
        y: 1220,
      },
    ],
  },
];

/* =========================================================
   Random Mission
========================================================= */

function createRandomMissions():
  MissionMarker[] {
  return MISSION_SPAWNS.map(
    mission => {
      const randomIndex =
        Math.floor(
          Math.random() *
            mission.positions.length
        );

      const position =
        mission.positions[
          randomIndex
        ];

      return {
        id:
          mission.id,

        name:
          mission.name,

        x:
          position.x,

        y:
          position.y,

        completed:
          false,
      };
    }
  );
}

/* =========================================================
   Rect
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
   Path Check

   현재 위치에서 클릭 위치까지
   직선으로 이동 가능한지 검사.

   벽을 가로질러 방 안을 클릭하면
   이동하지 않는다.
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
   DevilGameWorld
========================================================= */

export default function DevilGameWorld() {
  /* ======================================================
     DOM Ref
  ====================================================== */

  const viewportRef =
    useRef<HTMLDivElement | null>(
      null
    );

  /* ======================================================
     Animation Refs
  ====================================================== */

  const animationFrameRef =
    useRef<number | null>(
      null
    );

  const lastFrameTimeRef =
    useRef<number | null>(
      null
    );

  /*
   * React state와 별개로
   * 현재 실제 위치를 즉시 참조하기 위해 사용.
   *
   * 이동 도중 다시 클릭했을 때
   * 이전 목적지가 아니라 현재 좌표에서
   * 새 목적지로 이동하게 해준다.
   */
  const positionRef =
    useRef<Position>({
      x: 1100,
      y: 700,
    });

  /*
   * 현재 목표 지점
   */
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
     Missions
  ====================================================== */

  const [
    missions,
    setMissions,
  ] =
    useState<
      MissionMarker[]
    >(
      () =>
        createRandomMissions()
    );

  /* ======================================================
     Blackout
  ====================================================== */

  const [
    blackout,
    setBlackout,
  ] =
    useState(false);

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

     CSS transition 대신
     requestAnimationFrame으로 좌표를
     매 프레임 직접 업데이트한다.
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
       프레임 시간
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
       목표까지 거리
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
       이번 프레임 이동 거리
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
       혹시 이동 중 충돌 발생 시 정지
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
       실제 좌표 갱신
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
     Start Movement
  ====================================================== */

  const moveTo = (
    targetX: number,
    targetY: number
  ) => {
    const current =
      positionRef.current;

    /* =====================================
       목적지 이동 가능 여부
    ===================================== */

    if (
      !isWalkable(
        targetX,
        targetY
      )
    ) {
      return;
    }

    /* =====================================
       직선 경로 검사
    ===================================== */

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

    /*
     * 이동 중 다시 클릭하면
     * 기존 애니메이션을 취소하고
     * 현재 좌표에서 새 방향으로 이동.
     */
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
          "TEXTAREA"
      ) {
        return;
      }

      /* =====================================
         M = 지도
      ===================================== */

      if (
        event.key.toLowerCase() ===
        "m"
      ) {
        setMapOpen(
          previous =>
            !previous
        );
      }

      /* =====================================
         ESC
      ===================================== */

      if (
        event.key ===
        "Escape"
      ) {
        setMapOpen(
          false
        );
      }

      /* =====================================
         B = 정전 테스트
      ===================================== */

      if (
        event.key.toLowerCase() ===
        "b"
      ) {
        setBlackout(
          previous =>
            !previous
        );
      }

      /* =====================================
         R = 미션 위치 테스트
      ===================================== */

      if (
        event.key.toLowerCase() ===
        "r"
      ) {
        setMissions(
          createRandomMissions()
        );
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
  }, []);

  /* ======================================================
     Camera

     position이 매 프레임 바뀌므로
     카메라도 플레이어를 부드럽게 따라온다.
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
     Click
  ====================================================== */

  const handleWorldClick = (
    event:
      React.MouseEvent<HTMLDivElement>
  ) => {
    if (
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

    if (
      !viewport
    ) {
      return;
    }

    const rect =
      viewport.getBoundingClientRect();

    /* =====================================
       화면 클릭 좌표
    ===================================== */

    const clickX =
      event.clientX -
      rect.left;

    const clickY =
      event.clientY -
      rect.top;

    /* =====================================
       실제 월드 좌표
    ===================================== */

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
     Remaining Missions
  ====================================================== */

  const remainingMissionCount =
    missions.filter(
      mission =>
        !mission.completed
    ).length;

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
      {/* =========================================
          Viewport
      ========================================= */}

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
        {/* =====================================
            World

            transition 없음.
            실제 위치가 매 프레임 변경되므로
            자연스럽게 이동한다.
        ===================================== */}

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
          <DevilOfficeMap />
        </div>

        {/* =====================================
            Player

            캐릭터도 transition 사용하지 않음.
            position 자체가 매 프레임 갱신된다.
        ===================================== */}

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

        {/* =====================================
            Blackout
        ===================================== */}

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

        {/* =====================================
            HUD
        ===================================== */}

        <div
          data-no-move
          className="
            absolute
            left-4
            top-4
            z-[8000]
            rounded-xl
            bg-black/70
            px-4
            py-3
            text-white
          "
        >
          <div
            className="
              text-[12px]
              font-bold
            "
          >
            😈 악마 감자
          </div>

          <div
            className="
              mt-1
              text-[9px]
              text-white/60
            "
          >
            부드러운 이동 테스트
          </div>

          <div
            className="
              mt-2
              text-[9px]
              text-amber-300
            "
          >
            미션{" "}
            {
              remainingMissionCount
            }
            개 남음
          </div>
        </div>

        {/* =====================================
            Blackout Alert
        ===================================== */}

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
              bg-red-950/90
              px-5
              py-2
              text-[11px]
              font-bold
              text-red-200
            "
          >
            ⚡ 정전 발생
          </div>
        )}

        {/* =====================================
            Controls
        ===================================== */}

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
            M : 지도
          </Control>

          <Control>
            B : 정전
          </Control>

          <Control>
            R : 미션 재배치
          </Control>
        </div>

        {/* =====================================
            Map
        ===================================== */}

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
            missions
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
        bg-black/70
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