"use client";

import type {
  Mission,
} from "./missionTypes";

import CopyMission from "./CopyMission";

import ArchiveMission from "./ArchiveMission";

import CoffeeMission from "./CoffeeMission";

import EmailMission from "./EmailMission";

import MeetingMission from "./MeetingMission";

import PowerMission from "./PowerMission";

import ServerMission from "./ServerMission";

/* =========================================================
   Props
========================================================= */

type Props = {
  mission:
    Mission | null;

  onClose:
    () => void;

  onComplete: (
    missionId: string
  ) => void;
};

/* =========================================================
   MissionModal
========================================================= */

export default function MissionModal({
  mission,
  onClose,
  onComplete,
}: Props) {
  if (!mission) {
    return null;
  }

  /* =======================================================
     Mission Complete
  ======================================================= */

  const handleComplete =
    () => {
      onComplete(
        mission.id
      );
    };

  /* =======================================================
     Render Mission
  ======================================================= */

  const renderMission =
    () => {
      switch (
        mission.type
      ) {
        /* =============================================
           복사실
        ============================================= */

        case "copy":
          return (
            <CopyMission
              onComplete={
                handleComplete
              }
            />
          );

        /* =============================================
           자료실
        ============================================= */

        case "archive":
          return (
            <ArchiveMission
              onComplete={
                handleComplete
              }
            />
          );

        /* =============================================
           탕비실
        ============================================= */

        case "coffee":
          return (
            <CoffeeMission
              onComplete={
                handleComplete
              }
            />
          );

        /* =============================================
           중앙 사무실
        ============================================= */

        case "email":
          return (
            <EmailMission
              onComplete={
                handleComplete
              }
            />
          );

        /* =============================================
           회의실
        ============================================= */

        case "meeting":
          return (
            <MeetingMission
              onComplete={
                handleComplete
              }
            />
          );

        /* =============================================
           전력실
        ============================================= */

        case "power":
          return (
            <PowerMission
              onComplete={
                handleComplete
              }
            />
          );

        /* =============================================
           서버실
        ============================================= */

        case "server":
          return (
            <ServerMission
              onComplete={
                handleComplete
              }
            />
          );

        default:
          return (
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
              <div
                className="
                  text-3xl
                "
              >
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
          );
      }
    };

  /* =======================================================
     Render
  ======================================================= */

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
        {/* =================================================
            Header
        ================================================= */}

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
              {
                mission.title
              }
            </div>

            {/* 장소 */}

            <div
              className="
                mt-2

                inline-flex

                items-center
                gap-1.5

                rounded-full

                bg-black/5

                px-2.5
                py-1

                text-[10px]
                font-bold

                text-black/45
              "
            >
              <span>
                📍
              </span>

              {
                mission.room
              }
            </div>

            {/* 설명 */}

            <div
              className="
                mt-3

                max-w-[430px]

                text-[11px]
                font-medium
                leading-5

                text-black/45
              "
            >
              {
                mission.description
              }
            </div>
          </div>

          {/* =============================================
              Close
          ============================================= */}

          <button
            type="button"
            onClick={
              onClose
            }
            className="
              shrink-0

              rounded-lg

              border
              border-black/10

              bg-white

              px-3
              py-2

              text-[11px]
              font-bold

              text-black/60

              transition

              hover:bg-black/5
            "
          >
            닫기
          </button>
        </div>

        {/* =================================================
            Divider
        ================================================= */}

        <div
          className="
            mb-5

            h-px
            w-full

            bg-black/5
          "
        />

        {/* =================================================
            Mission Game
        ================================================= */}

        {renderMission()}
      </div>
    </div>
  );
}