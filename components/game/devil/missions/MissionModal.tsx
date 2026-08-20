"use client";

import type {
  Mission,
} from "./missionTypes";

import CopyMission from "./CopyMission";

type Props = {
  mission: Mission | null;

  onClose: () => void;

  onComplete: (
    missionId: string
  ) => void;
};

export default function MissionModal({
  mission,
  onClose,
  onComplete,
}: Props) {
  if (!mission) {
    return null;
  }

  return (
    <div
      data-no-move
      className="
        fixed
        inset-0
        z-[20000]

        flex
        items-center
        justify-center

        bg-black/70
        p-5
        backdrop-blur-[2px]
      "
    >
      <div
        className="
          relative
          max-h-[90vh]
          w-full
          max-w-[600px]

          overflow-y-auto

          rounded-2xl
          bg-[#f7f4ee]
          p-6

          shadow-2xl
        "
      >
        {/* Header */}

        <div
          className="
            mb-5
            flex
            items-start
            justify-between
            gap-4
          "
        >
          <div>
            <div
              className="
                text-[10px]
                font-bold
                tracking-[0.18em]
                text-black/35
              "
            >
              GAMJA OFFICE TASK
            </div>

            <div
              className="
                mt-1
                text-[20px]
                font-black
                text-black/85
              "
            >
              {mission.title}
            </div>

            <div
              className="
                mt-1
                text-[11px]
                font-semibold
                text-black/40
              "
            >
              {mission.room}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              rounded-lg
              border
              border-black/10
              bg-white
              px-3
              py-2
              text-[11px]
              font-bold
              text-black/60
            "
          >
            닫기
          </button>
        </div>

        {/* Mission */}

        {mission.type ===
          "copy" && (
          <CopyMission
            onComplete={() =>
              onComplete(
                mission.id
              )
            }
          />
        )}

        {/* 아직 구현하지 않은 미션 */}

        {mission.type !==
          "copy" && (
          <div
            className="
              rounded-xl
              border
              border-dashed
              border-black/15
              p-10
              text-center
            "
          >
            <div className="text-3xl">
              🚧
            </div>

            <div
              className="
                mt-3
                text-[14px]
                font-black
              "
            >
              미션 준비 중
            </div>
          </div>
        )}
      </div>
    </div>
  );
}