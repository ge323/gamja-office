"use client";

export type DevilRole =
  | "survivor"
  | "devil";

type RoleRevealProps = {
  role:
    DevilRole;
};

export default function RoleReveal({
  role,
}: RoleRevealProps) {
  const isDevil =
    role ===
    "devil";

  return (
    <div
      className="
        fixed
        inset-0
        z-[30000]
        flex
        items-center
        justify-center
        bg-zinc-950
        text-white
      "
    >
      <div
        className="
          w-[420px]
          text-center
        "
      >
        {/* =====================================
            Intro
        ===================================== */}

        <div
          className="
            text-[10px]
            font-bold
            tracking-[0.3em]
            text-white/35
          "
        >
          YOUR ROLE
        </div>

        {/* =====================================
            Icon
        ===================================== */}

        <div
          className="
            mt-8
            text-[70px]
          "
        >
          {isDevil
            ? "😈"
            : "🥔"}
        </div>

        {/* =====================================
            Role
        ===================================== */}

        <h1
          className={`
            mt-4
            text-3xl
            font-black

            ${
              isDevil
                ? "text-red-400"
                : "text-emerald-300"
            }
          `}
        >
          {isDevil
            ? "악마 감자"
            : "생존 감자"}
        </h1>

        {/* =====================================
            Description
        ===================================== */}

        <p
          className="
            mx-auto
            mt-5
            max-w-[300px]
            text-sm
            leading-7
            text-white/60
          "
        >
          {isDevil ? (
            <>
              정체를 숨기고
              생존 감자들의 업무를
              방해하세요.
              <br />
              기회를 노려
              생존 감자를 제거하세요.
            </>
          ) : (
            <>
              주어진 업무를
              완료하세요.
              <br />
              악마 감자를 찾아내고
              끝까지 살아남으세요.
            </>
          )}
        </p>

        {/* =====================================
            Notice
        ===================================== */}

        <div
          className="
            mt-10
            text-[10px]
            text-white/30
          "
        >
          잠시 후 게임이 시작됩니다...
        </div>
      </div>
    </div>
  );
}