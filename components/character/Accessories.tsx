"use client";

type GlassesType =
  | "none"
  | "round"
  | "sunglasses";

type HatType =
  | "none"
  | "cap"
  | "party";

type AccessoriesProps = {
  glasses?: GlassesType;
  hat?: HatType;
  ribbon?: boolean;
  tie?: boolean;
};

export default function Accessories({
  glasses = "none",
  hat = "none",
  ribbon = false,
  tie = false,
}: AccessoriesProps) {
  return (
    <>
      {/* =================================================
          안경
      ================================================= */}

      {glasses === "round" && (
        <div className="pointer-events-none absolute inset-0 z-30">
          {/* 왼쪽 렌즈 */}
          <div
            className="
              absolute
              left-[7px]
              top-[26px]
              h-[14px]
              w-[14px]
              rounded-full
              border-[2px]
              border-zinc-900
            "
          />

          {/* 오른쪽 렌즈 */}
          <div
            className="
              absolute
              right-[7px]
              top-[26px]
              h-[14px]
              w-[14px]
              rounded-full
              border-[2px]
              border-zinc-900
            "
          />

          {/* 가운데 연결 */}
          <div
            className="
              absolute
              left-1/2
              top-[32px]
              h-[2px]
              w-[10px]
              -translate-x-1/2
              bg-zinc-900
            "
          />
        </div>
      )}

      {/* =================================================
          선글라스
      ================================================= */}

      {glasses === "sunglasses" && (
        <div className="pointer-events-none absolute inset-0 z-30">
          {/* 왼쪽 */}
          <div
            className="
              absolute
              left-[7px]
              top-[27px]
              h-[11px]
              w-[15px]
              rounded-[3px]
              border-[2px]
              border-zinc-900
              bg-zinc-900
            "
          />

          {/* 오른쪽 */}
          <div
            className="
              absolute
              right-[7px]
              top-[27px]
              h-[11px]
              w-[15px]
              rounded-[3px]
              border-[2px]
              border-zinc-900
              bg-zinc-900
            "
          />

          {/* 가운데 */}
          <div
            className="
              absolute
              left-1/2
              top-[31px]
              h-[3px]
              w-[10px]
              -translate-x-1/2
              bg-zinc-900
            "
          />
        </div>
      )}

      {/* =================================================
          리본
      ================================================= */}

      {ribbon && (
        <div
          className="
            pointer-events-none
            absolute
            -right-[9px]
            top-[-5px]
            z-40
            h-[24px]
            w-[30px]
          "
        >
          {/* 왼쪽 리본 */}
          <div
            className="
              absolute
              left-0
              top-[4px]
              h-[15px]
              w-[14px]
              rotate-[-22deg]
              rounded-[70%_30%_60%_40%]
              border-[2px]
              border-zinc-900
              bg-rose-500
            "
          />

          {/* 오른쪽 리본 */}
          <div
            className="
              absolute
              right-0
              top-[4px]
              h-[15px]
              w-[14px]
              rotate-[22deg]
              rounded-[30%_70%_40%_60%]
              border-[2px]
              border-zinc-900
              bg-rose-500
            "
          />

          {/* 가운데 */}
          <div
            className="
              absolute
              left-1/2
              top-[8px]
              h-[10px]
              w-[10px]
              -translate-x-1/2
              rounded-full
              border-[2px]
              border-zinc-900
              bg-rose-400
            "
          />
        </div>
      )}

      {/* =================================================
          캡 모자
      ================================================= */}

      {hat === "cap" && (
        <div className="pointer-events-none absolute inset-0 z-40">
          {/* 모자 윗부분 */}
          <div
            className="
              absolute
              left-1/2
              top-[-12px]
              h-[22px]
              w-[42px]
              -translate-x-1/2
              rounded-t-[50%]
              rounded-b-[8px]
              border-[3px]
              border-zinc-900
              bg-blue-500
            "
          />

          {/* 챙 */}
          <div
            className="
              absolute
              left-[28px]
              top-[4px]
              h-[5px]
              w-[25px]
              rounded-full
              border-[2px]
              border-zinc-900
              bg-blue-500
            "
          />
        </div>
      )}

      {/* =================================================
          파티 모자
      ================================================= */}

      {hat === "party" && (
        <div className="pointer-events-none absolute inset-0 z-40">
          <div
            className="
              absolute
              left-1/2
              top-[-25px]
              h-0
              w-0
              -translate-x-1/2

              border-l-[16px]
              border-r-[16px]
              border-b-[32px]

              border-l-transparent
              border-r-transparent
              border-b-violet-500
            "
          />

          <div
            className="
              absolute
              left-1/2
              top-[-29px]
              h-[8px]
              w-[8px]
              -translate-x-1/2
              rounded-full
              bg-yellow-400
            "
          />
        </div>
      )}

      {/* =================================================
          넥타이
      ================================================= */}

      {/* =================================================
    넥타이
================================================= */}

{tie && (
  <div className="pointer-events-none absolute inset-0 z-30">
    {/* 매듭 */}
    <div
      className="
        absolute
        left-1/2
        top-[50px]
        h-[6px]
        w-[6px]
        -translate-x-1/2
        rotate-45
        rounded-[1px]
        bg-red-600
      "
    />

    {/* 넥타이 본체 */}
    <div
      className="
        absolute
        left-1/2
        top-[55px]
        h-[13px]
        w-[7px]
        -translate-x-1/2
        bg-red-600
        [clip-path:polygon(50%_0%,100%_82%,50%_100%,0%_82%)]
      "
    />
  </div>
)}
    </>
  );
}

export type {
  GlassesType,
  HatType,
};