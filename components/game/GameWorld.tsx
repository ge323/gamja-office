"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import Potato from "@/components/character/Potato";

import type {
  CharacterStyle,
} from "@/components/character/CharacterCustomizer";

import OfficeMap, {
  type OfficeInteraction,
  type OfficeInteractionType,
} from "@/components/game/OfficeMap";

import InteractionBubble from "@/components/game/InteractionBubble";

/* =========================================================
   Types
========================================================= */

type Position = {
  x: number;
  y: number;
};

type GameWorldProps = {
  nickname: string;

  characterStyle:
    CharacterStyle;
};

/* =========================================================
   World
========================================================= */

const WORLD_WIDTH =
  1100;

const WORLD_HEIGHT =
  650;

/* =========================================================
   Player
========================================================= */

const PLAYER_SPEED =
  260;

const MIN_MOVE_TIME =
  180;

const MAX_MOVE_TIME =
  1800;

/* =========================================================
   GameWorld
========================================================= */

export default function GameWorld({
  nickname,
  characterStyle,
}: GameWorldProps) {
  /* ======================================================
     Refs
  ====================================================== */

  const containerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const worldRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const moveTimerRef =
    useRef<number | null>(
      null
    );

  const interactionTimerRef =
    useRef<number | null>(
      null
    );

  const pendingInteractionRef =
    useRef<OfficeInteractionType | null>(
      null
    );

  /* ======================================================
     Scale
  ====================================================== */

  const [
    scale,
    setScale,
  ] =
    useState(1);

  /* ======================================================
     Player State
  ====================================================== */

  const [
    position,
    setPosition,
  ] =
    useState<Position>({
      x: 735,
      y: 565,
    });

  const [
    moving,
    setMoving,
  ] =
    useState(false);

  const [
    moveDuration,
    setMoveDuration,
  ] =
    useState(600);

  /* ======================================================
     Interaction State
  ====================================================== */

  const [
    interactionMessage,
    setInteractionMessage,
  ] =
    useState("");

  /* ======================================================
     Responsive Scale
  ====================================================== */

  useEffect(() => {
    const updateScale =
      () => {
        const container =
          containerRef.current;

        if (!container) {
          return;
        }

        const availableWidth =
          container.clientWidth;

        const nextScale =
          Math.min(
            1,
            availableWidth /
              WORLD_WIDTH
          );

        setScale(
          nextScale
        );
      };

    updateScale();

    window.addEventListener(
      "resize",
      updateScale
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateScale
      );
    };
  }, []);

  /* ======================================================
     Interaction Bubble
  ====================================================== */

  const showInteraction = (
    text: string
  ) => {
    setInteractionMessage(
      text
    );

    if (
      interactionTimerRef.current
    ) {
      window.clearTimeout(
        interactionTimerRef.current
      );
    }

    interactionTimerRef.current =
      window.setTimeout(
        () => {
          setInteractionMessage(
            ""
          );
        },
        2000
      );
  };

  /* ======================================================
     Interaction Execute
  ====================================================== */

  const executeInteraction = (
    type:
      OfficeInteractionType
  ) => {
    if (
      type ===
      "coffee"
    ) {
      showInteraction(
        "☕ 커피 충전 완료!"
      );

      return;
    }

    if (
      type ===
      "chair"
    ) {
      showInteraction(
        "🪑 잠깐 쉬는 중..."
      );

      return;
    }

    if (
      type ===
      "copier"
    ) {
      showInteraction(
        "📄 복사 완료!"
      );
    }
  };

  /* ======================================================
     Move To

     일반 이동과 오브젝트 이동에서
     공통으로 사용하는 함수
  ====================================================== */

  const moveTo = (
    targetX: number,
    targetY: number,
    interaction:
      OfficeInteractionType | null =
      null
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

    /* ================================================
       이미 근처에 있음
    ================================================ */

    if (
      distance < 8
    ) {
      setMoving(
        false
      );

      if (
        interaction
      ) {
        executeInteraction(
          interaction
        );
      }

      return;
    }

    /* ================================================
       이동시간 계산
    ================================================ */

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

    /* ================================================
       기존 이동 취소
    ================================================ */

    if (
      moveTimerRef.current
    ) {
      window.clearTimeout(
        moveTimerRef.current
      );
    }

    /* ================================================
       이동 준비
    ================================================ */

    setInteractionMessage(
      ""
    );

    pendingInteractionRef.current =
      interaction;

    setMoveDuration(
      duration
    );

    setMoving(
      true
    );

    /* ================================================
       이동
    ================================================ */

    setPosition({
      x:
        targetX,

      y:
        targetY,
    });

    /* ================================================
       도착
    ================================================ */

    moveTimerRef.current =
      window.setTimeout(
        () => {
          setMoving(
            false
          );

          const pending =
            pendingInteractionRef.current;

          pendingInteractionRef.current =
            null;

          if (
            pending
          ) {
            executeInteraction(
              pending
            );
          }
        },
        duration
      );
  };

  /* ======================================================
     Object Interaction
  ====================================================== */

  const handleInteract = (
    interaction:
      OfficeInteraction
  ) => {
    moveTo(
      interaction.targetX,
      interaction.targetY,
      interaction.type
    );
  };

  /* ======================================================
     World Click
  ====================================================== */

  const handleWorldClick = (
    event:
      React.MouseEvent<HTMLDivElement>
  ) => {
    const world =
      worldRef.current;

    if (!world) {
      return;
    }

    const clickedElement =
      event.target as HTMLElement;

    /*
     * 오브젝트를 직접 클릭했다면
     * OfficeMap에서 따로 처리
     */
    if (
      clickedElement.closest(
        "[data-no-move]"
      )
    ) {
      return;
    }

    const rect =
      world.getBoundingClientRect();

    /* ================================================
       Scale된 화면 좌표
       →
       실제 1100 x 650 좌표
    ================================================ */

    let targetX =
      (
        event.clientX -
        rect.left
      ) /
      scale;

    let targetY =
      (
        event.clientY -
        rect.top
      ) /
      scale;

    /* ================================================
       World Boundary
    ================================================ */

    targetX =
      Math.max(
        45,
        Math.min(
          WORLD_WIDTH -
            45,
          targetX
        )
      );

    targetY =
      Math.max(
        110,
        Math.min(
          WORLD_HEIGHT -
            25,
          targetY
        )
      );

    /* ================================================
       일반 이동이면
       예약 상호작용 취소
    ================================================ */

    pendingInteractionRef.current =
      null;

    moveTo(
      targetX,
      targetY,
      null
    );
  };

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

      if (
        interactionTimerRef.current
      ) {
        window.clearTimeout(
          interactionTimerRef.current
        );
      }
    };
  }, []);

  /* ======================================================
     Render
  ====================================================== */

  return (
    <div
      ref={
        containerRef
      }
      className="
        flex
        w-full
        justify-center
        overflow-hidden
        bg-[#ece7dd]
        px-4
        py-4
      "
    >
      {/* =============================================
          Scale Wrapper
      ============================================= */}

      <div
        style={{
          width:
            WORLD_WIDTH *
            scale,

          height:
            WORLD_HEIGHT *
            scale,
        }}
      >
        {/* ===========================================
            World

            실제 내부 좌표는 항상
            1100 × 650
        =========================================== */}

        <div
          ref={
            worldRef
          }
          onClick={
            handleWorldClick
          }
          className="
            relative
            origin-top-left
            cursor-pointer
            overflow-hidden
            rounded-xl
            border-[6px]
            border-zinc-800
            bg-[#eadfc9]
            shadow-lg
          "
          style={{
            width:
              WORLD_WIDTH,

            height:
              WORLD_HEIGHT,

            transform:
              `scale(${scale})`,
          }}
        >
          {/* =========================================
              Office
          ========================================= */}

          <OfficeMap
            onInteract={
              handleInteract
            }
          />

          {/* =========================================
              Player
          ========================================= */}

          <div
            className="absolute"
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

              zIndex:
                Math.round(
                  position.y
                ) +
                100,
            }}
          >
            {/* =====================================
                Interaction Bubble
            ===================================== */}

            <InteractionBubble
              text={
                interactionMessage
              }
            />

            {/* =====================================
                Character
            ===================================== */}

            <Potato
              name={
                nickname
              }
              glasses={
                characterStyle.glasses
              }
              hat={
                characterStyle.hat
              }
              ribbon={
                characterStyle.ribbon
              }
              tie={
                characterStyle.tie
              }
              moving={
                moving
              }
            />
          </div>

          {/* =========================================
              Help
          ========================================= */}

          <div
            data-no-move
            className="
              absolute
              bottom-[35px]
              left-1/2
              z-[3000]
              -translate-x-1/2
              rounded-lg
              border
              border-zinc-200
              bg-white/90
              px-3
              py-2
              text-[10px]
              text-zinc-500
              shadow-sm
              backdrop-blur
            "
          >
            바닥 또는 오브젝트를 클릭해보세요.
          </div>
        </div>
      </div>
    </div>
  );
}