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

import type {
  OnlinePlayer,
} from "@/components/game/GameWorld";

import DevilGameWorld from "@/components/game/devil/DevilGameWorld";

/* =========================================================
   Types
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
     Load State
  ====================================================== */

  const [
    loaded,
    setLoaded,
  ] =
    useState(false);

  /* ======================================================
     Enter State
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
     Character Style
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

     현재 DevilGameWorld 테스트에서는
     실제로 사용하지 않지만,
     기존 메인 로비 코드 복귀를 위해 유지한다.
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
     Online Player Callback

     이후 GameWorld 복구용으로 유지
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

  /*
   * 현재 DevilGameWorld 테스트에서는
   * 사용하지 않지만,
   * 이후 다시 메인 GameWorld를 연결할 때 사용한다.
   */
  void handleOnlinePlayersChange;

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
        setLoaded(true);

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
         Character Style
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

    setLoaded(true);
  }, []);

  /* ======================================================
     Online Popover Outside Click
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
        event.target instanceof Node &&
        !element.contains(
          event.target
        )
      ) {
        setOnlineOpen(false);
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
     Save Player
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

      /*
       * 혹시 사용자가 감자까지
       * 직접 입력했을 경우 제거
       */
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
     Customize
  ====================================================== */

  const handleCustomize =
    () => {
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
     Leave
  ====================================================== */

  const handleLeave =
    () => {
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

        {/* =====================================
            저장 정보 초기화
        ===================================== */}

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
     Devil Game Test
  ====================================================== */

  return (
    <main
      className="
        min-h-screen
        bg-zinc-950
        text-zinc-900
      "
    >
      {/* =========================================
          테스트용 Header
      ========================================= */}

      <header
        className="
          relative
          z-[20000]
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
              Devil Game Map Test
            </div>
          </div>

          {/* =====================================
              가운데 테스트 표시
          ===================================== */}

          <div
            className="
              hidden
              items-center
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
              md:flex
            "
          >
            <span>
              🧪
            </span>

            <span>
              악마 감자 맵 테스트
            </span>
          </div>

          {/* =====================================
              User
          ===================================== */}

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
                  text-[9px]
                  text-zinc-400
                "
              >
                TEST MODE
              </div>
            </div>

            {/* =================================
                꾸미기
            ================================= */}

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

            {/* =================================
                나가기
            ================================= */}

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
                hover:border-red-300
                hover:bg-red-50
                hover:text-red-500
              "
            >
              나가기
            </button>
          </div>
        </div>
      </header>

      {/* =========================================
          테스트 설명
      ========================================= */}

      <div
        className="
          bg-zinc-900
          px-4
          py-2
          text-center
          text-[10px]
          text-white/60
        "
      >
        빈 공간 클릭 = 이동
        <span
          className="
            mx-3
            text-white/20
          "
        >
          |
        </span>
        M = 전체 지도
        <span
          className="
            mx-3
            text-white/20
          "
        >
          |
        </span>
        ESC = 지도 닫기
      </div>

      {/* =========================================
          Devil GameWorld Test
      ========================================= */}

      <DevilGameWorld />
    </main>
  );
}