"use client";

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

type DevilLobbyProps = {
  room:
    DevilLobbyRoom;

  mySocketId:
    string;

  onLeave:
    () => void;

  onStart:
    () => void;
};

/* =========================================================
   Constants
========================================================= */

const MIN_PLAYERS =
  2;

/*
 * 창고형 로비에서
 * 참가 감자들이 서 있을 자리.
 */
const PLAYER_POSITIONS = [
  {
    left: "25%",
    top: "43%",
  },

  {
    left: "48%",
    top: "39%",
  },

  {
    left: "72%",
    top: "44%",
  },

  {
    left: "36%",
    top: "68%",
  },

  {
    left: "65%",
    top: "69%",
  },
];

/* =========================================================
   Helpers
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
   Devil Lobby
========================================================= */

export default function DevilLobby({
  room,

  mySocketId,

  onLeave,

  onStart,
}: DevilLobbyProps) {
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

  return (
    <div
      data-no-move

      className="
        absolute
        inset-0
        z-[20000]

        flex
        items-center
        justify-center

        bg-black/65

        p-4

        backdrop-blur-[3px]
      "
    >
      {/* =====================================================
          Main lobby window
      ===================================================== */}

      <div
        className="
          flex

          h-[min(780px,94vh)]
          w-full
          max-w-[1050px]

          flex-col

          overflow-hidden

          rounded-[24px]

          border
          border-zinc-700

          bg-[#161616]

          shadow-[0_30px_100px_rgba(0,0,0,0.55)]
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
          "
        >
          <div>
            <div
              className="
                text-[9px]
                font-black

                tracking-[0.24em]

                text-zinc-500
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
              "
            >
              <span
                className="
                  text-[19px]
                "
              >
                😈
              </span>

              <h2
                className="
                  text-[19px]
                  font-black

                  text-white
                "
              >
                감자 전쟁
              </h2>
            </div>

            <p
              className="
                mt-1

                text-[10px]

                text-zinc-500
              "
            >
              창고 대기실에서 다른 참가자를 기다리고 있습니다.
            </p>
          </div>

          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <div
              className="
                rounded-xl

                border
                border-zinc-700

                bg-zinc-900

                px-3
                py-2

                font-mono

                text-[10px]
                font-black

                tracking-[0.14em]

                text-zinc-300
              "
            >
              {room.id}
            </div>

            <div
              className="
                rounded-xl

                bg-white

                px-3
                py-2

                text-[10px]
                font-black

                text-zinc-900
              "
            >
              {playerCount}
              {" / "}
              {room.maxPlayers}
            </div>
          </div>
        </header>

        {/* =================================================
            Warehouse lobby
        ================================================= */}

        <div
          className="
            relative

            min-h-0
            flex-1

            overflow-hidden

            bg-[#262626]
          "
        >
          {/* =============================================
              Outer warehouse room
          ============================================= */}

          <div
            className="
              absolute
              inset-[24px]

              overflow-hidden

              rounded-[14px]

              border-[7px]
              border-[#151515]

              bg-[#77746d]

              shadow-inner
            "
          >
            {/* =========================================
                Concrete floor
            ========================================= */}

            <div
              className="
                absolute
                inset-0

                bg-[#74716a]

                [background-image:linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)]

                [background-size:56px_56px]
              "
            />

            {/* =========================================
                Top wall
            ========================================= */}

            <div
              className="
                absolute

                left-0
                right-0
                top-0

                h-[78px]

                border-b-[6px]
                border-[#30302e]

                bg-[#55534f]
              "
            />

            {/* =========================================
                Fluorescent light
            ========================================= */}

            <div
              className="
                absolute

                left-1/2
                top-[20px]

                h-[12px]
                w-[190px]

                -translate-x-1/2

                rounded-sm

                bg-[#e7e5ce]

                shadow-[0_0_26px_rgba(255,250,210,0.45)]
              "
            />

            {/* =========================================
                Storage sign
            ========================================= */}

            <div
              className="
                absolute

                left-1/2
                top-[47px]

                -translate-x-1/2

                rounded

                border
                border-zinc-500

                bg-[#292929]

                px-5
                py-1.5

                font-mono

                text-[8px]
                font-black

                tracking-[0.18em]

                text-zinc-300
              "
            >
              STORAGE B-02 · GAME WAITING AREA
            </div>

            {/* =========================================
                Left shelving
            ========================================= */}

            <div
              className="
                absolute

                left-[4%]
                top-[17%]

                h-[33%]
                w-[16%]

                border-[5px]
                border-[#363330]

                bg-[#59534b]

                shadow-xl
              "
            >
              <div
                className="
                  absolute
                  inset-x-0
                  top-[31%]

                  h-[5px]

                  bg-[#34312f]
                "
              />

              <div
                className="
                  absolute
                  inset-x-0
                  top-[64%]

                  h-[5px]

                  bg-[#34312f]
                "
              />

              <div
                className="
                  absolute

                  left-[9%]
                  top-[7%]

                  h-[20%]
                  w-[36%]

                  bg-[#b08a5b]
                "
              />

              <div
                className="
                  absolute

                  right-[8%]
                  top-[8%]

                  h-[18%]
                  w-[39%]

                  bg-[#8f714e]
                "
              />

              <div
                className="
                  absolute

                  left-[7%]
                  top-[39%]

                  h-[17%]
                  w-[58%]

                  bg-[#9e7b52]
                "
              />

              <div
                className="
                  absolute

                  right-[8%]
                  bottom-[7%]

                  h-[19%]
                  w-[48%]

                  bg-[#b88d5a]
                "
              />
            </div>

            {/* =========================================
                Right shelving
            ========================================= */}

            <div
              className="
                absolute

                right-[4%]
                top-[17%]

                h-[33%]
                w-[16%]

                border-[5px]
                border-[#363330]

                bg-[#59534b]

                shadow-xl
              "
            >
              <div
                className="
                  absolute
                  inset-x-0
                  top-[31%]

                  h-[5px]

                  bg-[#34312f]
                "
              />

              <div
                className="
                  absolute
                  inset-x-0
                  top-[64%]

                  h-[5px]

                  bg-[#34312f]
                "
              />

              {/* Monitor */}

              <div
                className="
                  absolute

                  left-[13%]
                  top-[7%]

                  h-[21%]
                  w-[49%]

                  rounded-sm

                  border-[4px]
                  border-zinc-800

                  bg-zinc-700
                "
              >
                <div
                  className="
                    absolute
                    inset-[4px]

                    bg-[#20282b]
                  "
                />
              </div>

              {/* Boxes */}

              <div
                className="
                  absolute

                  right-[7%]
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
                  w-[45%]

                  bg-[#ae8659]
                "
              />
            </div>

            {/* =========================================
                Back boxes
            ========================================= */}

            <div
              className="
                absolute

                left-[25%]
                top-[15%]

                h-[54px]
                w-[78px]

                border-[3px]
                border-[#765938]

                bg-[#a47a4d]

                shadow
              "
            />

            <div
              className="
                absolute

                left-[32%]
                top-[18%]

                h-[42px]
                w-[64px]

                border-[3px]
                border-[#735633]

                bg-[#92704c]
              "
            />

            <div
              className="
                absolute

                right-[29%]
                top-[17%]

                h-[50px]
                w-[76px]

                border-[3px]
                border-[#735633]

                bg-[#a67c4c]
              "
            />

            {/* =========================================
                Equipment table
            ========================================= */}

            <div
              className="
                absolute

                bottom-[11%]
                left-[6%]

                h-[16%]
                w-[21%]

                border-[5px]
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

              <div
                className="
                  absolute

                  right-[10%]
                  top-[18%]

                  h-[18%]
                  w-[32%]

                  bg-zinc-400
                "
              />
            </div>

            {/* =========================================
                Cleaning tools
            ========================================= */}

            <div
              className="
                absolute

                bottom-[11%]
                right-[7%]

                flex
                items-end
                gap-2
              "
            >
              <div
                className="
                  relative

                  h-[92px]
                  w-[18px]
                "
              >
                <div
                  className="
                    absolute

                    left-1/2
                    top-0

                    h-[72px]
                    w-[4px]

                    -translate-x-1/2

                    rotate-[7deg]

                    bg-[#6b4b2e]
                  "
                />

                <div
                  className="
                    absolute

                    bottom-0
                    left-1/2

                    h-[22px]
                    w-[26px]

                    -translate-x-1/2

                    rounded-t-[50%]

                    bg-[#a98d52]
                  "
                />
              </div>

              <div
                className="
                  h-[46px]
                  w-[34px]

                  rounded-b-lg

                  border-[3px]
                  border-[#54504a]

                  bg-[#8b9396]
                "
              />
            </div>

            {/* =========================================
                Exit door
            ========================================= */}

            <div
              className="
                absolute

                bottom-0
                left-1/2

                h-[76px]
                w-[125px]

                -translate-x-1/2

                border-x-[6px]
                border-t-[6px]
                border-[#33312f]

                bg-[#4c4c49]
              "
            >
              <div
                className="
                  absolute

                  left-1/2
                  top-[10px]

                  -translate-x-1/2

                  rounded

                  bg-red-800/80

                  px-3
                  py-1

                  text-[8px]
                  font-black

                  tracking-wider

                  text-red-100
                "
              >
                EXIT
              </div>
            </div>

            {/* =========================================
                Main floor marking
            ========================================= */}

            <div
              className="
                pointer-events-none

                absolute

                left-[22%]
                right-[22%]
                top-[31%]
                bottom-[17%]

                rounded-[28px]

                border-2
                border-dashed
                border-yellow-300/15
              "
            />

            {/* =========================================
                Players
            ========================================= */}

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
                    "

                    style={{
                      left:
                        position.left,

                      top:
                        position.top,
                    }}
                  >
                    {/* Role badges */}

                    <div
                      className="
                        mb-1

                        flex
                        h-[19px]

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

                            text-[8px]
                            font-black

                            text-amber-700

                            shadow
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

                            text-[8px]
                            font-black

                            text-white

                            shadow
                          "
                        >
                          나
                        </span>
                      )}
                    </div>

                    {/* Potato */}

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
                        0.95
                      }
                    />

                    <div
                      className="
                        mt-[-2px]

                        flex
                        items-center
                        gap-1.5

                        rounded-full

                        border
                        border-black/10

                        bg-white/90

                        px-2
                        py-1

                        text-[8px]
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

            {/* =========================================
                Empty player positions
            ========================================= */}

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

                        h-[76px]
                        w-[60px]

                        items-center
                        justify-center

                        rounded-[50%]

                        border-2
                        border-dashed
                        border-white/15

                        bg-black/10

                        text-xl
                        font-black

                        text-white/15
                      "
                    >
                      ?
                    </div>

                    <div
                      className="
                        mt-2

                        rounded-full

                        bg-black/20

                        px-2
                        py-1

                        text-[8px]

                        text-white/35
                      "
                    >
                      참가자 기다리는 중
                    </div>
                  </div>
                );
              }
            )}

            {/* =========================================
                Bottom info
            ========================================= */}

            <div
              className="
                absolute

                bottom-[3%]
                left-1/2

                -translate-x-1/2

                rounded-full

                border
                border-white/10

                bg-black/45

                px-4
                py-2

                text-[9px]
                font-medium

                text-white/60

                shadow-lg

                backdrop-blur
              "
            >
              게임 시작 전까지 창고 대기실에서 다른 감자를 기다려주세요.
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
          "
        >
          <div
            className="
              flex
              items-center
              gap-4
            "
          >
            {/* Leave */}

            <button
              type="button"

              onClick={
                onLeave
              }

              className="
                rounded-xl

                border
                border-zinc-700

                bg-zinc-900

                px-4
                py-3

                text-[10px]
                font-black

                text-zinc-400

                transition

                hover:border-red-500/40
                hover:bg-red-500/10
                hover:text-red-400
              "
            >
              나가기
            </button>

            {/* Middle info */}

            <div
              className="
                min-w-0
                flex-1
              "
            >
              <div
                className="
                  text-center

                  text-[10px]
                  font-bold

                  text-zinc-400
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
                이 참가했습니다.
              </div>

              <div
                className="
                  mt-1

                  text-center

                  text-[8px]

                  text-zinc-600
                "
              >
                게임이 시작되면 참가자 모두 같은 본 게임 맵으로 이동합니다.
              </div>
            </div>

            {/* Start */}

            <div
              className="
                w-[190px]
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

                    text-[10px]
                    font-black

                    text-zinc-900

                    transition

                    enabled:hover:bg-amber-100

                    disabled:cursor-not-allowed
                    disabled:bg-zinc-800
                    disabled:text-zinc-600
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

                    px-4
                    py-3

                    text-center

                    text-[9px]

                    text-zinc-500
                  "
                >
                  방장이 게임을 시작하기를 기다리는 중...
                </div>
              )}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}