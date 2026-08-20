"use client";

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

export default function DevilLobby({
  room,
  mySocketId,
  onLeave,
  onStart,
}: DevilLobbyProps) {
  /* =====================================================
     Host
  ===================================================== */

  const isHost =
    room.hostId ===
    mySocketId;

  const canStart =
    room.players.length >= 4;

  /* =====================================================
     Render
  ===================================================== */

  return (
    <div
      data-no-move
      className="
        absolute
        inset-0
        z-[15000]
        flex
        items-center
        justify-center
        bg-black/55
        backdrop-blur-[2px]
      "
    >
      <div
        className="
          w-[420px]
          overflow-hidden
          rounded-2xl
          border
          border-zinc-200
          bg-[#f8f5ef]
          shadow-2xl
        "
      >
        {/* =========================================
            Header
        ========================================= */}

        <div
          className="
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
            <div>
              <div
                className="
                  text-[10px]
                  font-bold
                  tracking-[0.18em]
                  text-zinc-400
                "
              >
                GAMJA OFFICE GAME
              </div>

              <h2
                className="
                  mt-1
                  text-xl
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
                참가하기를 기다리고
                있습니다.
              </p>
            </div>

            <div
              className="
                rounded-lg
                bg-zinc-900
                px-3
                py-2
                text-[10px]
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

        {/* =========================================
            Room Code
        ========================================= */}

        <div
          className="
            border-b
            border-zinc-200
            bg-white/60
            px-6
            py-3
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
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
                font-bold
                tracking-[0.15em]
                text-zinc-700
              "
            >
              {room.id}
            </span>
          </div>
        </div>

        {/* =========================================
            Player List
        ========================================= */}

        <div
          className="
            px-6
            py-5
          "
        >
          <div
            className="
              mb-3
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
              최소 4명
            </span>
          </div>

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
                    {/* Online */}

                    <span
                      className="
                        h-2
                        w-2
                        shrink-0
                        rounded-full
                        bg-emerald-500
                      "
                    />

                    {/* Nickname */}

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
                        {player.nickname}
                        {" 감자"}
                      </div>
                    </div>

                    {/* Host */}

                    {playerIsHost && (
                      <span
                        className="
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

                    {/* Me */}

                    {isMe && (
                      <span
                        className="
                          rounded-full
                          bg-zinc-100
                          px-2
                          py-1
                          text-[8px]
                          text-zinc-500
                        "
                      >
                        나
                      </span>
                    )}
                  </div>
                );
              }
            )}

            {/* =================================
                Empty Slots
            ================================= */}

            {Array.from({
              length:
                Math.max(
                  0,
                  room.maxPlayers -
                    room.players.length
                ),
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
                    h-[43px]
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-dashed
                    border-zinc-200
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

        {/* =========================================
            Footer
        ========================================= */}

        <div
          className="
            flex
            items-center
            justify-between
            gap-3
            border-t
            border-zinc-200
            bg-white/50
            px-6
            py-4
          "
        >
          {/* Leave */}

          <button
            type="button"
            onClick={
              onLeave
            }
            className="
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
            "
          >
            나가기
          </button>

          {/* =====================================
              Host
          ===================================== */}

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
                disabled:bg-zinc-300
                disabled:text-zinc-500
              "
            >
              {canStart
                ? "게임 시작"
                : `${
                    4 -
                    room.players.length
                  }명 더 필요`}
            </button>
          ) : (
            <div
              className="
                rounded-lg
                bg-zinc-100
                px-4
                py-2
                text-[10px]
                text-zinc-400
              "
            >
              방장이 게임을
              시작하기를 기다리는 중...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}