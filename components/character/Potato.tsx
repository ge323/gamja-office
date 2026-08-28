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
  | "middle"
  | "bob"
  | "curly"
  | "bun"
  | "braid"
  | "long"
  | "crop"
  | "comma"
  | "twoBlock"
  | "slick";

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
              Back Hair

              반드시 감자 몸통보다 먼저 렌더링한다.
              긴머리 / 단발 / 웨이브 / 포니테일 / 올림머리 /
              양갈래의 "뒤쪽 머리"를 담당한다.
          ================================================= */}

          <BackHairLayer
            type={hair}
            color={resolvedHairColor}
            direction={direction}
            ghost={ghost}
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

            <FrontHairLayer
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

   Layer policy
   ---------------------------------------------------------
   BackHairLayer  : 캐릭터 바깥 좌표 / body(z-10) 뒤
   FrontHairLayer : 감자 body 내부 / 얼굴보다 아래

   삭제된 스타일:
   - side
   - ponytail
   - spike

   추가된 남자 헤어:
   - crop     : 크롭컷
   - comma    : 쉼표머리
   - twoBlock : 투블럭
   - slick    : 넘긴머리
========================================================= */

type HairLayerProps = {
  type: HairType;
  color: string;
  direction: PotatoDirection;
  ghost: boolean;
};

function resolveHairPalette(
  color: string,
  ghost: boolean
) {
  return {
    fill:
      ghost
        ? "rgba(67, 107, 128, 0.72)"
        : color,

    shadow:
      ghost
        ? "rgba(33, 74, 94, 0.24)"
        : "rgba(0, 0, 0, 0.18)",

    shine:
      ghost
        ? "rgba(220, 246, 255, 0.17)"
        : "rgba(255, 255, 255, 0.20)",
  };
}

function BackHairLayer({
  type,
  color,
  direction,
  ghost,
}: HairLayerProps) {
  if (type === "none") {
    return null;
  }

  const {
    fill,
    shadow,
    shine,
  } = resolveHairPalette(
    color,
    ghost
  );

  const backView =
    direction === "up";

  const sideView =
    direction === "left" ||
    direction === "right";

  const common =
    "pointer-events-none absolute";

  const HairMass = ({
    top,
    width,
    height,
    radius,
  }: {
    top: number;
    width: number;
    height: number;
    radius: string;
  }) => (
    <div
      className={`${common} left-1/2 z-[2] -translate-x-1/2`}
      style={{
        top,
        width,
        height,
        borderRadius: radius,
        backgroundColor: fill,
        boxShadow:
          `inset 0 -5px 0 ${shadow}`,
      }}
    >
      {backView && (
        <div
          className="absolute left-[13px] top-[7px] h-[3px] w-[19px] -rotate-[8deg] rounded-full"
          style={{
            backgroundColor: shine,
          }}
        />
      )}
    </div>
  );

  /* 짧은 계열: 뒤통수를 작고 단정하게 채운다. */
  if (
    type === "short" ||
    type === "middle" ||
    type === "crop" ||
    type === "comma" ||
    type === "twoBlock" ||
    type === "slick"
  ) {
    const isTwoBlock =
      type === "twoBlock";

    const isSlick =
      type === "slick";

    return (
      <>
        <HairMass
          top={
            isSlick
              ? 1
              : 4
          }
          width={
            sideView
              ? 58
              : isTwoBlock
                ? 66
                : 63
          }
          height={
            backView
              ? isTwoBlock
                ? 43
                : 38
              : isTwoBlock
                ? 36
                : 32
          }
          radius={
            isSlick
              ? "48% 52% 36% 42% / 38% 42% 58% 62%"
              : "49% 51% 40% 40% / 42% 42% 58% 58%"
          }
        />

        {isTwoBlock && (
          <>
            <div
              className={`${common} left-[5px] top-[22px] z-[3] h-[20px] w-[11px] rounded-b-[75%]`}
              style={{
                backgroundColor: fill,
              }}
            />
            <div
              className={`${common} right-[5px] top-[22px] z-[3] h-[20px] w-[11px] rounded-b-[75%]`}
              style={{
                backgroundColor: fill,
              }}
            />
          </>
        )}
      </>
    );
  }

  if (type === "bob") {
    return (
      <>
        <HairMass
          top={4}
          width={70}
          height={60}
          radius="47% 47% 38% 38% / 38% 38% 62% 62%"
        />

        {!backView &&
          !sideView && (
          <>
            <div
              className={`${common} left-[2px] top-[48px] z-[3] h-[18px] w-[21px] rotate-[13deg] rounded-[40%_60%_75%_25%]`}
              style={{
                backgroundColor: fill,
              }}
            />
            <div
              className={`${common} right-[2px] top-[48px] z-[3] h-[18px] w-[21px] -rotate-[13deg] rounded-[60%_40%_25%_75%]`}
              style={{
                backgroundColor: fill,
              }}
            />
          </>
        )}
      </>
    );
  }

  if (type === "curly") {
    return (
      <>
        <HairMass
          top={1}
          width={75}
          height={73}
          radius="46% 46% 35% 35% / 34% 34% 66% 66%"
        />

        {!backView && (
          <>
            <div
              className={`${common} left-[-4px] top-[30px] z-[3] h-[23px] w-[22px] -rotate-[12deg] rounded-[65%_35%_65%_35%]`}
              style={{ backgroundColor: fill }}
            />
            <div
              className={`${common} left-[-2px] top-[49px] z-[3] h-[22px] w-[21px] rotate-[12deg] rounded-[35%_65%_35%_65%]`}
              style={{ backgroundColor: fill }}
            />
            <div
              className={`${common} right-[-4px] top-[30px] z-[3] h-[23px] w-[22px] rotate-[12deg] rounded-[35%_65%_35%_65%]`}
              style={{ backgroundColor: fill }}
            />
            <div
              className={`${common} right-[-2px] top-[49px] z-[3] h-[22px] w-[21px] -rotate-[12deg] rounded-[65%_35%_65%_35%]`}
              style={{ backgroundColor: fill }}
            />
          </>
        )}
      </>
    );
  }

  if (type === "long") {
    return (
      <HairMass
        top={0}
        width={
          sideView
            ? 67
            : 77
        }
        height={
          backView
            ? 80
            : 83
        }
        radius="47% 47% 25% 25% / 30% 30% 70% 70%"
      />
    );
  }

  if (type === "bun") {
    return (
      <>
        <HairMass
          top={3}
          width={63}
          height={44}
          radius="49% 49% 42% 42%"
        />

        <div
          className={`${common} left-1/2 top-[-20px] z-[3] h-[31px] w-[33px] -translate-x-1/2 rounded-full border-[2px]`}
          style={{
            backgroundColor: fill,
            borderColor: shadow,
          }}
        />
      </>
    );
  }

  if (type === "braid") {
    const steps = [
      23,
      35,
      47,
      59,
    ];

    return (
      <>
        <HairMass
          top={3}
          width={63}
          height={44}
          radius="49% 49% 42% 42%"
        />

        {!sideView &&
          steps.map(
            (
              top,
              index
            ) => (
              <div
                key={`braid-l-${top}`}
                className={`${common} left-[-2px] z-[3] rounded-full border`}
                style={{
                  top,
                  width: 15 - index,
                  height: 16 - index,
                  backgroundColor: fill,
                  borderColor: shadow,
                }}
              />
            )
          )}

        {!sideView &&
          steps.map(
            (
              top,
              index
            ) => (
              <div
                key={`braid-r-${top}`}
                className={`${common} right-[-2px] z-[3] rounded-full border`}
                style={{
                  top,
                  width: 15 - index,
                  height: 16 - index,
                  backgroundColor: fill,
                  borderColor: shadow,
                }}
              />
            )
          )}
      </>
    );
  }

  return null;
}

function FrontHairLayer({
  type,
  color,
  direction,
  ghost,
}: HairLayerProps) {
  if (type === "none") {
    return null;
  }

  const {
    fill,
    shadow,
    shine,
  } = resolveHairPalette(
    color,
    ghost
  );

  const base =
    "pointer-events-none absolute z-[26]";

  const backView =
    direction === "up";

  const sideView =
    direction === "left" ||
    direction === "right";

  const mirror =
    direction === "right";

  const Crown = ({
    width = 60,
    height = 25,
    top = -14,
    radius = "55% 55% 38% 38% / 68% 68% 32% 32%",
  }: {
    width?: number;
    height?: number;
    top?: number;
    radius?: string;
  }) => (
    <>
      <div
        className={`${base} left-1/2 -translate-x-1/2`}
        style={{
          top,
          width,
          height,
          backgroundColor: fill,
          borderRadius: radius,
          boxShadow:
            `inset 0 -4px 0 ${shadow}`,
        }}
      />

      <div
        className="pointer-events-none absolute left-[12px] top-[-6px] z-[27] h-[3px] w-[20px] -rotate-[8deg] rounded-full"
        style={{
          backgroundColor: shine,
        }}
      />
    </>
  );

  /* 뒷모습: 스타일 길이에 맞춰 중앙 뒤통수를 채운다. */
  if (backView) {
    const config =
      type === "long"
        ? { width: 64, height: 68 }
        : type === "curly"
          ? { width: 64, height: 58 }
          : type === "bob"
            ? { width: 63, height: 47 }
            : type === "braid" ||
                type === "bun"
              ? { width: 62, height: 42 }
              : { width: 61, height: 35 };

    return (
      <div
        className="pointer-events-none absolute left-1/2 top-[-10px] z-[26] -translate-x-1/2 rounded-[50%_50%_42%_42%]"
        style={{
          width: config.width,
          height: config.height,
          backgroundColor: fill,
          boxShadow:
            `inset 0 -4px 0 ${shadow}`,
        }}
      />
    );
  }

  if (type === "short") {
    return (
      <>
        <Crown
          width={60}
          height={24}
        />

        <div
          className={`${base} left-[5px] top-[2px] h-[14px] w-[18px] rotate-[15deg] rounded-b-[80%]`}
          style={{ backgroundColor: fill }}
        />
        <div
          className={`${base} left-[20px] top-[2px] h-[12px] w-[17px] rotate-[3deg] rounded-b-[80%]`}
          style={{ backgroundColor: fill }}
        />
        <div
          className={`${base} right-[6px] top-[1px] h-[14px] w-[17px] -rotate-[14deg] rounded-b-[80%]`}
          style={{ backgroundColor: fill }}
        />
      </>
    );
  }

  if (type === "crop") {
    return (
      <>
        <Crown
          width={60}
          height={21}
          top={-12}
          radius="52% 52% 35% 35% / 62% 62% 38% 38%"
        />

        {[6, 16, 26, 36, 46].map(
          (
            left,
            index
          ) => (
            <div
              key={left}
              className={`${base} top-[1px] h-[10px] w-[10px] rounded-b-[75%]`}
              style={{
                left,
                backgroundColor: fill,
                transform:
                  `rotate(${index % 2 === 0 ? -6 : 6}deg)`,
              }}
            />
          )
        )}
      </>
    );
  }

  if (type === "comma") {
    const content = (
      <>
        <Crown
          width={62}
          height={25}
          top={-14}
        />

        <div
          className={`${base} left-[5px] top-[-1px] h-[20px] w-[29px] -rotate-[18deg] rounded-[70%_35%_75%_35%]`}
          style={{ backgroundColor: fill }}
        />

        <div
          className={`${base} right-[13px] top-[3px] h-[18px] w-[13px] rotate-[22deg] rounded-b-full`}
          style={{ backgroundColor: fill }}
        />
      </>
    );

    return sideView && mirror ? (
      <div
        className="absolute inset-0"
        style={{
          transform: "scaleX(-1)",
        }}
      >
        {content}
      </div>
    ) : content;
  }

  if (type === "twoBlock") {
    return (
      <>
        <Crown
          width={64}
          height={27}
          top={-15}
        />

        <div
          className={`${base} left-[4px] top-[0px] h-[18px] w-[24px] rotate-[10deg] rounded-b-[78%]`}
          style={{ backgroundColor: fill }}
        />
        <div
          className={`${base} left-[22px] top-[1px] h-[16px] w-[18px] rounded-b-[78%]`}
          style={{ backgroundColor: fill }}
        />
        <div
          className={`${base} right-[5px] top-[0px] h-[17px] w-[18px] -rotate-[8deg] rounded-b-[78%]`}
          style={{ backgroundColor: fill }}
        />
      </>
    );
  }

  if (type === "slick") {
    return (
      <>
        <Crown
          width={63}
          height={25}
          top={-15}
          radius="45% 60% 35% 42% / 70% 62% 38% 30%"
        />

        <div
          className={`${base} left-[7px] top-[-1px] h-[13px] w-[39px] -rotate-[8deg] rounded-[70%_30%_55%_45%]`}
          style={{ backgroundColor: fill }}
        />
      </>
    );
  }

  if (type === "middle") {
    return (
      <>
        <Crown />

        <div
          className={`${base} left-[2px] top-[0px] h-[19px] w-[25px] rotate-[10deg] rounded-[65%_35%_72%_38%]`}
          style={{ backgroundColor: fill }}
        />
        <div
          className={`${base} right-[2px] top-[0px] h-[19px] w-[25px] -rotate-[10deg] rounded-[35%_65%_38%_72%]`}
          style={{ backgroundColor: fill }}
        />
        <div
          className="pointer-events-none absolute left-1/2 top-[-9px] z-[28] h-[19px] w-[2px] -translate-x-1/2 rounded-full"
          style={{ backgroundColor: shine }}
        />
      </>
    );
  }

  if (type === "bob") {
    return (
      <>
        <Crown
          width={62}
          height={27}
        />

        {[6, 18, 30, 42].map(
          (
            left,
            index
          ) => (
            <div
              key={left}
              className={`${base} top-[2px] h-[13px] w-[11px] rounded-b-[85%]`}
              style={{
                left,
                backgroundColor: fill,
                transform:
                  `rotate(${index < 2 ? 7 : -7}deg)`,
              }}
            />
          )
        )}
      </>
    );
  }

  if (type === "curly") {
    return (
      <>
        <Crown
          width={63}
          height={27}
        />
        <div
          className={`${base} left-[4px] top-[1px] h-[15px] w-[21px] rotate-[13deg] rounded-b-[82%]`}
          style={{ backgroundColor: fill }}
        />
        <div
          className={`${base} right-[4px] top-[1px] h-[15px] w-[21px] -rotate-[13deg] rounded-b-[82%]`}
          style={{ backgroundColor: fill }}
        />
      </>
    );
  }

  if (
    type === "bun" ||
    type === "braid"
  ) {
    return (
      <>
        <Crown
          width={61}
          height={26}
        />
        <div
          className={`${base} left-[5px] top-[1px] h-[15px] w-[20px] rotate-[13deg] rounded-b-[80%]`}
          style={{ backgroundColor: fill }}
        />
        <div
          className={`${base} right-[5px] top-[1px] h-[15px] w-[20px] -rotate-[13deg] rounded-b-[80%]`}
          style={{ backgroundColor: fill }}
        />
      </>
    );
  }

  /* long */
  return (
    <>
      <Crown
        width={64}
        height={28}
      />
      <div
        className={`${base} left-[3px] top-[1px] h-[16px] w-[22px] rotate-[13deg] rounded-b-[82%]`}
        style={{ backgroundColor: fill }}
      />
      <div
        className={`${base} right-[3px] top-[1px] h-[16px] w-[22px] -rotate-[13deg] rounded-b-[82%]`}
        style={{ backgroundColor: fill }}
      />
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