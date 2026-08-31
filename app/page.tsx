"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import CharacterCustomizer, {
  type CharacterStyle,
} from "@/components/character/CharacterCustomizer";

import dynamic from "next/dynamic";

import type {
  OnlinePlayer,
} from "@/components/game/GameWorld";

import type {
  DevilRole,
} from "@/components/game/devil/RoleReveal";

const GameWorld = dynamic(
  () =>
    import(
      "@/components/game/GameWorld"
    ).then(
      (module) =>
        module.default
    ),
  {
    ssr: false,
  }
);

const DevilGameWorld = dynamic(
  () =>
    import(
      "@/components/game/devil/DevilGameWorld"
    ).then(
      (module) =>
        module.default
    ),
  {
    ssr: false,
  }
);

const RoleReveal = dynamic(
  () =>
    import(
      "@/components/game/devil/RoleReveal"
    ).then(
      (module) =>
        module.default
    ),
  {
    ssr: false,
  }
);
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


  const [
    orientationReady,
    setOrientationReady,
  ] =
    useState(false);

  const [
    isMobileLike,
    setIsMobileLike,
  ] =
    useState(false);

  const [
    isPortrait,
    setIsPortrait,
  ] =
    useState(false);

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
     Mobile Orientation

     - 캐릭터 선택 화면: 세로/가로 모두 허용
     - 사무실 입장 이후: 모바일 세로면 가로 전환 안내
     - PC: 방향 제한 없음
  ====================================================== */

  useEffect(() => {
    const updateOrientation =
      () => {
        const width =
          window.visualViewport?.width ??
          window.innerWidth;

        const height =
          window.visualViewport?.height ??
          window.innerHeight;

        const coarsePointer =
          window.matchMedia(
            "(pointer: coarse)"
          ).matches;

        const mobileBySize =
          Math.min(
            width,
            height
          ) <= 900;

        const mobile =
          coarsePointer ||
          mobileBySize;

        setIsMobileLike(
          mobile
        );

        setIsPortrait(
          height > width
        );

        setOrientationReady(
          true
        );
      };

    updateOrientation();

    window.addEventListener(
      "resize",
      updateOrientation
    );

    window.addEventListener(
      "orientationchange",
      updateOrientation
    );

    window.visualViewport?.addEventListener(
      "resize",
      updateOrientation
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateOrientation
      );

      window.removeEventListener(
        "orientationchange",
        updateOrientation
      );

      window.visualViewport?.removeEventListener(
        "resize",
        updateOrientation
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
     Landscape Required After Enter

     캐릭터 선택/수정 중에는 방향을 강제하지 않는다.
     출근 완료 후 모바일이 세로라면 가로 전환 안내만 보여준다.
  ====================================================== */

  if (
    entered &&
    orientationReady &&
    isMobileLike &&
    isPortrait
  ) {
    return (
      <main
        className="
          fixed
          inset-0
          z-[999999]
          flex
          h-[100dvh]
          w-screen
          items-center
          justify-center
          overflow-hidden
          bg-[#171411]
          px-8
          text-white
        "
      >
        <div
          className="
            flex
            max-w-sm
            flex-col
            items-center
            text-center
          "
        >
          <div
            className="
              relative
              mb-8
              h-[58px]
              w-[96px]
              rounded-[18px]
              border-[3px]
              border-white/80
            "
            aria-hidden="true"
          >
            <div
              className="
                absolute
                left-2
                top-1/2
                h-2
                w-2
                -translate-y-1/2
                rounded-full
                bg-white/45
              "
            />

            <div
              className="
                absolute
                right-2
                top-1/2
                h-1
                w-5
                -translate-y-1/2
                rounded-full
                bg-white/45
              "
            />
          </div>

          <div
            className="
              text-[22px]
              font-black
              tracking-[-0.02em]
            "
          >
            화면을 가로로 돌려주세요
          </div>

          <div
            className="
              mt-3
              text-[14px]
              leading-6
              text-white/55
            "
          >
            캐릭터 설정이 완료됐어요.
            <br />
            사무실과 감자 전쟁은 가로 화면에 최적화되어 있어요.
          </div>

          <div
            className="
              mt-7
              flex
              items-center
              gap-2
              rounded-full
              border
              border-white/10
              bg-white/5
              px-5
              py-3
              text-[12px]
              font-semibold
              text-white/65
            "
          >
            <span aria-hidden="true">
              📱
            </span>

            <span aria-hidden="true">
              ↻
            </span>

            <span>
              가로로 돌리면 자동으로 이어집니다
            </span>
          </div>

          <button
            type="button"
            onClick={
              handleCustomize
            }
            className="
              mt-5
              rounded-lg
              px-4
              py-2
              text-[11px]
              text-white/40
              transition
              hover:bg-white/5
              hover:text-white/70
            "
          >
            캐릭터 다시 수정하기
          </button>
        </div>
      </main>
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
          max-[900px]:h-[100dvh]
          max-[900px]:min-h-0
          max-[900px]:overflow-hidden
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
        max-[900px]:h-[100dvh]
        max-[900px]:min-h-0
        max-[900px]:overflow-hidden
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