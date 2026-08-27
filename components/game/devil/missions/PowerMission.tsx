"use client";

import {
  useMemo,
  useState,
} from "react";

/* =========================================================
   Types
========================================================= */

type Props = {
  onComplete: () => void;
};

type WireColor =
  | "red"
  | "blue"
  | "yellow"
  | "green";

type WireInfo = {
  id: WireColor;
  label: string;
  icon: string;

  wireClass: string;
  lightClass: string;
  buttonClass: string;
};

/* =========================================================
   Wire Data
========================================================= */

const WIRES: WireInfo[] = [
  {
    id: "red",
    label: "R-01",
    icon: "⚡",
    wireClass: "bg-red-500",
    lightClass: "bg-red-400",
    buttonClass:
      "border-red-500 bg-red-100",
  },

  {
    id: "blue",
    label: "B-02",
    icon: "⚡",
    wireClass: "bg-blue-500",
    lightClass: "bg-blue-400",
    buttonClass:
      "border-blue-500 bg-blue-100",
  },

  {
    id: "yellow",
    label: "Y-03",
    icon: "⚡",
    wireClass: "bg-yellow-400",
    lightClass: "bg-yellow-300",
    buttonClass:
      "border-yellow-400 bg-yellow-100",
  },

  {
    id: "green",
    label: "G-04",
    icon: "⚡",
    wireClass: "bg-emerald-500",
    lightClass: "bg-emerald-400",
    buttonClass:
      "border-emerald-500 bg-emerald-100",
  },
];

/* =========================================================
   Shuffle
========================================================= */

function shuffleArray<T>(
  array: T[]
) {
  const copied = [...array];

  for (
    let index =
      copied.length - 1;
    index > 0;
    index -= 1
  ) {
    const randomIndex =
      Math.floor(
        Math.random() *
          (index + 1)
      );

    [
      copied[index],
      copied[randomIndex],
    ] = [
      copied[randomIndex],
      copied[index],
    ];
  }

  return copied;
}

/* =========================================================
   PowerMission
========================================================= */

export default function PowerMission({
  onComplete,
}: Props) {
  /* =======================================================
     오른쪽 단자 순서 랜덤
  ======================================================= */

  const rightWires =
    useMemo(
      () =>
        shuffleArray(
          WIRES
        ),
      []
    );

  /* =======================================================
     State
  ======================================================= */

  const [
    selectedWire,
    setSelectedWire,
  ] =
    useState<WireColor | null>(
      null
    );

  const [
    connectedWires,
    setConnectedWires,
  ] =
    useState<WireColor[]>(
      []
    );

  const [
    wrongWire,
    setWrongWire,
  ] =
    useState<WireColor | null>(
      null
    );

  const [
    message,
    setMessage,
  ] =
    useState(
      "왼쪽 케이블을 선택해주세요."
    );

  const [
    success,
    setSuccess,
  ] =
    useState(false);

  /* =======================================================
     Progress
  ======================================================= */

  const progress =
    Math.round(
      (
        connectedWires.length /
        WIRES.length
      ) *
        100
    );

  /* =======================================================
     Left Wire Select
  ======================================================= */

  function handleSelectLeft(
    wire:
      WireColor
  ) {
    if (
      success ||
      connectedWires.includes(
        wire
      )
    ) {
      return;
    }

    setSelectedWire(
      wire
    );

    setWrongWire(
      null
    );

    const info =
      WIRES.find(
        item =>
          item.id ===
          wire
      );

    setMessage(
      `${info?.label ?? ""} 케이블을 어디에 연결할까요?`
    );
  }

  /* =======================================================
     Right Terminal Select
  ======================================================= */

  function handleSelectRight(
    wire:
      WireColor
  ) {
    if (
      success ||
      connectedWires.includes(
        wire
      )
    ) {
      return;
    }

    if (!selectedWire) {
      setMessage(
        "먼저 왼쪽 케이블을 선택해주세요."
      );

      return;
    }

    /* =====================================
       Wrong Connection
    ===================================== */

    if (
      selectedWire !==
      wire
    ) {
      setWrongWire(
        wire
      );

      setMessage(
        "⚠️ 잘못된 단자입니다! 같은 색의 단자를 찾아주세요."
      );

      window.setTimeout(
        () => {
          setWrongWire(
            null
          );
        },
        500
      );

      return;
    }

    /* =====================================
       Correct Connection
    ===================================== */

    const nextConnected =
      [
        ...connectedWires,
        wire,
      ];

    setConnectedWires(
      nextConnected
    );

    setSelectedWire(
      null
    );

    setWrongWire(
      null
    );

    const info =
      WIRES.find(
        item =>
          item.id ===
          wire
      );

    setMessage(
      `✓ ${info?.label ?? ""} 회선 연결 완료`
    );

    /* =====================================
       Complete
    ===================================== */

    if (
      nextConnected.length ===
      WIRES.length
    ) {
      setSuccess(
        true
      );

      setMessage(
        "⚡ 전력 회선이 정상적으로 복구되었습니다!"
      );

      window.setTimeout(
        () => {
          onComplete();
        },
        1200
      );
    }
  }

  /* =======================================================
     Render
  ======================================================= */

  return (
    <div className="w-full">
      {/* =================================================
          Control Panel Header
      ================================================= */}

      <div
        className="
          overflow-hidden
          rounded-2xl
          border-[5px]
          border-[#292c31]
          bg-[#454950]
          shadow-xl
        "
      >
        {/* Top */}

        <div
          className="
            flex
            items-center
            justify-between
            gap-3
            border-b
            border-white/10
            bg-[#303338]
            px-5
            py-4
          "
        >
          <div>
            <div
              className="
                text-[9px]
                font-black
                tracking-[0.18em]
                text-white/35
              "
            >
              GAMJA OFFICE
              ELECTRICAL PANEL
            </div>

            <div
              className="
                mt-1
                text-[15px]
                font-black
                text-white
              "
            >
              ⚡ MAIN POWER PANEL
            </div>
          </div>

          <div
            className={`
              flex
              items-center
              gap-2
              rounded-full
              px-3
              py-1.5
              text-[9px]
              font-black

              ${
                success
                  ? `
                    bg-emerald-500/20
                    text-emerald-300
                  `
                  : `
                    bg-red-500/20
                    text-red-300
                  `
              }
            `}
          >
            <div
              className={`
                h-2
                w-2
                rounded-full

                ${
                  success
                    ? "bg-emerald-400"
                    : "bg-red-400 animate-pulse"
                }
              `}
            />

            {success
              ? "NORMAL"
              : "POWER ERROR"}
          </div>
        </div>

        {/* =================================================
            Warning
        ================================================= */}

        {!success && (
          <div
            className="
              border-b
              border-amber-400/20
              bg-amber-400/10
              px-4
              py-2.5
              text-center
              text-[9px]
              font-bold
              text-amber-200
            "
          >
            ⚠️ 끊어진 회선을 동일한 색상의
            단자에 연결하십시오.
          </div>
        )}

        {/* =================================================
            Progress
        ================================================= */}

        <div
          className="
            px-5
            pt-5
          "
        >
          <div
            className="
              flex
              items-end
              justify-between
            "
          >
            <div>
              <div
                className="
                  text-[9px]
                  font-black
                  tracking-[0.12em]
                  text-white/30
                "
              >
                CONNECTION STATUS
              </div>

              <div
                className="
                  mt-1
                  text-[12px]
                  font-bold
                  text-white/70
                "
              >
                전력 회선 복구
              </div>
            </div>

            <div
              className="
                text-right
              "
            >
              <span
                className="
                  text-[20px]
                  font-black
                  text-white
                "
              >
                {
                  connectedWires.length
                }
              </span>

              <span
                className="
                  text-[11px]
                  font-bold
                  text-white/30
                "
              >
                {" "}
                / {WIRES.length}
              </span>
            </div>
          </div>

          <div
            className="
              mt-3
              h-2
              overflow-hidden
              rounded-full
              bg-black/30
            "
          >
            <div
              className="
                h-full
                rounded-full
                bg-emerald-400
                transition-all
                duration-300
              "
              style={{
                width:
                  `${progress}%`,
              }}
            />
          </div>
        </div>

        {/* =================================================
            Wiring Board
        ================================================= */}

        <div
          className="
            m-5
            rounded-xl
            border-2
            border-black/40
            bg-[#202328]
            p-4
            shadow-inner
          "
        >
          {/* Labels */}

          <div
            className="
              mb-4
              grid
              grid-cols-[1fr_70px_1fr]
              items-center
              text-[8px]
              font-black
              tracking-[0.15em]
              text-white/25
            "
          >
            <div>
              DISCONNECTED
            </div>

            <div />

            <div className="text-right">
              TERMINAL
            </div>
          </div>

          {/* =================================================
              Wires
          ================================================= */}

          <div
            className="
              space-y-4
            "
          >
            {WIRES.map(
              (
                leftWire,
                index
              ) => {
                const rightWire =
                  rightWires[
                    index
                  ];

                const leftConnected =
                  connectedWires.includes(
                    leftWire.id
                  );

                const rightConnected =
                  connectedWires.includes(
                    rightWire.id
                  );

                const selected =
                  selectedWire ===
                  leftWire.id;

                const wrong =
                  wrongWire ===
                  rightWire.id;

                return (
                  <div
                    key={
                      leftWire.id
                    }
                    className="
                      grid
                      min-h-[66px]
                      grid-cols-[1fr_70px_1fr]
                      items-center
                      gap-2
                    "
                  >
                    {/* =================================
                        Left Cable
                    ================================= */}

                    <button
                      type="button"
                      disabled={
                        success ||
                        leftConnected
                      }
                      onClick={() =>
                        handleSelectLeft(
                          leftWire.id
                        )
                      }
                      className={`
                        relative
                        flex
                        min-h-[58px]
                        items-center
                        gap-3
                        overflow-hidden
                        rounded-lg
                        border-2
                        px-3
                        py-2
                        text-left
                        transition
                        active:scale-[0.98]

                        ${
                          leftConnected
                            ? `
                              border-emerald-500/50
                              bg-emerald-500/10
                            `
                            : selected
                              ? `
                                border-white
                                bg-white/15
                              `
                              : `
                                border-white/10
                                bg-white/5
                                hover:bg-white/10
                              `
                        }

                        disabled:cursor-default
                      `}
                    >
                      {/* Light */}

                      <div
                        className={`
                          h-3
                          w-3
                          shrink-0
                          rounded-full

                          ${
                            leftConnected
                              ? "bg-emerald-400"
                              : leftWire.lightClass
                          }
                        `}
                      />

                      <div>
                        <div
                          className="
                            text-[11px]
                            font-black
                            text-white
                          "
                        >
                          {
                            leftWire.label
                          }
                        </div>

                        <div
                          className="
                            mt-0.5
                            text-[8px]
                            font-bold
                            text-white/35
                          "
                        >
                          {leftConnected
                            ? "CONNECTED"
                            : selected
                              ? "SELECTED"
                              : "SELECT"}
                        </div>
                      </div>

                      {/* Cable */}

                      <div
                        className={`
                          absolute
                          bottom-0
                          right-0
                          top-0
                          w-2
                          ${leftWire.wireClass}
                        `}
                      />
                    </button>

                    {/* =================================
                        Middle Cable Visualization
                    ================================= */}

                    <div
                      className="
                        relative
                        h-[36px]
                      "
                    >
                      {leftConnected ? (
                        <>
                          <div
                            className={`
                              absolute
                              left-[-10px]
                              right-[-10px]
                              top-1/2
                              h-[6px]
                              -translate-y-1/2
                              rounded-full
                              ${leftWire.wireClass}
                            `}
                          />

                          <div
                            className="
                              absolute
                              left-1/2
                              top-1/2
                              flex
                              h-5
                              w-5
                              -translate-x-1/2
                              -translate-y-1/2
                              items-center
                              justify-center
                              rounded-full
                              bg-emerald-500
                              text-[9px]
                              font-black
                              text-white
                            "
                          >
                            ✓
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Left broken wire */}

                          <div
                            className={`
                              absolute
                              left-[-10px]
                              top-[9px]
                              h-[6px]
                              w-[32px]
                              rotate-[8deg]
                              rounded-full
                              ${leftWire.wireClass}
                            `}
                          />

                          {/* Broken end */}

                          <div
                            className="
                              absolute
                              left-[20px]
                              top-[13px]
                              text-[13px]
                              text-amber-300
                            "
                          >
                            ⚡
                          </div>

                          <div
                            className="
                              absolute
                              right-[20px]
                              top-[13px]
                              text-[13px]
                              text-amber-300
                            "
                          >
                            ⚡
                          </div>

                          {/* Right broken wire */}

                          <div
                            className={`
                              absolute
                              right-[-10px]
                              top-[21px]
                              h-[6px]
                              w-[32px]
                              rotate-[-8deg]
                              rounded-full
                              bg-zinc-500
                            `}
                          />
                        </>
                      )}
                    </div>

                    {/* =================================
                        Right Terminal
                    ================================= */}

                    <button
                      type="button"
                      disabled={
                        success ||
                        rightConnected
                      }
                      onClick={() =>
                        handleSelectRight(
                          rightWire.id
                        )
                      }
                      className={`
                        relative
                        flex
                        min-h-[58px]
                        items-center
                        justify-between
                        gap-2
                        overflow-hidden
                        rounded-lg
                        border-2
                        px-3
                        py-2
                        text-left
                        transition
                        active:scale-[0.98]

                        ${
                          rightConnected
                            ? `
                              border-emerald-500/50
                              bg-emerald-500/10
                            `
                            : wrong
                              ? `
                                border-red-500
                                bg-red-500/20
                              `
                              : `
                                border-white/10
                                bg-white/5
                                hover:bg-white/10
                              `
                        }

                        disabled:cursor-default
                      `}
                    >
                      {/* Terminal stripe */}

                      <div
                        className={`
                          absolute
                          bottom-0
                          left-0
                          top-0
                          w-2
                          ${rightWire.wireClass}
                        `}
                      />

                      <div
                        className="
                          pl-2
                        "
                      >
                        <div
                          className="
                            text-[11px]
                            font-black
                            text-white
                          "
                        >
                          {
                            rightWire.label
                          }
                        </div>

                        <div
                          className="
                            mt-0.5
                            text-[8px]
                            font-bold
                            text-white/35
                          "
                        >
                          {rightConnected
                            ? "CONNECTED"
                            : "TERMINAL"}
                        </div>
                      </div>

                      {/* Socket */}

                      <div
                        className={`
                          flex
                          h-7
                          w-7
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          border-[4px]
                          border-black/40
                          ${rightWire.wireClass}
                        `}
                      >
                        <div
                          className="
                            h-2
                            w-2
                            rounded-full
                            bg-black/50
                          "
                        />
                      </div>
                    </button>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* =================================================
            Status Screen
        ================================================= */}

        <div
          className="
            mx-5
            mb-5
            rounded-lg
            border
            border-black/30
            bg-[#151719]
            px-4
            py-3
          "
        >
          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            <div
              className={`
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-lg
                text-lg

                ${
                  success
                    ? `
                      bg-emerald-500/15
                    `
                    : `
                      bg-amber-500/10
                    `
                }
              `}
            >
              {success
                ? "✅"
                : "⚡"}
            </div>

            <div>
              <div
                className="
                  text-[8px]
                  font-black
                  tracking-[0.12em]
                  text-white/25
                "
              >
                SYSTEM MESSAGE
              </div>

              <div
                className={`
                  mt-1
                  text-[10px]
                  font-bold

                  ${
                    message.includes(
                      "잘못된"
                    )
                      ? "text-red-400"
                      : success
                        ? "text-emerald-400"
                        : "text-white/60"
                  }
                `}
              >
                {message}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          Instruction
      ================================================= */}

      {!success && (
        <div
          className="
            mt-4
            rounded-lg
            bg-black/5
            px-4
            py-3
            text-center
            text-[9px]
            font-semibold
            leading-4
            text-black/40
          "
        >
          ① 왼쪽의 끊어진 케이블을 선택한 뒤
          {" "}
          ② 오른쪽에서
          <strong className="mx-1 text-black/60">
            같은 색 단자
          </strong>
          를 선택하세요.
        </div>
      )}
    </div>
  );
}