"use client";

/* =========================================================
   Types
========================================================= */

export type DevilLobbyPlayer = {
  id: string;
  nickname: string;
};

export type DevilLobbyRoom = {
  id: string;

  hostId: string;

  status:
    | "waiting"
    | "playing";

  maxPlayers: number;

  players:
    DevilLobbyPlayer[];
};

type DevilLobbyProps = {
  room:
    DevilLobbyRoom;

  mySocketId:
    string | null;

  onLeave:
    () => void;

  onStart:
    () => void;
};

/* =========================================================
   테스트용 최소 인원

   개발이 끝나면
   4로 바꾸면 됨.
========================================================= */

const MIN_PLAYERS =
  2;

/* =========================================================
   DevilLobby
========================================================= */

export default function DevilLobby({
  room,
  mySocketId,
  onLeave,
  onStart,
}: DevilLobbyProps) {
  /* ======================================================
     Host
  ====================================================== */

  const isHost =
    room.hostId ===
    mySocketId;

  /* ======================================================
     Start Check
  ====================================================== */

  const canStart =
    room.players.length >=
    MIN_PLAYERS;

  const remainingPlayers =
    Math.max(
      0,

      MIN_PLAYERS -
        room.players.length
    );

  /* ======================================================
     Empty Slots
  ====================================================== */

  const emptySlots =
    Math.max(
      0,

      room.maxPlayers -
        room.players.length
    );

  /* ======================================================
     Render
  ====================================================== */

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
        bg-black/60
        px-4
        py-6
        backdrop-blur-[2px]
      "
    >
      {/* =================================================
          Lobby Card
      ================================================= */}

      <div
        className="
          flex
          max-h-[90vh]
          w-full
          max-w-[520px]
          flex-col
          overflow-hidden
          rounded-2xl
          border
          border-zinc-200
          bg-[#f8f5ef]
          shadow-2xl
        "
      >
        {/* =================================================
            Header
        ================================================= */}

        <div
          className="
            shrink-0
            border-b
            border-zinc-200
            px-6
            py-5
          "
        >
          <div
            className="
              flex
              items-start
              justify-between
              gap-4
            "
          >
            {/* =============================================
                Title
            ============================================= */}

            <div>
              <div
                className="
                  text-[9px]
                  font-bold
                  tracking-[0.22em]
                  text-zinc-400
                "
              >
                GAMJA OFFICE GAME
              </div>

              <h2
                className="
                  mt-1
                  text-[22px]
                  font-black
                  text-zinc-900
                "
              >
                😈 악마 감자
              </h2>

              <p
                className="
                  mt-1
                  text-[11px]
                  text-zinc-500
                "
              >
                다른 감자들이
                참가하기를 기다리고 있습니다.
              </p>
            </div>

            {/* =============================================
                Count
            ============================================= */}

            <div
              className="
                shrink-0
                rounded-xl
                bg-zinc-900
                px-4
                py-2
                text-[11px]
                font-bold
                text-white
              "
            >
              {
                room.players.length
              }
              {" / "}
              {
                room.maxPlayers
              }
            </div>
          </div>
        </div>

        {/* =================================================
            Room Code
        ================================================= */}

        <div
          className="
            shrink-0
            border-b
            border-zinc-200
            bg-white/40
            px-6
            py-4
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              gap-4
            "
          >
            <span
              className="
                text-[10px]
                text-zinc-400
              "
            >
              방 코드
            </span>

            <span
              className="
                font-mono
                text-[11px]
                font-black
                tracking-[0.18em]
                text-zinc-700
              "
            >
              {
                room.id
              }
            </span>
          </div>
        </div>

        {/* =================================================
            Player Section
        ================================================= */}

        <div
          className="
            min-h-0
            flex-1
            overflow-y-auto
            px-6
            py-5
          "
        >
          {/* ===============================================
              Player Header
          =============================================== */}

          <div
            className="
              mb-4
              flex
              items-center
              justify-between
            "
          >
            <span
              className="
                text-[11px]
                font-bold
                text-zinc-700
              "
            >
              참가 감자
            </span>

            <span
              className="
                text-[9px]
                text-zinc-400
              "
            >
              최소 {MIN_PLAYERS}명
            </span>
          </div>

          {/* ===============================================
              Players
          =============================================== */}

          <div
            className="
              space-y-2
            "
          >
            {room.players.map(
              player => {
                const playerIsHost =
                  player.id ===
                  room.hostId;

                const isMe =
                  player.id ===
                  mySocketId;

                return (
                  <div
                    key={
                      player.id
                    }
                    className="
                      flex
                      min-h-[44px]
                      items-center
                      gap-3
                      rounded-xl
                      border
                      border-zinc-200
                      bg-white
                      px-3
                      py-2.5
                    "
                  >
                    {/* =====================================
                        Online
                    ===================================== */}

                    <span
                      className="
                        h-2
                        w-2
                        shrink-0
                        rounded-full
                        bg-emerald-500
                      "
                    />

                    {/* =====================================
                        Nickname
                    ===================================== */}

                    <div
                      className="
                        min-w-0
                        flex-1
                      "
                    >
                      <div
                        className="
                          truncate
                          text-[11px]
                          font-semibold
                          text-zinc-700
                        "
                      >
                        {
                          player.nickname
                        }
                        {" 감자"}
                      </div>
                    </div>

                    {/* =====================================
                        Host Badge
                    ===================================== */}

                    {playerIsHost && (
                      <span
                        className="
                          shrink-0
                          rounded-full
                          bg-amber-100
                          px-2
                          py-1
                          text-[8px]
                          font-bold
                          text-amber-700
                        "
                      >
                        👑 방장
                      </span>
                    )}

                    {/* =====================================
                        Me
                    ===================================== */}

                    {isMe && (
                      <span
                        className="
                          shrink-0
                          rounded-full
                          bg-zinc-100
                          px-2
                          py-1
                          text-[8px]
                          font-medium
                          text-zinc-400
                        "
                      >
                        나
                      </span>
                    )}
                  </div>
                );
              }
            )}

            {/* ===============================================
                Empty Slots
            =============================================== */}

            {Array.from({
              length:
                emptySlots,
            }).map(
              (
                _,
                index
              ) => (
                <div
                  key={
                    `empty-${index}`
                  }
                  className="
                    flex
                    min-h-[44px]
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-dashed
                    border-zinc-200
                    bg-white/20
                    px-3
                    py-2.5
                    text-[9px]
                    text-zinc-300
                  "
                >
                  참가자 기다리는 중...
                </div>
              )
            )}
          </div>
        </div>

        {/* =================================================
            Footer
        ================================================= */}

        <div
          className="
            shrink-0
            border-t
            border-zinc-200
            bg-white/50
            px-6
            py-4
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              gap-3
            "
          >
            {/* =============================================
                Leave
            ============================================= */}

            <button
              type="button"
              onClick={
                onLeave
              }
              className="
                shrink-0
                rounded-lg
                border
                border-zinc-200
                bg-white
                px-4
                py-2
                text-[10px]
                font-semibold
                text-zinc-500
                transition
                hover:bg-zinc-50
                hover:text-red-500
              "
            >
              나가기
            </button>

            {/* =============================================
                Host
            ============================================= */}

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
                  min-w-[145px]
                  rounded-lg
                  bg-zinc-900
                  px-5
                  py-2
                  text-[10px]
                  font-bold
                  text-white
                  transition

                  enabled:hover:bg-zinc-700

                  disabled:cursor-not-allowed
                  disabled:bg-zinc-200
                  disabled:text-zinc-400
                "
              >
                {canStart
                  ? "게임 시작"
                  : `${remainingPlayers}명 더 필요`}
              </button>
            ) : (
              <div
                className="
                  flex-1
                  rounded-lg
                  bg-zinc-100
                  px-4
                  py-2.5
                  text-center
                  text-[9px]
                  text-zinc-400
                "
              >
                방장이 게임을 시작하기를 기다리는 중...
              </div>
            )}
          </div>

          {/* ===============================================
              Status Description
          =============================================== */}

          {isHost && (
            <div
              className="
                mt-3
                text-right
                text-[8px]
                text-zinc-400
              "
            >
              {canStart
                ? `${room.players.length}명이 준비되었습니다.`
                : `게임을 시작하려면 최소 ${MIN_PLAYERS}명이 필요합니다.`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}