"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import Potato from "@/components/character/Potato";

import type {
  CharacterStyle,
} from "@/components/character/CharacterCustomizer";

/* =========================================================
   Types
========================================================= */

export type DevilLobbyPlayer = {
  id: string;

  nickname: string;

  characterStyle?:
    CharacterStyle;
};

export type DevilLobbyRoom = {
  id: string;

  hostId: string;

  status:
    | "waiting"
    | "countdown"
    | "playing";

  maxPlayers: number;

  players:
    DevilLobbyPlayer[];

  countdownEndsAt?:
    number | null;
};

export type DevilLobbyChatMessage = {
  id: string;

  nickname: string;

  message: string;

  createdAt?: number;
};

type DevilLobbyProps = {
  room:
    DevilLobbyRoom;

  mySocketId:
    string;

  onLeave:
    () => void;

  onStart:
    () => void;

  /*
   * 대기실 채팅
   */
  messages?:
    DevilLobbyChatMessage[];

  onSendMessage?: (
    message: string
  ) => void;
};

/* =========================================================
   Constants
========================================================= */

const MIN_PLAYERS =
  2;

const PLAYER_POSITIONS = [
  {
    left: "25%",
    top: "42%",
  },

  {
    left: "48%",
    top: "38%",
  },

  {
    left: "72%",
    top: "43%",
  },

  {
    left: "36%",
    top: "67%",
  },

  {
    left: "64%",
    top: "68%",
  },
];

/* =========================================================
   Helper
========================================================= */

function getDisplayName(
  nickname: string
) {
  const trimmed =
    nickname
      .replace(
        /\s*감자\s*$/g,
        ""
      )
      .trim();

  return trimmed
    ? `${trimmed} 감자`
    : "감자";
}

/* =========================================================
   DevilLobby
========================================================= */

export default function DevilLobby({
  room,

  mySocketId,

  onLeave,

  onStart,

  messages = [],

  onSendMessage,
}: DevilLobbyProps) {
  /* =======================================================
     Chat
  ======================================================= */

  const [
    chatInput,
    setChatInput,
  ] =
    useState("");

  const chatScrollRef =
    useRef<HTMLDivElement | null>(
      null
    );

  /* =======================================================
     Room
  ======================================================= */

  const isHost =
    room.hostId ===
    mySocketId;

  const playerCount =
    room.players.length;

  const needPlayers =
    Math.max(
      0,

      MIN_PLAYERS -
        playerCount
    );

  const canStart =
    isHost &&
    room.status ===
      "waiting" &&
    playerCount >=
      MIN_PLAYERS;

  /* =======================================================
     Chat Auto Scroll
  ======================================================= */

  useEffect(() => {
    const element =
      chatScrollRef.current;

    if (!element) {
      return;
    }

    element.scrollTop =
      element.scrollHeight;
  }, [
    messages,
  ]);

  /* =======================================================
     Send Chat
  ======================================================= */

  const sendMessage =
    () => {
      const text =
        chatInput
          .trim()
          .slice(
            0,
            100
          );

      if (!text) {
        return;
      }

      onSendMessage?.(
        text
      );

      setChatInput(
        ""
      );
    };

  /* =======================================================
     Render
  ======================================================= */

  return (
    <div
      data-no-move

      className="
        fixed
        inset-0
        z-[20000]

        flex
        items-center
        justify-center

        overflow-hidden

        bg-black/65

        p-4

        backdrop-blur-[3px]

        max-[900px]:p-0
      "
    >
      {/* =================================================
          Lobby Window
      ================================================= */}

      <div
        className="
          flex

          h-[min(780px,94dvh)]
          w-full
          max-w-[1050px]

          flex-col

          overflow-hidden

          rounded-[24px]

          border
          border-zinc-700

          bg-[#161616]

          shadow-[0_30px_100px_rgba(0,0,0,0.55)]

          max-[900px]:h-[100dvh]
          max-[900px]:max-h-[100dvh]
          max-[900px]:max-w-none
          max-[900px]:rounded-none
          max-[900px]:border-0
        "
      >
        {/* =================================================
            Header
        ================================================= */}

        <header
          className="
            flex
            shrink-0

            items-center
            justify-between

            border-b
            border-zinc-800

            bg-[#111111]

            px-6
            py-4

            max-[900px]:px-3
            max-[900px]:py-2
          "
        >
          <div
            className="
              min-w-0
            "
          >
            <div
              className="
                text-[8px]
                font-black

                tracking-[0.22em]

                text-zinc-500

                max-[900px]:hidden
              "
            >
              GAMJA OFFICE GAME
            </div>

            <div
              className="
                mt-1

                flex
                items-center
                gap-2

                max-[900px]:mt-0
              "
            >
              <span>
                😈
              </span>

              <h2
                className="
                  truncate

                  text-[18px]
                  font-black

                  text-white

                  max-[900px]:text-[14px]
                "
              >
                감자 전쟁
              </h2>
            </div>

            <p
              className="
                mt-1

                text-[9px]

                text-zinc-500

                max-[900px]:hidden
              "
            >
              창고 대기실에서 다른 감자를 기다리고 있습니다.
            </p>
          </div>

          <div
            className="
              ml-3

              flex
              shrink-0

              items-center
              gap-2
            "
          >
            <div
              className="
                rounded-lg

                border
                border-zinc-700

                bg-zinc-900

                px-3
                py-2

                font-mono

                text-[9px]
                font-black

                tracking-[0.1em]

                text-zinc-300

                max-[900px]:px-2
                max-[900px]:py-1.5
                max-[900px]:text-[8px]
              "
            >
              {room.id}
            </div>

            <div
              className="
                rounded-lg

                bg-white

                px-3
                py-2

                text-[9px]
                font-black

                text-zinc-900

                max-[900px]:px-2
                max-[900px]:py-1.5
              "
            >
              {playerCount}
              {" / "}
              {room.maxPlayers}
            </div>
          </div>
        </header>

        {/* =================================================
            Warehouse
        ================================================= */}

        <div
          className="
            relative

            min-h-0
            flex-1

            overflow-hidden

            bg-[#242424]
          "
        >
          <div
            className="
              absolute

              inset-[18px]

              overflow-hidden

              rounded-[14px]

              border-[6px]
              border-[#151515]

              bg-[#74716a]

              shadow-inner

              max-[900px]:inset-[5px]
              max-[900px]:rounded-md
              max-[900px]:border-[3px]
            "
          >
            {/* =============================================
                Floor
            ============================================= */}

            <div
              className="
                absolute
                inset-0

                bg-[#74716a]

                [background-image:linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)]

                [background-size:56px_56px]
              "
            />

            {/* =============================================
                Top Wall
            ============================================= */}

            <div
              className="
                absolute

                left-0
                right-0
                top-0

                h-[70px]

                border-b-[5px]
                border-[#30302e]

                bg-[#55534f]

                max-[900px]:h-[42px]
                max-[900px]:border-b-[3px]
              "
            />

            {/* =============================================
                Fluorescent Light
            ============================================= */}

            <div
              className="
                absolute

                left-1/2
                top-[18px]

                h-[10px]
                w-[180px]

                -translate-x-1/2

                rounded-sm

                bg-[#ebe8d2]

                shadow-[0_0_26px_rgba(255,250,210,0.45)]

                max-[900px]:top-[8px]
                max-[900px]:h-[6px]
                max-[900px]:w-[130px]
              "
            />

            {/* =============================================
                Sign
            ============================================= */}

            <div
              className="
                absolute

                left-1/2
                top-[43px]

                -translate-x-1/2

                rounded

                border
                border-zinc-500

                bg-[#292929]

                px-4
                py-1

                font-mono

                text-[7px]
                font-black

                tracking-[0.15em]

                text-zinc-300

                max-[900px]:top-[19px]
                max-[900px]:px-2
                max-[900px]:text-[6px]
              "
            >
              STORAGE B-02
            </div>

            {/* =============================================
                Left Shelf
            ============================================= */}

            <WarehouseShelf
              side="left"
            />

            {/* =============================================
                Right Shelf
            ============================================= */}

            <WarehouseShelf
              side="right"
            />

            {/* =============================================
                Boxes
            ============================================= */}

            <div
              className="
                absolute

                left-[24%]
                top-[16%]

                h-[48px]
                w-[72px]

                border-[3px]
                border-[#765938]

                bg-[#a47a4d]

                max-[900px]:h-[28px]
                max-[900px]:w-[45px]
              "
            />

            <div
              className="
                absolute

                left-[31%]
                top-[18%]

                h-[40px]
                w-[58px]

                border-[3px]
                border-[#735633]

                bg-[#92704c]

                max-[900px]:h-[23px]
                max-[900px]:w-[38px]
              "
            />

            <div
              className="
                absolute

                right-[27%]
                top-[17%]

                h-[45px]
                w-[70px]

                border-[3px]
                border-[#735633]

                bg-[#a67c4c]

                max-[900px]:h-[27px]
                max-[900px]:w-[43px]
              "
            />

            {/* =============================================
                Equipment
            ============================================= */}

            <div
              className="
                absolute

                bottom-[8%]
                left-[5%]

                h-[15%]
                w-[19%]

                border-[4px]
                border-[#3e3933]

                bg-[#66594c]
              "
            >
              <div
                className="
                  absolute

                  left-[10%]
                  top-[14%]

                  h-[42%]
                  w-[35%]

                  border-[3px]
                  border-zinc-900

                  bg-[#34383b]
                "
              />
            </div>

            {/* =============================================
                Exit
            ============================================= */}

            <div
              className="
                absolute

                bottom-0
                left-1/2

                h-[68px]
                w-[110px]

                -translate-x-1/2

                border-x-[5px]
                border-t-[5px]
                border-[#33312f]

                bg-[#4c4c49]

                max-[900px]:h-[40px]
                max-[900px]:w-[76px]
                max-[900px]:border-x-[3px]
                max-[900px]:border-t-[3px]
              "
            >
              <div
                className="
                  absolute

                  left-1/2
                  top-[8px]

                  -translate-x-1/2

                  rounded

                  bg-red-800/80

                  px-2
                  py-1

                  text-[7px]
                  font-black

                  text-red-100

                  max-[900px]:top-[4px]
                  max-[900px]:py-0.5
                  max-[900px]:text-[6px]
                "
              >
                EXIT
              </div>
            </div>

            {/* =============================================
                Waiting Zone
            ============================================= */}

            <div
              className="
                pointer-events-none

                absolute

                left-[21%]
                right-[21%]
                top-[29%]
                bottom-[13%]

                rounded-[28px]

                border-2
                border-dashed
                border-yellow-300/15
              "
            />

            {/* =============================================
                Players
            ============================================= */}

            {room.players.map(
              (
                player,
                index
              ) => {
                const position =
                  PLAYER_POSITIONS[
                    index %
                      PLAYER_POSITIONS.length
                  ];

                const host =
                  player.id ===
                  room.hostId;

                const me =
                  player.id ===
                  mySocketId;

                return (
                  <div
                    key={
                      player.id
                    }

                    className="
                      absolute
                      z-30

                      flex

                      -translate-x-1/2
                      -translate-y-1/2

                      flex-col
                      items-center

                      max-[900px]:scale-[0.72]
                    "

                    style={{
                      left:
                        position.left,

                      top:
                        position.top,
                    }}
                  >
                    <div
                      className="
                        mb-1

                        flex
                        h-[18px]

                        items-center
                        gap-1
                      "
                    >
                      {host && (
                        <span
                          className="
                            rounded-full

                            bg-amber-100

                            px-2
                            py-0.5

                            text-[7px]
                            font-black

                            text-amber-700
                          "
                        >
                          👑 방장
                        </span>
                      )}

                      {me && (
                        <span
                          className="
                            rounded-full

                            bg-zinc-950

                            px-2
                            py-0.5

                            text-[7px]
                            font-black

                            text-white
                          "
                        >
                          나
                        </span>
                      )}
                    </div>

                    <Potato
                      name={
                        getDisplayName(
                          player.nickname
                        )
                      }

                      glasses={
                        player
                          .characterStyle
                          ?.glasses ??
                        "none"
                      }

                      hat={
                        player
                          .characterStyle
                          ?.hat ??
                        "none"
                      }

                      ribbon={
                        player
                          .characterStyle
                          ?.ribbon ??
                        false
                      }

                      tie={
                        player
                          .characterStyle
                          ?.tie ??
                        false
                      }

                      color={
                        player
                          .characterStyle
                          ?.color ??
                        "default"
                      }

                      direction="down"

                      moving={
                        false
                      }

                      scale={
                        0.9
                      }
                    />

                    <div
                      className="
                        mt-[-3px]

                        flex
                        items-center
                        gap-1

                        rounded-full

                        bg-white/90

                        px-2
                        py-1

                        text-[7px]
                        font-bold

                        text-zinc-600

                        shadow
                      "
                    >
                      <span
                        className="
                          h-1.5
                          w-1.5

                          rounded-full

                          bg-emerald-500
                        "
                      />

                      대기 중
                    </div>
                  </div>
                );
              }
            )}

            {/* =============================================
                Empty Slots
            ============================================= */}

            {Array.from({
              length:
                Math.max(
                  0,

                  Math.min(
                    room.maxPlayers,
                    PLAYER_POSITIONS.length
                  ) -
                    playerCount
                ),
            }).map(
              (
                _,
                emptyIndex
              ) => {
                const index =
                  playerCount +
                  emptyIndex;

                const position =
                  PLAYER_POSITIONS[
                    index %
                      PLAYER_POSITIONS.length
                  ];

                return (
                  <div
                    key={
                      `empty-${emptyIndex}`
                    }

                    className="
                      absolute
                      z-10

                      flex

                      -translate-x-1/2
                      -translate-y-1/2

                      flex-col
                      items-center

                      max-[900px]:scale-75
                    "

                    style={{
                      left:
                        position.left,

                      top:
                        position.top,
                    }}
                  >
                    <div
                      className="
                        flex

                        h-[70px]
                        w-[55px]

                        items-center
                        justify-center

                        rounded-[50%]

                        border-2
                        border-dashed
                        border-white/15

                        bg-black/10

                        text-lg
                        font-black

                        text-white/15
                      "
                    >
                      ?
                    </div>
                  </div>
                );
              }
            )}

            {/* =============================================
                Lobby Chat
            ============================================= */}

            <div
              data-no-move

              className="
                absolute

                bottom-[14px]
                right-[14px]

                z-[100]

                flex

                h-[190px]
                w-[270px]

                flex-col

                overflow-hidden

                rounded-xl

                border
                border-white/10

                bg-black/75

                shadow-2xl

                backdrop-blur-md

                max-[900px]:bottom-[5px]
                max-[900px]:right-[5px]
                max-[900px]:h-[125px]
                max-[900px]:w-[215px]
              "
            >
              {/* Chat Header */}

              <div
                className="
                  flex
                  items-center
                  justify-between

                  border-b
                  border-white/10

                  px-3
                  py-2

                  max-[900px]:px-2
                  max-[900px]:py-1.5
                "
              >
                <span
                  className="
                    text-[8px]
                    font-black

                    tracking-[0.14em]

                    text-white/60
                  "
                >
                  LOBBY CHAT
                </span>

                <span
                  className="
                    text-[7px]

                    text-emerald-400
                  "
                >
                  ● {playerCount}
                </span>
              </div>

              {/* Messages */}

              <div
                ref={
                  chatScrollRef
                }

                className="
                  min-h-0
                  flex-1

                  space-y-1

                  overflow-y-auto

                  px-3
                  py-2

                  scrollbar-thin

                  max-[900px]:px-2
                  max-[900px]:py-1
                "
              >
                {messages.length ===
                0 ? (
                  <div
                    className="
                      py-3
                      text-center

                      text-[8px]

                      text-white/25
                    "
                  >
                    대기 중인 감자들과
                    이야기해보세요.
                  </div>
                ) : (
                  messages.map(
                    item => (
                      <div
                        key={
                          item.id
                        }

                        className="
                          break-words

                          text-[9px]
                          leading-4

                          text-white/65

                          max-[900px]:text-[8px]
                          max-[900px]:leading-3
                        "
                      >
                        <span
                          className="
                            mr-1

                            font-black

                            text-white
                          "
                        >
                          {
                            item.nickname
                          }
                        </span>

                        {
                          item.message
                        }
                      </div>
                    )
                  )
                )}
              </div>

              {/* Input */}

              <div
                className="
                  flex
                  shrink-0

                  border-t
                  border-white/10

                  bg-black/30
                "
              >
                <input
                  type="text"

                  value={
                    chatInput
                  }

                  maxLength={
                    100
                  }

                  placeholder="메시지 입력..."

                  onChange={
                    event => {
                      setChatInput(
                        event
                          .target
                          .value
                      );
                    }
                  }

                  onKeyDown={
                    event => {
                      /*
                       * 상위 게임 이동 이벤트 방지
                       */
                      event.stopPropagation();

                      if (
                        event.key ===
                        "Enter"
                      ) {
                        event.preventDefault();

                        sendMessage();
                      }
                    }
                  }

                  onClick={
                    event => {
                      event.stopPropagation();
                    }
                  }

                  className="
                    min-w-0
                    flex-1

                    bg-transparent

                    px-3
                    py-2.5

                    text-[9px]

                    text-white

                    outline-none

                    placeholder:text-white/25

                    max-[900px]:px-2
                    max-[900px]:py-2
                    max-[900px]:text-[8px]
                  "
                />

                <button
                  type="button"

                  onClick={
                    sendMessage
                  }

                  disabled={
                    !chatInput.trim()
                  }

                  className="
                    border-l
                    border-white/10

                    px-3

                    text-[8px]
                    font-black

                    text-white/70

                    transition

                    hover:bg-white/10

                    disabled:cursor-not-allowed
                    disabled:text-white/20

                    max-[900px]:px-2
                  "
                >
                  SEND
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            Footer
        ================================================= */}

        <footer
          className="
            shrink-0

            border-t
            border-zinc-800

            bg-[#111111]

            px-6
            py-4

            max-[900px]:px-3
            max-[900px]:py-2
          "
        >
          <div
            className="
              flex
              items-center
              gap-4

              max-[900px]:gap-2
            "
          >
            {/* Leave */}

            <button
              type="button"

              onClick={
                onLeave
              }

              className="
                shrink-0

                rounded-xl

                border
                border-zinc-700

                bg-zinc-900

                px-4
                py-3

                text-[9px]
                font-black

                text-zinc-400

                transition

                hover:border-red-500/40
                hover:bg-red-500/10
                hover:text-red-400

                max-[900px]:rounded-lg
                max-[900px]:px-3
                max-[900px]:py-2
                max-[900px]:text-[8px]
              "
            >
              나가기
            </button>

            {/* Status */}

            <div
              className="
                min-w-0
                flex-1

                text-center
              "
            >
              <div
                className="
                  text-[9px]
                  font-bold

                  text-zinc-400

                  max-[900px]:text-[8px]
                "
              >
                현재{" "}
                <span
                  className="
                    text-white
                  "
                >
                  {playerCount}명
                </span>
                {" "}
                참가
              </div>

              <div
                className="
                  mt-1

                  text-[7px]

                  text-zinc-600

                  max-[900px]:hidden
                "
              >
                참가자 모두 같은 게임 맵으로 이동합니다.
              </div>
            </div>

            {/* Start */}

            <div
              className="
                w-[190px]

                shrink-0

                max-[900px]:w-[135px]
              "
            >
              {isHost ? (
                <button
                  type="button"

                  disabled={
                    !canStart
                  }

                  onClick={
                    onStart
                  }

                  className="
                    w-full

                    rounded-xl

                    bg-white

                    px-4
                    py-3

                    text-[9px]
                    font-black

                    text-zinc-900

                    transition

                    enabled:hover:bg-amber-100

                    disabled:cursor-not-allowed
                    disabled:bg-zinc-800
                    disabled:text-zinc-600

                    max-[900px]:rounded-lg
                    max-[900px]:px-2
                    max-[900px]:py-2
                    max-[900px]:text-[8px]
                  "
                >
                  {needPlayers >
                  0
                    ? `${needPlayers}명 더 필요`
                    : "게임 시작"}
                </button>
              ) : (
                <div
                  className="
                    rounded-xl

                    border
                    border-zinc-800

                    bg-zinc-900

                    px-3
                    py-3

                    text-center

                    text-[8px]

                    text-zinc-500

                    max-[900px]:rounded-lg
                    max-[900px]:px-2
                    max-[900px]:py-2
                    max-[900px]:text-[7px]
                  "
                >
                  방장 대기 중...
                </div>
              )}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

/* =========================================================
   Warehouse Shelf
========================================================= */

function WarehouseShelf({
  side,
}: {
  side:
    | "left"
    | "right";
}) {
  return (
    <div
      className={`
        absolute

        top-[16%]

        h-[31%]
        w-[15%]

        border-[5px]
        border-[#363330]

        bg-[#59534b]

        shadow-xl

        max-[900px]:top-[14%]
        max-[900px]:h-[30%]
        max-[900px]:border-[3px]

        ${
          side ===
          "left"
            ? "left-[4%]"
            : "right-[4%]"
        }
      `}
    >
      <div
        className="
          absolute

          inset-x-0
          top-[31%]

          h-[5px]

          bg-[#34312f]

          max-[900px]:h-[3px]
        "
      />

      <div
        className="
          absolute

          inset-x-0
          top-[64%]

          h-[5px]

          bg-[#34312f]

          max-[900px]:h-[3px]
        "
      />

      <div
        className="
          absolute

          left-[8%]
          top-[7%]

          h-[20%]
          w-[40%]

          bg-[#ad8659]
        "
      />

      <div
        className="
          absolute

          right-[8%]
          top-[39%]

          h-[17%]
          w-[55%]

          bg-[#98734b]
        "
      />

      <div
        className="
          absolute

          left-[8%]
          bottom-[7%]

          h-[19%]
          w-[46%]

          bg-[#b28758]
        "
      />
    </div>
  );
}