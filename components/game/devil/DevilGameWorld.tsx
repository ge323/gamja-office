"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import Potato from "@/components/character/Potato";

import DevilOfficeMap, {
  DEVIL_MAP_HEIGHT,
  DEVIL_MAP_WIDTH,
  DOOR_AREAS,
  WALKABLE_AREAS,
  type WalkableRect,
} from "./DevilOfficeMap";

import GameMapOverlay, {
  type MissionMarker,
} from "./GameMapOverlay";

import MissionModal from "./missions/MissionModal";

import {
  INITIAL_MISSIONS,
  type Mission,
} from "./missions/missionTypes";

/* =========================================================
   Types
========================================================= */

type Position = {
  x: number;
  y: number;
};

type DevilGameWorldProps = {
  role:
    | "devil"
    | "survivor";
};

/* =========================================================
   Viewport
========================================================= */

const VIEWPORT_WIDTH =
  1100;

const VIEWPORT_HEIGHT =
  650;

/* =========================================================
   Player
========================================================= */

const PLAYER_SPEED =
  260;

const ARRIVAL_DISTANCE =
  2;

/*
 * 이동 경로 검사 간격
 */
const COLLISION_STEP =
  4;

/*
 * 미션 오브젝트와 상호작용 가능한 거리
 */
const INTERACTION_DISTANCE =
  115;

/* =========================================================
   Rect Check
========================================================= */

function isInsideRect(
  x: number,
  y: number,
  rect:
    WalkableRect
) {
  return (
    x >= rect.x &&
    x <=
      rect.x +
        rect.width &&
    y >= rect.y &&
    y <=
      rect.y +
        rect.height
  );
}

/* =========================================================
   Walkable

   방 내부 + 복도 + 문만 이동 가능
========================================================= */

function isWalkable(
  x: number,
  y: number
) {
  const areas = [
    ...WALKABLE_AREAS,
    ...DOOR_AREAS,
  ];

  return areas.some(
    area =>
      isInsideRect(
        x,
        y,
        area
      )
  );
}

/* =========================================================
   Path Walkable

   클릭 위치까지 직선으로 이동하는 동안
   이동 불가능한 영역을 지나가는지 검사한다.

   따라서 벽을 뚫고 방 안으로 바로 이동할 수 없다.
========================================================= */

function isPathWalkable(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
) {
  const dx =
    toX -
    fromX;

  const dy =
    toY -
    fromY;

  const distance =
    Math.sqrt(
      dx * dx +
        dy * dy
    );

  const steps =
    Math.max(
      1,

      Math.ceil(
        distance /
          COLLISION_STEP
      )
    );

  for (
    let index = 1;
    index <= steps;
    index += 1
  ) {
    const ratio =
      index /
      steps;

    const x =
      fromX +
      dx *
        ratio;

    const y =
      fromY +
      dy *
        ratio;

    if (
      !isWalkable(
        x,
        y
      )
    ) {
      return false;
    }
  }

  return true;
}

/* =========================================================
   Clamp
========================================================= */

function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.max(
    min,

    Math.min(
      max,
      value
    )
  );
}

/* =========================================================
   Distance
========================================================= */

function getDistance(
  a: Position,
  b: Position
) {
  const dx =
    a.x -
    b.x;

  const dy =
    a.y -
    b.y;

  return Math.sqrt(
    dx * dx +
      dy * dy
  );
}

/* =========================================================
   DevilGameWorld
========================================================= */

export default function DevilGameWorld({
  role,
}: DevilGameWorldProps) {
  /* ======================================================
     Refs
  ====================================================== */

  const viewportRef =
    useRef<HTMLDivElement | null>(
      null
    );

  /*
   * 실제 이동 애니메이션
   */
  const animationFrameRef =
    useRef<number | null>(
      null
    );

  /*
   * 이전 프레임 시간
   */
  const lastFrameTimeRef =
    useRef<number | null>(
      null
    );

  /*
   * React state와 별개로
   * 현재 위치를 즉시 참조하기 위한 ref
   */
  const positionRef =
    useRef<Position>({
      x: 1100,
      y: 700,
    });

  /*
   * 현재 이동 목표
   */
  const targetPositionRef =
    useRef<Position | null>(
      null
    );

  /* ======================================================
     Position
  ====================================================== */

  const [
    position,
    setPosition,
  ] =
    useState<Position>({
      x: 1100,
      y: 700,
    });

  /* ======================================================
     Moving
  ====================================================== */

  const [
    moving,
    setMoving,
  ] =
    useState(false);

  /* ======================================================
     Map
  ====================================================== */

  const [
    mapOpen,
    setMapOpen,
  ] =
    useState(false);

  /* ======================================================
     Blackout
  ====================================================== */

  const [
    blackout,
    setBlackout,
  ] =
    useState(false);

  /* ======================================================
     Missions
  ====================================================== */

  const [
    missions,
    setMissions,
  ] =
    useState<Mission[]>(
      () =>
        INITIAL_MISSIONS.map(
          mission => ({
            ...mission,
          })
        )
    );

  /*
   * 현재 실행 중인 미션
   */
  const [
    activeMission,
    setActiveMission,
  ] =
    useState<Mission | null>(
      null
    );

  /* ======================================================
     Remaining Mission Count
  ====================================================== */

  const remainingMissionCount =
    missions.filter(
      mission =>
        !mission.completed
    ).length;

  /* ======================================================
     Nearby Mission
  ====================================================== */

  const nearbyMission =
    missions.find(
      mission => {
        if (
          mission.completed
        ) {
          return false;
        }

        const distance =
          getDistance(
            position,
            {
              x:
                mission.x,

              y:
                mission.y,
            }
          );

        return (
          distance <=
          INTERACTION_DISTANCE
        );
      }
    ) ?? null;

  /* ======================================================
     GameMapOverlay용 Mission 변환

     GameMapOverlay는
     name 필드를 사용하고 있기 때문에
     title → name 으로 변환
  ====================================================== */

  const mapMissions:
    MissionMarker[] =
    missions.map(
      mission => ({
        id:
          mission.id,

        name:
          mission.title,

        x:
          mission.x,

        y:
          mission.y,

        completed:
          mission.completed,
      })
    );

  /* ======================================================
     Stop Movement
  ====================================================== */

  const stopMovement =
    () => {
      targetPositionRef.current =
        null;

      lastFrameTimeRef.current =
        null;

      if (
        animationFrameRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animationFrameRef.current
        );

        animationFrameRef.current =
          null;
      }

      setMoving(
        false
      );
    };

  /* ======================================================
     Movement Animation

     CSS transition이 아니라
     requestAnimationFrame으로 실제 좌표를
     조금씩 이동시킨다.
  ====================================================== */

  const animateMovement = (
    timestamp: number
  ) => {
    const target =
      targetPositionRef.current;

    if (!target) {
      stopMovement();

      return;
    }

    const current =
      positionRef.current;

    /* =====================================
       첫 프레임
    ===================================== */

    if (
      lastFrameTimeRef.current ===
      null
    ) {
      lastFrameTimeRef.current =
        timestamp;

      animationFrameRef.current =
        requestAnimationFrame(
          animateMovement
        );

      return;
    }

    /* =====================================
       Delta Time
    ===================================== */

    const deltaTime =
      Math.min(
        40,

        timestamp -
          lastFrameTimeRef.current
      ) /
      1000;

    lastFrameTimeRef.current =
      timestamp;

    /* =====================================
       목표까지 거리
    ===================================== */

    const dx =
      target.x -
      current.x;

    const dy =
      target.y -
      current.y;

    const distance =
      Math.sqrt(
        dx * dx +
          dy * dy
      );

    /* =====================================
       도착
    ===================================== */

    if (
      distance <=
      ARRIVAL_DISTANCE
    ) {
      const finalPosition = {
        x:
          target.x,

        y:
          target.y,
      };

      positionRef.current =
        finalPosition;

      setPosition(
        finalPosition
      );

      stopMovement();

      return;
    }

    /* =====================================
       이번 프레임 이동거리
    ===================================== */

    const moveDistance =
      Math.min(
        PLAYER_SPEED *
          deltaTime,

        distance
      );

    const directionX =
      dx /
      distance;

    const directionY =
      dy /
      distance;

    const nextX =
      current.x +
      directionX *
        moveDistance;

    const nextY =
      current.y +
      directionY *
        moveDistance;

    /* =====================================
       이동 가능 영역 체크
    ===================================== */

    if (
      !isWalkable(
        nextX,
        nextY
      )
    ) {
      stopMovement();

      return;
    }

    /* =====================================
       Position Update
    ===================================== */

    const nextPosition = {
      x:
        nextX,

      y:
        nextY,
    };

    positionRef.current =
      nextPosition;

    setPosition(
      nextPosition
    );

    /* =====================================
       Next Frame
    ===================================== */

    animationFrameRef.current =
      requestAnimationFrame(
        animateMovement
      );
  };

  /* ======================================================
     Move To
  ====================================================== */

  const moveTo = (
    targetX: number,
    targetY: number
  ) => {
    /*
     * 미션 중에는 이동 금지
     */
    if (
      activeMission
    ) {
      return;
    }

    /*
     * 지도 열려 있을 때 이동 금지
     */
    if (
      mapOpen
    ) {
      return;
    }

    const current =
      positionRef.current;

    /* =====================================
       목표점이 이동 가능한 위치인가?
    ===================================== */

    if (
      !isWalkable(
        targetX,
        targetY
      )
    ) {
      return;
    }

    /* =====================================
       현재 위치 → 목표 위치 경로 체크
    ===================================== */

    if (
      !isPathWalkable(
        current.x,
        current.y,
        targetX,
        targetY
      )
    ) {
      return;
    }

    const dx =
      targetX -
      current.x;

    const dy =
      targetY -
      current.y;

    const distance =
      Math.sqrt(
        dx * dx +
          dy * dy
      );

    if (
      distance <
      ARRIVAL_DISTANCE
    ) {
      return;
    }

    /* =====================================
       이전 애니메이션 취소
    ===================================== */

    if (
      animationFrameRef.current !==
      null
    ) {
      cancelAnimationFrame(
        animationFrameRef.current
      );

      animationFrameRef.current =
        null;
    }

    /* =====================================
       새로운 목적지
    ===================================== */

    targetPositionRef.current = {
      x:
        targetX,

      y:
        targetY,
    };

    lastFrameTimeRef.current =
      null;

    setMoving(
      true
    );

    animationFrameRef.current =
      requestAnimationFrame(
        animateMovement
      );
  };

  /* ======================================================
     Mission Complete
  ====================================================== */

  const completeMission = (
    missionId: string
  ) => {
    setMissions(
      previous =>
        previous.map(
          mission =>
            mission.id ===
            missionId
              ? {
                  ...mission,

                  completed:
                    true,
                }
              : mission
        )
    );

    setActiveMission(
      null
    );
  };

  /* ======================================================
     Mission Start
  ====================================================== */

  const startMission =
    () => {
      if (
        !nearbyMission
      ) {
        return;
      }

      /*
       * 플레이어 이동 중이면
       * 미션 시작하면서 정지
       */
      stopMovement();

      setActiveMission(
        nearbyMission
      );
    };

  /* ======================================================
     Reset Missions

     개발 테스트용
  ====================================================== */

  const resetMissions =
    () => {
      setMissions(
        INITIAL_MISSIONS.map(
          mission => ({
            ...mission,

            completed:
              false,
          })
        )
      );

      setActiveMission(
        null
      );
    };

/* ======================================================
   Keyboard
====================================================== */

useEffect(() => {
  const handleKeyDown = (
    event: KeyboardEvent
  ) => {
    const target =
      event.target as HTMLElement;

    /*
     * input/select 사용 중에는
     * 게임 단축키 막기
     */
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT"
    ) {
      return;
    }

    /* =====================================
       미션 창이 열려 있을 때
    ===================================== */

    if (activeMission) {
      if (
        event.code === "Escape"
      ) {
        setActiveMission(
          null
        );
      }

      return;
    }

    /* =====================================
       E = 미션 실행

       event.key가 아니라
       물리 키 위치인 event.code 사용
    ===================================== */

    if (
      event.code === "KeyE"
    ) {
      event.preventDefault();

      if (
        nearbyMission
      ) {
        stopMovement();

        setActiveMission(
          nearbyMission
        );
      }

      return;
    }

    /* =====================================
       M = 지도
    ===================================== */

    if (
      event.code === "KeyM"
    ) {
      event.preventDefault();

      setMapOpen(
        previous =>
          !previous
      );

      return;
    }

    /* =====================================
       ESC
    ===================================== */

    if (
      event.code === "Escape"
    ) {
      setMapOpen(
        false
      );

      return;
    }

    /* =====================================
       B = 정전 테스트
    ===================================== */

    if (
      event.code === "KeyB"
    ) {
      setBlackout(
        previous =>
          !previous
      );

      return;
    }

    /* =====================================
       R = 미션 초기화
    ===================================== */

    if (
      event.code === "KeyR"
    ) {
      resetMissions();
    }
  };

  window.addEventListener(
    "keydown",
    handleKeyDown
  );

  return () => {
    window.removeEventListener(
      "keydown",
      handleKeyDown
    );
  };
}, [
  activeMission,
  nearbyMission,
]);

  /* ======================================================
     Camera

     맵 가장자리에서는 카메라가 멈추고
     플레이어가 화면 가장자리 쪽으로 이동한다.
  ====================================================== */

  const cameraX =
    clamp(
      position.x -
        VIEWPORT_WIDTH /
          2,

      0,

      DEVIL_MAP_WIDTH -
        VIEWPORT_WIDTH
    );

  const cameraY =
    clamp(
      position.y -
        VIEWPORT_HEIGHT /
          2,

      0,

      DEVIL_MAP_HEIGHT -
        VIEWPORT_HEIGHT
    );

  /* ======================================================
     Player Screen Position
  ====================================================== */

  const playerScreenX =
    position.x -
    cameraX;

  const playerScreenY =
    position.y -
    cameraY;

  /* ======================================================
     World Click
  ====================================================== */

  const handleWorldClick = (
    event:
      React.MouseEvent<HTMLDivElement>
  ) => {
    /*
     * 미션 중 이동 금지
     */
    if (
      activeMission
    ) {
      return;
    }

    /*
     * 지도 열려 있을 때 이동 금지
     */
    if (
      mapOpen
    ) {
      return;
    }

    const targetElement =
      event.target as HTMLElement;

    /*
     * 버튼/HUD 등을 클릭했을 때
     * 캐릭터 이동 방지
     */
    if (
      targetElement.closest(
        "[data-no-move]"
      )
    ) {
      return;
    }

    const viewport =
      viewportRef.current;

    if (!viewport) {
      return;
    }

    const rect =
      viewport.getBoundingClientRect();

    /* =====================================
       화면 클릭 좌표
    ===================================== */

    const clickX =
      event.clientX -
      rect.left;

    const clickY =
      event.clientY -
      rect.top;

    /* =====================================
       화면 → 월드 좌표
    ===================================== */

    const targetX =
      cameraX +
      clickX;

    const targetY =
      cameraY +
      clickY;

    moveTo(
      targetX,
      targetY
    );
  };

  /* ======================================================
     Cleanup
  ====================================================== */

  useEffect(() => {
    return () => {
      if (
        animationFrameRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animationFrameRef.current
        );
      }
    };
  }, []);

  /* ======================================================
     Render
  ====================================================== */

  return (
    <div
      className="
        flex
        min-h-screen
        items-center
        justify-center
        bg-zinc-950
        p-4
      "
    >
      {/* =================================================
          Viewport
      ================================================= */}

      <div
        ref={
          viewportRef
        }
        onClick={
          handleWorldClick
        }
        className="
          relative
          cursor-pointer
          overflow-hidden
          rounded-xl
          border-[6px]
          border-zinc-800
          bg-black
          shadow-2xl
        "
        style={{
          width:
            VIEWPORT_WIDTH,

          height:
            VIEWPORT_HEIGHT,
        }}
      >
        {/* =============================================
            World
        ============================================= */}

        <div
          className="
            absolute
            left-0
            top-0
          "
          style={{
            width:
              DEVIL_MAP_WIDTH,

            height:
              DEVIL_MAP_HEIGHT,

            transform:
              `translate3d(
                ${-cameraX}px,
                ${-cameraY}px,
                0
              )`,

            willChange:
              "transform",
          }}
        >
          {/* =========================================
              Office Map
          ========================================= */}

          <DevilOfficeMap />

          {/* =========================================
              Mission Markers

              실제 게임에서는 나중에
              복사기/서버/전력패널 등에
              직접 빛을 표시하는 방식으로
              변경하면 됨.
          ========================================= */}

          {missions.map(
            mission => {
              if (
                mission.completed
              ) {
                return null;
              }

              return (
                <div
                  key={
                    mission.id
                  }
                  className="
                    pointer-events-none
                    absolute
                    z-[200]
                    flex
                    flex-col
                    items-center
                  "
                  style={{
                    left:
                      mission.x,

                    top:
                      mission.y,

                    transform:
                      "translate(-50%, -50%)",
                  }}
                >
                  {/* 빛 */}

                  <div
                    className="
                      flex
                      h-7
                      w-7
                      items-center
                      justify-center
                      rounded-full
                      border-2
                      border-amber-100
                      bg-amber-400
                      text-[13px]
                      font-black
                      text-zinc-900
                      shadow-[0_0_18px_rgba(251,191,36,0.85)]
                    "
                  >
                    !
                  </div>

                  {/* 미션 이름 */}

                  <div
                    className="
                      mt-1
                      whitespace-nowrap
                      rounded-md
                      bg-black/75
                      px-2
                      py-1
                      text-[9px]
                      font-bold
                      text-white
                    "
                  >
                    {
                      mission.title
                    }
                  </div>
                </div>
              );
            }
          )}
        </div>

        {/* =============================================
            Player
        ============================================= */}

        <div
          className="
            pointer-events-none
            absolute
            z-[5000]
          "
          style={{
            left:
              playerScreenX,

            top:
              playerScreenY,

            transform:
              "translate(-50%, -100%)",

            willChange:
              "left, top",
          }}
        >
          <Potato
            name="테스트 감자"
            glasses="sunglasses"
            moving={
              moving
            }
          />
        </div>

        {/* =============================================
            Blackout
        ============================================= */}

        {blackout && (
          <div
            className="
              pointer-events-none
              absolute
              inset-0
              z-[7000]
            "
            style={{
              background: `
                radial-gradient(
                  circle 210px
                  at ${playerScreenX}px ${playerScreenY}px,

                  rgba(0,0,0,0) 0px,

                  rgba(0,0,0,0.03) 90px,

                  rgba(0,0,0,0.18) 125px,

                  rgba(0,0,0,0.62) 165px,

                  rgba(0,0,0,0.95) 210px,

                  rgba(0,0,0,1) 270px
                )
              `,
            }}
          />
        )}

        {/* =============================================
            Game Status
        ============================================= */}

        <div
          data-no-move
          className="
            absolute
            left-4
            top-4
            z-[8000]
            min-w-[150px]
            rounded-xl
            border
            border-white/10
            bg-black/75
            px-4
            py-3
            text-white
            shadow-lg
            backdrop-blur-sm
          "
        >
          {/* =====================================
              Role
          ===================================== */}

          <div
            className={`
              text-[12px]
              font-black

              ${
                role ===
                "devil"
                  ? "text-red-400"
                  : "text-emerald-400"
              }
            `}
          >
            {role ===
            "devil"
              ? "😈 악마 감자"
              : "🥔 생존 감자"}
          </div>

          {/* =====================================
              Missions
          ===================================== */}

          <div
            className="
              mt-2
              text-[9px]
              font-semibold
              text-amber-300
            "
          >
            남은 미션{" "}
            {
              remainingMissionCount
            }
            개
          </div>
        </div>

        {/* =============================================
            Mission Interaction 안내
        ============================================= */}

        {nearbyMission &&
          !activeMission &&
          !mapOpen && (
            <div
              data-no-move
              className="
                absolute
                bottom-5
                left-1/2
                z-[8500]
                -translate-x-1/2
                rounded-xl
                border
                border-white/10
                bg-black/85
                px-5
                py-3
                text-[11px]
                font-bold
                text-white
                shadow-xl
                backdrop-blur-sm
              "
            >
              <span
                className="
                  mr-2
                  rounded-md
                  bg-amber-400
                  px-2
                  py-1
                  text-[10px]
                  font-black
                  text-zinc-900
                "
              >
                E
              </span>

              {
                nearbyMission.title
              }

              <span
                className="
                  ml-2
                  text-white/40
                "
              >
                · {
                  nearbyMission.room
                }
              </span>
            </div>
          )}

        {/* =============================================
            Blackout Alert
        ============================================= */}

        {blackout && (
          <div
            data-no-move
            className="
              absolute
              left-1/2
              top-5
              z-[9000]
              -translate-x-1/2
              rounded-full
              border
              border-red-400/20
              bg-red-950/90
              px-5
              py-2
              text-[11px]
              font-bold
              text-red-200
              shadow-lg
            "
          >
            ⚡ 정전 발생
          </div>
        )}

        {/* =============================================
            Controls
        ============================================= */}

        <div
          data-no-move
          className="
            absolute
            bottom-4
            right-4
            z-[8000]
            flex
            gap-2
          "
        >
          <Control>
            E : 업무
          </Control>

          <Control>
            M : 지도
          </Control>

          <Control>
            B : 정전
          </Control>

          <Control>
            R : 미션 초기화
          </Control>
        </div>

        {/* =============================================
            Map Overlay
        ============================================= */}

        <GameMapOverlay
          open={
            mapOpen
          }
          playerX={
            position.x
          }
          playerY={
            position.y
          }
          missions={
            mapMissions
          }
          blackout={
            blackout
          }
          onClose={() => {
            setMapOpen(
              false
            );
          }}
        />
      </div>

      {/* =================================================
          Mission Modal

          Viewport 바깥에 두기 때문에
          viewport overflow-hidden 영향을 받지 않음.
      ================================================= */}

      <MissionModal
        mission={
          activeMission
        }
        onClose={() => {
          setActiveMission(
            null
          );
        }}
        onComplete={
          completeMission
        }
      />
    </div>
  );
}

/* =========================================================
   Control
========================================================= */

function Control({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <div
      className="
        rounded-lg
        border
        border-white/5
        bg-black/75
        px-3
        py-2
        text-[10px]
        text-white
      "
    >
      {children}
    </div>
  );
}