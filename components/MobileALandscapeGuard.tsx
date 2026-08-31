"use client";

import {
  type ReactNode,
  useEffect,
  useState,
} from "react";

type MobileLandscapeGuardProps = {
  children: ReactNode;
};

export default function MobileLandscapeGuard({
  children,
}: MobileLandscapeGuardProps) {
  const [ready, setReady] =
    useState(false);

  const [isMobile, setIsMobile] =
    useState(false);

  const [isPortrait, setIsPortrait] =
    useState(false);

  useEffect(() => {
    const updateScreen = () => {
      const width =
        window.innerWidth;

      const height =
        window.innerHeight;

      /*
       * 휴대폰/태블릿 터치 환경 판정
       */
      const mobile =
        window.matchMedia(
          "(pointer: coarse)"
        ).matches ||
        Math.min(
          width,
          height
        ) <= 768;

      setIsMobile(
        mobile
      );

      setIsPortrait(
        height > width
      );

      setReady(
        true
      );
    };

    updateScreen();

    window.addEventListener(
      "resize",
      updateScreen
    );

    window.addEventListener(
      "orientationchange",
      updateScreen
    );

    window.visualViewport?.addEventListener(
      "resize",
      updateScreen
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateScreen
      );

      window.removeEventListener(
        "orientationchange",
        updateScreen
      );

      window.visualViewport?.removeEventListener(
        "resize",
        updateScreen
      );
    };
  }, []);

  /*
   * Hydration 전에는 그냥 children 표시.
   * 빈 화면처럼 보이는 것을 방지한다.
   */
  if (!ready) {
    return <>{children}</>;
  }

  /*
   * PC에서는 방향 제한 없음.
   */
  if (!isMobile) {
    return <>{children}</>;
  }

  /*
   * 모바일 세로모드
   */
  if (isPortrait) {
    return (
      <div
        className="
          fixed
          inset-0
          z-[999999]
          flex
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
          {/* 휴대폰 아이콘 */}
          <div
            className="
              relative
              mb-8
              h-24
              w-14
              rotate-90
              rounded-[18px]
              border-[3px]
              border-white/80
            "
          >
            <div
              className="
                absolute
                left-1/2
                top-2
                h-1
                w-5
                -translate-x-1/2
                rounded-full
                bg-white/50
              "
            />

            <div
              className="
                absolute
                bottom-2
                left-1/2
                h-2
                w-2
                -translate-x-1/2
                rounded-full
                bg-white/50
              "
            />
          </div>

          <div
            className="
              text-xl
              font-bold
            "
          >
            화면을 가로로 돌려주세요
          </div>

          <div
            className="
              mt-3
              text-sm
              leading-6
              text-white/55
            "
          >
            Gamja Office는
            <br />
            가로 화면에 최적화되어 있어요.
          </div>

          <div
            className="
              mt-6
              rounded-full
              border
              border-white/10
              bg-white/5
              px-5
              py-2.5
              text-xs
              text-white/60
            "
          >
            📱 ↻ 가로로 돌리면 자동으로 시작됩니다
          </div>
        </div>
      </div>
    );
  }

  /*
   * 모바일 가로
   */
  return (
    <div
      className="
        h-[100dvh]
        w-screen
        overflow-hidden
        bg-black
      "
    >
      {children}
    </div>
  );
}