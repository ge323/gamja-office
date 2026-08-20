"use client";

import {
  DEVIL_MAP_HEIGHT,
  DEVIL_MAP_WIDTH,
} from "./DevilOfficeMap";

/* =========================================================
   Types
========================================================= */

export type MissionMarker = {
  id: string;

  name: string;

  x: number;
  y: number;

  completed: boolean;
};

type GameMapOverlayProps = {
  open: boolean;

  playerX: number;
  playerY: number;

  missions: MissionMarker[];

  blackout: boolean;

  onClose: () => void;
};

/* =========================================================
   Map
========================================================= */

const SCALE = 0.34;

const ROOMS = [
  {
    name: "전력실",
    x: 80,
    y: 100,
    width: 480,
    height: 300,
  },

  {
    name: "휴게실",
    x: 760,
    y: 70,
    width: 680,
    height: 330,
  },

  {
    name: "CCTV",
    x: 1640,
    y: 100,
    width: 480,
    height: 300,
  },

  {
    name: "자료실",
    x: 80,
    y: 500,
    width: 520,
    height: 360,
  },

  {
    name: "중앙 사무실",
    x: 700,
    y: 460,
    width: 800,
    height: 430,
  },

  {
    name: "탕비실",
    x: 1600,
    y: 500,
    width: 520,
    height: 360,
  },

  {
    name: "복사실",
    x: 80,
    y: 960,
    width: 520,
    height: 330,
  },

  {
    name: "회의실",
    x: 760,
    y: 1000,
    width: 680,
    height: 330,
  },

  {
    name: "서버실",
    x: 1600,
    y: 960,
    width: 520,
    height: 330,
  },
];

/* =========================================================
   Component
========================================================= */

export default function GameMapOverlay({
  open,
  playerX,
  playerY,
  missions,
  blackout,
  onClose,
}: GameMapOverlayProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      data-no-move
      className="
        absolute
        inset-0
        z-[10000]
        flex
        items-center
        justify-center
        bg-black/80
      "
      onClick={
        onClose
      }
    >
      <div
        className="
          relative
          overflow-hidden
          rounded-2xl
          border-[4px]
          border-white/30
          bg-[#d8cfbd]
          shadow-2xl
        "
        style={{
          width:
            DEVIL_MAP_WIDTH *
            SCALE,

          height:
            DEVIL_MAP_HEIGHT *
            SCALE,
        }}
        onClick={event => {
          event.stopPropagation();
        }}
      >
        {/* =====================================
            방
        ===================================== */}

        {ROOMS.map(room => (
          <div
            key={
              room.name
            }
            className="
              absolute
              flex
              items-center
              justify-center
              rounded-md
              border-[2px]
              border-zinc-700
              bg-white/50
              text-[10px]
              font-bold
              text-zinc-800
            "
            style={{
              left:
                room.x *
                SCALE,

              top:
                room.y *
                SCALE,

              width:
                room.width *
                SCALE,

              height:
                room.height *
                SCALE,
            }}
          >
            {
              room.name
            }
          </div>
        ))}

        {/* =====================================
            미션 위치

            정전 아닐 때만 표시
        ===================================== */}

        {!blackout &&
          missions
            .filter(
              mission =>
                !mission.completed
            )
            .map(
              mission => (
                <div
                  key={
                    mission.id
                  }
                  className="
                    absolute
                    z-[60]
                    -translate-x-1/2
                    -translate-y-1/2
                  "
                  style={{
                    left:
                      mission.x *
                      SCALE,

                    top:
                      mission.y *
                      SCALE,
                  }}
                >
                  {/* Glow */}

                  <div
                    className="
                      absolute
                      left-1/2
                      top-1/2
                      h-[26px]
                      w-[26px]
                      -translate-x-1/2
                      -translate-y-1/2
                      rounded-full
                      bg-amber-300/25
                      animate-ping
                    "
                  />

                  {/* Main Dot */}

                  <div
                    className="
                      relative
                      h-[13px]
                      w-[13px]
                      rounded-full
                      border-[2px]
                      border-white
                      bg-amber-300
                      shadow-[0_0_14px_rgba(253,224,71,0.95)]
                    "
                    title={
                      mission.name
                    }
                  />
                </div>
              )
            )}

        {/* =====================================
            내 위치
        ===================================== */}

        <div
          className="
            absolute
            z-[80]
            h-[16px]
            w-[16px]
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            border-[3px]
            border-white
            bg-emerald-500
            shadow-lg
          "
          style={{
            left:
              playerX *
              SCALE,

            top:
              playerY *
              SCALE,
          }}
        />

        {/* =====================================
            제목
        ===================================== */}

        <div
          className="
            absolute
            left-1/2
            top-4
            z-[100]
            -translate-x-1/2
            rounded-full
            bg-black/70
            px-5
            py-2
            text-[11px]
            font-bold
            text-white
          "
        >
          GAMJA OFFICE MAP
        </div>

        {/* =====================================
            정전 안내
        ===================================== */}

        {blackout && (
          <div
            className="
              absolute
              left-1/2
              top-[58px]
              z-[100]
              -translate-x-1/2
              rounded-full
              border
              border-red-400/40
              bg-red-950/80
              px-4
              py-2
              text-[10px]
              font-semibold
              text-red-200
            "
          >
            ⚡ 정전 중 · 미션 위치 확인 불가
          </div>
        )}

        {/* =====================================
            안내
        ===================================== */}

        <div
          className="
            absolute
            bottom-4
            left-1/2
            z-[100]
            -translate-x-1/2
            rounded-lg
            bg-black/70
            px-4
            py-2
            text-[10px]
            text-white
          "
        >
          M 또는 ESC를 눌러 닫기
        </div>
      </div>
    </div>
  );
}