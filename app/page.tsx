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
   저장할 데이터 타입
========================================================= */

type SavedPlayerData = {
  nickname: string;

  characterStyle:
    CharacterStyle;
};

/* =========================================================
   LocalStorage Key
========================================================= */

const STORAGE_KEY =
  "gamja-office-player";

/* =========================================================
   기본 캐릭터 설정
========================================================= */

const DEFAULT_CHARACTER_STYLE: CharacterStyle =
  {
    glasses: "none",

    hat: "none",

    ribbon: false,

    tie: false,
  };

/* =========================================================
   Home
========================================================= */

export default function Home() {
  /* ======================================================
     LocalStorage 로딩 완료 여부

     Next.js hydration 문제를 피하기 위해 사용
  ====================================================== */

  const [
    loaded,
    setLoaded,
  ] =
    useState(false);

  /* ======================================================
     입장 여부
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
     캐릭터 외형
  ====================================================== */

  const [
    characterStyle,
    setCharacterStyle,
  ] =
    useState<CharacterStyle>(
      DEFAULT_CHARACTER_STYLE
    );

  /* ======================================================
     처음 페이지 실행

     LocalStorage에 저장된 캐릭터가 있으면 불러오기
  ====================================================== */

  useEffect(() => {
    try {
      const saved =
        window.localStorage.getItem(
          STORAGE_KEY
        );

      /*
       * 저장된 데이터 없음
       */
      if (!saved) {
        setLoaded(true);

        return;
      }

      /*
       * JSON 문자열
       * →
       * JavaScript 객체
       */
      const parsed =
        JSON.parse(
          saved
        ) as SavedPlayerData;

      /*
       * 닉네임 복원
       */
      if (
        typeof parsed.nickname ===
        "string"
      ) {
        setNickname(
          parsed.nickname
        );
      }

      /*
       * 캐릭터 설정 복원
       */
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
        "저장된 캐릭터 정보를 불러오지 못했습니다.",
        error
      );

      /*
       * 저장 데이터가 깨졌다면 제거
       */
      window.localStorage.removeItem(
        STORAGE_KEY
      );
    }

    setLoaded(true);
  }, []);

  /* ======================================================
     Player 저장
  ====================================================== */

  const savePlayer = (
    nextNickname: string,
    nextCharacterStyle:
      CharacterStyle
  ) => {
    const data:
      SavedPlayerData = {
        nickname:
          nextNickname,

        characterStyle:
          nextCharacterStyle,
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
        "캐릭터 정보를 저장하지 못했습니다.",
        error
      );
    }
  };

  /* ======================================================
     사무실 입장
  ====================================================== */

  const handleEnter =
    () => {
      const trimmedNickname =
        nickname.trim();

      /*
       * 닉네임 없으면 입장 불가
       */
      if (
        !trimmedNickname
      ) {
        return;
      }

      /*
       * 앞뒤 공백 제거
       */
      setNickname(
        trimmedNickname
      );

      /*
       * LocalStorage 저장
       */
      savePlayer(
        trimmedNickname,
        characterStyle
      );

      /*
       * 게임 입장
       */
      setEntered(
        true
      );
    };

  /* ======================================================
     저장된 정보 삭제
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
     LocalStorage 확인 전

     잠깐 빈 화면이 나타나는 것을 방지
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

        {/* =========================================
            저장 정보 초기화

            저장된 닉네임이 있을 때만 표시
        ========================================= */}

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
     게임
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
          {/* =====================================
              Logo
          ===================================== */}

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

          {/* =====================================
              User
          ===================================== */}

          <div
            className="
              flex
              items-center
              gap-4
            "
          >
            {/* 사용자 상태 */}

            <div className="text-right">
              <div
                className="
                  text-xs
                  font-semibold
                  text-zinc-700
                "
              >
                {nickname}
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

            {/* =================================
                꾸미기
            ================================= */}

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