"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import Potato from "@/components/character/Potato";

import OfficeMap, {
  type OfficeInteraction,
  type OfficeInteractionType,
} from "@/components/game/OfficeMap";

import InteractionBubble from "@/components/game/InteractionBubble";

type Position = {
  x: number;
  y: number;
};

/* =========================================================
   World
========================================================= */

const WORLD_WIDTH = 1100;
const WORLD_HEIGHT = 650;

/* =========================================================
   Player
========================================================= */

const PLAYER_SPEED = 260;

const MIN_MOVE_TIME = 180;
const MAX_MOVE_TIME = 1800;

export default function GameWorld() {
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

  /*
   * 현재 이동이 끝났을 때
   * 실행해야 할 상호작용
   */
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
     Interaction
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
     실제 상호작용 실행
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
     공통 이동 함수

     일반 바닥 이동과
     오브젝트 이동 모두 여기 사용
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

    /*
     * 거의 같은 위치
     */
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

    /* ====================================================
       이동시간 계산
    ==================================================== */

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

    /*
     * 기존 이동 종료 타이머 삭제
     */
    if (
      moveTimerRef.current
    ) {
      window.clearTimeout(
        moveTimerRef.current
      );
    }

    /*
     * 이동 전에 기존 말풍선 제거
     */
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

    setPosition({
      x:
        targetX,

      y:
        targetY,
    });

    /* ====================================================
       도착
    ==================================================== */

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

          /*
           * 오브젝트까지 이동한 경우
           * 도착 후 상호작용 실행
           */
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
     오브젝트 클릭
  ====================================================== */

  const handleInteract = (
    interaction:
      OfficeInteraction
  ) => {
    /*
     * 해당 오브젝트 앞으로 이동
     *
     * 도착했을 때 interaction.type 실행
     */
    moveTo(
      interaction.targetX,
      interaction.targetY,
      interaction.type
    );
  };

  /* ======================================================
     일반 바닥 클릭
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
     * 가구를 직접 누른 경우
     * 일반 이동 처리하지 않음.
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

    /*
     * 화면은 scale 되어 있으므로
     * 클릭 위치를 1100 × 650 원본 좌표로 변환
     */
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

    /* ====================================================
       경계 제한
    ==================================================== */

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

    /*
     * 일반 이동이므로
     * pending interaction 제거
     */
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
          scaled wrapper
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

            내부 좌표는 항상 1100 × 650
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
            <InteractionBubble
              text={
                interactionMessage
              }
            />

            <Potato
              name="감자"
              glasses="sunglasses"
              moving={
                moving
              }
            />
          </div>

          {/* =========================================
              안내
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