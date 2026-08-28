"use client";

import Accessories, {
  type GlassesType,
  type HatType,
} from "./Accessories";

/* =========================================================
   Types
========================================================= */

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

export type HairType =
  | "none"
  | "short"
  | "side"
  | "middle"
  | "bob"
  | "curly"
  | "ponytail"
  | "bun"
  | "braid"
  | "spike"
  | "long";

export type HairColor =
  | "black"
  | "brown"
  | "blonde"
  | "pink"
  | "blue";

export type EyeType =
  | "dot"
  | "round"
  | "smile"
  | "sleepy"
  | "sparkle"
  | "wink"
  | "puppy";

export type MouthType =
  | "default"
  | "smile"
  | "open"
  | "cat"
  | "pout"
  | "flat";

type PotatoProps = {
  name?: string;

  glasses?: GlassesType;
  hat?: HatType;

  ribbon?: boolean;
  tie?: boolean;

  moving?: boolean;

  direction?: PotatoDirection;

  color?: PotatoColor;

  hair?: HairType;
  hairColor?: HairColor;
  eyes?: EyeType;
  mouth?: MouthType;
  blush?: boolean;
  freckles?: boolean;

  /*
   * 로비 등에서 캐릭터 크기를 조절할 때 사용
   *
   * 기본: 1
   */
  scale?: number;

  /*
   * 감자 전쟁 상태
   */
  ghost?: boolean;

  /*
   * 악마가 공격 모션 중인지
   */
  attacking?: boolean;

  /*
   * 악마 역할인지
   */
  evil?: boolean;

  /*
   * 공격당한 순간
   */
  hit?: boolean;
};

/* =========================================================
   Colors
========================================================= */

const HAIR_COLORS: Record<HairColor, string> = {
  black: "#27272a",
  brown: "#6b4423",
  blonde: "#e7c56a",
  pink: "#d66d8f",
  blue: "#5f78b8",
};

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

  hair = "none",
  hairColor = "brown",
  eyes = "dot",
  mouth = "default",
  blush = true,
  freckles = false,

  scale = 1,

  ghost = false,
  attacking = false,
  evil = false,
  hit = false,
}: PotatoProps) {
  const potatoColor =
    POTATO_COLORS[color];

  const resolvedHairColor =
    HAIR_COLORS[hairColor];

  const facingDown =
    direction === "down";

  const facingUp =
    direction === "up";

  const facingLeft =
    direction === "left";

  const facingRight =
    direction === "right";

  const facingSide =
    facingLeft ||
    facingRight;

  /* =======================================================
     Character animation
  ======================================================= */

  const characterAnimation =
    ghost
      ? "potato-ghost-float"
      : hit
        ? "potato-hit"
        : attacking
          ? "potato-attack-body"
          : moving
            ? "potato-direction-bounce"
            : "";

  return (
    <div className="flex flex-col items-center">
      {/* =====================================================
          Nickname
      ===================================================== */}

      <div
        className={`
          -mb-1

          whitespace-nowrap

          text-[11px]
          font-medium

          ${
            ghost
              ? "text-sky-300"
              : evil
                ? "text-red-500"
                : "text-zinc-600"
          }
        `}
      >
        {ghost && "👻 "}
        {name}
      </div>

      {/* =====================================================
          Scale wrapper

          실제 캐릭터 좌표는 항상 80 x 100 유지.
          해상도와 상관없이 한 덩어리로 확대/축소된다.
      ===================================================== */}

      <div
        className="relative shrink-0"
        style={{
          width:
            80 * scale,

          height:
            100 * scale,
        }}
      >
        <div
          className={`
            relative

            h-[100px]
            w-[80px]

            origin-top-left

            ${characterAnimation}

            ${
              !moving &&
              !attacking &&
              facingLeft
                ? "potato-lean-left"
                : ""
            }

            ${
              !moving &&
              !attacking &&
              facingRight
                ? "potato-lean-right"
                : ""
            }
          `}
          style={{
            transform:
              `scale(${scale})`,

            /*
             * ghost 상태에서도 클릭 판정 등의
             * 실제 크기는 유지한다.
             */
            opacity:
              ghost
                ? 0.65
                : 1,
          }}
        >
          {/* =================================================
              Ghost Aura
          ================================================= */}

          {ghost && (
            <>
              <div
                className="
                  pointer-events-none

                  absolute

                  left-1/2
                  top-[2px]

                  h-[84px]
                  w-[68px]

                  -translate-x-1/2

                  rounded-[50%]

                  bg-sky-300/15

                  blur-[8px]
                "
              />

              <div
                className="
                  pointer-events-none

                  absolute

                  left-1/2
                  top-[8px]

                  h-[75px]
                  w-[58px]

                  -translate-x-1/2

                  rounded-[50%]

                  border
                  border-sky-200/50
                "
              />
            </>
          )}

          {/* =================================================
              Evil Aura
          ================================================= */}

          {evil &&
            !ghost && (
              <div
                className="
                  pointer-events-none

                  absolute

                  left-1/2
                  top-[7px]

                  h-[77px]
                  w-[61px]

                  -translate-x-1/2

                  rounded-[50%]

                  bg-red-500/10

                  blur-[7px]
                "
              />
            )}

          {/* =================================================
                Left Arm
          ================================================= */}

          <div
            className={`
              absolute

              left-[-1px]
              top-[48px]

              z-[5]

              h-[4px]
              w-[23px]

              origin-right

              rounded-full

              ${
                ghost
                  ? "bg-sky-950/70"
                  : "bg-zinc-900"
              }

              ${
                attacking
                  ? "potato-attack-left-arm"
                  : moving
                    ? facingUp
                      ? "potato-arm-up-left"
                      : facingSide
                        ? "potato-arm-side-left"
                        : "potato-arm-left"
                    : "rotate-[25deg]"
              }
            `}
          />

          {/* =================================================
              Right Arm
          ================================================= */}

          <div
            className={`
              absolute

              right-[-1px]
              top-[48px]

              z-[5]

              h-[4px]
              w-[23px]

              origin-left

              rounded-full

              ${
                ghost
                  ? "bg-sky-950/70"
                  : "bg-zinc-900"
              }

              ${
                attacking
                  ? "potato-attack-right-arm"
                  : moving
                    ? facingUp
                      ? "potato-arm-up-right"
                      : facingSide
                        ? "potato-arm-side-right"
                        : "potato-arm-right"
                    : "-rotate-[25deg]"
              }
            `}
          />

          {/* =================================================
              Knife

              공격 중인 악마에게만 표시.
          ================================================= */}

          {attacking &&
            !ghost && (
              <div
                className="
                  potato-knife

                  pointer-events-none

                  absolute

                  right-[-6px]
                  top-[28px]

                  z-30

                  h-[42px]
                  w-[24px]

                  origin-bottom-left
                "
              >
                {/* Blade */}

                <div
                  className="
                    absolute

                    left-[8px]
                    top-0

                    h-[27px]
                    w-[8px]

                    -rotate-[12deg]

                    rounded-t-full

                    border
                    border-zinc-500

                    bg-zinc-200

                    shadow
                  "
                >
                  <div
                    className="
                      absolute

                      right-[1px]
                      top-[3px]

                      h-[18px]
                      w-[2px]

                      bg-white/80
                    "
                  />
                </div>

                {/* Handle */}

                <div
                  className="
                    absolute

                    bottom-0
                    left-[7px]

                    h-[16px]
                    w-[10px]

                    -rotate-[12deg]

                    rounded-sm

                    border
                    border-zinc-950

                    bg-[#6f3d28]
                  "
                />
              </div>
            )}

          {/* =================================================
              Left Leg
          ================================================= */}

          <div
            className={`
              absolute

              bottom-[5px]
              left-[29px]

              z-0

              h-[21px]
              w-[4px]

              origin-top

              rounded-full

              ${
                ghost
                  ? "bg-sky-950/60"
                  : "bg-zinc-900"
              }

              ${
                moving &&
                !ghost
                  ? "potato-leg-left"
                  : ""
              }
            `}
          />

          {/* =================================================
              Right Leg
          ================================================= */}

          <div
            className={`
              absolute

              bottom-[5px]
              right-[29px]

              z-0

              h-[21px]
              w-[4px]

              origin-top

              rounded-full

              ${
                ghost
                  ? "bg-sky-950/60"
                  : "bg-zinc-900"
              }

              ${
                moving &&
                !ghost
                  ? "potato-leg-right"
                  : ""
              }
            `}
          />

          {/* =================================================
              Shadow

              유령은 그림자가 매우 약함.
          ================================================= */}

          <div
            className={`
              absolute

              bottom-[1px]
              left-1/2

              h-[6px]

              -translate-x-1/2

              rounded-full

              transition-all
              duration-150

              ${
                ghost
                  ? "w-[22px] bg-sky-900/5"
                  : moving
                    ? "w-[28px] bg-zinc-900/10"
                    : "w-[34px] bg-zinc-900/10"
              }
            `}
          />

          {/* =================================================
              Body
          ================================================= */}

          <div
            className={`
              absolute

              left-1/2
              top-[8px]

              z-10

              h-[75px]
              w-[58px]

              -translate-x-1/2

              rounded-[48%_52%_46%_54%/42%_46%_54%_58%]

              border-[4px]

              ${
                ghost
                  ? "border-sky-950/70"
                  : hit
                    ? "border-red-600"
                    : "border-zinc-900"
              }

              transition
              duration-100
            `}
            style={{
              backgroundColor:
                ghost
                  ? "#b8dcea"
                  : hit
                    ? "#ef8b7f"
                    : potatoColor.body,

              boxShadow:
                ghost
                  ? "inset -5px -5px 0 rgba(50,100,130,0.15)"
                  : evil
                    ? `inset -5px -5px 0 ${potatoColor.shadow}33, 0 0 12px rgba(239,68,68,0.30)`
                    : `inset -5px -5px 0 ${potatoColor.shadow}33`,
            }}
          >
            {/* =============================================
                Potato spots
            ============================================= */}

            <PotatoSpot
              left={10}
              top={12}
              color={
                ghost
                  ? "#73a6b8"
                  : potatoColor.spot
              }
            />

            <PotatoSpot
              right={9}
              top={17}
              color={
                ghost
                  ? "#73a6b8"
                  : potatoColor.spot
              }
            />

            <PotatoSpot
              left={7}
              top={42}
              color={
                ghost
                  ? "#73a6b8"
                  : potatoColor.spot
              }
            />

            <PotatoSpot
              right={10}
              bottom={10}
              color={
                ghost
                  ? "#73a6b8"
                  : potatoColor.spot
              }
            />

            <HairLayer
              type={hair}
              color={resolvedHairColor}
              direction={direction}
              ghost={ghost}
            />

            {/* =============================================
                HIT FACE

                피격 중에는 방향 얼굴보다 이 얼굴을 우선 표시.
            ============================================= */}

            {hit &&
              !ghost && (
                <>
                  {/* 왼쪽 눈 */}

                  <div
                    className="
                      absolute

                      left-[10px]
                      top-[29px]

                      h-[8px]
                      w-[8px]

                      rotate-45
                    "
                  >
                    <div
                      className="
                        absolute
                        left-1/2
                        top-0

                        h-full
                        w-[2px]

                        -translate-x-1/2

                        bg-zinc-900
                      "
                    />

                    <div
                      className="
                        absolute
                        left-0
                        top-1/2

                        h-[2px]
                        w-full

                        -translate-y-1/2

                        bg-zinc-900
                      "
                    />
                  </div>

                  {/* 오른쪽 눈 */}

                  <div
                    className="
                      absolute

                      right-[10px]
                      top-[29px]

                      h-[8px]
                      w-[8px]

                      rotate-45
                    "
                  >
                    <div
                      className="
                        absolute
                        left-1/2
                        top-0

                        h-full
                        w-[2px]

                        -translate-x-1/2

                        bg-zinc-900
                      "
                    />

                    <div
                      className="
                        absolute
                        left-0
                        top-1/2

                        h-[2px]
                        w-full

                        -translate-y-1/2

                        bg-zinc-900
                      "
                    />
                  </div>

                  {/* 놀란 입 */}

                  <div
                    className="
                      absolute

                      left-1/2
                      top-[45px]

                      h-[9px]
                      w-[9px]

                      -translate-x-1/2

                      rounded-full

                      border-[2px]
                      border-zinc-900
                    "
                  />

                  {/* 충격 표시 */}

                  <div
                    className="
                      absolute

                      -right-[13px]
                      -top-[10px]

                      text-[18px]
                      font-black

                      text-red-600
                    "
                  >
                    !
                  </div>
                </>
              )}

            {/* =============================================
                DOWN / FRONT
            ============================================= */}

            {!hit &&
              facingDown && (
                <>
                  {/* Face points */}

                  {!evil && blush && (
                    <>
                      <div className="absolute z-[33] left-[7px] top-[40px] h-[5px] w-[7px] rounded-full bg-rose-300/60" />
                      <div className="absolute z-[33] right-[7px] top-[40px] h-[5px] w-[7px] rounded-full bg-rose-300/60" />
                    </>
                  )}

                  {!evil && freckles && (
                    <Freckles direction="down" ghost={ghost} />
                  )}

                  {/* =====================================
                      Normal eyes
                  ===================================== */}

                  {!evil &&
                    glasses !==
                      "sunglasses" && (
                    <EyePair
                      type={eyes}
                      direction="down"
                      ghost={ghost}
                    />
                  )}

                  {/* =====================================
                      Evil eyes
                  ===================================== */}

                  {evil && (
                    <>
                      <div
                        className="
                          absolute

                          left-[9px]
                          top-[28px]

                          h-[9px]
                          w-[12px]

                          rotate-[13deg]

                          border-b-[4px]
                          border-red-700
                        "
                      />

                      <div
                        className="
                          absolute

                          right-[9px]
                          top-[28px]

                          h-[9px]
                          w-[12px]

                          -rotate-[13deg]

                          border-b-[4px]
                          border-red-700
                        "
                      />

                      <div
                        className="
                          absolute

                          left-[14px]
                          top-[33px]

                          h-[4px]
                          w-[4px]

                          rounded-full

                          bg-zinc-950
                        "
                      />

                      <div
                        className="
                          absolute

                          right-[14px]
                          top-[33px]

                          h-[4px]
                          w-[4px]

                          rounded-full

                          bg-zinc-950
                        "
                      />
                    </>
                  )}

                  {/* Mouth */}

                  {evil ? (
                    <div
                      className="
                        absolute
                        left-1/2
                        top-[45px]
                        h-[9px]
                        w-[18px]
                        -translate-x-1/2
                        rounded-b-full
                        border-b-[3px]
                        border-zinc-950
                      "
                    >
                      <div className="absolute bottom-[-2px] left-[3px] h-[5px] w-[4px] rotate-[12deg] bg-white [clip-path:polygon(0_0,100%_0,50%_100%)]" />
                      <div className="absolute bottom-[-2px] right-[3px] h-[5px] w-[4px] -rotate-[12deg] bg-white [clip-path:polygon(0_0,100%_0,50%_100%)]" />
                    </div>
                  ) : (
                    <MouthFace
                      type={mouth}
                      direction="down"
                      ghost={ghost}
                    />
                  )}

                  <Accessories
                    glasses={glasses}
                    hat={hat}
                    ribbon={ribbon}
                    tie={tie}
                    direction={direction}
                  />
                </>
              )}

            {/* =============================================
                UP / BACK
            ============================================= */}

            {!hit &&
              facingUp && (
                <>
                  <div
                    className="
                      absolute

                      left-[8px]
                      top-[12px]

                      h-[18px]
                      w-[12px]

                      rotate-[20deg]

                      rounded-full

                      bg-white/10
                    "
                  />

                  <PotatoSpot
                    right={14}
                    top={31}
                    size={4}
                    color={
                      ghost
                        ? "#73a6b8"
                        : potatoColor.spot
                    }
                  />

                  <PotatoSpot
                    left={19}
                    top={45}
                    color={
                      ghost
                        ? "#73a6b8"
                        : potatoColor.spot
                    }
                  />

                  {/* 악마 뿔 */}

                  {evil &&
                    !ghost && (
                      <>
                        <div
                          className="
                            absolute

                            -left-[3px]
                            top-[-8px]

                            h-[16px]
                            w-[11px]

                            -rotate-[20deg]

                            bg-red-800

                            [clip-path:polygon(50%_0,100%_100%,0_100%)]
                          "
                        />

                        <div
                          className="
                            absolute

                            -right-[3px]
                            top-[-8px]

                            h-[16px]
                            w-[11px]

                            rotate-[20deg]

                            bg-red-800

                            [clip-path:polygon(50%_0,100%_100%,0_100%)]
                          "
                        />
                      </>
                    )}

                  <Accessories
                    glasses={glasses}
                    hat={hat}
                    ribbon={ribbon}
                    tie={tie}
                    direction={direction}
                  />
                </>
              )}

            {/* =============================================
                LEFT
            ============================================= */}

            {!hit &&
              facingLeft && (
                <>
                  {!evil ? (
                    glasses !==
                    "sunglasses" ? (
                      <EyePair
                        type={eyes}
                        direction="left"
                        ghost={ghost}
                      />
                    ) : null
                  ) : (
                    <div className="absolute left-[10px] top-[31px] h-[7px] w-[6px] rounded-[2px] bg-red-800" />
                  )}

                  {!evil && blush && (
                    <div className="absolute z-[33] left-[7px] top-[41px] h-[5px] w-[7px] rounded-full bg-rose-300/60" />
                  )}

                  {!evil && freckles && (
                    <Freckles direction="left" ghost={ghost} />
                  )}

                  {evil ? (
                    <div className="absolute left-[9px] top-[48px] h-[3px] w-[9px] border-b-[3px] border-red-900" />
                  ) : (
                    <MouthFace type={mouth} direction="left" ghost={ghost} />
                  )}

                  {evil &&
                    !ghost && (
                      <div
                        className="
                          absolute

                          -left-[4px]
                          top-[-7px]

                          h-[16px]
                          w-[11px]

                          -rotate-[24deg]

                          bg-red-800

                          [clip-path:polygon(50%_0,100%_100%,0_100%)]
                        "
                      />
                    )}

                  <Accessories
                    glasses={glasses}
                    hat={hat}
                    ribbon={ribbon}
                    tie={tie}
                    direction={direction}
                  />
                </>
              )}

            {/* =============================================
                RIGHT
            ============================================= */}

            {!hit &&
              facingRight && (
                <>
                  {!evil ? (
                    glasses !==
                    "sunglasses" ? (
                      <EyePair
                        type={eyes}
                        direction="right"
                        ghost={ghost}
                      />
                    ) : null
                  ) : (
                    <div className="absolute right-[10px] top-[31px] h-[7px] w-[6px] rounded-[2px] bg-red-800" />
                  )}

                  {!evil && blush && (
                    <div className="absolute z-[33] right-[7px] top-[41px] h-[5px] w-[7px] rounded-full bg-rose-300/60" />
                  )}

                  {!evil && freckles && (
                    <Freckles direction="right" ghost={ghost} />
                  )}

                  {evil ? (
                    <div className="absolute right-[9px] top-[48px] h-[3px] w-[9px] border-b-[3px] border-red-900" />
                  ) : (
                    <MouthFace type={mouth} direction="right" ghost={ghost} />
                  )}

                  {evil &&
                    !ghost && (
                      <div
                        className="
                          absolute

                          -right-[4px]
                          top-[-7px]

                          h-[16px]
                          w-[11px]

                          rotate-[24deg]

                          bg-red-800

                          [clip-path:polygon(50%_0,100%_100%,0_100%)]
                        "
                      />
                    )}

                  <Accessories
                    glasses={glasses}
                    hat={hat}
                    ribbon={ribbon}
                    tie={tie}
                    direction={direction}
                  />
                </>
              )}

            {/* =============================================
                Ghost Face Overlay

                유령은 기존 방향 얼굴 위에
                작은 유령 표시를 추가한다.
            ============================================= */}

            {ghost && (
              <div
                className="
                  pointer-events-none

                  absolute

                  -right-[7px]
                  -top-[9px]

                  flex
                  h-[19px]
                  w-[19px]

                  items-center
                  justify-center

                  rounded-full

                  border
                  border-sky-100/70

                  bg-sky-500/80

                  text-[10px]

                  shadow
                "
              >
                👻
              </div>
            )}
          </div>

          {/* =================================================
              Attack effect
          ================================================= */}

          {attacking &&
            !ghost && (
              <div
                className="
                  potato-slash

                  pointer-events-none

                  absolute

                  right-[-18px]
                  top-[16px]

                  z-40

                  h-[58px]
                  w-[58px]

                  rounded-full

                  border-r-[4px]
                  border-t-[4px]
                  border-red-400/80
                "
              />
            )}

          {/* =================================================
              Hit flash
          ================================================= */}

          {hit &&
            !ghost && (
              <div
                className="
                  potato-hit-flash

                  pointer-events-none

                  absolute

                  -inset-[8px]

                  z-50

                  rounded-full

                  border-[3px]
                  border-red-400/70
                "
              />
            )}
        </div>
      </div>

      {/* =====================================================
          Animation CSS
      ===================================================== */}

      <style>{`
        @keyframes directionBounce {
          0%,
          100% {
            translate: 0 0;
          }

          50% {
            translate: 0 -4px;
          }
        }

        @keyframes armLeft {
          0%,
          100% {
            transform: rotate(18deg);
          }

          50% {
            transform: rotate(48deg);
          }
        }

        @keyframes armRight {
          0%,
          100% {
            transform: rotate(-18deg);
          }

          50% {
            transform: rotate(-48deg);
          }
        }

        @keyframes armUpLeft {
          0%,
          100% {
            transform: rotate(42deg);
          }

          50% {
            transform: rotate(12deg);
          }
        }

        @keyframes armUpRight {
          0%,
          100% {
            transform: rotate(-42deg);
          }

          50% {
            transform: rotate(-12deg);
          }
        }

        @keyframes sideArmLeft {
          0%,
          100% {
            transform: rotate(10deg);
          }

          50% {
            transform: rotate(52deg);
          }
        }

        @keyframes sideArmRight {
          0%,
          100% {
            transform: rotate(-52deg);
          }

          50% {
            transform: rotate(-10deg);
          }
        }

        @keyframes legLeft {
          0%,
          100% {
            transform: rotate(13deg);
          }

          50% {
            transform: rotate(-13deg);
          }
        }

        @keyframes legRight {
          0%,
          100% {
            transform: rotate(-13deg);
          }

          50% {
            transform: rotate(13deg);
          }
        }

        /* ===============================================
           Ghost
        =============================================== */

        @keyframes ghostFloat {
          0%,
          100% {
            translate: 0 -2px;
          }

          50% {
            translate: 0 -10px;
          }
        }

        /* ===============================================
           Attack
        =============================================== */

        @keyframes attackBody {
          0% {
            translate: 0 0;
          }

          35% {
            translate: 7px -1px;
          }

          65% {
            translate: 9px 1px;
          }

          100% {
            translate: 0 0;
          }
        }

        @keyframes attackRightArm {
          0% {
            transform: rotate(-25deg);
          }

          40% {
            transform: rotate(-100deg);
          }

          70% {
            transform: rotate(15deg);
          }

          100% {
            transform: rotate(-25deg);
          }
        }

        @keyframes attackLeftArm {
          0%,
          100% {
            transform: rotate(25deg);
          }

          50% {
            transform: rotate(5deg);
          }
        }

        @keyframes knifeSwing {
          0% {
            transform: rotate(-45deg);
          }

          45% {
            transform: rotate(45deg);
          }

          100% {
            transform: rotate(-15deg);
          }
        }

        @keyframes slash {
          0% {
            opacity: 0;
            transform: rotate(-30deg) scale(0.6);
          }

          40% {
            opacity: 1;
          }

          100% {
            opacity: 0;
            transform: rotate(35deg) scale(1.15);
          }
        }

        /* ===============================================
           Hit
        =============================================== */

        @keyframes hitShake {
          0% {
            translate: 0 0;
          }

          20% {
            translate: -6px 0;
          }

          40% {
            translate: 6px -2px;
          }

          60% {
            translate: -5px 1px;
          }

          80% {
            translate: 4px 0;
          }

          100% {
            translate: 0 0;
          }
        }

        @keyframes hitFlash {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }

          40% {
            opacity: 1;
          }

          100% {
            opacity: 0;
            transform: scale(1.25);
          }
        }

        /* ===============================================
           Classes
        =============================================== */

        .potato-direction-bounce {
          animation:
            directionBounce
            0.34s
            ease-in-out
            infinite;
        }

        .potato-arm-left {
          animation:
            armLeft
            0.34s
            ease-in-out
            infinite;
        }

        .potato-arm-right {
          animation:
            armRight
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

        .potato-arm-side-left {
          animation:
            sideArmLeft
            0.34s
            ease-in-out
            infinite;
        }

        .potato-arm-side-right {
          animation:
            sideArmRight
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

        .potato-lean-left {
          rotate: -2deg;
        }

        .potato-lean-right {
          rotate: 2deg;
        }

        .potato-ghost-float {
          animation:
            ghostFloat
            1.4s
            ease-in-out
            infinite;
        }

        .potato-attack-body {
          animation:
            attackBody
            0.48s
            ease-out
            1;
        }

        .potato-attack-left-arm {
          animation:
            attackLeftArm
            0.48s
            ease-out
            1;
        }

        .potato-attack-right-arm {
          animation:
            attackRightArm
            0.48s
            ease-out
            1;
        }

        .potato-knife {
          animation:
            knifeSwing
            0.48s
            ease-out
            1;
        }

        .potato-slash {
          animation:
            slash
            0.48s
            ease-out
            1;
        }

        .potato-hit {
          animation:
            hitShake
            0.48s
            ease-out
            1;
        }

        .potato-hit-flash {
          animation:
            hitFlash
            0.48s
            ease-out
            1;
        }

        @media (prefers-reduced-motion: reduce) {
          .potato-direction-bounce,
          .potato-arm-left,
          .potato-arm-right,
          .potato-arm-up-left,
          .potato-arm-up-right,
          .potato-arm-side-left,
          .potato-arm-side-right,
          .potato-leg-left,
          .potato-leg-right,
          .potato-ghost-float,
          .potato-attack-body,
          .potato-attack-left-arm,
          .potato-attack-right-arm,
          .potato-knife,
          .potato-slash,
          .potato-hit,
          .potato-hit-flash {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

/* =========================================================
   Hair
========================================================= */

type HairLayerProps = {
  type: HairType;
  color: string;
  direction: PotatoDirection;
  ghost: boolean;
};

function HairLayer({
  type,
  color,
  direction,
  ghost,
}: HairLayerProps) {
  if (type === "none") {
    return null;
  }

  const hairColor =
    ghost
      ? "rgba(67, 107, 128, 0.72)"
      : color;

  const shadow =
    ghost
      ? "rgba(33, 74, 94, 0.22)"
      : "rgba(0, 0, 0, 0.17)";

  const shine =
    ghost
      ? "rgba(220, 246, 255, 0.16)"
      : "rgba(255, 255, 255, 0.18)";

  /*
   * 머리 구조를 3단계로 나눈다.
   *
   * back  : 얼굴 뒤로 내려오는 머리
   * crown : 정수리 볼륨
   * bang  : 이마까지만 내려오는 앞머리
   *
   * 눈 영역(top 약 27~39px)은 비워 둔다.
   */
  const Back = ({
    className = "",
  }: {
    className?: string;
  }) => (
    <div
      className={`pointer-events-none absolute z-[12] ${className}`}
      style={{
        backgroundColor:
          hairColor,
        boxShadow:
          `inset 0 -4px 0 ${shadow}`,
      }}
    />
  );

  const Front = ({
    className = "",
  }: {
    className?: string;
  }) => (
    <div
      className={`pointer-events-none absolute z-[24] ${className}`}
      style={{
        backgroundColor:
          hairColor,
      }}
    />
  );

  const Crown = () => (
    <>
      <Front className="left-1/2 top-[-13px] h-[29px] w-[64px] -translate-x-1/2 rounded-[60%_60%_36%_36%]" />

      <div
        className="
          pointer-events-none
          absolute
          left-[12px]
          top-[-5px]
          z-[25]
          h-[3px]
          w-[24px]
          -rotate-[9deg]
          rounded-full
        "
        style={{
          backgroundColor:
            shine,
        }}
      />
    </>
  );

  /* ======================================================
     BACK VIEW
  ====================================================== */

  if (direction === "up") {
    if (type === "spike") {
      return (
        <div className="pointer-events-none absolute left-1/2 top-[-16px] z-[18] flex w-[58px] -translate-x-1/2 items-end justify-center gap-[1px]">
          {[21, 31, 38, 32, 23].map(
            (height, index) => (
              <span
                key={index}
                className="w-[12px] [clip-path:polygon(50%_0,100%_100%,0_100%)]"
                style={{
                  height,
                  backgroundColor:
                    hairColor,
                }}
              />
            )
          )}
        </div>
      );
    }

    return (
      <>
        <Crown />

        {(type === "bob" ||
          type === "curly" ||
          type === "long") && (
          <Back className="left-1/2 top-[2px] h-[62px] w-[72px] -translate-x-1/2 rounded-[45%_45%_32%_32%]" />
        )}

        {type === "ponytail" && (
          <>
            <Back className="left-1/2 top-[1px] h-[45px] w-[66px] -translate-x-1/2 rounded-[48%]" />
            <Back className="right-[-15px] top-[14px] h-[52px] w-[28px] rotate-[13deg] rounded-[70%_35%_70%_35%]" />
          </>
        )}

        {type === "bun" && (
          <>
            <Back className="left-1/2 top-[0px] h-[40px] w-[65px] -translate-x-1/2 rounded-[50%]" />
            <Back className="left-1/2 top-[-25px] h-[31px] w-[33px] -translate-x-1/2 rounded-full" />
          </>
        )}

        {type === "braid" && (
          <>
            <Back className="left-1/2 top-[0px] h-[40px] w-[65px] -translate-x-1/2 rounded-[50%]" />

            {[23, 36, 49].map(
              (top, index) => (
                <Back
                  key={`back-l-${top}`}
                  className="left-[-5px] h-[16px] w-[15px] rounded-full"
                />
              )
            )}

            {[23, 36, 49].map(
              top => (
                <Back
                  key={`back-r-${top}`}
                  className="right-[-5px] h-[16px] w-[15px] rounded-full"
                />
              )
            )}
          </>
        )}

        {type !== "bob" &&
          type !== "curly" &&
          type !== "long" &&
          type !== "ponytail" &&
          type !== "bun" &&
          type !== "braid" && (
          <Back className="left-1/2 top-[0px] h-[38px] w-[66px] -translate-x-1/2 rounded-[50%]" />
        )}
      </>
    );
  }

  /* ======================================================
     SHORT
  ====================================================== */

  if (type === "short") {
    return (
      <>
        <Crown />

        <Front className="left-[5px] top-[3px] h-[15px] w-[18px] rotate-[18deg] rounded-b-[75%]" />
        <Front className="left-[20px] top-[3px] h-[13px] w-[17px] rotate-[5deg] rounded-b-[75%]" />
        <Front className="right-[6px] top-[2px] h-[15px] w-[17px] -rotate-[16deg] rounded-b-[75%]" />
      </>
    );
  }

  /* ======================================================
     SIDE PART
  ====================================================== */

  if (type === "side") {
    return (
      <>
        <Crown />

        <Front className="left-[1px] top-[-1px] h-[23px] w-[29px] -rotate-[20deg] rounded-[70%_35%_72%_35%]" />

        <Front className="left-[19px] top-[2px] h-[15px] w-[27px] -rotate-[9deg] rounded-b-[75%]" />
      </>
    );
  }

  /* ======================================================
     MIDDLE PART
  ====================================================== */

  if (type === "middle") {
    return (
      <>
        <Crown />

        <Front className="left-[0px] top-[0px] h-[21px] w-[27px] rotate-[11deg] rounded-[65%_35%_70%_40%]" />

        <Front className="right-[0px] top-[0px] h-[21px] w-[27px] -rotate-[11deg] rounded-[35%_65%_40%_70%]" />

        <div
          className="
            pointer-events-none
            absolute
            left-1/2
            top-[-7px]
            z-[26]
            h-[19px]
            w-[2px]
            -translate-x-1/2
            rounded-full
          "
          style={{
            backgroundColor:
              shine,
          }}
        />
      </>
    );
  }

  /* ======================================================
     BOB
  ====================================================== */

  if (type === "bob") {
    return (
      <>
        <Back className="left-1/2 top-[2px] h-[57px] w-[72px] -translate-x-1/2 rounded-[45%_45%_38%_38%]" />

        <Crown />

        <Front className="left-[5px] top-[3px] h-[16px] w-[17px] rotate-[12deg] rounded-b-[80%]" />
        <Front className="left-[19px] top-[3px] h-[14px] w-[13px] rotate-[4deg] rounded-b-[80%]" />
        <Front className="right-[19px] top-[3px] h-[14px] w-[13px] -rotate-[4deg] rounded-b-[80%]" />
        <Front className="right-[5px] top-[3px] h-[16px] w-[17px] -rotate-[12deg] rounded-b-[80%]" />
      </>
    );
  }

  /* ======================================================
     WAVE
  ====================================================== */

  if (type === "curly") {
    return (
      <>
        {/* 하나의 큰 뒷머리 실루엣 */}
        <Back className="left-1/2 top-[0px] h-[69px] w-[78px] -translate-x-1/2 rounded-[45%_45%_32%_32%]" />

        {/* 옆 웨이브는 얼굴 바깥으로만 */}
        <Back className="left-[-10px] top-[25px] h-[25px] w-[24px] -rotate-[16deg] rounded-[65%_35%_65%_35%]" />
        <Back className="left-[-7px] top-[45px] h-[24px] w-[23px] rotate-[12deg] rounded-[35%_65%_35%_65%]" />

        <Back className="right-[-10px] top-[25px] h-[25px] w-[24px] rotate-[16deg] rounded-[35%_65%_35%_65%]" />
        <Back className="right-[-7px] top-[45px] h-[24px] w-[23px] -rotate-[12deg] rounded-[65%_35%_65%_35%]" />

        <Crown />

        {/* 앞머리는 눈 위에서 끝남 */}
        <Front className="left-[5px] top-[1px] h-[17px] w-[20px] rotate-[14deg] rounded-b-[75%]" />
        <Front className="right-[5px] top-[1px] h-[17px] w-[20px] -rotate-[14deg] rounded-b-[75%]" />
      </>
    );
  }

  /* ======================================================
     PONYTAIL
  ====================================================== */

  if (type === "ponytail") {
    return (
      <>
        <Back className="left-1/2 top-[1px] h-[43px] w-[67px] -translate-x-1/2 rounded-[48%]" />

        <Back className="right-[-17px] top-[13px] h-[57px] w-[30px] rotate-[13deg] rounded-[65%_35%_72%_35%]" />

        <Crown />

        <Front className="left-[5px] top-[1px] h-[17px] w-[21px] rotate-[14deg] rounded-b-[75%]" />

        <Front className="right-[8px] top-[2px] h-[15px] w-[18px] -rotate-[9deg] rounded-b-[75%]" />

        <div
          className="
            pointer-events-none
            absolute
            right-[-1px]
            top-[9px]
            z-[27]
            h-[11px]
            w-[11px]
            rounded-full
          "
          style={{
            backgroundColor:
              shadow,
          }}
        />
      </>
    );
  }

  /* ======================================================
     BUN
  ====================================================== */

  if (type === "bun") {
    return (
      <>
        <Back className="left-1/2 top-[0px] h-[43px] w-[67px] -translate-x-1/2 rounded-[48%]" />

        <Back className="left-1/2 top-[-27px] h-[33px] w-[35px] -translate-x-1/2 rounded-full" />

        <Crown />

        <Front className="left-[5px] top-[1px] h-[17px] w-[20px] rotate-[13deg] rounded-b-[75%]" />

        <Front className="right-[5px] top-[1px] h-[17px] w-[20px] -rotate-[13deg] rounded-b-[75%]" />
      </>
    );
  }

  /* ======================================================
     BRAID
  ====================================================== */

  if (type === "braid") {
    return (
      <>
        <Back className="left-1/2 top-[0px] h-[43px] w-[67px] -translate-x-1/2 rounded-[48%]" />

        <Crown />

        <Front className="left-[5px] top-[1px] h-[16px] w-[20px] rotate-[13deg] rounded-b-[75%]" />
        <Front className="right-[5px] top-[1px] h-[16px] w-[20px] -rotate-[13deg] rounded-b-[75%]" />

        {[22, 35, 48, 61].map(
          (top, index) => (
            <Back
              key={`l-${top}`}
              className="left-[-6px] h-[16px] w-[15px] rounded-full"
            />
          )
        )}

        {[22, 35, 48, 61].map(
          (top, index) => (
            <Back
              key={`r-${top}`}
              className="right-[-6px] h-[16px] w-[15px] rounded-full"
            />
          )
        )}
      </>
    );
  }

  /* ======================================================
     SPIKE
  ====================================================== */

  if (type === "spike") {
    return (
      <div className="pointer-events-none absolute left-1/2 top-[-17px] z-[22] flex w-[60px] -translate-x-1/2 items-end justify-center gap-[1px]">
        {[22, 32, 40, 34, 24].map(
          (height, index) => (
            <span
              key={index}
              className="w-[12px] [clip-path:polygon(50%_0,100%_100%,0_100%)]"
              style={{
                height,
                backgroundColor:
                  hairColor,
              }}
            />
          )
        )}
      </div>
    );
  }

  /* ======================================================
     LONG
  ====================================================== */

  return (
    <>
      {/* 긴 머리는 얼굴 뒤에 큰 한 덩어리로 만든다 */}
      <Back className="left-1/2 top-[-1px] h-[76px] w-[78px] -translate-x-1/2 rounded-[46%_46%_28%_28%]" />

      <Crown />

      {/* 이마만 살짝 덮는 앞머리 */}
      <Front className="left-[4px] top-[1px] h-[17px] w-[21px] rotate-[14deg] rounded-b-[75%]" />

      <Front className="right-[4px] top-[1px] h-[17px] w-[21px] -rotate-[14deg] rounded-b-[75%]" />
    </>
  );
}

/* =========================================================
   Eyes
========================================================= */

type EyePairProps = {
  type: EyeType;
  direction: "down" | "left" | "right";
  ghost: boolean;
};

function EyePair({
  type,
  direction,
  ghost,
}: EyePairProps) {
  const color = ghost
    ? "#315c73"
    : "#18181b";

  const shine = ghost
    ? "#d8f4ff"
    : "#ffffff";

  const side =
    direction === "left" ||
    direction === "right";

  if (side) {
    const sideClass =
      direction === "left"
        ? "left-[10px]"
        : "right-[10px]";

    if (type === "sleepy") {
      return <div className={`absolute z-[35] ${sideClass} top-[33px] h-[3px] w-[9px] rounded-full`} style={{ backgroundColor: color }} />;
    }

    if (type === "smile" || type === "wink") {
      return <div className={`absolute z-[35] ${sideClass} top-[31px] h-[7px] w-[10px] rounded-t-full border-t-[3px]`} style={{ borderColor: color }} />;
    }

    if (type === "sparkle") {
      return <div className={`absolute z-[35] ${sideClass} top-[27px] text-[13px] font-black leading-none`} style={{ color }}>✦</div>;
    }

    return (
      <div className={`absolute z-[35] ${sideClass} top-[29px] h-[9px] w-[8px] rounded-full`} style={{ backgroundColor: type === "round" ? "transparent" : color, border: type === "round" ? `2px solid ${color}` : undefined }}>
        <div className="absolute right-[1px] top-[1px] h-[2px] w-[2px] rounded-full" style={{ backgroundColor: shine }} />
      </div>
    );
  }

  const positions = ["left-[11px]", "right-[11px]"];

  if (type === "sleepy") {
    return <>{positions.map(position => <div key={position} className={`absolute z-[35] ${position} top-[33px] h-[3px] w-[9px] rounded-full`} style={{ backgroundColor: color }} />)}</>;
  }

  if (type === "smile") {
    return <>{positions.map(position => <div key={position} className={`absolute z-[35] ${position} top-[31px] h-[7px] w-[10px] rounded-t-full border-t-[3px]`} style={{ borderColor: color }} />)}</>;
  }

  if (type === "wink") {
    return (
      <>
        <div className="absolute z-[35] left-[11px] top-[31px] h-[7px] w-[10px] rounded-t-full border-t-[3px]" style={{ borderColor: color }} />
        <div className="absolute z-[35] right-[12px] top-[29px] h-[9px] w-[7px] rounded-full" style={{ backgroundColor: color }}>
          <div className="absolute right-[1px] top-[1px] h-[2px] w-[2px] rounded-full" style={{ backgroundColor: shine }} />
        </div>
      </>
    );
  }

  if (type === "sparkle") {
    return <>{positions.map(position => <div key={position} className={`absolute z-[35] ${position} top-[27px] text-[13px] font-black leading-none`} style={{ color }}>✦</div>)}</>;
  }

  if (type === "puppy") {
    return (
      <>
        {positions.map(position => (
          <div key={position} className={`absolute z-[35] ${position} top-[27px] h-[12px] w-[9px] rounded-[50%_50%_55%_55%]`} style={{ backgroundColor: color }}>
            <div className="absolute left-[2px] top-[1px] h-[3px] w-[3px] rounded-full" style={{ backgroundColor: shine }} />
            <div className="absolute bottom-[1px] left-1/2 h-[3px] w-[5px] -translate-x-1/2 rounded-full bg-white/20" />
          </div>
        ))}
      </>
    );
  }

  if (type === "round") {
    return <>{positions.map(position => <div key={position} className={`absolute z-[35] ${position} top-[28px] h-[10px] w-[9px] rounded-full border-[2px]`} style={{ borderColor: color }}><div className="absolute right-[1px] top-[1px] h-[2px] w-[2px] rounded-full" style={{ backgroundColor: shine }} /></div>)}</>;
  }

  return <>{positions.map(position => <div key={position} className={`absolute z-[35] ${position} top-[30px] h-[7px] w-[6px] rounded-full`} style={{ backgroundColor: color }}><div className="absolute right-[1px] top-[1px] h-[2px] w-[2px] rounded-full" style={{ backgroundColor: shine }} /></div>)}</>;
}

/* =========================================================
   Mouth
========================================================= */

type MouthFaceProps = {
  type: MouthType;
  direction: "down" | "left" | "right";
  ghost: boolean;
};

function MouthFace({
  type,
  direction,
  ghost,
}: MouthFaceProps) {
  const color = ghost
    ? "#315c73"
    : "#18181b";

  const lipColor = ghost
    ? "#79a9bb"
    : "#d96b78";

  const side =
    direction === "left" ||
    direction === "right";

  if (side) {
    const sideClass = direction === "left" ? "left-[9px]" : "right-[9px]";
    if (type === "flat") return <div className={`absolute z-[35] ${sideClass} top-[49px] h-[2px] w-[10px] rounded-full`} style={{ backgroundColor: color }} />;
    if (type === "pout") return <div className={`absolute z-[35] ${sideClass} top-[47px] h-[6px] w-[8px] rounded-t-full border-t-[2px]`} style={{ borderColor: color }} />;
    if (type === "open") return <div className={`absolute z-[35] ${sideClass} top-[45px] h-[8px] w-[10px] rounded-full border-[2px]`} style={{ borderColor: color, backgroundColor: lipColor }} />;
    if (type === "cat") return <div className={`absolute z-[35] ${sideClass} top-[45px] h-[9px] w-[12px]`}><div className="absolute left-[1px] bottom-0 h-[6px] w-[6px] rounded-b-full border-b-[2px]" style={{ borderColor: color }} /><div className="absolute right-[1px] bottom-0 h-[6px] w-[6px] rounded-b-full border-b-[2px]" style={{ borderColor: color }} /></div>;
    if (type === "smile") return <div className={`absolute z-[35] ${sideClass} top-[45px] h-[7px] w-[11px] rounded-b-full border-b-[3px]`} style={{ borderColor: color }} />;
    return <div className={`absolute z-[35] ${sideClass} top-[47px] h-[4px] w-[9px] rounded-b-full border-b-[3px]`} style={{ borderColor: color }} />;
  }

  if (type === "flat") {
    return <div className="absolute z-[35] left-1/2 top-[48px] h-[2px] w-[12px] -translate-x-1/2 rounded-full" style={{ backgroundColor: color }} />;
  }

  if (type === "pout") {
    return <div className="absolute z-[35] left-1/2 top-[47px] h-[7px] w-[10px] -translate-x-1/2 rounded-t-full border-t-[2px]" style={{ borderColor: color }} />;
  }

  if (type === "open") {
    return (
      <div className="absolute z-[35] left-1/2 top-[43px] h-[11px] w-[14px] -translate-x-1/2 overflow-hidden rounded-full border-[2px]" style={{ borderColor: color, backgroundColor: color }}>
        <div className="absolute bottom-0 left-1/2 h-[4px] w-[9px] -translate-x-1/2 rounded-t-full" style={{ backgroundColor: lipColor }} />
        <div className="absolute left-[2px] top-[1px] h-[2px] w-[8px] rounded-full bg-white/90" />
      </div>
    );
  }

  if (type === "cat") {
    return (
      <div className="absolute z-[35] left-1/2 top-[43px] h-[12px] w-[18px] -translate-x-1/2">
        <div className="absolute left-1/2 top-[1px] h-[4px] w-[4px] -translate-x-1/2 rotate-45 rounded-[1px]" style={{ backgroundColor: color }} />
        <div className="absolute bottom-[1px] left-[1px] h-[7px] w-[9px] rounded-b-full border-b-[2px]" style={{ borderColor: color }} />
        <div className="absolute bottom-[1px] right-[1px] h-[7px] w-[9px] rounded-b-full border-b-[2px]" style={{ borderColor: color }} />
      </div>
    );
  }

  if (type === "smile") {
    return <div className="absolute z-[35] left-1/2 top-[42px] h-[10px] w-[17px] -translate-x-1/2 rounded-b-full border-b-[3px]" style={{ borderColor: color }} />;
  }

  return <div className="absolute z-[35] left-1/2 top-[44px] h-[5px] w-[12px] -translate-x-1/2 rounded-b-full border-b-[3px]" style={{ borderColor: color }} />;
}

/* =========================================================
   Freckles
========================================================= */

type FrecklesProps = {
  direction: "down" | "left" | "right";
  ghost: boolean;
};

function Freckles({
  direction,
  ghost,
}: FrecklesProps) {
  const color = ghost
    ? "#5f8fa5"
    : "#8b5e34";

  if (direction === "left") {
    return (
      <div className="pointer-events-none absolute z-[34] left-[7px] top-[39px] flex gap-[2px]">
        {[0, 1, 2].map((index) => (
          <span key={index} className="h-[2px] w-[2px] rounded-full" style={{ backgroundColor: color }} />
        ))}
      </div>
    );
  }

  if (direction === "right") {
    return (
      <div className="pointer-events-none absolute z-[34] right-[7px] top-[39px] flex gap-[2px]">
        {[0, 1, 2].map((index) => (
          <span key={index} className="h-[2px] w-[2px] rounded-full" style={{ backgroundColor: color }} />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="pointer-events-none absolute z-[34] left-[7px] top-[39px] flex gap-[2px]">
        {[0, 1, 2].map((index) => (
          <span key={index} className="h-[2px] w-[2px] rounded-full" style={{ backgroundColor: color }} />
        ))}
      </div>
      <div className="pointer-events-none absolute z-[34] right-[7px] top-[39px] flex gap-[2px]">
        {[0, 1, 2].map((index) => (
          <span key={index} className="h-[2px] w-[2px] rounded-full" style={{ backgroundColor: color }} />
        ))}
      </div>
    </>
  );
}

/* =========================================================
   Potato Spot
========================================================= */

type PotatoSpotProps = {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;

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
        left:
          left !== undefined
            ? `${left}px`
            : undefined,

        right:
          right !== undefined
            ? `${right}px`
            : undefined,

        top:
          top !== undefined
            ? `${top}px`
            : undefined,

        bottom:
          bottom !== undefined
            ? `${bottom}px`
            : undefined,

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