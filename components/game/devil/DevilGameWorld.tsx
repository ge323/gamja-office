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

import GameMapOverlay from "./GameMapOverlay";

/* =========================================================
   Types
========================================================= */

type Position = {
  x: number;
  y: number;
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
     Map Overlay
  ====================================================== */

  const [
    mapOpen,
    setMapOpen,
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

      /*
       * input / textarea 사용 중에는
       * M 단축키를 막음
       */
      if (
        target.tagName ===
          "INPUT" ||
        target.tagName ===
          "TEXTAREA"
      ) {
        return;
      }

      /* M */

      if (
        event.key.toLowerCase() ===
        "m"
      ) {
        setMapOpen(
          previous =>
            !previous
        );
      }

      /* ESC */

      if (
        event.key ===
        "Escape"
      ) {
        setMapOpen(
          false
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

    /*
     * 너무 가까우면 이동하지 않음
     */
    if (
      distance < 8
    ) {
      return;
    }

    /* =====================================
       이동 시간 계산
    ===================================== */

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

    /* =====================================
       기존 이동 타이머 제거
    ===================================== */

    if (
      moveTimerRef.current
    ) {
      window.clearTimeout(
        moveTimerRef.current
      );
    }

    /* =====================================
       이동 시작
    ===================================== */

    setMoveDuration(
      duration
    );

    setMoving(
      true
    );

    setPosition({
      x:
        targetX,

      y:
        targetY,
    });

    /* =====================================
       이동 종료
    ===================================== */

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
     World Click
  ====================================================== */

  const handleWorldClick = (
    event:
      React.MouseEvent<HTMLDivElement>
  ) => {
    /*
     * 지도 열려있으면 이동 금지
     */
    if (
      mapOpen
    ) {
      return;
    }

    const clickedElement =
      event.target as HTMLElement;

    /*
     * HUD / UI 클릭 제외
     */
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
       현재 카메라 위치
    ===================================== */

    const cameraX =
      getCameraX(
        position.x
      );

    const cameraY =
      getCameraY(
        position.y
      );

    /* =====================================
       화면 좌표 → 실제 맵 좌표
    ===================================== */

    let targetX =
      event.clientX -
      rect.left +
      cameraX;

    let targetY =
      event.clientY -
      rect.top +
      cameraY;

    /* =====================================
       맵 밖 이동 제한
    ===================================== */

    targetX =
      Math.max(
        50,

        Math.min(
          DEVIL_MAP_WIDTH -
            50,

          targetX
        )
      );

    targetY =
      Math.max(
        100,

        Math.min(
          DEVIL_MAP_HEIGHT -
            30,

          targetY
        )
      );

    moveTo(
      targetX,
      targetY
    );
  };

  /* ======================================================
     Camera
  ====================================================== */

  const cameraX =
    getCameraX(
      position.x
    );

  const cameraY =
    getCameraY(
      position.y
    );

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
          bg-[#d8cfbd]
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
            실제 대형 맵
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

            /*
             * 카메라가 플레이어를 따라감
             */
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
          {/* =================================
              Map
          ================================= */}

          <DevilOfficeMap />

          {/* =================================
              Player
          ================================= */}

          <div
            className="
              absolute
              z-[5000]
            "
            style={{
              left:
                position.x,

              top:
                position.y,

              transform:
                "translate(-50%, -100%)",

              transitionProperty:
                "left, top",

              transitionDuration:
                `${moveDuration}ms`,

              transitionTimingFunction:
                "linear",
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
        </div>

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
        </div>

        {/* =====================================
            M 안내
        ===================================== */}

        <div
          data-no-move
          className="
            absolute
            bottom-4
            right-4
            z-[8000]
            rounded-lg
            border
            border-white/10
            bg-black/70
            px-3
            py-2
            text-[10px]
            text-white/80
          "
        >
          M : 전체 지도
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
   Camera X
========================================================= */

function getCameraX(
  playerX: number
) {
  return Math.max(
    0,

    Math.min(
      DEVIL_MAP_WIDTH -
        VIEWPORT_WIDTH,

      playerX -
        VIEWPORT_WIDTH /
          2
    )
  );
}

/* =========================================================
   Camera Y
========================================================= */

function getCameraY(
  playerY: number
) {
  return Math.max(
    0,

    Math.min(
      DEVIL_MAP_HEIGHT -
        VIEWPORT_HEIGHT,

      playerY -
        VIEWPORT_HEIGHT /
          2
    )
  );
}