"use client";

import {
  useEffect,
  useState,
} from "react";

import CharacterCustomizer, {
  type CharacterStyle,
} from "@/components/character/CharacterCustomizer";

import GameWorld from "@/components/game/GameWorld";

/* =========================================================
   저장 데이터
========================================================= */

type SavedPlayerData = {
  nickname: string;
  characterStyle: CharacterStyle;
};

/* =========================================================
   LocalStorage
========================================================= */

const STORAGE_KEY =
  "gamja-office-player";

/* =========================================================
   기본 스타일
========================================================= */

const DEFAULT_CHARACTER_STYLE: CharacterStyle =
  {
    glasses:
      "none",

    hat:
      "none",

    ribbon:
      false,

    tie:
      false,

    color:
      "default",
  };

/* =========================================================
   이름 표시
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
     저장정보 로딩
  ====================================================== */

  const [
    loaded,
    setLoaded,
  ] =
    useState(false);

  /* ======================================================
     게임 입장 여부
  ====================================================== */

  const [
    entered,
    setEntered,
  ] =
    useState(false);

  /* ======================================================
     닉네임
  ====================================================== */

  const [
    nickname,
    setNickname,
  ] =
    useState("");

  /* ======================================================
     캐릭터 설정
  ====================================================== */

  const [
    characterStyle,
    setCharacterStyle,
  ] =
    useState<CharacterStyle>(
      DEFAULT_CHARACTER_STYLE
    );

  /* ======================================================
     저장정보 불러오기
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

      /* 닉네임 */

      if (
        typeof parsed.nickname ===
        "string"
      ) {
        /*
         * 예전 저장 데이터에
         * "LOL 감자" 등이 들어있을 경우도
         * 감자 부분 제거
         */
        const cleanedNickname =
          parsed.nickname.replace(
            /\s*감자\s*$/g,
            ""
          );

        setNickname(
          cleanedNickname
        );
      }

      /* 외형 */

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
     저장
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
     입장
  ====================================================== */

  const handleEnter =
    () => {
      let trimmed =
        nickname.trim();

      /*
       * 혹시 감자를 직접 입력했다면 제거
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
     저장 정보 초기화
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
    };

  /* ======================================================
     로딩
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
     입장 전
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

        {/* 저장정보 초기화 */}

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
     게임 화면
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
          border-b
          border-zinc-300
          bg-[#f7f4ee]
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
          {/* 로고 */}

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
                text-[10px]
                text-zinc-400
              "
            >
              Potato Workspace
            </div>
          </div>

          {/* 사용자 */}

          <div
            className="
              flex
              items-center
              gap-4
            "
          >
            <div className="text-right">
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

            {/* 꾸미기 */}

            <button
              type="button"
              onClick={() => {
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
      />
    </main>
  );
}