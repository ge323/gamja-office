"use client";

import {
  useMemo,
  useState,
} from "react";

type Props = {
  onComplete: () => void;
};

type PaperSize =
  | "A4"
  | "A3";

type PrintColor =
  | "black"
  | "color";

type PrintSide =
  | "single"
  | "double";

type CopyProblem = {
  paper: PaperSize;
  copies: number;
  color: PrintColor;
  side: PrintSide;
};

const PROBLEMS: CopyProblem[] = [
  {
    paper: "A4",
    copies: 3,
    color: "black",
    side: "double",
  },

  {
    paper: "A4",
    copies: 5,
    color: "color",
    side: "single",
  },

  {
    paper: "A3",
    copies: 2,
    color: "black",
    side: "single",
  },

  {
    paper: "A3",
    copies: 4,
    color: "color",
    side: "double",
  },
];

export default function CopyMission({
  onComplete,
}: Props) {
  /* =====================================
     문제 생성
  ===================================== */

  const problem = useMemo(() => {
    const randomIndex =
      Math.floor(
        Math.random() *
          PROBLEMS.length
      );

    return PROBLEMS[
      randomIndex
    ];
  }, []);

  /* =====================================
     사용자 설정
  ===================================== */

  const [
    paper,
    setPaper,
  ] =
    useState<PaperSize>(
      "A4"
    );

  const [
    copies,
    setCopies,
  ] =
    useState(1);

  const [
    color,
    setColor,
  ] =
    useState<PrintColor>(
      "black"
    );

  const [
    side,
    setSide,
  ] =
    useState<PrintSide>(
      "single"
    );

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState(false);

  /* =====================================
     정답 확인
  ===================================== */

  function handlePrint() {
    if (success) {
      return;
    }

    const isCorrect =
      paper ===
        problem.paper &&
      copies ===
        problem.copies &&
      color ===
        problem.color &&
      side ===
        problem.side;

    if (!isCorrect) {
      setMessage(
        "설정이 요청서와 다릅니다."
      );

      return;
    }

    setSuccess(true);

    setMessage(
      "복사가 완료되었습니다!"
    );

    /*
      약간의 연출 후 완료 처리
    */

    setTimeout(() => {
      onComplete();
    }, 1000);
  }

  /* =====================================
     Render
  ===================================== */

  return (
    <div
      className="
        w-full
        max-w-[520px]
      "
    >
      {/* =================================
          요청서
      ================================= */}

      <div
        className="
          rounded-xl
          border
          border-black/10
          bg-amber-50
          p-5
        "
      >
        <div
          className="
            text-[11px]
            font-bold
            tracking-[0.15em]
            text-black/40
          "
        >
          COPY REQUEST
        </div>

        <div
          className="
            mt-1
            text-[18px]
            font-black
            text-black/85
          "
        >
          📄 회의자료 복사 요청
        </div>

        <div
          className="
            mt-4
            space-y-1
            text-[13px]
            font-semibold
            text-black/65
          "
        >
          <div>
            용지 크기 :{" "}
            <strong>
              {problem.paper}
            </strong>
          </div>

          <div>
            필요한 부수 :{" "}
            <strong>
              {problem.copies}부
            </strong>
          </div>

          <div>
            인쇄 방식 :{" "}
            <strong>
              {problem.side ===
              "double"
                ? "양면"
                : "단면"}
            </strong>
          </div>

          <div>
            색상 :{" "}
            <strong>
              {problem.color ===
              "black"
                ? "흑백"
                : "컬러"}
            </strong>
          </div>
        </div>
      </div>

      {/* =================================
          복사기
      ================================= */}

      <div
        className="
          mt-5
          rounded-2xl
          bg-[#34363b]
          p-5
        "
      >
        <div
          className="
            mb-4
            flex
            items-center
            justify-between
          "
        >
          <div
            className="
              font-black
              text-white
            "
          >
            🖨 GAMJA COPY 3000
          </div>

          <div
            className="
              h-2
              w-2
              rounded-full
              bg-emerald-400
            "
          />
        </div>

        {/* 화면 */}

        <div
          className="
            rounded-xl
            bg-[#d9e5dd]
            p-4
          "
        >
          {/* 용지 */}

          <label
            className="
              block
              text-[12px]
              font-bold
              text-black/60
            "
          >
            용지 크기
          </label>

          <select
            value={paper}
            onChange={(
              event
            ) =>
              setPaper(
                event.target
                  .value as PaperSize
              )
            }
            className="
              mt-1
              w-full
              rounded-lg
              border
              border-black/15
              bg-white
              px-3
              py-2
              text-[13px]
              font-bold
            "
          >
            <option value="A4">
              A4
            </option>

            <option value="A3">
              A3
            </option>
          </select>

          {/* 매수 */}

          <div className="mt-4">
            <div
              className="
                text-[12px]
                font-bold
                text-black/60
              "
            >
              복사 부수
            </div>

            <div
              className="
                mt-2
                flex
                items-center
                gap-3
              "
            >
              <button
                type="button"
                onClick={() =>
                  setCopies(
                    (
                      previous
                    ) =>
                      Math.max(
                        1,
                        previous -
                          1
                      )
                  )
                }
                className="
                  h-9
                  w-9
                  rounded-lg
                  bg-white
                  font-black
                "
              >
                -
              </button>

              <div
                className="
                  min-w-[50px]
                  text-center
                  text-[18px]
                  font-black
                "
              >
                {copies}
              </div>

              <button
                type="button"
                onClick={() =>
                  setCopies(
                    (
                      previous
                    ) =>
                      Math.min(
                        9,
                        previous +
                          1
                      )
                  )
                }
                className="
                  h-9
                  w-9
                  rounded-lg
                  bg-white
                  font-black
                "
              >
                +
              </button>
            </div>
          </div>

          {/* 단면 / 양면 */}

          <div className="mt-4">
            <div
              className="
                text-[12px]
                font-bold
                text-black/60
              "
            >
              인쇄 방식
            </div>

            <div
              className="
                mt-2
                grid
                grid-cols-2
                gap-2
              "
            >
              <button
                type="button"
                onClick={() =>
                  setSide(
                    "single"
                  )
                }
                className={`
                  rounded-lg
                  border
                  px-3
                  py-2
                  text-[12px]
                  font-bold

                  ${
                    side ===
                    "single"
                      ? "border-black bg-black text-white"
                      : "border-black/10 bg-white text-black"
                  }
                `}
              >
                단면
              </button>

              <button
                type="button"
                onClick={() =>
                  setSide(
                    "double"
                  )
                }
                className={`
                  rounded-lg
                  border
                  px-3
                  py-2
                  text-[12px]
                  font-bold

                  ${
                    side ===
                    "double"
                      ? "border-black bg-black text-white"
                      : "border-black/10 bg-white text-black"
                  }
                `}
              >
                양면
              </button>
            </div>
          </div>

          {/* 흑백 / 컬러 */}

          <div className="mt-4">
            <div
              className="
                text-[12px]
                font-bold
                text-black/60
              "
            >
              색상
            </div>

            <div
              className="
                mt-2
                grid
                grid-cols-2
                gap-2
              "
            >
              <button
                type="button"
                onClick={() =>
                  setColor(
                    "black"
                  )
                }
                className={`
                  rounded-lg
                  border
                  px-3
                  py-2
                  text-[12px]
                  font-bold

                  ${
                    color ===
                    "black"
                      ? "border-black bg-black text-white"
                      : "border-black/10 bg-white text-black"
                  }
                `}
              >
                흑백
              </button>

              <button
                type="button"
                onClick={() =>
                  setColor(
                    "color"
                  )
                }
                className={`
                  rounded-lg
                  border
                  px-3
                  py-2
                  text-[12px]
                  font-bold

                  ${
                    color ===
                    "color"
                      ? "border-black bg-black text-white"
                      : "border-black/10 bg-white text-black"
                  }
                `}
              >
                컬러
              </button>
            </div>
          </div>
        </div>

        {/* 상태 */}

        <div
          className="
            mt-4
            min-h-[22px]
            text-center
            text-[12px]
            font-bold
          "
        >
          {message && (
            <span
              className={
                success
                  ? "text-emerald-400"
                  : "text-red-400"
              }
            >
              {message}
            </span>
          )}
        </div>

        {/* 실행 */}

        <button
          type="button"
          disabled={success}
          onClick={
            handlePrint
          }
          className="
            mt-2
            w-full
            rounded-xl
            bg-white
            py-3
            text-[13px]
            font-black
            text-black

            disabled:cursor-default
            disabled:opacity-50
          "
        >
          {success
            ? "출력 중..."
            : "복사 시작"}
        </button>
      </div>
    </div>
  );
}