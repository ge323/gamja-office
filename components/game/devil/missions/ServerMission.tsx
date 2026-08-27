"use client";

import {
  useMemo,
  useState,
} from "react";

/* =========================================================
   Types
========================================================= */

type Props = {
  onComplete:
    () => void;
};

type ServerId =
  | "SRV-01"
  | "SRV-02"
  | "SRV-03"
  | "SRV-04"
  | "SRV-05"
  | "SRV-06";

type ServerInfo = {
  id:
    ServerId;

  service:
    string;

  normalLog:
    string;

  errorLog:
    string;
};

/* =========================================================
   Server Data
========================================================= */

const SERVERS:
  ServerInfo[] = [
  {
    id:
      "SRV-01",

    service:
      "인사 시스템",

    normalLog:
      "HR SERVICE HEALTHY",

    errorLog:
      "HR DATABASE CONNECTION TIMEOUT",
  },

  {
    id:
      "SRV-02",

    service:
      "그룹웨어",

    normalLog:
      "GROUPWARE STATUS OK",

    errorLog:
      "SESSION SERVICE NOT RESPONDING",
  },

  {
    id:
      "SRV-03",

    service:
      "메일 서버",

    normalLog:
      "MAIL QUEUE NORMAL",

    errorLog:
      "SMTP QUEUE OVERFLOW",
  },

  {
    id:
      "SRV-04",

    service:
      "파일 서버",

    normalLog:
      "STORAGE ONLINE",

    errorLog:
      "DISK I/O FAILURE DETECTED",
  },

  {
    id:
      "SRV-05",

    service:
      "업무 포털",

    normalLog:
      "PORTAL SERVICE RUNNING",

    errorLog:
      "APPLICATION PROCESS CRASHED",
  },

  {
    id:
      "SRV-06",

    service:
      "백업 서버",

    normalLog:
      "BACKUP SCHEDULE ACTIVE",

    errorLog:
      "BACKUP DAEMON STOPPED",
  },
];

/* =========================================================
   ServerMission
========================================================= */

export default function ServerMission({
  onComplete,
}: Props) {
  /* =======================================================
     Random Broken Server
  ======================================================= */

  const brokenServer =
    useMemo(
      () => {
        const randomIndex =
          Math.floor(
            Math.random() *
              SERVERS.length
          );

        return SERVERS[
          randomIndex
        ];
      },
      []
    );

  /* =======================================================
     State
  ======================================================= */

  const [
    selectedServer,
    setSelectedServer,
  ] =
    useState<
      ServerId | null
    >(
      null
    );

  const [
    message,
    setMessage,
  ] =
    useState(
      "장애 로그를 확인하고 문제가 발생한 서버를 선택해주세요."
    );

  const [
    wrongServer,
    setWrongServer,
  ] =
    useState<
      ServerId | null
    >(
      null
    );

  const [
    rebooting,
    setRebooting,
  ] =
    useState(false);

  const [
    rebootProgress,
    setRebootProgress,
  ] =
    useState(0);

  const [
    success,
    setSuccess,
  ] =
    useState(false);

  /* =======================================================
     Select Server
  ======================================================= */

  function handleSelectServer(
    serverId:
      ServerId
  ) {
    if (
      success ||
      rebooting
    ) {
      return;
    }

    setSelectedServer(
      serverId
    );

    setWrongServer(
      null
    );

    setMessage(
      `${serverId} 선택됨. 로그와 일치하는지 확인해주세요.`
    );
  }

  /* =======================================================
     Reboot
  ======================================================= */

  function handleReboot() {
    if (
      !selectedServer ||
      success ||
      rebooting
    ) {
      return;
    }

    /* =====================================
       Wrong Server
    ===================================== */

    if (
      selectedServer !==
      brokenServer.id
    ) {
      setWrongServer(
        selectedServer
      );

      setMessage(
        "⚠️ 선택한 서버에서는 장애가 확인되지 않습니다."
      );

      window.setTimeout(
        () => {
          setWrongServer(
            null
          );
        },
        600
      );

      return;
    }

    /* =====================================
       Start Reboot
    ===================================== */

    setRebooting(
      true
    );

    setMessage(
      `${selectedServer} 재부팅 중...`
    );

    let progress =
      0;

    const timer =
      window.setInterval(
        () => {
          progress +=
            10;

          setRebootProgress(
            progress
          );

          if (
            progress >=
            100
          ) {
            window.clearInterval(
              timer
            );

            setRebooting(
              false
            );

            setSuccess(
              true
            );

            setMessage(
              "✅ 서버가 정상적으로 복구되었습니다!"
            );

            window.setTimeout(
              () => {
                onComplete();
              },
              1200
            );
          }
        },
        120
      );
  }

  /* =======================================================
     Render
  ======================================================= */

  return (
    <div
      className="
        w-full
      "
    >
      {/* =================================================
          Log Console
      ================================================= */}

      <div
        className="
          overflow-hidden

          rounded-2xl

          border-[5px]
          border-zinc-800

          bg-[#16191d]

          shadow-xl
        "
      >
        {/* Header */}

        <div
          className="
            flex

            items-center
            justify-between

            border-b
            border-white/10

            bg-[#25292f]

            px-5
            py-4
          "
        >
          <div>
            <div
              className="
                text-[9px]
                font-black

                tracking-[0.16em]

                text-white/30
              "
            >
              GAMJA OFFICE
              INFRASTRUCTURE
            </div>

            <div
              className="
                mt-1

                text-[15px]
                font-black

                text-white
              "
            >
              🖥 SERVER MONITOR
            </div>
          </div>

          <div
            className={`
              flex
              items-center
              gap-2

              rounded-full

              px-3
              py-1.5

              text-[9px]
              font-black

              ${
                success
                  ? `
                    bg-emerald-500/15
                    text-emerald-300
                  `
                  : `
                    bg-red-500/15
                    text-red-300
                  `
              }
            `}
          >
            <div
              className={`
                h-2
                w-2

                rounded-full

                ${
                  success
                    ? "bg-emerald-400"
                    : "bg-red-400 animate-pulse"
                }
              `}
            />

            {success
              ? "ALL SYSTEMS NORMAL"
              : "INCIDENT DETECTED"}
          </div>
        </div>

        {/* =================================================
            Incident Log
        ================================================= */}

        <div
          className="
            border-b
            border-white/10

            bg-black

            px-5
            py-4

            font-mono
          "
        >
          <div
            className="
              text-[9px]
              font-bold

              text-emerald-400/60
            "
          >
            $ systemctl status
          </div>

          <div
            className="
              mt-3

              space-y-1

              text-[10px]
              leading-5
            "
          >
            <div
              className="
                text-white/35
              "
            >
              [INFO] Monitoring
              6 production servers...
            </div>

            <div
              className="
                text-white/35
              "
            >
              [INFO] Routine health check started
            </div>

            <div
              className="
                text-red-400
                font-bold
              "
            >
              [ERROR]{" "}
              {
                brokenServer.errorLog
              }
            </div>

            <div
              className="
                text-amber-300
              "
            >
              [WARN] Manual intervention required
            </div>
          </div>
        </div>

        {/* =================================================
            Server Racks
        ================================================= */}

        <div
          className="
            p-5
          "
        >
          <div
            className="
              mb-3

              flex
              items-end
              justify-between
            "
          >
            <div>
              <div
                className="
                  text-[9px]
                  font-black

                  tracking-[0.12em]

                  text-white/25
                "
              >
                SERVER RACK
              </div>

              <div
                className="
                  mt-1

                  text-[11px]
                  font-bold

                  text-white/55
                "
              >
                장애가 발생한 서버를 선택하세요.
              </div>
            </div>
          </div>

          <div
            className="
              grid

              grid-cols-2

              gap-3

              sm:grid-cols-3
            "
          >
            {SERVERS.map(
              server => {
                const selected =
                  selectedServer ===
                  server.id;

                const wrong =
                  wrongServer ===
                  server.id;

                const broken =
                  success &&
                  server.id ===
                    brokenServer.id;

                return (
                  <button
                    key={
                      server.id
                    }
                    type="button"
                    disabled={
                      success ||
                      rebooting
                    }
                    onClick={() =>
                      handleSelectServer(
                        server.id
                      )
                    }
                    className={`
                      relative

                      overflow-hidden

                      rounded-xl

                      border-2

                      bg-[#252a30]

                      p-3

                      text-left

                      transition

                      active:scale-[0.98]

                      ${
                        wrong
                          ? `
                            border-red-500
                            bg-red-500/15
                          `
                          : broken
                            ? `
                              border-emerald-500
                              bg-emerald-500/10
                            `
                            : selected
                              ? `
                                border-white
                                bg-white/10
                              `
                              : `
                                border-white/10

                                hover:bg-white/5
                              `
                      }

                      disabled:cursor-default
                    `}
                  >
                    {/* Rack top */}

                    <div
                      className="
                        flex

                        items-center
                        justify-between
                      "
                    >
                      <div
                        className="
                          text-[11px]
                          font-black

                          text-white
                        "
                      >
                        {
                          server.id
                        }
                      </div>

                      <div
                        className={`
                          h-2
                          w-2

                          rounded-full

                          ${
                            broken
                              ? "bg-emerald-400"
                              : selected
                                ? "bg-amber-400 animate-pulse"
                                : "bg-emerald-400"
                          }
                        `}
                      />
                    </div>

                    <div
                      className="
                        mt-1

                        text-[8px]
                        font-semibold

                        text-white/35
                      "
                    >
                      {
                        server.service
                      }
                    </div>

                    {/* Rack Slots */}

                    <div
                      className="
                        mt-3

                        space-y-1
                      "
                    >
                      {Array.from({
                        length: 4,
                      }).map(
                        (
                          _,
                          index
                        ) => (
                          <div
                            key={
                              index
                            }
                            className="
                              flex

                              h-3

                              items-center

                              rounded-sm

                              bg-black/40

                              px-1.5
                            "
                          >
                            <div
                              className="
                                h-1
                                w-1

                                rounded-full

                                bg-emerald-400/70
                              "
                            />

                            <div
                              className="
                                ml-auto

                                h-[2px]
                                w-8

                                bg-white/10
                              "
                            />
                          </div>
                        )
                      )}
                    </div>
                  </button>
                );
              }
            )}
          </div>

          {/* =================================================
              Selected Server
          ================================================= */}

          <div
            className="
              mt-5

              rounded-xl

              border
              border-white/10

              bg-black/30

              p-4
            "
          >
            {!selectedServer ? (
              <div
                className="
                  py-4

                  text-center

                  text-[10px]

                  text-white/35
                "
              >
                서버를 선택하면 상세 상태가 표시됩니다.
              </div>
            ) : (
              <>
                {(() => {
                  const server =
                    SERVERS.find(
                      item =>
                        item.id ===
                        selectedServer
                    );

                  if (!server) {
                    return null;
                  }

                  return (
                    <>
                      <div
                        className="
                          flex

                          items-start
                          justify-between

                          gap-4
                        "
                      >
                        <div>
                          <div
                            className="
                              text-[9px]
                              font-black

                              tracking-[0.12em]

                              text-white/25
                            "
                          >
                            SELECTED SERVER
                          </div>

                          <div
                            className="
                              mt-1

                              text-[14px]
                              font-black

                              text-white
                            "
                          >
                            {
                              server.id
                            }{" "}
                            ·{" "}
                            {
                              server.service
                            }
                          </div>
                        </div>

                        <div
                          className="
                            rounded-md

                            bg-white/5

                            px-2
                            py-1

                            text-[8px]
                            font-bold

                            text-white/40
                          "
                        >
                          PROD
                        </div>
                      </div>

                      <div
                        className="
                          mt-3

                          rounded-lg

                          bg-black

                          p-3

                          font-mono

                          text-[9px]
                          leading-5
                        "
                      >
                        <div
                          className="
                            text-white/25
                          "
                        >
                          &gt; healthcheck
                        </div>

                        <div
                          className={
                            selectedServer ===
                            brokenServer.id
                              ? "text-red-400"
                              : "text-emerald-400"
                          }
                        >
                          {selectedServer ===
                          brokenServer.id
                            ? brokenServer.errorLog
                            : server.normalLog}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </>
            )}
          </div>

          {/* =================================================
              Reboot
          ================================================= */}

          {rebooting && (
            <div
              className="
                mt-4

                rounded-xl

                border
                border-blue-400/20

                bg-blue-400/10

                p-4
              "
            >
              <div
                className="
                  flex

                  items-center
                  justify-between

                  text-[10px]
                  font-bold

                  text-blue-200
                "
              >
                <span>
                  SERVER REBOOT
                </span>

                <span>
                  {
                    rebootProgress
                  }%
                </span>
              </div>

              <div
                className="
                  mt-3

                  h-2

                  overflow-hidden

                  rounded-full

                  bg-black/30
                "
              >
                <div
                  className="
                    h-full

                    rounded-full

                    bg-blue-400

                    transition-all
                    duration-100
                  "
                  style={{
                    width:
                      `${rebootProgress}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* =================================================
              Message
          ================================================= */}

          <div
            className="
              mt-4

              min-h-[22px]

              text-center

              text-[10px]
              font-bold
            "
          >
            <span
              className={
                success
                  ? "text-emerald-400"
                  : message.includes(
                        "장애가 확인되지"
                      )
                    ? "text-red-400"
                    : "text-white/55"
              }
            >
              {
                message
              }
            </span>
          </div>

          {/* =================================================
              Action
          ================================================= */}

          <button
            type="button"
            disabled={
              !selectedServer ||
              success ||
              rebooting
            }
            onClick={
              handleReboot
            }
            className="
              mt-2

              w-full

              rounded-xl

              bg-white

              py-3

              text-[11px]
              font-black

              text-black

              transition

              enabled:hover:bg-emerald-100

              disabled:cursor-not-allowed
              disabled:opacity-30
            "
          >
            {rebooting
              ? "재부팅 중..."
              : success
                ? "서버 복구 완료"
                : "선택 서버 재부팅"}
          </button>
        </div>
      </div>

      {/* =================================================
          Instruction
      ================================================= */}

      {!success && (
        <div
          className="
            mt-4

            rounded-lg

            bg-black/5

            px-4
            py-3

            text-center

            text-[9px]
            font-semibold
            leading-4

            text-black/40
          "
        >
          상단 장애 로그를 확인한 뒤 서버를 선택하세요.
          선택한 서버의 상세 로그를 확인하고
          <strong className="mx-1 text-black/60">
            장애 서버만 재부팅
          </strong>
          해야 합니다.
        </div>
      )}
    </div>
  );
}