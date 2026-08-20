"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import Potato from "@/components/character/Potato";
import OfficeMap from "@/components/game/OfficeMap";

type Position = {
  x: number;
  y: number;
};

const PLAYER_SPEED = 260;

/*
 * 캐릭터가 지나치게 빠르거나
 * 느려지는 걸 막기 위한 범위
 */
const MIN_MOVE_TIME = 180;
const MAX_MOVE_TIME = 1800;

export default function GameWorld() {
  const worldRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const moveTimerRef =
    useRef<number | null>(
      null
    );

  const [
    position,
    setPosition,
  ] =
    useState<Position>({
      x: 730,
      y: 560,
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
    useState(650);

  const [
    direction,
    setDirection,
  ] =
    useState<
      "left" | "right"
    >("right");

  /* ======================================================
     클릭 이동
  ====================================================== */

  const handleWorldClick = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    const world =
      worldRef.current;

    if (!world) {
      return;
    }

    const target =
      event.target as HTMLElement;

    /*
     * 가구나 UI를 직접 클릭했을 때는
     * 이동하지 않음
     */
    if (
      target.closest(
        "[data-no-move]"
      )
    ) {
      return;
    }

    const rect =
      world.getBoundingClientRect();

    let targetX =
      event.clientX -
      rect.left;

    let targetY =
      event.clientY -
      rect.top;

    /*
     * 화면 바깥 제한
     */
    targetX =
      Math.max(
        45,
        Math.min(
          rect.width - 45,
          targetX
        )
      );

    targetY =
      Math.max(
        110,
        Math.min(
          rect.height - 18,
          targetY
        )
      );

    /* ====================================================
       거리 계산
    ==================================================== */

    const deltaX =
      targetX -
      position.x;

    const deltaY =
      targetY -
      position.y;

    const distance =
      Math.sqrt(
        deltaX * deltaX +
          deltaY * deltaY
      );

    /*
     * 거의 같은 위치를 클릭하면 무시
     */
    if (
      distance < 8
    ) {
      return;
    }

    /* ====================================================
       캐릭터 방향
    ==================================================== */

    if (
      Math.abs(deltaX) > 5
    ) {
      setDirection(
        deltaX < 0
          ? "left"
          : "right"
      );
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

    setMoveDuration(
      duration
    );

    setMoving(true);

    setPosition({
      x:
        targetX,

      y:
        targetY,
    });

    /* ====================================================
       이전 이동 타이머 삭제
    ==================================================== */

    if (
      moveTimerRef.current
    ) {
      window.clearTimeout(
        moveTimerRef.current
      );
    }

    /* ====================================================
       도착 처리
    ==================================================== */

    moveTimerRef.current =
      window.setTimeout(
        () => {
          setMoving(false);
        },
        duration
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
    };
  }, []);

  return (
    <div className="flex w-full justify-center bg-[#ece7dd] px-4 py-4">
      <div
        ref={worldRef}
        onClick={
          handleWorldClick
        }
        className="
          relative
          h-[650px]
          w-full
          max-w-[1100px]
          cursor-pointer
          overflow-hidden
          border-[6px]
          border-zinc-800
          bg-[#e8d8bd]
          shadow-xl
        "
      >
        {/* =================================================
            Office Map
        ================================================= */}

        <OfficeMap />

        {/* =================================================
            Player
        ================================================= */}

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
          {/* =============================================
              방향 표현

              현재 감자는 정면 캐릭터라
              아주 강한 좌우 반전은 없지만,
              앞으로 옷/헤어 같은 비대칭 요소가 생기면
              방향이 확실히 보이게 됨.
          ============================================= */}

          <div
            style={{
              transform:
                direction ===
                "left"
                  ? "scaleX(-1)"
                  : "scaleX(1)",
            }}
          >
            {/*
             * 이름만 다시 뒤집어서
             * 글자가 거꾸로 보이지 않게 하는 건
             * 다음 단계에서 캐릭터 본체/닉네임을
             * 분리할 때 개선할 예정.
             *
             * 현재는 캐릭터가 대칭이라 우선 방향 변환을
             * 아주 단순하게 유지.
             */}

            <Potato
              name="감자"
              glasses="sunglasses"
              moving={
                moving
              }
            />
          </div>
        </div>

        {/* =================================================
            안내
        ================================================= */}

        <div
          data-no-move
          className="
            absolute
            bottom-[36px]
            left-1/2
            z-[3000]
            -translate-x-1/2
            rounded-md
            border
            border-zinc-300
            bg-white/90
            px-3
            py-1.5
            text-[10px]
            text-zinc-500
            shadow
            backdrop-blur
          "
        >
          빈 공간을 클릭하면 감자가 이동합니다.
        </div>
      </div>
    </div>
  );
}