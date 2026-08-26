"use client";

/* =========================================================
   Types
========================================================= */

type GlassesType =
  | "none"
  | "round"
  | "sunglasses";

type HatType =
  | "none"
  | "cap"
  | "party";

export type AccessoryDirection =
  | "down"
  | "up"
  | "left"
  | "right";

type AccessoriesProps = {
  glasses?: GlassesType;

  hat?: HatType;

  ribbon?: boolean;

  tie?: boolean;

  /*
   * 캐릭터가 바라보는 방향
   */
  direction?: AccessoryDirection;
};

/* =========================================================
   Accessories
========================================================= */

export default function Accessories({
  glasses = "none",

  hat = "none",

  ribbon = false,

  tie = false,

  direction = "down",
}: AccessoriesProps) {
  const facingDown =
    direction === "down";

  const facingUp =
    direction === "up";

  const facingLeft =
    direction === "left";

  const facingRight =
    direction === "right";

  return (
    <>
      {/* =====================================================
          ROUND GLASSES
      ===================================================== */}

      {glasses === "round" &&
        !facingUp && (
          <>
            {/* ===============================================
                FRONT
            =============================================== */}

            {facingDown && (
              <div
                className="
                  pointer-events-none
                  absolute
                  inset-0
                  z-30
                "
              >
                {/* 왼쪽 렌즈 */}

                <div
                  className="
                    absolute

                    left-[8px]
                    top-[27px]

                    h-[13px]
                    w-[13px]

                    rounded-full

                    border-[2px]
                    border-zinc-900
                  "
                />

                {/* 오른쪽 렌즈 */}

                <div
                  className="
                    absolute

                    right-[8px]
                    top-[27px]

                    h-[13px]
                    w-[13px]

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
                    w-[9px]

                    -translate-x-1/2

                    bg-zinc-900
                  "
                />
              </div>
            )}

            {/* ===============================================
                LEFT
            =============================================== */}

            {facingLeft && (
              <div
                className="
                  pointer-events-none

                  absolute
                  inset-0
                  z-30
                "
              >
                {/* 옆모습에서는 렌즈 하나만 크게 보임 */}

                <div
                  className="
                    absolute

                    left-[5px]
                    top-[27px]

                    h-[13px]
                    w-[13px]

                    rounded-full

                    border-[2px]
                    border-zinc-900
                  "
                />

                {/* 안경 다리 */}

                <div
                  className="
                    absolute

                    left-[15px]
                    top-[32px]

                    h-[2px]
                    w-[13px]

                    bg-zinc-900
                  "
                />
              </div>
            )}

            {/* ===============================================
                RIGHT
            =============================================== */}

            {facingRight && (
              <div
                className="
                  pointer-events-none

                  absolute
                  inset-0
                  z-30
                "
              >
                <div
                  className="
                    absolute

                    right-[5px]
                    top-[27px]

                    h-[13px]
                    w-[13px]

                    rounded-full

                    border-[2px]
                    border-zinc-900
                  "
                />

                <div
                  className="
                    absolute

                    right-[15px]
                    top-[32px]

                    h-[2px]
                    w-[13px]

                    bg-zinc-900
                  "
                />
              </div>
            )}
          </>
        )}

      {/* =====================================================
          SUNGLASSES
      ===================================================== */}

      {glasses ===
        "sunglasses" &&
        !facingUp && (
          <>
            {/* ===============================================
                FRONT
            =============================================== */}

            {facingDown && (
              <div
                className="
                  pointer-events-none

                  absolute
                  inset-0
                  z-30
                "
              >
                <div
                  className="
                    absolute

                    left-[8px]
                    top-[28px]

                    h-[10px]
                    w-[14px]

                    rounded-[3px]

                    border-[2px]
                    border-zinc-900

                    bg-zinc-900
                  "
                />

                <div
                  className="
                    absolute

                    right-[8px]
                    top-[28px]

                    h-[10px]
                    w-[14px]

                    rounded-[3px]

                    border-[2px]
                    border-zinc-900

                    bg-zinc-900
                  "
                />

                <div
                  className="
                    absolute

                    left-1/2
                    top-[31px]

                    h-[3px]
                    w-[9px]

                    -translate-x-1/2

                    bg-zinc-900
                  "
                />
              </div>
            )}

            {/* ===============================================
                LEFT
            =============================================== */}

            {facingLeft && (
              <div
                className="
                  pointer-events-none

                  absolute
                  inset-0
                  z-30
                "
              >
                <div
                  className="
                    absolute

                    left-[4px]
                    top-[28px]

                    h-[10px]
                    w-[15px]

                    rounded-[3px]

                    border-[2px]
                    border-zinc-900

                    bg-zinc-900
                  "
                />

                <div
                  className="
                    absolute

                    left-[16px]
                    top-[31px]

                    h-[3px]
                    w-[13px]

                    bg-zinc-900
                  "
                />
              </div>
            )}

            {/* ===============================================
                RIGHT
            =============================================== */}

            {facingRight && (
              <div
                className="
                  pointer-events-none

                  absolute
                  inset-0
                  z-30
                "
              >
                <div
                  className="
                    absolute

                    right-[4px]
                    top-[28px]

                    h-[10px]
                    w-[15px]

                    rounded-[3px]

                    border-[2px]
                    border-zinc-900

                    bg-zinc-900
                  "
                />

                <div
                  className="
                    absolute

                    right-[16px]
                    top-[31px]

                    h-[3px]
                    w-[13px]

                    bg-zinc-900
                  "
                />
              </div>
            )}
          </>
        )}

      {/* =====================================================
          RIBBON
      ===================================================== */}

      {ribbon && (
        <div
          className={`
            pointer-events-none

            absolute

            z-40

            h-[22px]
            w-[28px]

            ${
              facingDown
                ? `
                  -right-[8px]
                  top-[-5px]
                `
                : ""
            }

            ${
              facingUp
                ? `
                  -right-[5px]
                  top-[-4px]
                `
                : ""
            }

            ${
              facingLeft
                ? `
                  -left-[7px]
                  top-[-3px]

                  scale-[0.85]
                `
                : ""
            }

            ${
              facingRight
                ? `
                  -right-[7px]
                  top-[-3px]

                  scale-[0.85]
                `
                : ""
            }
          `}
        >
          {/* 왼쪽 리본 */}

          <div
            className="
              absolute

              left-0
              top-[4px]

              h-[14px]
              w-[13px]

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

              h-[14px]
              w-[13px]

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

              h-[9px]
              w-[9px]

              -translate-x-1/2

              rounded-full

              border-[2px]
              border-zinc-900

              bg-rose-400
            "
          />
        </div>
      )}

      {/* =====================================================
          CAP
      ===================================================== */}

      {hat === "cap" && (
        <div
          className="
            pointer-events-none

            absolute
            inset-0

            z-40
          "
        >
          {/* ===============================================
              FRONT / BACK
          =============================================== */}

          {(facingDown ||
            facingUp) && (
            <>
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

              {/* 뒤에서는 챙을 안 보이게 */}

              {facingDown && (
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
              )}
            </>
          )}

          {/* ===============================================
              LEFT
          =============================================== */}

          {facingLeft && (
            <>
              <div
                className="
                  absolute

                  left-[5px]
                  top-[-11px]

                  h-[21px]
                  w-[39px]

                  rounded-t-[50%]
                  rounded-b-[8px]

                  border-[3px]
                  border-zinc-900

                  bg-blue-500
                "
              />

              <div
                className="
                  absolute

                  -left-[3px]
                  top-[3px]

                  h-[5px]
                  w-[26px]

                  rounded-full

                  border-[2px]
                  border-zinc-900

                  bg-blue-500
                "
              />
            </>
          )}

          {/* ===============================================
              RIGHT
          =============================================== */}

          {facingRight && (
            <>
              <div
                className="
                  absolute

                  right-[5px]
                  top-[-11px]

                  h-[21px]
                  w-[39px]

                  rounded-t-[50%]
                  rounded-b-[8px]

                  border-[3px]
                  border-zinc-900

                  bg-blue-500
                "
              />

              <div
                className="
                  absolute

                  -right-[3px]
                  top-[3px]

                  h-[5px]
                  w-[26px]

                  rounded-full

                  border-[2px]
                  border-zinc-900

                  bg-blue-500
                "
              />
            </>
          )}
        </div>
      )}

      {/* =====================================================
          PARTY HAT
      ===================================================== */}

      {hat === "party" && (
        <div
          className="
            pointer-events-none

            absolute
            inset-0

            z-40
          "
        >
          <div
            className={`
              absolute

              top-[-25px]

              h-0
              w-0

              border-l-[15px]
              border-r-[15px]
              border-b-[31px]

              border-l-transparent
              border-r-transparent
              border-b-violet-500

              ${
                facingDown ||
                facingUp
                  ? `
                    left-1/2
                    -translate-x-1/2
                  `
                  : ""
              }

              ${
                facingLeft
                  ? `
                    left-[7px]

                    -rotate-[7deg]

                    scale-[0.92]
                  `
                  : ""
              }

              ${
                facingRight
                  ? `
                    right-[7px]

                    rotate-[7deg]

                    scale-[0.92]
                  `
                  : ""
              }
            `}
          />

          <div
            className={`
              absolute

              top-[-29px]

              h-[8px]
              w-[8px]

              rounded-full

              bg-yellow-400

              ${
                facingDown ||
                facingUp
                  ? `
                    left-1/2
                    -translate-x-1/2
                  `
                  : ""
              }

              ${
                facingLeft
                  ? "left-[18px]"
                  : ""
              }

              ${
                facingRight
                  ? "right-[18px]"
                  : ""
              }
            `}
          />
        </div>
      )}

      {/* =====================================================
          TIE

          뒤를 바라볼 때는 보이지 않는다.
      ===================================================== */}

      {tie &&
        !facingUp && (
          <div
            className="
              pointer-events-none

              absolute
              inset-0

              z-30
            "
          >
            {/* ===============================================
                FRONT
            =============================================== */}

            {facingDown && (
              <>
                {/* 매듭 */}

                <div
                  className="
                    absolute

                    left-1/2
                    top-[49px]

                    h-[5px]
                    w-[5px]

                    -translate-x-1/2

                    rotate-45

                    rounded-[1px]

                    bg-red-600
                  "
                />

                {/* 본체 */}

                <div
                  className="
                    absolute

                    left-1/2
                    top-[53px]

                    h-[12px]
                    w-[6px]

                    -translate-x-1/2

                    bg-red-600

                    [clip-path:polygon(50%_0%,100%_82%,50%_100%,0%_82%)]
                  "
                />
              </>
            )}

            {/* ===============================================
                LEFT
            =============================================== */}

            {facingLeft && (
              <div
                className="
                  absolute

                  left-[20px]
                  top-[50px]

                  h-[13px]
                  w-[6px]

                  -rotate-[8deg]

                  scale-[0.82]

                  origin-top

                  bg-red-600

                  [clip-path:polygon(50%_0%,100%_82%,50%_100%,0%_82%)]
                "
              />
            )}

            {/* ===============================================
                RIGHT
            =============================================== */}

            {facingRight && (
              <div
                className="
                  absolute

                  right-[20px]
                  top-[50px]

                  h-[13px]
                  w-[6px]

                  rotate-[8deg]

                  scale-[0.82]

                  origin-top

                  bg-red-600

                  [clip-path:polygon(50%_0%,100%_82%,50%_100%,0%_82%)]
                "
              />
            )}
          </div>
        )}
    </>
  );
}

/* =========================================================
   Exports
========================================================= */

export type {
  GlassesType,
  HatType,
};