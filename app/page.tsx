"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import CharacterCustomizer, {
  type CharacterStyle,
} from "@/components/character/CharacterCustomizer";

import GameWorld, {
  type OnlinePlayer,
} from "@/components/game/GameWorld";

/* =========================================================
   Saved Player
========================================================= */

type SavedPlayerData = {
  nickname: string;
  characterStyle: CharacterStyle;
};

/* =========================================================
   Storage
========================================================= */

const STORAGE_KEY =
  "gamja-office-player";

/* =========================================================
   Default Character
========================================================= */

const DEFAULT_CHARACTER_STYLE:
  CharacterStyle = {
  glasses: "none",
  hat: "none",
  ribbon: false,
  tie: false,
  color: "default",
};

/* =========================================================
   Display Name
========================================================= */

function getDisplayName(
  nickname: string
) {
  const trimmed =
    nickname.trim();

  if (!trimmed) {
    return "감자";
  }

  return `${trimmed} 감자`;
}

/* =========================================================
   Home
========================================================= */

export default function Home() {
  /* ======================================================
     Refs
  ====================================================== */

  const onlinePopoverRef =
    useRef<HTMLDivElement | null>(
      null
    );

  /* ======================================================
     Loaded
  ====================================================== */

  const [
    loaded,
    setLoaded,
  ] =
    useState(false);

  /* ======================================================
     Entered
  ====================================================== */

  const [
    entered,
    setEntered,
  ] =
    useState(false);

  /* ======================================================
     Nickname
  ====================================================== */

  const [
    nickname,
    setNickname,
  ] =
    useState("");

  /* ======================================================
     Character
  ====================================================== */

  const [
    characterStyle,
    setCharacterStyle,
  ] =
    useState<CharacterStyle>(
      DEFAULT_CHARACTER_STYLE
    );

  /* ======================================================
     Online Players
  ====================================================== */

  const [
    onlinePlayers,
    setOnlinePlayers,
  ] =
    useState<
      OnlinePlayer[]
    >([]);

  /* ======================================================
     Online Popover
  ====================================================== */

  const [
    onlineOpen,
    setOnlineOpen,
  ] =
    useState(false);

  /* ======================================================
     GameWorld → 접속자 전달
  ====================================================== */

  const handleOnlinePlayersChange =
    useCallback(
      (
        players:
          OnlinePlayer[]
      ) => {
        setOnlinePlayers(
          players
        );
      },
      []
    );

  /* ======================================================
     LocalStorage Load
  ====================================================== */

  useEffect(() => {
    try {
      const saved =
        window.localStorage.getItem(
          STORAGE_KEY
        );

      if (!saved) {
        setLoaded(
          true
        );

        return;
      }

      const parsed =
        JSON.parse(
          saved
        ) as SavedPlayerData;

      /* =====================================
         Nickname
      ===================================== */

      if (
        typeof parsed.nickname ===
        "string"
      ) {
        const cleanedNickname =
          parsed.nickname.replace(
            /\s*감자\s*$/g,
            ""
          );

        setNickname(
          cleanedNickname
        );
      }

      /* =====================================
         Character
      ===================================== */

      if (
        parsed.characterStyle
      ) {
        setCharacterStyle({
          ...DEFAULT_CHARACTER_STYLE,

          ...parsed.characterStyle,
        });
      }
    } catch (
      error
    ) {
      console.error(
        "저장된 감자 정보를 불러오지 못했습니다.",
        error
      );

      window.localStorage.removeItem(
        STORAGE_KEY
      );
    }

    setLoaded(
      true
    );
  }, []);

  /* ======================================================
     Popover 바깥 클릭 시 닫기
  ====================================================== */

  useEffect(() => {
    const handlePointerDown = (
      event:
        MouseEvent
    ) => {
      const element =
        onlinePopoverRef.current;

      if (!element) {
        return;
      }

      if (
        event.target instanceof
          Node &&
        !element.contains(
          event.target
        )
      ) {
        setOnlineOpen(
          false
        );
      }
    };

    document.addEventListener(
      "mousedown",
      handlePointerDown
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown
      );
    };
  }, []);

  /* ======================================================
     Save
  ====================================================== */

  const savePlayer = (
    nextNickname: string,
    nextStyle:
      CharacterStyle
  ) => {
    const data:
      SavedPlayerData = {
        nickname:
          nextNickname,

        characterStyle:
          nextStyle,
      };

    try {
      window.localStorage.setItem(
        STORAGE_KEY,

        JSON.stringify(
          data
        )
      );
    } catch (
      error
    ) {
      console.error(
        "감자 정보를 저장하지 못했습니다.",
        error
      );
    }
  };

  /* ======================================================
     Enter
  ====================================================== */

  const handleEnter =
    () => {
      let trimmed =
        nickname.trim();

      trimmed =
        trimmed.replace(
          /\s*감자\s*$/g,
          ""
        );

      if (!trimmed) {
        return;
      }

      setNickname(
        trimmed
      );

      savePlayer(
        trimmed,
        characterStyle
      );

      setEntered(
        true
      );
    };

  /* ======================================================
     Reset
  ====================================================== */

  const handleResetPlayer =
    () => {
      try {
        window.localStorage.removeItem(
          STORAGE_KEY
        );
      } catch (
        error
      ) {
        console.error(
          "저장 정보를 삭제하지 못했습니다.",
          error
        );
      }

      setNickname(
        ""
      );

      setCharacterStyle(
        DEFAULT_CHARACTER_STYLE
      );

      setOnlinePlayers(
        []
      );

      setOnlineOpen(
        false
      );

      setEntered(
        false
      );
    };

  /* ======================================================
     Loading
  ====================================================== */

  if (!loaded) {
    return (
      <main
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-[#ece7dd]
        "
      >
        <div
          className="
            text-xs
            text-zinc-400
          "
        >
          감자 출근 준비 중...
        </div>
      </main>
    );
  }

  /* ======================================================
     Character Customizer
  ====================================================== */

  if (!entered) {
    return (
      <div className="relative">
        <CharacterCustomizer
          nickname={
            nickname
          }
          setNickname={
            setNickname
          }
          style={
            characterStyle
          }
          setStyle={
            setCharacterStyle
          }
          onEnter={
            handleEnter
          }
        />

        {nickname && (
          <button
            type="button"
            onClick={
              handleResetPlayer
            }
            className="
              fixed
              bottom-5
              right-5
              rounded-lg
              border
              border-zinc-200
              bg-white/90
              px-3
              py-2
              text-[10px]
              text-zinc-400
              shadow-sm
              transition
              hover:text-red-500
            "
          >
            저장 정보 초기화
          </button>
        )}
      </div>
    );
  }

  /* ======================================================
     Game
  ====================================================== */

  return (
    <main
      className="
        min-h-screen
        bg-[#ece7dd]
        text-zinc-900
      "
    >
      {/* =========================================
          Header
      ========================================= */}

      <header
        className="
          relative
          z-[10000]
          border-b
          border-zinc-300
          bg-[#f7f4ee]
        "
      >
        <div
          className="
            mx-auto
            grid
            max-w-[1130px]
            grid-cols-[1fr_auto_1fr]
            items-center
            gap-4
            px-4
            py-3
          "
        >
          {/* =====================================
              Logo
          ===================================== */}

          <div
            className="
              justify-self-start
            "
          >
            <div
              className="
                text-sm
                font-bold
              "
            >
              Gamja Office
            </div>

            <div
              className="
                mt-0.5
                text-[10px]
                text-zinc-400
              "
            >
              Potato Workspace
            </div>
          </div>

          {/* =====================================
              접속자
          ===================================== */}

          <div
            ref={
              onlinePopoverRef
            }
            className="
              relative
              hidden
              justify-self-center
              md:block
            "
          >
            {/* =================================
                접속자 버튼
            ================================= */}

            <button
              type="button"
              onClick={() => {
                setOnlineOpen(
                  previous =>
                    !previous
                );
              }}
              className="
                flex
                min-w-[105px]
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-zinc-200
                bg-white
                px-4
                py-2
                text-[10px]
                font-medium
                text-zinc-600
                shadow-sm
                transition
                hover:bg-zinc-50
              "
            >
              <span
                className="
                  h-2
                  w-2
                  rounded-full
                  bg-emerald-500
                "
              />

              <span>
                {
                  onlinePlayers.length
                }
                명 접속
              </span>

              <span
                className={`
                  text-[9px]
                  text-zinc-400
                  transition-transform

                  ${
                    onlineOpen
                      ? "rotate-180"
                      : ""
                  }
                `}
              >
                ▾
              </span>
            </button>

            {/* =================================
                접속자 팝오버
            ================================= */}

            {onlineOpen && (
              <div
                className="
                  absolute
                  left-1/2
                  top-[calc(100%+8px)]
                  w-[210px]
                  -translate-x-1/2
                  overflow-hidden
                  rounded-xl
                  border
                  border-zinc-200
                  bg-white
                  shadow-xl
                "
              >
                {/* Header */}

                <div
                  className="
                    flex
                    items-center
                    justify-between
                    border-b
                    border-zinc-100
                    px-3
                    py-2.5
                  "
                >
                  <div
                    className="
                      text-[10px]
                      font-semibold
                      text-zinc-700
                    "
                  >
                    접속 중인 감자
                  </div>

                  <div
                    className="
                      text-[9px]
                      text-zinc-400
                    "
                  >
                    {
                      onlinePlayers.length
                    }
                    명
                  </div>
                </div>

                {/* Player List */}

                <div
                  className="
                    max-h-[230px]
                    overflow-y-auto
                    py-1

                    [scrollbar-width:none]
                    [-ms-overflow-style:none]
                    [&::-webkit-scrollbar]:hidden
                  "
                >
                  {onlinePlayers.length ===
                  0 ? (
                    <div
                      className="
                        px-3
                        py-5
                        text-center
                        text-[10px]
                        text-zinc-400
                      "
                    >
                      접속자를 불러오는 중...
                    </div>
                  ) : (
                    onlinePlayers.map(
                      player => {
                        const isMe =
                          getDisplayName(
                            player.nickname
                          ) ===
                          getDisplayName(
                            nickname
                          );

                        return (
                          <div
                            key={
                              player.id
                            }
                            className="
                              flex
                              items-center
                              gap-2.5
                              px-3
                              py-2
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

                            <span
                              className="
                                min-w-0
                                flex-1
                                truncate
                                text-[10px]
                                font-medium
                                text-zinc-700
                              "
                            >
                              {getDisplayName(
                                player.nickname
                              )}
                            </span>

                            {isMe && (
                              <span
                                className="
                                  rounded-full
                                  bg-zinc-100
                                  px-2
                                  py-0.5
                                  text-[8px]
                                  text-zinc-400
                                "
                              >
                                나
                              </span>
                            )}
                          </div>
                        );
                      }
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* =====================================
              내 정보
          ===================================== */}

          <div
            className="
              flex
              items-center
              justify-self-end
              gap-4
            "
          >
            <div
              className="
                text-right
              "
            >
              <div
                className="
                  text-xs
                  font-semibold
                  text-zinc-700
                "
              >
                {getDisplayName(
                  nickname
                )}
              </div>

              <div
                className="
                  mt-0.5
                  flex
                  items-center
                  justify-end
                  gap-1.5
                  text-[10px]
                  text-zinc-400
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

                online
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setOnlinePlayers(
                  []
                );

                setOnlineOpen(
                  false
                );

                setEntered(
                  false
                );
              }}
              className="
                rounded-lg
                border
                border-zinc-200
                bg-white
                px-3
                py-1.5
                text-[11px]
                font-medium
                text-zinc-500
                transition
                hover:bg-zinc-50
              "
            >
              꾸미기
            </button>
          </div>
        </div>

        {/* =========================================
            모바일 접속자
        ========================================= */}

        <div
          className="
            border-t
            border-zinc-200
            px-4
            py-2
            md:hidden
          "
        >
          <div
            className="
              flex
              items-center
              justify-center
              gap-1.5
              text-[10px]
              text-zinc-500
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

            {
              onlinePlayers.length
            }
            명 접속
          </div>
        </div>
      </header>

      {/* =========================================
          Game
      ========================================= */}

      <GameWorld
        nickname={
          nickname
        }
        characterStyle={
          characterStyle
        }
        onOnlinePlayersChange={
          handleOnlinePlayersChange
        }
      />
    </main>
  );
}