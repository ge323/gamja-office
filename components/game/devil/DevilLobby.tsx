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

  /*
   * 게임 준비 상태
   */
  ready?: boolean;
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
   * 준비 / 준비 취소
   */
  onToggleReady:
    () => void;

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
  3;

const MAX_PLAYERS =
  5;

/*
 * 최대 5명 전용 배치.
 *
 * 오른쪽 아래 채팅 영역과 겹치지 않도록
 * 전체 플레이어 영역을 중앙보다 살짝 왼쪽으로 당겼다.
 *
 * 위 3명 / 아래 2명 구조로 배치해서
 * 캐릭터와 빈 슬롯의 위치가 안정적으로 보이게 한다.
 */
const PLAYER_POSITIONS = [
  {
    left: "24%",
    top: "40%",
  },

  {
    left: "44%",
    top: "37%",
  },

  {
    left: "64%",
    top: "41%",
  },

  {
    left: "34%",
    top: "65%",
  },

  {
    left: "56%",
    top: "64%",
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

  onToggleReady,

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

  /*
   * 서버가 이전 설정으로 6명을 보내더라도
   * 로비 UI에서는 최대 5명까지만 표시한다.
   *
   * 실제 입장 제한은 server.js에서도
   * DEVIL_GAME_MAX_PLAYERS = 5로 맞춰야 한다.
   */
  const displayedMaxPlayers =
    Math.min(
      MAX_PLAYERS,
      room.maxPlayers
    );

  const me =
    room.players.find(
      player =>
        player.id ===
        mySocketId
    );

  const isReady =
    Boolean(
      me?.ready
    );

  const readyCount =
    room.players.filter(
      player =>
        player.ready
    ).length;

  const enoughPlayers =
    playerCount >=
    MIN_PLAYERS;

  /*
   * 방장을 포함해서
   * 전원이 준비해야 한다.
   */
  const allReady =
    enoughPlayers &&
    room.players.every(
      player =>
        player.ready ===
        true
    );

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
    allReady;

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
          Lobby
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
              준비를 마치고 다른 감자를 기다려주세요.
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
            {/* 방 코드 */}

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

            {/* 인원 */}

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
              {displayedMaxPlayers}
            </div>

            {/* 준비 현황 */}

            <div
              className="
                rounded-lg

                border
                border-emerald-500/30

                bg-emerald-500/10

                px-3
                py-2

                text-[9px]
                font-black

                text-emerald-400

                max-[900px]:px-2
                max-[900px]:py-1.5
                max-[900px]:text-[8px]
              "
            >
              ✓ {readyCount}/{playerCount}
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
            {/* Floor */}

            <div
              className="
                absolute
                inset-0

                bg-[#74716a]

                [background-image:linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)]

                [background-size:56px_56px]
              "
            />

            {/* Top Wall */}

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

            {/* Light */}

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

            {/* Sign */}

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

            <WarehouseShelf
              side="left"
            />

            <WarehouseShelf
              side="right"
            />

            {/* Boxes */}

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

            {/* Equipment */}

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

            {/* Exit */}

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

            {/* Waiting Zone */}

            <div
              className="
                pointer-events-none

                absolute

                left-[19%]
                right-[25%]
                top-[28%]
                bottom-[12%]

                rounded-[28px]

                border-2
                border-dashed
                border-yellow-300/15
              "
            />

            {/* =================================================
                Players
            ================================================= */}

            {room.players.map(
              (
                player,
                index
              ) => {
                const playerPosition =
                  PLAYER_POSITIONS[
                    index %
                      PLAYER_POSITIONS.length
                  ];

                const host =
                  player.id ===
                  room.hostId;

                const myPlayer =
                  player.id ===
                  mySocketId;

                const ready =
                  Boolean(
                    player.ready
                  );

                return (
                  <div
                    key={
                      player.id
                    }
                    className="
                      absolute
                      z-30

                      flex

                      flex-col
                      items-center

                      max-[900px]:scale-[0.72]
                    "
                    style={{
                      left:
                        playerPosition.left,

                      top:
                        playerPosition.top,

                      /*
                       * 닉네임/방장 배지/준비 배지까지 포함한
                       * 전체 박스의 정중앙이 아니라
                       * 실제 감자 몸통이 슬롯 중심에 오도록
                       * Y 이동량을 줄인다.
                       */
                      transform:
                        "translate(-50%, -35%)",
                    }}
                  >
                    {/* Role badges */}

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

                      {myPlayer && (
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

                    {/* Character */}

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

                      special={
                        player
                          .characterStyle
                          ?.special ??
                        "none"
                      }

                      color={
                        player
                          .characterStyle
                          ?.color ??
                        "default"
                      }

                      hair={
                        player
                          .characterStyle
                          ?.hair ??
                        "none"
                      }

                      hairColor={
                        player
                          .characterStyle
                          ?.hairColor ??
                        "brown"
                      }

                      eyes={
                        player
                          .characterStyle
                          ?.eyes ??
                        "dot"
                      }

                      mouth={
                        player
                          .characterStyle
                          ?.mouth ??
                        "default"
                      }

                      blush={
                        player
                          .characterStyle
                          ?.blush ??
                        true
                      }

                      freckles={
                        player
                          .characterStyle
                          ?.freckles ??
                        false
                      }

                      direction="down"

                      moving={
                        false
                      }

                      scale={
                        0.9
                      }
                    />

                    {/* Ready Status */}

                    <div
                      className={`
                        mt-[-3px]

                        flex
                        items-center
                        gap-1

                        rounded-full

                        border

                        px-2
                        py-1

                        text-[7px]
                        font-black

                        shadow

                        ${
                          ready
                            ? `
                              border-emerald-200
                              bg-emerald-50
                              text-emerald-600
                            `
                            : `
                              border-zinc-200
                              bg-white/90
                              text-zinc-400
                            `
                        }
                      `}
                    >
                      <span
                        className={`
                          h-1.5
                          w-1.5

                          rounded-full

                          ${
                            ready
                              ? "bg-emerald-500"
                              : "bg-zinc-300"
                          }
                        `}
                      />

                      {ready
                        ? "준비 완료"
                        : "준비 중..."}
                    </div>
                  </div>
                );
              }
            )}

            {/* =================================================
                Empty Slots
            ================================================= */}

            {Array.from({
              length:
                Math.max(
                  0,

                  Math.min(
                    displayedMaxPlayers,
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

                const playerPosition =
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

                      flex-col
                      items-center

                      max-[900px]:scale-75
                    "
                    style={{
                      left:
                        playerPosition.left,

                      top:
                        playerPosition.top,

                      transform:
                        "translate(-50%, -35%)",
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

                    <div
                      className="
                        mt-2

                        text-[7px]

                        text-white/20
                      "
                    >
                      참가자 대기
                    </div>
                  </div>
                );
              }
            )}

            {/* =================================================
                Lobby Chat
            ================================================= */}

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
              {/* Header */}

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

              gap-3

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
                준비 완료{" "}
                <span
                  className="
                    text-emerald-400
                  "
                >
                  {readyCount}
                </span>
                {" / "}
                <span
                  className="
                    text-white
                  "
                >
                  {playerCount}명
                </span>
              </div>

              <div
                className="
                  mt-1

                  text-[7px]

                  text-zinc-600

                  max-[900px]:hidden
                "
              >
                모든 참가자가 준비하면 방장이 게임을 시작할 수 있습니다.
              </div>
            </div>

            {/* Ready */}

            <button
              type="button"
              disabled={
                room.status !==
                "waiting"
              }
              onClick={
                onToggleReady
              }
              className={`
                shrink-0

                rounded-xl

                px-4
                py-3

                text-[9px]
                font-black

                transition

                max-[900px]:rounded-lg
                max-[900px]:px-3
                max-[900px]:py-2
                max-[900px]:text-[8px]

                ${
                  isReady
                    ? `
                      border
                      border-emerald-500/40

                      bg-emerald-500/15

                      text-emerald-400

                      hover:bg-emerald-500/25
                    `
                    : `
                      border
                      border-amber-400/40

                      bg-amber-400

                      text-zinc-950

                      hover:bg-amber-300
                    `
                }

                disabled:cursor-not-allowed
                disabled:opacity-40
              `}
            >
              {isReady
                ? "✓ 준비 취소"
                : "준비하기"}
            </button>

            {/* Host Start */}

            {isHost && (
              <div
                className="
                  w-[190px]

                  shrink-0

                  max-[900px]:w-[135px]
                "
              >
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
                  {!enoughPlayers
                    ? `${needPlayers}명 더 필요`
                    : !allReady
                      ? "준비 대기 중"
                      : "게임 시작"}
                </button>
              </div>
            )}
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