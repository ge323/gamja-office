"use client";

import Accessories, {
  type GlassesType,
  type HatType,
} from "./Accessories";

export type PotatoColor =
  | "default"
  | "gold"
  | "sweet"
  | "purple"
  | "burnt";

export type PotatoDirection =
  | "down"
  | "up"
  | "left"
  | "right";

type PotatoProps = {
  name?: string;

  glasses?: GlassesType;

  hat?: HatType;

  ribbon?: boolean;

  tie?: boolean;

  moving?: boolean;

  direction?: PotatoDirection;

  color?: PotatoColor;

  /**
   * 캐릭터 전체 확대/축소.
   *
   * 기본값 1.
   *
   * 예:
   * scale={0.8}
   * scale={1.2}
   */
  scale?: number;
};

/* =========================================================
   Colors
========================================================= */

const POTATO_COLORS: Record<
  PotatoColor,
  {
    body: string;
    spot: string;
    shadow: string;
  }
> = {
  default: {
    body: "#d9a15f",
    spot: "#ad733b",
    shadow: "#9c6b38",
  },

  gold: {
    body: "#e5bb55",
    spot: "#b9842c",
    shadow: "#ad7e32",
  },

  sweet: {
    body: "#c98266",
    spot: "#995440",
    shadow: "#8f5544",
  },

  purple: {
    body: "#9a769c",
    spot: "#6f5273",
    shadow: "#6e536f",
  },

  burnt: {
    body: "#5c4033",
    spot: "#241b17",
    shadow: "#30231e",
  },
};

/* =========================================================
   Potato
========================================================= */

export default function Potato({
  name = "감자",

  glasses = "none",

  hat = "none",

  ribbon = false,

  tie = false,

  moving = false,

  direction = "down",

  color = "default",

  scale = 1,
}: PotatoProps) {
  const potatoColor =
    POTATO_COLORS[color];

  const facingDown =
    direction === "down";

  const facingUp =
    direction === "up";

  const facingLeft =
    direction === "left";

  const facingRight =
    direction === "right";

  /* =======================================================
     Direction animation classes
  ======================================================= */

  const stageClass =
    moving
      ? `potato-stage-moving potato-moving-${direction}`
      : "";

  const leftArmClass =
    moving
      ? direction === "up"
        ? "potato-arm-up-left"
        : direction === "left"
          ? "potato-arm-left-facing-left"
          : direction === "right"
            ? "potato-arm-left-facing-right"
            : "potato-arm-down-left"
      : "";

  const rightArmClass =
    moving
      ? direction === "up"
        ? "potato-arm-up-right"
        : direction === "left"
          ? "potato-arm-right-facing-left"
          : direction === "right"
            ? "potato-arm-right-facing-right"
            : "potato-arm-down-right"
      : "";

  return (
    <div className="flex flex-col items-center">
      {/* =====================================================
          Nickname
      ===================================================== */}

      <div
        className="
          relative
          z-20

          -mb-1

          whitespace-nowrap

          text-[11px]
          font-medium
          text-zinc-600
        "
      >
        {name}
      </div>

      {/* =====================================================
          Scale wrapper

          내부 디자인은 항상 80 × 100 비율로 유지하고
          바깥에서 전체를 한 번에 scale 한다.
      ===================================================== */}

      <div
        className="
          relative

          h-[100px]
          w-[80px]

          shrink-0
        "
        style={{
          transform:
            `scale(${scale})`,

          transformOrigin:
            "top center",
        }}
      >
        {/* =================================================
            Character Stage
        ================================================= */}

        <div
          className={`
            relative

            h-full
            w-full

            ${stageClass}
          `}
        >
          {/* =================================================
              Shadow
          ================================================= */}

          <div
            className={`
              absolute

              bottom-[1%]
              left-1/2

              h-[6%]

              -translate-x-1/2

              rounded-full

              bg-zinc-900/10

              transition-all
              duration-150

              ${
                moving
                  ? "w-[34%]"
                  : "w-[42%]"
              }
            `}
          />

          {/* =================================================
              BODY GROUP

              이 박스가 캐릭터의 기준점.
              팔다리도 이 박스를 기준으로 붙는다.
          ================================================= */}

          <div
            className="
              absolute

              left-1/2
              top-[8%]

              h-[75%]
              w-[72.5%]

              -translate-x-1/2
            "
          >
            {/* =============================================
                LEFT ARM

                몸통 좌측 경계에 직접 연결.
            ============================================= */}

            <div
              className={`
                absolute

                left-[-18%]
                top-[53%]

                z-0

                h-[5.3%]
                w-[31%]

                origin-right

                rounded-full

                bg-zinc-900

                ${
                  moving
                    ? leftArmClass
                    : "rotate-[25deg]"
                }
              `}
            />

            {/* =============================================
                RIGHT ARM
            ============================================= */}

            <div
              className={`
                absolute

                right-[-18%]
                top-[53%]

                z-0

                h-[5.3%]
                w-[31%]

                origin-left

                rounded-full

                bg-zinc-900

                ${
                  moving
                    ? rightArmClass
                    : "-rotate-[25deg]"
                }
              `}
            />

            {/* =============================================
                LEFT LEG

                몸 아래에서 시작하도록 body 기준 배치.
            ============================================= */}

            <div
              className={`
                absolute

                bottom-[-24%]
                left-[33%]

                z-0

                h-[27%]
                w-[6.5%]

                origin-top

                rounded-full

                bg-zinc-900

                ${
                  moving
                    ? "potato-leg-left"
                    : ""
                }
              `}
            />

            {/* =============================================
                RIGHT LEG
            ============================================= */}

            <div
              className={`
                absolute

                bottom-[-24%]
                right-[33%]

                z-0

                h-[27%]
                w-[6.5%]

                origin-top

                rounded-full

                bg-zinc-900

                ${
                  moving
                    ? "potato-leg-right"
                    : ""
                }
              `}
            />

            {/* =============================================
                Potato Body

                팔다리보다 z-index가 높아서
                연결 부위를 자연스럽게 가린다.
            ============================================= */}

            <div
              className="
                absolute
                inset-0

                z-10

                overflow-visible

                rounded-[48%_52%_46%_54%/42%_46%_54%_58%]

                border-[4px]
                border-zinc-900
              "
              style={{
                backgroundColor:
                  potatoColor.body,

                boxShadow:
                  `inset -5px -5px 0 ${potatoColor.shadow}33`,
              }}
            >
              {/* =========================================
                  Potato Spots
              ========================================= */}

              <PotatoSpot
                left="17%"
                top="15%"
                color={
                  potatoColor.spot
                }
              />

              <PotatoSpot
                right="15%"
                top="22%"
                color={
                  potatoColor.spot
                }
              />

              <PotatoSpot
                left="13%"
                top="56%"
                color={
                  potatoColor.spot
                }
              />

              <PotatoSpot
                right="18%"
                bottom="14%"
                color={
                  potatoColor.spot
                }
              />

              <PotatoSpot
                left="43%"
                top="10%"
                size={2}
                color={
                  potatoColor.spot
                }
              />

              {/* =========================================
                  DOWN
                  정면
              ========================================= */}

              {facingDown && (
                <>
                  {/* Cheeks */}

                  <div
                    className="
                      absolute

                      left-[12%]
                      top-[54%]

                      h-[7%]
                      w-[13%]

                      rounded-full

                      bg-rose-300/60
                    "
                  />

                  <div
                    className="
                      absolute

                      right-[12%]
                      top-[54%]

                      h-[7%]
                      w-[13%]

                      rounded-full

                      bg-rose-300/60
                    "
                  />

                  {/* Eyes */}

                  <div
                    className="
                      absolute

                      left-[21%]
                      top-[40%]

                      h-[8%]
                      w-[10%]

                      rounded-[1px]

                      bg-zinc-900
                    "
                  />

                  <div
                    className="
                      absolute

                      right-[21%]
                      top-[40%]

                      h-[8%]
                      w-[10%]

                      rounded-[1px]

                      bg-zinc-900
                    "
                  />

                  {/* Mouth */}

                  <div
                    className="
                      absolute

                      left-1/2
                      top-[59%]

                      h-[7%]
                      w-[21%]

                      -translate-x-1/2

                      border-b-[3px]
                      border-zinc-900
                    "
                  />

                  <Accessories
                    glasses={
                      glasses
                    }
                    hat={
                      hat
                    }
                    ribbon={
                      ribbon
                    }
                    tie={
                      tie
                    }
                  />
                </>
              )}

              {/* =========================================
                  UP
                  뒷모습
              ========================================= */}

              {facingUp && (
                <>
                  {/* 뒤통수 하이라이트 */}

                  <div
                    className="
                      absolute

                      left-[15%]
                      top-[17%]

                      h-[24%]
                      w-[20%]

                      rotate-[20deg]

                      rounded-full

                      bg-white/10
                    "
                  />

                  {/* Back spots */}

                  <PotatoSpot
                    right="24%"
                    top="39%"
                    size={4}
                    color={
                      potatoColor.spot
                    }
                  />

                  <PotatoSpot
                    left="34%"
                    top="60%"
                    color={
                      potatoColor.spot
                    }
                  />

                  {/* 뒤에서도 모자 / 리본 유지 */}

                  <Accessories
                    glasses="none"
                    hat={
                      hat
                    }
                    ribbon={
                      ribbon
                    }
                    tie={false}
                  />
                </>
              )}

              {/* =========================================
                  LEFT
              ========================================= */}

              {facingLeft && (
                <>
                  {/* Eye */}

                  <div
                    className="
                      absolute

                      left-[16%]
                      top-[40%]

                      h-[9%]
                      w-[10%]

                      rounded-[2px]

                      bg-zinc-900
                    "
                  />

                  {/* Cheek */}

                  <div
                    className="
                      absolute

                      left-[10%]
                      top-[54%]

                      h-[7%]
                      w-[13%]

                      rounded-full

                      bg-rose-300/60
                    "
                  />

                  {/* Mouth */}

                  <div
                    className="
                      absolute

                      left-[15%]
                      top-[63%]

                      h-[5%]
                      w-[16%]

                      border-b-[3px]
                      border-zinc-900
                    "
                  />

                  <Accessories
                    glasses={
                      glasses
                    }
                    hat={
                      hat
                    }
                    ribbon={
                      ribbon
                    }
                    tie={
                      tie
                    }
                  />
                </>
              )}

              {/* =========================================
                  RIGHT
              ========================================= */}

              {facingRight && (
                <>
                  {/* Eye */}

                  <div
                    className="
                      absolute

                      right-[16%]
                      top-[40%]

                      h-[9%]
                      w-[10%]

                      rounded-[2px]

                      bg-zinc-900
                    "
                  />

                  {/* Cheek */}

                  <div
                    className="
                      absolute

                      right-[10%]
                      top-[54%]

                      h-[7%]
                      w-[13%]

                      rounded-full

                      bg-rose-300/60
                    "
                  />

                  {/* Mouth */}

                  <div
                    className="
                      absolute

                      right-[15%]
                      top-[63%]

                      h-[5%]
                      w-[16%]

                      border-b-[3px]
                      border-zinc-900
                    "
                  />

                  <Accessories
                    glasses={
                      glasses
                    }
                    hat={
                      hat
                    }
                    ribbon={
                      ribbon
                    }
                    tie={
                      tie
                    }
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          Animation

          모든 애니메이션은 캐릭터 자체 좌표만 변경.
          화면 해상도에는 의존하지 않는다.
      ===================================================== */}

      <style>{`
        @keyframes potatoBounceDown {
          0% {
            transform: translateY(0px);
          }

          50% {
            transform: translateY(-4px);
          }

          100% {
            transform: translateY(0px);
          }
        }

        @keyframes potatoBounceUp {
          0% {
            transform: translateY(0px);
          }

          50% {
            transform: translateY(-3px);
          }

          100% {
            transform: translateY(0px);
          }
        }

        @keyframes potatoBounceSide {
          0% {
            transform: translateY(0px) rotate(0deg);
          }

          25% {
            transform: translateY(-2px) rotate(-1deg);
          }

          50% {
            transform: translateY(-4px) rotate(0deg);
          }

          75% {
            transform: translateY(-2px) rotate(1deg);
          }

          100% {
            transform: translateY(0px) rotate(0deg);
          }
        }

        @keyframes armDownLeft {
          0% {
            transform: rotate(20deg);
          }

          50% {
            transform: rotate(45deg);
          }

          100% {
            transform: rotate(20deg);
          }
        }

        @keyframes armDownRight {
          0% {
            transform: rotate(-20deg);
          }

          50% {
            transform: rotate(-45deg);
          }

          100% {
            transform: rotate(-20deg);
          }
        }

        @keyframes armUpLeft {
          0% {
            transform: rotate(40deg);
          }

          50% {
            transform: rotate(12deg);
          }

          100% {
            transform: rotate(40deg);
          }
        }

        @keyframes armUpRight {
          0% {
            transform: rotate(-40deg);
          }

          50% {
            transform: rotate(-12deg);
          }

          100% {
            transform: rotate(-40deg);
          }
        }

        @keyframes armLeftFacingLeft {
          0% {
            transform: rotate(12deg);
          }

          50% {
            transform: rotate(38deg);
          }

          100% {
            transform: rotate(12deg);
          }
        }

        @keyframes armRightFacingLeft {
          0% {
            transform: rotate(-32deg);
          }

          50% {
            transform: rotate(-10deg);
          }

          100% {
            transform: rotate(-32deg);
          }
        }

        @keyframes armLeftFacingRight {
          0% {
            transform: rotate(32deg);
          }

          50% {
            transform: rotate(10deg);
          }

          100% {
            transform: rotate(32deg);
          }
        }

        @keyframes armRightFacingRight {
          0% {
            transform: rotate(-12deg);
          }

          50% {
            transform: rotate(-38deg);
          }

          100% {
            transform: rotate(-12deg);
          }
        }

        @keyframes legLeft {
          0% {
            transform: rotate(11deg);
          }

          50% {
            transform: rotate(-11deg);
          }

          100% {
            transform: rotate(11deg);
          }
        }

        @keyframes legRight {
          0% {
            transform: rotate(-11deg);
          }

          50% {
            transform: rotate(11deg);
          }

          100% {
            transform: rotate(-11deg);
          }
        }

        .potato-moving-down {
          animation:
            potatoBounceDown
            0.34s
            ease-in-out
            infinite;
        }

        .potato-moving-up {
          animation:
            potatoBounceUp
            0.34s
            ease-in-out
            infinite;
        }

        .potato-moving-left,
        .potato-moving-right {
          animation:
            potatoBounceSide
            0.34s
            ease-in-out
            infinite;
        }

        .potato-arm-down-left {
          animation:
            armDownLeft
            0.34s
            ease-in-out
            infinite;
        }

        .potato-arm-down-right {
          animation:
            armDownRight
            0.34s
            ease-in-out
            infinite;
        }

        .potato-arm-up-left {
          animation:
            armUpLeft
            0.34s
            ease-in-out
            infinite;
        }

        .potato-arm-up-right {
          animation:
            armUpRight
            0.34s
            ease-in-out
            infinite;
        }

        .potato-arm-left-facing-left {
          animation:
            armLeftFacingLeft
            0.34s
            ease-in-out
            infinite;
        }

        .potato-arm-right-facing-left {
          animation:
            armRightFacingLeft
            0.34s
            ease-in-out
            infinite;
        }

        .potato-arm-left-facing-right {
          animation:
            armLeftFacingRight
            0.34s
            ease-in-out
            infinite;
        }

        .potato-arm-right-facing-right {
          animation:
            armRightFacingRight
            0.34s
            ease-in-out
            infinite;
        }

        .potato-leg-left {
          animation:
            legLeft
            0.34s
            ease-in-out
            infinite;
        }

        .potato-leg-right {
          animation:
            legRight
            0.34s
            ease-in-out
            infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .potato-stage-moving,
          .potato-arm-down-left,
          .potato-arm-down-right,
          .potato-arm-up-left,
          .potato-arm-up-right,
          .potato-arm-left-facing-left,
          .potato-arm-right-facing-left,
          .potato-arm-left-facing-right,
          .potato-arm-right-facing-right,
          .potato-leg-left,
          .potato-leg-right {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

/* =========================================================
   Potato Spot
========================================================= */

type PotatoSpotProps = {
  left?: string;

  right?: string;

  top?: string;

  bottom?: string;

  size?: number;

  color: string;
};

function PotatoSpot({
  left,

  right,

  top,

  bottom,

  size = 3,

  color,
}: PotatoSpotProps) {
  return (
    <div
      className="
        absolute

        rounded-full
      "
      style={{
        left,

        right,

        top,

        bottom,

        width:
          `${size}px`,

        height:
          `${size}px`,

        backgroundColor:
          color,
      }}
    />
  );
}