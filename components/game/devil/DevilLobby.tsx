"use client";

import type {
  CharacterStyle,
} from "@/components/character/CharacterCustomizer";

import Potato from "@/components/character/Potato";

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
 * 로비 캐릭터 자리.
 *
 * 최대 6명 정도를 기준으로
 * 사무실 안에 자연스럽게 배치.
 */
const LOBBY_POSITIONS = [
  {
    left: "20%",
    top: "37%",
  },

  {
    left: "42%",
    top: "34%",
  },

  {
    left: "66%",
    top: "38%",
  },

  {
    left: "29%",
    top: "67%",
  },

  {
    left: "52%",
    top: "65%",
  },

  {
    left: "76%",
    top: "66%",
  },
];

/* =========================================================
   Helpers
========================================================= */

function displayName(
  nickname: string
) {
  const clean =
    nickname
      .replace(
        /\s*감자\s*$/g,
        ""
      )
      .trim();

  return clean
    ? `${clean} 감자`
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
}: DevilLobbyProps) {
  const isHost =
    room.hostId ===
    mySocketId;

  const playerCount =
    room.players.length;

  const canStart =
    isHost &&
    room.status ===
      "waiting" &&
    playerCount >=
      MIN_PLAYERS;

  const needCount =
    Math.max(
      0,
      MIN_PLAYERS -
        playerCount
    );

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

        bg-black/50

        px-5
        py-5

        backdrop-blur-[3px]
      "
    >
      {/* =====================================================
          Lobby Window
      ===================================================== */}

      <div
        className="
          flex

          h-[min(760px,92vh)]
          w-full
          max-w-[980px]

          flex-col

          overflow-hidden

          rounded-[26px]

          border
          border-zinc-700

          bg-[#171717]

          shadow-[0_28px_90px_rgba(0,0,0,0.45)]
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

            bg-[#101010]

            px-6
            py-4
          "
        >
          <div>
            <div
              className="
                text-[9px]
                font-bold

                tracking-[0.22em]

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
                  text-[18px]
                "
              >
                🥔
              </span>

              <h2
                className="
                  text-[18px]
                  font-black

                  text-white
                "
              >
                감자 전쟁 로비
              </h2>
            </div>

            <p
              className="
                mt-1

                text-[10px]

                text-zinc-500
              "
            >
              게임이 시작되기 전,
              사무실에서 다른 감자들을 기다려주세요.
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
                font-bold

                tracking-[0.12em]

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
            Office Lobby
        ================================================= */}

        <div
          className="
            relative

            min-h-0
            flex-1

            overflow-hidden

            bg-[#373431]
          "
        >
          {/* =============================================
              바깥 벽
          ============================================= */}

          <div
            className="
              absolute
              inset-[22px]

              rounded-[18px]

              border-[6px]
              border-[#262422]

              bg-[#d9c7a8]

              shadow-inner
            "
          />

          {/* =============================================
              바닥
          ============================================= */}

          <div
            className="
              absolute

              left-[38px]
              right-[38px]
              top-[38px]
              bottom-[38px]

              overflow-hidden

              rounded-[12px]

              bg-[#d9c7a8]
            "
          >
            {/* 바닥 줄 */}

            <div
              className="
                absolute
                inset-0

                opacity-[0.16]

                [background-image:linear-gradient(to_right,#765f48_1px,transparent_1px),linear-gradient(to_bottom,#765f48_1px,transparent_1px)]

                [background-size:44px_44px]
              "
            />

            {/* =========================================
                상단 벽 / 안내판
            ========================================= */}

            <div
              className="
                absolute

                left-[7%]
                top-[5%]

                h-[15%]
                w-[30%]

                rounded-md

                border-[5px]
                border-[#6a513a]

                bg-[#b98e61]

                shadow-md
              "
            >
              <div
                className="
                  absolute
                  inset-x-3
                  top-3

                  flex
                  items-center
                  justify-center

                  rounded

                  bg-[#f1e9da]

                  py-2

                  text-[9px]
                  font-black

                  text-zinc-600
                "
              >
                GAMJA OFFICE
              </div>
            </div>

            {/* =========================================
                시계
            ========================================= */}

            <div
              className="
                absolute

                right-[10%]
                top-[7%]

                flex
                h-11
                w-11

                items-center
                justify-center

                rounded-full

                border-[4px]
                border-zinc-700

                bg-[#f8f4ea]

                text-[13px]

                shadow
              "
            >
              🕒
            </div>

            {/* =========================================
                책상 1
            ========================================= */}

            <div
              className="
                absolute

                left-[11%]
                top-[27%]

                h-[17%]
                w-[23%]

                rounded-[4px]

                border-[5px]
                border-[#60462f]

                bg-[#a9784e]

                shadow-md
              "
            >
              <div
                className="
                  absolute

                  left-[15%]
                  top-[18%]

                  h-[42%]
                  w-[30%]

                  rounded-sm

                  bg-zinc-800

                  shadow
                "
              />

              <div
                className="
                  absolute

                  right-[15%]
                  top-[22%]

                  h-[13%]
                  w-[24%]

                  rounded-sm

                  bg-[#d3c2a1]
                "
              />
            </div>

            {/* =========================================
                책상 2
            ========================================= */}

            <div
              className="
                absolute

                right-[11%]
                top-[27%]

                h-[17%]
                w-[23%]

                rounded-[4px]

                border-[5px]
                border-[#60462f]

                bg-[#a9784e]

                shadow-md
              "
            >
              <div
                className="
                  absolute

                  right-[15%]
                  top-[18%]

                  h-[42%]
                  w-[30%]

                  rounded-sm

                  bg-zinc-800

                  shadow
                "
              />

              <div
                className="
                  absolute

                  left-[15%]
                  top-[22%]

                  h-[13%]
                  w-[24%]

                  rounded-sm

                  bg-[#d3c2a1]
                "
              />
            </div>

            {/* =========================================
                중앙 회의 테이블
            ========================================= */}

            <div
              className="
                absolute

                left-1/2
                top-[49%]

                h-[18%]
                w-[28%]

                -translate-x-1/2

                rounded-[40%]

                border-[5px]
                border-[#5e4631]

                bg-[#9b704d]

                shadow-lg
              "
            >
              <div
                className="
                  absolute

                  left-1/2
                  top-1/2

                  -translate-x-1/2
                  -translate-y-1/2

                  rounded-lg

                  bg-[#efe5d3]

                  px-3
                  py-1

                  text-[8px]
                  font-bold

                  text-zinc-500
                "
              >
                WAITING
              </div>
            </div>

            {/* =========================================
                하단 소파
            ========================================= */}

            <div
              className="
                absolute

                bottom-[7%]
                left-[8%]

                h-[11%]
                w-[28%]

                rounded-lg

                border-[4px]
                border-[#40503f]

                bg-[#71886e]

                shadow
              "
            />

            {/* =========================================
                식물
            ========================================= */}

            <div
              className="
                absolute

                bottom-[7%]
                right-[10%]

                text-[38px]
              "
            >
              🪴
            </div>

            {/* =========================================
                캐릭터
            ========================================= */}

            {room.players.map(
              (
                player,
                index
              ) => {
                const host =
                  player.id ===
                  room.hostId;

                const me =
                  player.id ===
                  mySocketId;

                const position =
                  LOBBY_POSITIONS[
                    index %
                      LOBBY_POSITIONS.length
                  ];

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
                    {/* =================================
                        상태 배지
                    ================================= */}

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

                            text-[8px]
                            font-black

                            text-amber-700

                            shadow-sm
                          "
                        >
                          👑 방장
                        </span>
                      )}

                      {me && (
                        <span
                          className="
                            rounded-full

                            bg-zinc-900

                            px-2
                            py-0.5

                            text-[8px]
                            font-black

                            text-white

                            shadow-sm
                          "
                        >
                          나
                        </span>
                      )}
                    </div>

                    {/* =================================
                        Potato
                    ================================= */}

                    <Potato
                      name={
                        displayName(
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

                    {/* =================================
                        접속 표시
                    ================================= */}

                    <div
                      className="
                        mt-[-2px]

                        flex
                        items-center
                        gap-1

                        rounded-full

                        bg-white/90

                        px-2
                        py-1

                        text-[8px]
                        font-semibold

                        text-zinc-500

                        shadow-sm
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

                      준비 완료
                    </div>
                  </div>
                );
              }
            )}

            {/* =========================================
                빈 슬롯
            ========================================= */}

            {Array.from({
              length:
                Math.max(
                  0,
                  Math.min(
                    LOBBY_POSITIONS.length,
                    room.maxPlayers
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
                  LOBBY_POSITIONS[
                    index %
                      LOBBY_POSITIONS.length
                  ];

                return (
                  <div
                    key={
                      `empty-${emptyIndex}`
                    }
                    className="
                      absolute

                      z-20

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

                        h-[74px]
                        w-[58px]

                        items-center
                        justify-center

                        rounded-[50%]

                        border-2
                        border-dashed
                        border-zinc-500/25

                        bg-white/15

                        text-xl

                        text-zinc-500/30
                      "
                    >
                      ?
                    </div>

                    <div
                      className="
                        mt-2

                        rounded-full

                        bg-black/15

                        px-2
                        py-1

                        text-[8px]

                        text-zinc-600/70
                      "
                    >
                      기다리는 중
                    </div>
                  </div>
                );
              }
            )}

            {/* =========================================
                로비 메시지
            ========================================= */}

            <div
              className="
                absolute

                bottom-[3%]
                left-1/2

                -translate-x-1/2

                rounded-full

                border
                border-white/50

                bg-white/80

                px-4
                py-2

                text-[9px]
                font-semibold

                text-zinc-600

                shadow

                backdrop-blur-sm
              "
            >
              🥔 참가 감자들이 모두 모이면 게임을 시작할 수 있어요.
            </div>
          </div>
        </div>

        {/* =================================================
            Footer Controls
        ================================================= */}

        <footer
          className="
            shrink-0

            border-t
            border-zinc-800

            bg-[#101010]

            px-6
            py-4
          "
        >
          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            {/* =========================================
                Leave
            ========================================= */}

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
                font-bold

                text-zinc-400

                transition

                hover:border-red-500/50
                hover:bg-red-500/10
                hover:text-red-400
              "
            >
              나가기
            </button>

            {/* =========================================
                Status
            ========================================= */}

            <div
              className="
                min-w-0
                flex-1
              "
            >
              <div
                className="
                  text-center

                  text-[9px]

                  text-zinc-500
                "
              >
                현재{" "}
                <span
                  className="
                    font-black
                    text-white
                  "
                >
                  {playerCount}명
                </span>
                이 로비에 있습니다.
              </div>

              <div
                className="
                  mt-1

                  text-center

                  text-[8px]

                  text-zinc-600
                "
              >
                게임이 시작되면
                모든 참가자가 같은 사무실 맵으로 이동합니다.
              </div>
            </div>

            {/* =========================================
                Start
            ========================================= */}

            <div
              className="
                w-[180px]
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
                  {needCount >
                  0
                    ? `${needCount}명 더 필요`
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
                  방장이 시작하기를
                  기다리는 중...
                </div>
              )}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}