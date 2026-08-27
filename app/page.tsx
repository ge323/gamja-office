"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import CharacterCustomizer, {
  type CharacterStyle,
} from "@/components/character/CharacterCustomizer";

import GameWorld, {
  type OnlinePlayer,
} from "@/components/game/GameWorld";

import DevilGameWorld from "@/components/game/devil/DevilGameWorld";

import RoleReveal, {
  type DevilRole,
} from "@/components/game/devil/RoleReveal";

/* =========================================================
   Types
========================================================= */

type SavedPlayerData = {
  nickname: string;

  characterStyle:
    CharacterStyle;
};

type AppScreen =
  | "office"
  | "roleReveal"
  | "devilGame";

/* =========================================================
   Storage
========================================================= */

const STORAGE_KEY =
  "gamja-office-player";

/* =========================================================
   Character
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
   Name
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
  const [
    loaded,
    setLoaded,
  ] =
    useState(false);

  const [
    entered,
    setEntered,
  ] =
    useState(false);

  const [
    screen,
    setScreen,
  ] =
    useState<AppScreen>(
      "office"
    );

  const [
    nickname,
    setNickname,
  ] =
    useState("");

  const [
    characterStyle,
    setCharacterStyle,
  ] =
    useState<CharacterStyle>(
      DEFAULT_CHARACTER_STYLE
    );

  const [
    onlinePlayers,
    setOnlinePlayers,
  ] =
    useState<
      OnlinePlayer[]
    >([]);

  const [
    devilRole,
    setDevilRole,
  ] =
    useState<
      DevilRole | null
    >(null);

  const [
    devilRoomId,
    setDevilRoomId,
  ] =
    useState<
      string | null
    >(null);

  const [
    devilPlayerId,
    setDevilPlayerId,
  ] =
    useState("");

  /* ======================================================
     Load
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

      setScreen(
        "office"
      );

      setEntered(
        true
      );
    };

  /* ======================================================
     Online
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
     Role
  ====================================================== */

  const handleDevilRole =
    useCallback(
      (
        role:
          DevilRole,
        roomId:
          string,
        playerId:
          string
      ) => {
        setDevilRole(
          role
        );

        setDevilRoomId(
          roomId
        );

        setDevilPlayerId(
          playerId
        );

        setScreen(
          "roleReveal"
        );
      },
      []
    );

  /* ======================================================
     Return To Office
  ====================================================== */

  const handleReturnToOffice =
    useCallback(
      () => {
        setDevilRole(
          null
        );

        setDevilRoomId(
          null
        );

        setDevilPlayerId(
          ""
        );

        setScreen(
          "office"
        );
      },
      []
    );

  /* ======================================================
     Role Reveal Timer
  ====================================================== */

  useEffect(() => {
    if (
      screen !==
        "roleReveal" ||
      !devilRole
    ) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setScreen(
            "devilGame"
          );
        },
        3200
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [
    screen,
    devilRole,
  ]);

  /* ======================================================
     Customize
  ====================================================== */

  const handleCustomize =
    () => {
      setEntered(
        false
      );

      setScreen(
        "office"
      );

      setDevilRole(
        null
      );

      setDevilRoomId(
        null
      );

      setDevilPlayerId(
        ""
      );

      setOnlinePlayers(
        []
      );
    };

  /* ======================================================
     Leave
  ====================================================== */

  const handleLeave =
    () => {
      setEntered(
        false
      );

      setScreen(
        "office"
      );

      setDevilRole(
        null
      );

      setDevilRoomId(
        null
      );

      setDevilPlayerId(
        ""
      );

      setOnlinePlayers(
        []
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

      setEntered(
        false
      );

      setScreen(
        "office"
      );

      setDevilRole(
        null
      );

      setDevilRoomId(
        null
      );

      setDevilPlayerId(
        ""
      );

      setOnlinePlayers(
        []
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
     Customizer
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
              z-[10000]
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
     Role Reveal
  ====================================================== */

  if (
    screen ===
      "roleReveal" &&
    devilRole
  ) {
    return (
      <RoleReveal
        role={
          devilRole
        }
      />
    );
  }

  /* ======================================================
     Potato War
  ====================================================== */

  if (
    screen ===
      "devilGame" &&
    devilRole
  ) {
    return (
      <main
        className="
          min-h-screen
          bg-zinc-950
        "
      >
        {/* =====================================
            Header
        ===================================== */}

        <header
          className="
            border-b
            border-zinc-800
            bg-zinc-950
            text-white
          "
        >
          <div
            className="
              mx-auto
              flex
              max-w-[1130px]
              items-center
              justify-between
              px-4
              py-3
            "
          >
            <div>
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
                  text-[9px]
                  font-medium
                  text-white/40
                "
              >
                🥔 감자 전쟁
              </div>
            </div>

            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              {devilRoomId && (
                <div
                  className="
                    rounded-lg
                    border
                    border-white/10
                    bg-white/5
                    px-3
                    py-2
                    font-mono
                    text-[9px]
                    text-white/50
                  "
                >
                  {
                    devilRoomId
                  }
                </div>
              )}

              <div
                className="
                  text-right
                "
              >
                <div
                  className="
                    text-[11px]
                    font-semibold
                  "
                >
                  {getDisplayName(
                    nickname
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* =====================================
            Game
        ===================================== */}

        <DevilGameWorld
          role={
            devilRole
          }
          roomId={
            devilRoomId ?? ""
          }
          playerId={
            devilPlayerId
          }
          nickname={
            nickname
          }
          characterStyle={
            characterStyle
          }
          onReturnToOffice={
            handleReturnToOffice
          }
        />
      </main>
    );
  }

  /* ======================================================
     Main Office
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
          {/* Logo */}

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

          {/* Online */}

          <div
            className="
              hidden
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
              text-zinc-600
              shadow-sm
              md:flex
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
          </div>

          {/* User */}

          <div
            className="
              flex
              items-center
              justify-self-end
              gap-3
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
                  text-[9px]
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
              onClick={
                handleCustomize
              }
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

            <button
              type="button"
              onClick={
                handleLeave
              }
              className="
                rounded-lg
                border
                border-red-200
                bg-white
                px-3
                py-1.5
                text-[11px]
                font-medium
                text-red-400
                transition
                hover:bg-red-50
              "
            >
              나가기
            </button>
          </div>
        </div>
      </header>

      {/* =========================================
          Main Office
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
        onDevilRole={
          handleDevilRole
        }
      />
    </main>
  );
}