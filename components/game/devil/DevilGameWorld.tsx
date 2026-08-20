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

const VIEWPORT_WIDTH = 1100;
const VIEWPORT_HEIGHT = 650;

/* =========================================================
   Player
========================================================= */

const PLAYER_SPEED = 300;

const MIN_MOVE_TIME = 150;
const MAX_MOVE_TIME = 2200;

/* =========================================================
   미션 위치 후보
========================================================= */

const MISSION_SPAWNS:
  MissionSpawn[] = [
  {
    id: "power",
    name: "전력 점검",

    positions: [
      { x: 170, y: 180 },
      { x: 310, y: 190 },
      { x: 450, y: 220 },
      { x: 180, y: 320 },
      { x: 410, y: 330 },
    ],
  },

  {
    id: "archive",
    name: "문서 찾기",

    positions: [
      { x: 170, y: 590 },
      { x: 300, y: 620 },
      { x: 470, y: 600 },
      { x: 200, y: 760 },
      { x: 430, y: 780 },
    ],
  },

  {
    id: "coffee",
    name: "커피 제조",

    positions: [
      { x: 1690, y: 590 },
      { x: 1830, y: 610 },
      { x: 2010, y: 620 },
      { x: 1730, y: 770 },
      { x: 1980, y: 780 },
    ],
  },

  {
    id: "copy",
    name: "서류 복사",

    positions: [
      { x: 170, y: 1040 },
      { x: 320, y: 1060 },
      { x: 470, y: 1080 },
      { x: 200, y: 1210 },
      { x: 430, y: 1220 },
    ],
  },

  {
    id: "server",
    name: "서버 점검",

    positions: [
      { x: 1680, y: 1030 },
      { x: 1810, y: 1060 },
      { x: 1980, y: 1050 },
      { x: 1740, y: 1210 },
      { x: 1990, y: 1210 },
    ],
  },
];

/* =========================================================
   랜덤 미션 생성
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

      const randomPosition =
        mission.positions[
          randomIndex
        ];

      return {
        id: mission.id,
        name: mission.name,

        x: randomPosition.x,
        y: randomPosition.y,

        completed: false,
      };
    }
  );
}

/* =========================================================
   DevilGameWorld
========================================================= */

export default function DevilGameWorld() {
  /* ======================================================
     Refs
  ====================================================== */

  const viewportRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const moveTimerRef =
    useRef<number | null>(
      null
    );

  /* ======================================================
     Player Position

     실제 맵에서의 좌표
  ====================================================== */

  const [
    position,
    setPosition,
  ] =
    useState<Position>({
      x: 1100,
      y: 740,
    });

  /* ======================================================
     Moving
  ====================================================== */

  const [
    moving,
    setMoving,
  ] =
    useState(false);

  const [
    moveDuration,
    setMoveDuration,
  ] =
    useState(500);

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
         ESC = 지도 닫기
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
         R = 미션 재배치 테스트
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
     Move
  ====================================================== */

  const moveTo = (
    targetX: number,
    targetY: number
  ) => {
    const dx =
      targetX -
      position.x;

    const dy =
      targetY -
      position.y;

    const distance =
      Math.sqrt(
        dx * dx +
          dy * dy
      );

    if (
      distance < 8
    ) {
      return;
    }

    const calculatedDuration =
      (
        distance /
        PLAYER_SPEED
      ) *
      1000;

    const duration =
      Math.max(
        MIN_MOVE_TIME,

        Math.min(
          MAX_MOVE_TIME,
          calculatedDuration
        )
      );

    if (
      moveTimerRef.current
    ) {
      window.clearTimeout(
        moveTimerRef.current
      );
    }

    setMoveDuration(
      duration
    );

    setMoving(
      true
    );

    setPosition({
      x: targetX,
      y: targetY,
    });

    moveTimerRef.current =
      window.setTimeout(
        () => {
          setMoving(
            false
          );
        },
        duration
      );
  };

  /* ======================================================
     Camera

     플레이어가 항상 화면 중앙에 오도록
     맵 위치를 이동시킨다.
  ====================================================== */

  const cameraX =
    position.x -
    VIEWPORT_WIDTH / 2;

  const cameraY =
    position.y -
    VIEWPORT_HEIGHT / 2;

  /* ======================================================
     World Click
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

    const clickedElement =
      event.target as HTMLElement;

    if (
      clickedElement.closest(
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
       화면 중심에서 클릭까지의 차이
    ===================================== */

    const screenCenterX =
      VIEWPORT_WIDTH / 2;

    const screenCenterY =
      VIEWPORT_HEIGHT / 2;

    const clickedX =
      event.clientX -
      rect.left;

    const clickedY =
      event.clientY -
      rect.top;

    const offsetX =
      clickedX -
      screenCenterX;

    const offsetY =
      clickedY -
      screenCenterY;

    /* =====================================
       현재 플레이어 실제 좌표 기준
       목표 좌표 계산
    ===================================== */

    let targetX =
      position.x +
      offsetX;

    let targetY =
      position.y +
      offsetY;

    /* =====================================
       맵 경계 제한

       화면 중심 고정을 유지하기 위해
       맵 바깥으로 너무 가까이 가지 않게 함
    ===================================== */

    const minX =
      VIEWPORT_WIDTH / 2;

    const maxX =
      DEVIL_MAP_WIDTH -
      VIEWPORT_WIDTH / 2;

    const minY =
      VIEWPORT_HEIGHT / 2;

    const maxY =
      DEVIL_MAP_HEIGHT -
      VIEWPORT_HEIGHT / 2;

    targetX =
      Math.max(
        minX,
        Math.min(
          maxX,
          targetX
        )
      );

    targetY =
      Math.max(
        minY,
        Math.min(
          maxY,
          targetY
        )
      );

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
        moveTimerRef.current
      ) {
        window.clearTimeout(
          moveTimerRef.current
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
            움직이는 맵
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
              `translate(${-cameraX}px, ${-cameraY}px)`,

            transitionProperty:
              "transform",

            transitionDuration:
              `${moveDuration}ms`,

            transitionTimingFunction:
              "linear",
          }}
        >
          <DevilOfficeMap />
        </div>

        {/* =====================================
            Player

            월드 안에 있지 않고
            Viewport 중앙에 고정
        ===================================== */}

        <div
          className="
            pointer-events-none
            absolute
            left-1/2
            top-1/2
            z-[5000]
          "
          style={{
            transform:
              "translate(-50%, -100%)",
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
            Blackout Vision

            플레이어 중심 주변만 보임
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
                  circle 210px at 50% 50%,

                  rgba(0, 0, 0, 0) 0px,

                  rgba(0, 0, 0, 0.03) 90px,

                  rgba(0, 0, 0, 0.15) 125px,

                  rgba(0, 0, 0, 0.55) 165px,

                  rgba(0, 0, 0, 0.92) 210px,

                  rgba(0, 0, 0, 0.99) 260px,

                  rgba(0, 0, 0, 1) 100%
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
            border
            border-white/10
            bg-black/70
            px-4
            py-3
            text-white
            shadow-lg
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
            대형 맵 테스트
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
              border
              border-red-400/30
              bg-red-950/85
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
            M : 전체 지도
          </div>

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
            B : 정전
          </div>

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
            R : 미션 재배치
          </div>
        </div>

        {/* =====================================
            Map Overlay
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