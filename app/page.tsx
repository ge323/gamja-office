"use client";

import {
  useState,
} from "react";

import CharacterCustomizer, {
  type CharacterStyle,
} from "@/components/character/CharacterCustomizer";

import GameWorld from "@/components/game/GameWorld";

export default function Home() {
  /* =========================================
     입장 여부
  ========================================= */

  const [
    entered,
    setEntered,
  ] =
    useState(false);

  /* =========================================
     닉네임
  ========================================= */

  const [
    nickname,
    setNickname,
  ] =
    useState("");

  /* =========================================
     캐릭터 외형
  ========================================= */

  const [
    characterStyle,
    setCharacterStyle,
  ] =
    useState<CharacterStyle>({
      glasses:
        "none",

      hat:
        "none",

      ribbon:
        false,

      tie:
        false,
    });

  /* =========================================
     입장 전
  ========================================= */

  if (!entered) {
    return (
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
        onEnter={() => {
          const trimmed =
            nickname.trim();

          if (!trimmed) {
            return;
          }

          setNickname(
            trimmed
          );

          setEntered(
            true
          );
        }}
      />
    );
  }

  /* =========================================
     게임 화면
  ========================================= */

  return (
    <main className="min-h-screen bg-[#ece7dd] text-zinc-900">
      {/* =====================================
          Header
      ===================================== */}

      <header className="border-b border-zinc-300 bg-[#f7f4ee]">
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
            <div className="text-sm font-bold">
              Gamja Office
            </div>

            <div className="mt-0.5 text-[10px] text-zinc-400">
              Potato Workspace
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* 사용자 상태 */}

            <div className="text-right">
              <div className="text-xs font-semibold text-zinc-700">
                {nickname}
              </div>

              <div className="mt-0.5 flex items-center justify-end gap-1.5 text-[10px] text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

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

      {/* =====================================
          Game
      ===================================== */}

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