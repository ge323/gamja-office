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

const MIN_MOVE_TIME = 180;
const MAX_MOVE_TIME = 1800;

export default function GameWorld() {
  const worldRef =
    useRef<HTMLDivElement | null>(null);

  const moveTimerRef =
    useRef<number | null>(null);

  const [position, setPosition] =
    useState<Position>({
      x: 735,
      y: 565,
    });

  const [moving, setMoving] =
    useState(false);

  const [moveDuration, setMoveDuration] =
    useState(600);

  const handleWorldClick = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    const world =
      worldRef.current;

    if (!world) {
      return;
    }

    const clickedElement =
      event.target as HTMLElement;

    /*
     * 가구 / 버튼 / UI 클릭 시 이동하지 않음
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

    let targetX =
      event.clientX -
      rect.left;

    let targetY =
      event.clientY -
      rect.top;

    /*
     * 맵 밖으로 나가지 못하도록 제한
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
          rect.height - 25,
          targetY
        )
      );

    /*
     * 현재 위치와 클릭 위치 차이
     */
    const dx =
      targetX -
      position.x;

    const dy =
      targetY -
      position.y;

    /*
     * 거리 계산
     */
    const distance =
      Math.sqrt(
        dx * dx +
          dy * dy
      );

    /*
     * 너무 가까운 곳 클릭 무시
     */
    if (distance < 8) {
      return;
    }

    /*
     * 일정한 이동 속도 유지
     */
    const calculatedDuration =
      (distance / PLAYER_SPEED) *
      1000;

    const duration =
      Math.max(
        MIN_MOVE_TIME,
        Math.min(
          MAX_MOVE_TIME,
          calculatedDuration
        )
      );

    setMoveDuration(duration);

    setMoving(true);

    setPosition({
      x: targetX,
      y: targetY,
    });

    if (moveTimerRef.current) {
      window.clearTimeout(
        moveTimerRef.current
      );
    }

    moveTimerRef.current =
      window.setTimeout(() => {
        setMoving(false);
      }, duration);
  };

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
        onClick={handleWorldClick}
        className="
          relative
          h-[650px]
          w-full
          max-w-[1100px]
          cursor-pointer
          overflow-hidden
          rounded-xl
          border-[6px]
          border-zinc-800
          bg-[#eadfc9]
          shadow-lg
        "
      >
        <OfficeMap />

        {/* =========================================
            Player
        ========================================= */}

        <div
          className="absolute"
          style={{
            left: position.x,
            top: position.y,

            transform:
              "translate(-50%, -100%)",

            transitionProperty:
              "left, top",

            transitionDuration:
              `${moveDuration}ms`,

            transitionTimingFunction:
              "linear",

            zIndex:
              Math.round(position.y) +
              100,
          }}
        >
          <Potato
            name="감자"
            glasses="sunglasses"
            moving={moving}
          />
        </div>

        {/* 안내 */}
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
          빈 공간을 클릭하면 감자가 이동합니다.
        </div>
      </div>
    </div>
  );
}