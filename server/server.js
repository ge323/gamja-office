const express = require("express");
const http = require("http");

const {
  Server,
} = require("socket.io");

/* =========================================================
   Express / HTTP
========================================================= */

const app = express();

const server =
  http.createServer(app);

/* =========================================================
   Socket.IO
========================================================= */

const io = new Server(
  server,
  {
    cors: {
      origin: "*",

      methods: [
        "GET",
        "POST",
      ],
    },
  }
);

/* =========================================================
   Port
========================================================= */

const PORT =
  process.env.PORT ||
  4000;

/* =========================================================
   Main Office
========================================================= */

const players = {};

const chatHistory = [];

const MAX_CHAT_HISTORY =
  50;

/* =========================================================
   Devil Game Rooms
========================================================= */

const devilRooms = {};

/* =========================================================
   Devil Game Constants
========================================================= */

const DEVIL_GAME_MIN_PLAYERS =
  3;

const DEVIL_GAME_DEFAULT_MAX_PLAYERS =
  6;

const DEVIL_GAME_MAX_PLAYERS =
  6;

/*
 * 방장이 시작을 누른 뒤
 * 실제 게임으로 전환되기까지의 시간.
 */
const POTATO_WAR_START_COUNTDOWN_MS =
  8_000;

/*
 * 테스트용 처치 쿨타임.
 */
const POTATO_WAR_KILL_COOLDOWN_MS =
  5_000;

/*
 * 페이지 전환 중 Socket이 잠깐 끊어지는 것을
 * 허용하기 위한 재접속 유예시간.
 */
const POTATO_WAR_RECONNECT_GRACE_MS =
  15_000;

/*
 * 악마 공격 가능 거리.
 */
const POTATO_WAR_KILL_RANGE =
  135;

/*
 * 맵 크기.
 */
const POTATO_WAR_MAP_WIDTH =
  2200;

const POTATO_WAR_MAP_HEIGHT =
  1400;

/* =========================================================
   Emergency Meeting Constants
========================================================= */

/*
 * 시체 신고 가능 거리.
 */
const POTATO_WAR_REPORT_DISTANCE =
  150;

/*
 * 토론 시간.
 */
const POTATO_WAR_DISCUSSION_MS =
  30_000;

/*
 * 투표 시간.
 */
const POTATO_WAR_VOTING_MS =
  20_000;

/*
 * 투표 결과 표시 시간.
 */
const POTATO_WAR_VOTE_RESULT_MS =
  3_000;

/*
 * 수동 긴급회의는 한 플레이어당 게임 중 1회.
 */
const POTATO_WAR_EMERGENCY_MEETING_LIMIT =
  1;

/*
 * 중앙 회의 테이블 근처에서만 수동 긴급회의 사용 가능.
 */
const POTATO_WAR_EMERGENCY_MEETING_DISTANCE =
  190;

const POTATO_WAR_EMERGENCY_MEETING_POSITION = {
  x: 1100,
  y: 700,
};

/* =========================================================
   Spawn Points
========================================================= */

const POTATO_WAR_SPAWN_POINTS = [
  {
    id: "power",
    x: 330,
    y: 240,
  },

  {
    id: "lounge",
    x: 1100,
    y: 220,
  },

  {
    id: "cctv",
    x: 1880,
    y: 240,
  },

  {
    id: "archive",
    x: 300,
    y: 680,
  },

  {
    id: "pantry",
    x: 1850,
    y: 680,
  },

  {
    id: "meeting",
    x: 1100,
    y: 1150,
  },
];

/* =========================================================
   Personal Missions
========================================================= */

const POTATO_WAR_MISSION_IDS = [
  "copy-01",
  "archive-01",
  "coffee-01",
  "email-01",
  "meeting-01",
  "power-01",
  "server-01",
];

const POTATO_WAR_MISSIONS_PER_PLAYER =
  3;

/* =========================================================
   Helpers
========================================================= */

function createId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function addChatMessage(
  message
) {
  chatHistory.push(
    message
  );

  if (
    chatHistory.length >
    MAX_CHAT_HISTORY
  ) {
    chatHistory.shift();
  }
}

function shuffleArray(
  array
) {
  const copied =
    [...array];

  for (
    let index =
      copied.length - 1;
    index > 0;
    index -= 1
  ) {
    const randomIndex =
      Math.floor(
        Math.random() *
          (index + 1)
      );

    [
      copied[index],
      copied[randomIndex],
    ] = [
      copied[randomIndex],
      copied[index],
    ];
  }

  return copied;
}

function getDistance(
  a,
  b
) {
  const dx =
    a.x - b.x;

  const dy =
    a.y - b.y;

  return Math.sqrt(
    dx * dx +
      dy * dy
  );
}

/* =========================================================
   Room Code
========================================================= */

function createRoomCode() {
  let roomId;

  do {
    const number =
      Math.floor(
        1000 +
          Math.random() *
            9000
      );

    roomId =
      `GAMJA-${number}`;
  } while (
    devilRooms[roomId]
  );

  return roomId;
}

/* =========================================================
   Socket Room Name
========================================================= */

function getSocketRoomName(
  roomId
) {
  return `devil:${roomId}`;
}

/* =========================================================
   Find Lobby Room
========================================================= */

function findPlayerRoom(
  socketId
) {
  return Object.values(
    devilRooms
  ).find(
    room =>
      Array.isArray(
        room.players
      ) &&
      room.players.includes(
        socketId
      )
  );
}

/* =========================================================
   Lobby Player
========================================================= */

function getPublicRoomPlayer(
  socketId
) {
  const player =
    players[socketId];

  if (!player) {
    return null;
  }

  return {
    id:
      player.id,

    nickname:
      player.nickname,

    characterStyle:
      player.characterStyle,
  };
}

/* =========================================================
   Public Lobby Room
========================================================= */

function getPublicRoom(
  room
) {
  if (!room) {
    return null;
  }

  return {
    id:
      room.id,

    hostId:
      room.hostId,

    status:
      room.status,

    maxPlayers:
      room.maxPlayers,

    countdownEndsAt:
      room.countdownEndsAt ??
      null,

    players:
      room.players
        .map(
          socketId => {
            const player =
              getPublicRoomPlayer(
                socketId
              );

            if (!player) {
              return null;
            }

            return {
              ...player,

              ready:
                Boolean(
                  room.ready?.[
                    socketId
                  ]
                ),
            };
          }
        )
        .filter(Boolean),
  };
}

function getPublicRooms() {
  return Object.values(
    devilRooms
  )
    .map(getPublicRoom)
    .filter(Boolean);
}

/* =========================================================
   Public Office Players

   감자전쟁이 실제로 진행 중인 플레이어는
   일반 사무실 플레이어 목록에서 제외한다.

   대기실(waiting/countdown) 참가자는 사무실에 보여도 되지만,
   room.status === "playing" 인 순간부터 사무실에서는 숨긴다.
========================================================= */

function getPublicOfficePlayers() {
  return Object.values(
    players
  ).filter(
    player => {
      const isPlaying =
        Object.values(
          devilRooms
        ).some(
          room => {
            if (
              room.status !==
                "playing" ||
              !room.gamePlayers
            ) {
              return false;
            }

            /*
             * 게임 시작 당시 고정 playerId와
             * 현재 연결된 Socket ID를 모두 검사한다.
             */
            return Object.values(
              room.gamePlayers
            ).some(
              gamePlayer =>
                gamePlayer.leftGame !==
                  true &&
                (
                  gamePlayer.id ===
                    player.id ||
                  gamePlayer.connectedSocketId ===
                    player.id
                )
            );
          }
        );

      return !isPlaying;
    }
  );
}

/* =========================================================
   Broadcast Lobby
========================================================= */

function broadcastRoomList() {
  io.emit(
    "devilRooms:update",
    getPublicRooms()
  );
}

function broadcastRoomUpdate(
  room
) {
  if (!room) {
    return;
  }

  io
    .to(
      getSocketRoomName(
        room.id
      )
    )
    .emit(
      "devilRoom:update",
      getPublicRoom(room)
    );

  broadcastRoomList();
}

/* =========================================================
   Personal Mission Assignment
========================================================= */

function createPersonalMissions() {
  return shuffleArray(
    POTATO_WAR_MISSION_IDS
  ).slice(
    0,
    POTATO_WAR_MISSIONS_PER_PLAYER
  );
}

/* =========================================================
   Role Assignment
========================================================= */

function assignRoles(
  room
) {
  /*
   * 3~4명 : 악마 1명
   * 5~6명 : 악마 2명
   */

  const devilCount =
    room.players.length >= 5
      ? 2
      : 1;

  const shuffled =
    shuffleArray(
      room.players
    );

  const devilIds =
    new Set(
      shuffled.slice(
        0,
        devilCount
      )
    );

  const roles = {};

  room.players.forEach(
    socketId => {
      roles[socketId] =
        devilIds.has(
          socketId
        )
          ? "devil"
          : "survivor";
    }
  );

  return roles;
}

/* =========================================================
   Game Runtime
========================================================= */

function createGameRuntime(
  room
) {
  room.gamePlayers = {};

  room.corpses = [];

  room.meeting = null;

  const spawnPoints =
    shuffleArray(
      POTATO_WAR_SPAWN_POINTS
    );

  room.players.forEach(
    (
      socketId,
      index
    ) => {
      const officePlayer =
        players[socketId];

      if (!officePlayer) {
        return;
      }

      const spawn =
        spawnPoints[
          index %
            spawnPoints.length
        ];

      const missionIds =
        createPersonalMissions();

      room.gamePlayers[
        socketId
      ] = {
        id:
          socketId,

        connectedSocketId:
          socketId,

        nickname:
          officePlayer.nickname,

        characterStyle:
          officePlayer.characterStyle,

        role:
          room.roles[
            socketId
          ],

        state:
          "alive",

        x:
          spawn.x,

        y:
          spawn.y,

        spawnId:
          spawn.id,

        missionIds,

        completedMissionIds:
          [],

        lastKillAt:
          0,

        /*
         * 수동 긴급회의 사용 횟수.
         */
        emergencyMeetingUses:
          0,

        leftGame:
          false,

        returnedToOffice:
          false,
      };

      console.log(
        "🎯 미션 배정:",
        officePlayer.nickname,
        missionIds
      );
    }
  );
}
/* =========================================================
   Public Game Player
========================================================= */

function getPublicGamePlayer(
  gamePlayer
) {
  if (!gamePlayer) {
    return null;
  }

  return {
    id:
      gamePlayer.id,

    nickname:
      gamePlayer.nickname,

    characterStyle:
      gamePlayer.characterStyle,

    state:
      gamePlayer.state,

    x:
      gamePlayer.x,

    y:
      gamePlayer.y,

    moving:
      Boolean(
        gamePlayer.moving
      ),
  };
}

/* =========================================================
   Public Meeting
========================================================= */

function getPublicMeeting(
  room
) {
  const meeting =
    room?.meeting;

  if (
    !meeting ||
    !meeting.active
  ) {
    return null;
  }

  return {
    id:
      meeting.id,

    active:
      true,

    kind:
      meeting.kind ??
      "corpse",

    phase:
      meeting.phase,

    reporterId:
      meeting.reporterId,

    reporterNickname:
      meeting.reporterNickname,

    corpseId:
      meeting.corpseId,

    victimId:
      meeting.victimId,

    victimNickname:
      meeting.victimNickname,

    startedAt:
      meeting.startedAt,

    phaseEndsAt:
      meeting.phaseEndsAt,

    messages:
      meeting.messages ??
      [],

    votedPlayerIds:
      Object.keys(
        meeting.votes ??
          {}
      ),
  };
}

/* =========================================================
   Survivor Mission Progress

   악마의 미션은 전체 진행도 계산에서 완전히 제외한다.
   죽은 생존자의 미션은 팀 전체 목표에 계속 포함한다.
   유령 상태에서도 남은 미션을 수행할 수 있다.
========================================================= */

function getSurvivorMissionProgress(
  room
) {
  const survivors =
    Object.values(
      room.gamePlayers ??
        {}
    ).filter(
      player =>
        player.role ===
          "survivor" &&
        player.leftGame !==
          true
    );

  const total =
    survivors.reduce(
      (sum, player) =>
        sum +
        (player.missionIds
          ?.length ??
          0),
      0
    );

  const completed =
    survivors.reduce(
      (sum, player) => {
        const assigned =
          new Set(
            player.missionIds ??
              []
          );

        const validCompleted =
          (
            player.completedMissionIds ??
            []
          ).filter(
            missionId =>
              assigned.has(
                missionId
              )
          ).length;

        return (
          sum +
          validCompleted
        );
      },
      0
    );

  const percentage =
    total === 0
      ? 0
      : Math.min(
          100,
          Math.round(
            (completed /
              total) *
              100
          )
        );

  return {
    completed,
    total,
    percentage,
  };
}

/* =========================================================
   Public Game State
========================================================= */

function getPublicGameState(
  room
) {
  return {
    roomId:
      room.id,

    players:
      Object.values(
        room.gamePlayers ??
          {}
      )
        .filter(
          player =>
            player.leftGame !==
            true
        )
        .map(
          getPublicGamePlayer
        )
        .filter(Boolean),

    corpses:
      room.corpses ??
      [],

    /*
     * 생존팀 전체 미션 진행도.
     *
     * 악마에게 배정된 가짜 미션은
     * 이 진행도에 포함되지 않는다.
     */
    missionProgress:
      getSurvivorMissionProgress(
        room
      ),

    meeting:
      getPublicMeeting(
        room
      ),
  };
}

/* =========================================================
   Broadcast Game State
========================================================= */

function broadcastGameState(
  room
) {
  if (!room) {
    return;
  }

  io
    .to(
      getSocketRoomName(
        room.id
      )
    )
    .emit(
      "devilGame:state",
      getPublicGameState(
        room
      )
    );
}

/* =========================================================
   Find Game Room
========================================================= */

function findGameRoomBySocket(
  socketId
) {
  return Object.values(
    devilRooms
  ).find(
    room => {
      if (
        room.status !==
          "playing" ||
        !room.gamePlayers
      ) {
        return false;
      }

      return Object.values(
        room.gamePlayers
      ).some(
        player =>
          player
            .connectedSocketId ===
          socketId
      );
    }
  );
}

/* =========================================================
   Find Game Player
========================================================= */

function findGamePlayerBySocket(
  room,
  socketId
) {
  if (!room?.gamePlayers) {
    return null;
  }

  return (
    Object.values(
      room.gamePlayers
    ).find(
      player =>
        player
          .connectedSocketId ===
        socketId
    ) ??
    null
  );
}

/* =========================================================
   Active Players
========================================================= */

function getActiveGamePlayers(
  room
) {
  return Object.values(
    room.gamePlayers ??
      {}
  ).filter(
    player =>
      player.leftGame !==
      true
  );
}

/* =========================================================
   Alive Players
========================================================= */

function getAliveGamePlayers(
  room
) {
  return getActiveGamePlayers(
    room
  ).filter(
    player =>
      player.state ===
      "alive"
  );
}

/* =========================================================
   Finish Game
========================================================= */

function finishPotatoWar(
  room,
  winningTeam,
  reason = ""
) {
  if (
    !room ||
    room.status !==
      "playing"
  ) {
    return;
  }

  room.status =
    "finished";

  room.finishedAt =
    Date.now();

  /*
   * 게임 종료 시 진행 중인 회의도 종료.
   */
  if (room.meeting) {
    room.meeting.active =
      false;
  }

  /*
   * 승리팀에 속해 있고
   * 실제 게임에서 나가지 않은 플레이어는
   * 죽었더라도 승리자로 처리한다.
   *
   * 예:
   * 생존자가 죽어서 ghost가 되었더라도
   * 최종적으로 생존팀이 승리하면 함께 승리.
   */
  const winners =
    Object.values(
      room.gamePlayers ??
        {}
    )
      .filter(
        player =>
          player.role ===
            winningTeam &&
          player.leftGame !==
            true
      )
      .map(
        player => ({
          id:
            player.id,

          nickname:
            player.nickname,

          characterStyle:
            player.characterStyle,
        })
      );

  const result = {
    roomId:
      room.id,

    winningTeam,

    reason,

    winners,

    finishedAt:
      room.finishedAt,
  };

  room.result =
    result;

  console.log(
    "🏆 GAME OVER:",
    room.id,
    winningTeam,
    reason
  );

  /*
   * 기존 클라이언트와의 호환을 위해
   * 두 이벤트 모두 전송한다.
   */
  io
    .to(
      getSocketRoomName(
        room.id
      )
    )
    .emit(
      "devilGame:end",
      result
    );

  io
    .to(
      getSocketRoomName(
        room.id
      )
    )
    .emit(
      "devilGame:finished",
      result
    );

  broadcastRoomList();

  /*
   * 결과 화면을 볼 시간을 주고
   * 60초 후 방을 제거한다.
   */
  setTimeout(
    () => {
      const currentRoom =
        devilRooms[
          room.id
        ];

      if (
        currentRoom &&
        currentRoom.status ===
          "finished"
      ) {
        delete devilRooms[
          room.id
        ];

        broadcastRoomList();
      }
    },
    60_000
  );
}

/* =========================================================
   Winner Check

   승리 규칙

   1. 악마가 모두 사라지면 생존팀 승리

   2. 생존팀 전체 미션을 100% 완료하면
      생존팀 승리

   3. 살아있는 생존자가 한 명도 없으면
      악마팀 승리

   4. 악마 수 >= 생존자 수가 되어도
      자동으로 악마팀이 승리하지 않는다.

      예:
      악마 1 : 생존자 1
      → 게임 계속 진행

   5. 단순 사망 / 유령화는
      인원 부족 종료 사유가 아니다.

   6. 실제 게임 퇴장(leftGame)으로
      참가자가 최소 인원보다 적어진 경우에만
      not-enough-players 종료를 적용한다.
========================================================= */

function checkGameEnd(
  room
) {
  if (
    !room ||
    room.status !==
      "playing"
  ) {
    return;
  }

  const allGamePlayers =
    Object.values(
      room.gamePlayers ??
        {}
    );

  /*
   * 게임을 실제로 나가지 않은 참가자.
   *
   * ghost도 activePlayers에는 포함된다.
   */
  const activePlayers =
    allGamePlayers.filter(
      player =>
        player.leftGame !==
        true
    );

  /*
   * 모든 사람이 게임을 나간 경우.
   */
  if (
    activePlayers.length ===
    0
  ) {
    delete devilRooms[
      room.id
    ];

    broadcastRoomList();

    return;
  }

  /*
   * 현재 살아있는 플레이어.
   */
  const alivePlayers =
    activePlayers.filter(
      player =>
        player.state ===
        "alive"
    );

  const aliveDevils =
    alivePlayers.filter(
      player =>
        player.role ===
        "devil"
    );

  const aliveSurvivors =
    alivePlayers.filter(
      player =>
        player.role ===
        "survivor"
    );

  /* =====================================================
     1. 악마 전원 제거
     → 생존팀 승리
  ===================================================== */

  if (
    aliveDevils.length ===
    0
  ) {
    finishPotatoWar(
      room,
      "survivor",
      "all-devils-eliminated"
    );

    return;
  }

  /* =====================================================
     2. 전체 미션 완료
     → 생존팀 승리

     중요:
     percentage === 100만 검사하지 않고
     completed >= total을 직접 확인한다.

     total === 0인 게임에서는
     미션 승리가 발생하지 않는다.
  ===================================================== */

  const missionProgress =
    getSurvivorMissionProgress(
      room
    );

  if (
    missionProgress.total >
      0 &&
    missionProgress.completed >=
      missionProgress.total
  ) {
    finishPotatoWar(
      room,
      "survivor",
      "all-missions-completed"
    );

    return;
  }

  /* =====================================================
     3. 살아있는 생존자 전멸
     → 악마팀 승리

     ghost 상태의 생존자만 남아 있다면
     악마팀 승리.

     따라서 생존자는 전멸하기 전에
     미션 100%를 달성해야 한다.
  ===================================================== */

  if (
    aliveSurvivors.length ===
    0
  ) {
    finishPotatoWar(
      room,
      "devil",
      "all-survivors-eliminated"
    );

    return;
  }

  /* =====================================================
     4. 실제 퇴장으로 인한 인원 부족 확인
  ===================================================== */

  const hasActuallyLeft =
    allGamePlayers.some(
      player =>
        player.leftGame ===
        true
    );

  /*
   * 단순히 사람이 죽어서 3명 미만이 된 것은
   * 여기서 게임 종료시키지 않는다.

   * 반드시 실제 퇴장자가 존재해야 한다.
   */
  if (
    hasActuallyLeft &&
    activePlayers.length <
      DEVIL_GAME_MIN_PLAYERS
  ) {
    const activeDevils =
      activePlayers.filter(
        player =>
          player.role ===
          "devil"
      );

    const activeSurvivors =
      activePlayers.filter(
        player =>
          player.role ===
          "survivor"
      );

    /*
     * 퇴장으로 인해 악마 진영 자체가
     * 없어졌다면 생존팀 승리.
     */
    if (
      activeDevils.length ===
      0
    ) {
      finishPotatoWar(
        room,
        "survivor",
        "not-enough-players"
      );

      return;
    }

    /*
     * 퇴장으로 인해 생존 진영 자체가
     * 없어졌다면 악마팀 승리.
     */
    if (
      activeSurvivors.length ===
      0
    ) {
      finishPotatoWar(
        room,
        "devil",
        "not-enough-players"
      );

      return;
    }

    /*
     * 양쪽 진영이 모두 남아 있지만
     * 실제 퇴장 때문에 최소 인원이 깨진 경우.

     * 살아있는 인원을 기준으로
     * 더 많은 진영이 승리한다.

     * 동수라면 기존 규칙에 따라
     * 생존팀을 선택한다.
     */
    const winningTeam =
      aliveDevils.length >
      aliveSurvivors.length
        ? "devil"
        : "survivor";

    finishPotatoWar(
      room,
      winningTeam,
      "not-enough-players"
    );

    return;
  }

  /*
   * 중요:
   *
   * 기존처럼
   *
   * aliveDevils.length >= aliveSurvivors.length
   *
   * 조건으로 게임을 끝내지 않는다.
   *
   * 따라서
   *
   * 악마 1 : 생존자 1
   * 악마 2 : 생존자 1
   *
   * 같은 상황에서도
   * 살아있는 생존자가 존재한다면
   * 게임은 계속 진행된다.
   */
}

/* =========================================================
   Corpse Helpers
========================================================= */

function getActiveCorpse(
  room,
  corpseId
) {
  return (
    room.corpses?.find(
      corpse =>
        corpse.id ===
          corpseId &&
        corpse.reported !==
          true
    ) ??
    null
  );
}

/* =========================================================
   Can Report Corpse
========================================================= */

function canReportCorpse(
  reporter,
  corpse
) {
  if (
    !reporter ||
    !corpse
  ) {
    return false;
  }

  if (
    reporter.state !==
    "alive"
  ) {
    return false;
  }

  const distance =
    getDistance(
      {
        x:
          reporter.x,
        y:
          reporter.y,
      },
      {
        x:
          corpse.x,
        y:
          corpse.y,
      }
    );

  return (
    distance <=
    POTATO_WAR_REPORT_DISTANCE
  );
}

/* =========================================================
   Emergency Meeting Distance
========================================================= */

function canCallEmergencyMeeting(
  player
) {
  if (!player) {
    return false;
  }

  if (
    player.state !==
    "alive"
  ) {
    return false;
  }

  const distance =
    getDistance(
      {
        x:
          player.x,
        y:
          player.y,
      },
      POTATO_WAR_EMERGENCY_MEETING_POSITION
    );

  return (
    distance <=
    POTATO_WAR_EMERGENCY_MEETING_DISTANCE
  );
}

/* =========================================================
   Meeting Participants
========================================================= */

function getMeetingParticipants(
  room
) {
  return getAliveGamePlayers(
    room
  );
}

/* =========================================================
   Meeting Public Player
========================================================= */

function getPublicMeetingPlayer(
  player
) {
  if (!player) {
    return null;
  }

  return {
    id:
      player.id,

    nickname:
      player.nickname,

    characterStyle:
      player.characterStyle,

    state:
      player.state,
  };
}

/* =========================================================
   Broadcast Meeting
========================================================= */

function broadcastMeeting(
  room
) {
  if (
    !room?.meeting ||
    !room.meeting.active
  ) {
    return;
  }

  const participants =
    getMeetingParticipants(
      room
    );

  io
    .to(
      getSocketRoomName(
        room.id
      )
    )
    .emit(
      "devilGame:meetingUpdate",
      {
        meeting:
          getPublicMeeting(
            room
          ),

        players:
          participants
            .map(
              getPublicMeetingPlayer
            )
            .filter(Boolean),
      }
    );
}
/* =========================================================
   Start Game
========================================================= */

function beginPotatoWar(
  room
) {
  if (
    !room ||
    room.status !==
      "countdown"
  ) {
    return;
  }

  if (
    room.players.length <
    DEVIL_GAME_MIN_PLAYERS
  ) {
    room.status =
      "waiting";

    room.countdownEndsAt =
      null;

    broadcastRoomUpdate(
      room
    );

    return;
  }

  room.roles =
    assignRoles(
      room
    );

  createGameRuntime(
    room
  );

  room.status =
    "playing";

  /*
   * 게임 시작 참가자를 사무실 목록에서 즉시 숨긴다.
   */
  io.emit(
    "players:update",
    getPublicOfficePlayers()
  );

  room.startedAt =
    Date.now();

  room.countdownEndsAt =
    null;

  /*
   * 각자에게 자기 역할/미션만 전달.
   */
  Object.values(
    room.gamePlayers
  ).forEach(
    player => {
      if (
        !player
          .connectedSocketId
      ) {
        return;
      }

      io
        .to(
          player
            .connectedSocketId
        )
        .emit(
          "devilGame:started",
          {
            roomId:
              room.id,

            playerId:
              player.id,

            role:
              player.role,

            missionIds:
              player.missionIds,

            x:
              player.x,

            y:
              player.y,
          }
        );

      /*
       * 이전 프론트 호환용.
       */
      io
        .to(
          player
            .connectedSocketId
        )
        .emit(
          "devilGame:role",
          {
            roomId:
              room.id,

            playerId:
              player.id,

            role:
              player.role,
          }
        );
    }
  );

  broadcastRoomUpdate(
    room
  );

  broadcastGameState(
    room
  );
}

/* =========================================================
   Meeting: Start Voting
========================================================= */

function startMeetingVoting(
  room,
  meetingId
) {
  if (
    !room ||
    room.status !==
      "playing"
  ) {
    return;
  }

  const meeting =
    room.meeting;

  if (
    !meeting ||
    !meeting.active ||
    meeting.id !==
      meetingId ||
    meeting.phase !==
      "discussion"
  ) {
    return;
  }

  meeting.phase =
    "voting";

  meeting.phaseEndsAt =
    Date.now() +
    POTATO_WAR_VOTING_MS;

  io
    .to(
      getSocketRoomName(
        room.id
      )
    )
    .emit(
      "devilGame:meeting-phase",
      {
        phase:
          "voting",

        phaseEndsAt:
          meeting.phaseEndsAt,
      }
    );

  broadcastGameState(
    room
  );

  setTimeout(
    () => {
      const currentRoom =
        devilRooms[
          room.id
        ];

      if (
        !currentRoom ||
        !currentRoom.meeting ||
        currentRoom
          .meeting.id !==
          meetingId
      ) {
        return;
      }

      finishMeetingVote(
        currentRoom
      );
    },
    POTATO_WAR_VOTING_MS
  );
}

/* =========================================================
   Meeting: Finish Vote
========================================================= */

function finishMeetingVote(
  room
) {
  const meeting =
    room?.meeting;

  if (
    !room ||
    !meeting ||
    !meeting.active ||
    meeting.phase ===
      "result"
  ) {
    return;
  }

  meeting.phase =
    "result";

  meeting.phaseEndsAt =
    Date.now() +
    POTATO_WAR_VOTE_RESULT_MS;

  const voteCounts = {};

  Object.values(
    meeting.votes ??
      {}
  ).forEach(
    targetId => {
      voteCounts[targetId] =
        (
          voteCounts[
            targetId
          ] ??
          0
        ) + 1;
    }
  );

  const entries =
    Object.entries(
      voteCounts
    ).sort(
      (
        [, a],
        [, b]
      ) =>
        b - a
    );

  let skipped =
    false;

  let expelledPlayer =
    null;

  if (
    entries.length ===
    0
  ) {
    skipped =
      true;
  } else {
    const [
      topTarget,
      topVotes,
    ] =
      entries[0];

    const secondVotes =
      entries[1]?.[1] ??
      0;

    /*
     * 동률.
     */
    if (
      entries.length > 1 &&
      topVotes ===
        secondVotes
    ) {
      skipped =
        true;
    } else if (
      topTarget ===
      "skip"
    ) {
      skipped =
        true;
    } else {
      const target =
        room
          .gamePlayers?.[
            topTarget
          ];

      if (
        target &&
        target.state ===
          "alive" &&
        target.leftGame !==
          true
      ) {
        target.state =
          "ghost";

        expelledPlayer = {
          id:
            target.id,

          nickname:
            target.nickname,

          /*
           * 투표 결과에서 역할 공개.
           */
          role:
            target.role,
        };
      } else {
        skipped =
          true;
      }
    }
  }

  const result = {
    roomId:
      room.id,

    skipped,

    expelledPlayer,

    voteCounts,

    resultEndsAt:
      meeting.phaseEndsAt,
  };

  io
    .to(
      getSocketRoomName(
        room.id
      )
    )
    .emit(
      "devilGame:meeting-result",
      result
    );

  broadcastGameState(
    room
  );

  /*
   * 퇴출로 승패가 결정될 수 있음.
   */
  checkGameEnd(
    room
  );

  if (
    room.status !==
    "playing"
  ) {
    return;
  }

  setTimeout(
    () => {
      const currentRoom =
        devilRooms[
          room.id
        ];

      if (
        !currentRoom ||
        currentRoom.status !==
          "playing" ||
        !currentRoom.meeting ||
        currentRoom
          .meeting.id !==
          meeting.id
      ) {
        return;
      }

      currentRoom.meeting =
        null;

      io
        .to(
          getSocketRoomName(
            currentRoom.id
          )
        )
        .emit(
          "devilGame:meeting-ended",
          {
            roomId:
              currentRoom.id,
          }
        );

      broadcastGameState(
        currentRoom
      );
    },
    POTATO_WAR_VOTE_RESULT_MS
  );
}

/* =========================================================
   Remove Player From Waiting Room

   - 대기실 나가기 버튼
   - 일반 사무실 Socket disconnect
   에서 공통으로 사용한다.
========================================================= */

function removePlayerFromWaitingRoom(
  socket
) {
  const room =
    findPlayerRoom(
      socket.id
    );

  if (
    !room ||
    room.status ===
      "playing"
  ) {
    return null;
  }

  const playerIndex =
    room.players.indexOf(
      socket.id
    );

  if (
    playerIndex !== -1
  ) {
    room.players.splice(
      playerIndex,
      1
    );
  }

  if (
    room.ready
  ) {
    delete room.ready[
      socket.id
    ];
  }

  socket.leave(
    getSocketRoomName(
      room.id
    )
  );

  /*
   * 방장이 나갔다면
   * 남은 첫 번째 참가자에게 방장을 넘긴다.
   */
  if (
    room.hostId ===
    socket.id
  ) {
    room.hostId =
      room.players[0] ??
      null;
  }

  /*
   * 카운트다운 중 인원이 최소 인원보다 적어지면
   * 다시 waiting 상태로 되돌린다.
   */
  if (
    room.status ===
      "countdown" &&
    room.players.length <
      DEVIL_GAME_MIN_PLAYERS
  ) {
    room.status =
      "waiting";

    room.countdownEndsAt =
      null;
  }

  /*
   * 아무도 남지 않았다면 방 삭제.
   */
  if (
    room.players.length ===
    0
  ) {
    delete devilRooms[
      room.id
    ];

    broadcastRoomList();

    return room;
  }

  /*
   * 남아 있는 참가자에게 최신 방 상태 전송.
   */
  broadcastRoomUpdate(
    room
  );

  return room;
}

/* =========================================================
   Socket
========================================================= */

io.on(
  "connection",
  socket => {
    console.log(
      "🥔 연결:",
      socket.id
    );

    /* =====================================================
       Office Join
    ===================================================== */

    socket.on(
      "player:join",
      data => {
        const nickname =
          String(
            data?.nickname ??
              ""
          )
            .trim()
            .slice(
              0,
              20
            );

        if (!nickname) {
          return;
        }

        players[
          socket.id
        ] = {
          id:
            socket.id,

          nickname,

          x:
            Number(
              data?.x
            ) || 735,

          y:
            Number(
              data?.y
            ) || 565,

          characterStyle:
            data?.characterStyle ??
            null,
        };

        socket.emit(
          "chat:history",
          chatHistory
        );

        socket.emit(
          "devilRooms:update",
          getPublicRooms()
        );

        io.emit(
      "players:update",
      getPublicOfficePlayers()
    );

        const message = {
          id:
            createId(),

          type:
            "system",

          message:
            `${nickname} 감자가 입장했습니다.`,

          createdAt:
            Date.now(),
        };

        addChatMessage(
          message
        );

        io.emit(
          "chat:message",
          message
        );
      }
    );

    /* =====================================================
       Office Move
    ===================================================== */

    socket.on(
      "player:move",
      position => {
        const player =
          players[
            socket.id
          ];

        if (!player) {
          return;
        }

        const x =
          Number(
            position?.x
          );

        const y =
          Number(
            position?.y
          );

        if (
          !Number.isFinite(x) ||
          !Number.isFinite(y)
        ) {
          return;
        }

        player.x =
          x;

        player.y =
          y;

        socket
          .broadcast
          .emit(
            "player:moved",
            {
              id:
                socket.id,

              x,

              y,

              duration:
                Number(
                  position
                    ?.duration
                ) ||
                300,
            }
          );
      }
    );

    /* =====================================================
   Character Style
===================================================== */

socket.on(
  "player:style",
  characterStyle => {
    const player =
      players[
        socket.id
      ];

    if (!player) {
      return;
    }

    player.characterStyle =
      characterStyle;

    io.emit(
      "players:update",
      getPublicOfficePlayers()
    );

    const room =
      findPlayerRoom(
        socket.id
      );

    if (
      room &&
      room.status !==
        "playing"
    ) {
      broadcastRoomUpdate(
        room
      );
    }
  }
);

/* =====================================================
   Main Chat

   기존 문자열 방식과
   { message } 방식 모두 허용.
===================================================== */

socket.on(
  "chat:send",
  raw => {
    const player =
      players[
        socket.id
      ];

    if (!player) {
      return;
    }

    const rawMessage =
      typeof raw ===
      "string"
        ? raw
        : raw?.message;

    const message =
      String(
        rawMessage ??
          ""
      )
        .trim()
        .slice(
          0,
          100
        );

    if (!message) {
      return;
    }

    const chatMessage = {
      id:
        createId(),

      type:
        "chat",

      playerId:
        socket.id,

      nickname:
        player.nickname,

      message,

      createdAt:
        Date.now(),
    };

    addChatMessage(
      chatMessage
    );

    io.emit(
      "chat:message",
      chatMessage
    );
  }
);

/* =====================================================
   Lobby Chat
===================================================== */

socket.on(
  "devilLobby:chat",
  payload => {
    const player =
      players[
        socket.id
      ];

    if (!player) {
      return;
    }

    const room =
      findPlayerRoom(
        socket.id
      );

    if (!room) {
      return;
    }

    if (
      room.status !==
        "waiting" &&
      room.status !==
        "countdown"
    ) {
      return;
    }

    const requestedRoomId =
      String(
        payload?.roomId ??
          ""
      )
        .trim()
        .toUpperCase();

    if (
      requestedRoomId &&
      requestedRoomId !==
        room.id
    ) {
      return;
    }

    const message =
      String(
        payload?.message ??
          ""
      )
        .trim()
        .slice(
          0,
          100
        );

    if (!message) {
      return;
    }

    const lobbyMessage = {
      id:
        createId(),

      playerId:
        socket.id,

      nickname:
        player.nickname,

      message,

      createdAt:
        Date.now(),
    };

    io
      .to(
        getSocketRoomName(
          room.id
        )
      )
      .emit(
        "devilLobby:chat",
        lobbyMessage
      );
  }
);

/* =====================================================
   Rooms List
===================================================== */

socket.on(
  "devilRooms:list",
  callback => {
    if (
      typeof callback ===
      "function"
    ) {
      callback({
        ok:
          true,

        rooms:
          getPublicRooms(),
      });

      return;
    }

    socket.emit(
      "devilRooms:update",
      getPublicRooms()
    );
  }
);

/* =====================================================
   Create Room
===================================================== */

socket.on(
  "devilRoom:create",
  (
    options = {},
    callback
  ) => {
    const player =
      players[
        socket.id
      ];

    if (!player) {
      callback?.({
        ok:
          false,

        message:
          "먼저 사무실에 입장해주세요.",
      });

      return;
    }

    if (
      findPlayerRoom(
        socket.id
      )
    ) {
      callback?.({
        ok:
          false,

        message:
          "이미 게임방에 참가 중입니다.",
      });

      return;
    }

    let maxPlayers =
      Number(
        options?.maxPlayers
      );

    if (
      !Number.isFinite(
        maxPlayers
      )
    ) {
      maxPlayers =
        DEVIL_GAME_DEFAULT_MAX_PLAYERS;
    }

    maxPlayers =
      Math.max(
        DEVIL_GAME_MIN_PLAYERS,

        Math.min(
          DEVIL_GAME_MAX_PLAYERS,

          Math.floor(
            maxPlayers
          )
        )
      );

    const roomId =
      createRoomCode();

    const room = {
      id:
        roomId,

      hostId:
        socket.id,

      status:
        "waiting",

      maxPlayers,

      players: [
        socket.id,
      ],

      ready: {
        [socket.id]:
          false,
      },

      roles: {},

      countdownEndsAt:
        null,

      startedAt:
        null,

      gamePlayers:
        null,

      corpses: [],

      meeting:
        null,
    };

    devilRooms[
      roomId
    ] = room;

    socket.join(
      getSocketRoomName(
        roomId
      )
    );

    broadcastRoomUpdate(
      room
    );

    callback?.({
      ok:
        true,

      room:
        getPublicRoom(
          room
        ),
    });
  }
);

/* =====================================================
   Join Room

   { roomId } 최신 방식과
   문자열 구버전 둘 다 허용.
===================================================== */

socket.on(
  "devilRoom:join",
  (
    payload,
    callback
  ) => {
    const player =
      players[
        socket.id
      ];

    if (!player) {
      callback?.({
        ok:
          false,

        message:
          "먼저 사무실에 입장해주세요.",
      });

      return;
    }

    const rawRoomId =
      typeof payload ===
      "string"
        ? payload
        : payload?.roomId;

    const roomId =
      String(
        rawRoomId ??
          ""
      )
        .trim()
        .toUpperCase();

    const room =
      devilRooms[
        roomId
      ];

    if (!room) {
      callback?.({
        ok:
          false,

        message:
          "게임방을 찾을 수 없습니다.",
      });

      return;
    }

    if (
      room.status !==
      "waiting"
    ) {
      callback?.({
        ok:
          false,

        message:
          "이미 게임이 시작된 방입니다.",
      });

      return;
    }

    const currentRoom =
      findPlayerRoom(
        socket.id
      );

    if (
      currentRoom &&
      currentRoom.id !==
        room.id
    ) {
      callback?.({
        ok:
          false,

        message:
          "이미 다른 게임방에 참가 중입니다.",
      });

      return;
    }

    if (
      room.players.includes(
        socket.id
      )
    ) {
      callback?.({
        ok:
          true,

        room:
          getPublicRoom(
            room
          ),
      });

      return;
    }

    if (
      room.players.length >=
      room.maxPlayers
    ) {
      callback?.({
        ok:
          false,

        message:
          "게임방 인원이 가득 찼습니다.",
      });

      return;
    }

    const duplicate =
      room.players.some(
        id =>
          players[id]
            ?.nickname ===
          player.nickname
      );

    if (duplicate) {
      callback?.({
        ok:
          false,

        message:
          "게임방에서는 같은 닉네임을 사용할 수 없습니다.",
      });

      return;
    }

    room.players.push(
      socket.id
    );

    room.ready ??= {};

    room.ready[
      socket.id
    ] =
      false;

    socket.join(
      getSocketRoomName(
        room.id
      )
    );

    broadcastRoomUpdate(
      room
    );

    callback?.({
      ok:
        true,

      room:
        getPublicRoom(
          room
        ),
    });
  }
);

/* =====================================================
   Ready
===================================================== */

socket.on(
  "devilRoom:ready",
  (
    payload,
    callback
  ) => {
    const room =
      findPlayerRoom(
        socket.id
      );

    if (!room) {
      callback?.({
        ok:
          false,

        message:
          "참가 중인 게임방을 찾을 수 없습니다.",
      });

      return;
    }

    if (
      room.status !==
      "waiting"
    ) {
      callback?.({
        ok:
          false,

        message:
          "현재 준비 상태를 변경할 수 없습니다.",
      });

      return;
    }

    const ready =
      typeof payload ===
      "boolean"
        ? payload
        : Boolean(
            payload?.ready
          );

    const requestedRoomId =
      typeof payload ===
      "object"
        ? String(
            payload?.roomId ??
              ""
          )
            .trim()
            .toUpperCase()
        : "";

    if (
      requestedRoomId &&
      requestedRoomId !==
        room.id
    ) {
      callback?.({
        ok:
          false,

        message:
          "잘못된 게임방입니다.",
      });

      return;
    }

    room.ready[
      socket.id
    ] =
      ready;

    broadcastRoomUpdate(
      room
    );

    callback?.({
      ok:
        true,

      ready,
    });
  }
);

/* =====================================================
   Leave Lobby
===================================================== */

socket.on(
  "devilRoom:leave",
  callback => {
    try {
      const room =
        findPlayerRoom(
          socket.id
        );

      if (
        !room
      ) {
        callback?.({
          ok: true,
        });

        return;
      }

      if (
        room.status ===
        "playing"
      ) {
        callback?.({
          ok: false,

          message:
            "게임 진행 중에는 대기실 퇴장을 사용할 수 없습니다.",
        });

        return;
      }

      removePlayerFromWaitingRoom(
        socket
      );

      callback?.({
        ok: true,
      });
    } catch (
      error
    ) {
      console.error(
        "❌ devilRoom:leave 오류:",
        error
      );

      callback?.({
        ok: false,

        message:
          "게임방을 나가는 중 서버 오류가 발생했습니다.",
      });
    }
  }
);

/* =====================================================
   Start Game
===================================================== */

socket.on(
  "devilRoom:start",
  (
    payload,
    callback
  ) => {
    const rawRoomId =
      typeof payload ===
      "string"
        ? payload
        : payload?.roomId;

    const roomId =
      String(
        rawRoomId ??
          ""
      )
        .trim()
        .toUpperCase();

    const room =
      devilRooms[
        roomId
      ];

    if (!room) {
      callback?.({
        ok:
          false,

        message:
          "게임방을 찾을 수 없습니다.",
      });

      return;
    }

    if (
      room.hostId !==
      socket.id
    ) {
      callback?.({
        ok:
          false,

        message:
          "방장만 게임을 시작할 수 있습니다.",
      });

      return;
    }

    if (
      room.status !==
      "waiting"
    ) {
      callback?.({
        ok:
          false,

        message:
          "이미 게임이 시작되었습니다.",
      });

      return;
    }

    if (
      room.players.length <
      DEVIL_GAME_MIN_PLAYERS
    ) {
      callback?.({
        ok:
          false,

        message:
          `${DEVIL_GAME_MIN_PLAYERS -
          room.players.length}명이 더 필요합니다.`,
      });

      return;
    }

    const allReady =
      room.players.every(
        id =>
          room.ready?.[
            id
          ] === true
      );

    if (!allReady) {
      callback?.({
        ok:
          false,

        message:
          "아직 준비하지 않은 참가자가 있습니다.",
      });

      return;
    }

    room.status =
      "countdown";

    room.countdownEndsAt =
      Date.now() +
      POTATO_WAR_START_COUNTDOWN_MS;

    broadcastRoomUpdate(
      room
    );

    io
      .to(
        getSocketRoomName(
          room.id
        )
      )
      .emit(
        "devilGame:countdown",
        {
          roomId:
            room.id,

          countdownEndsAt:
            room.countdownEndsAt,
        }
      );

    callback?.({
      ok:
        true,

      countdownEndsAt:
        room.countdownEndsAt,
    });

    setTimeout(
      () => {
        beginPotatoWar(
          devilRooms[
            room.id
          ]
        );
      },
      POTATO_WAR_START_COUNTDOWN_MS
    );
  }
);

/* =====================================================
   Game Join / Reconnect

   게임 화면 전환 시 Socket ID가 바뀔 수 있으므로
   게임 시작 당시의 고정 playerId를 우선 사용한다.

   playerId 전달이 꼬인 경우에는 같은 방의 nickname을
   보조 식별자로 사용해 기존 gamePlayer를 복구한다.
===================================================== */

socket.on(
  "devilGame:join",
  (
    payload = {},
    callback
  ) => {
    const roomId =
      String(
        payload?.roomId ??
          ""
      )
        .trim()
        .toUpperCase();

    const requestedPlayerId =
      String(
        payload?.playerId ??
          ""
      ).trim();

    const requestedNickname =
      String(
        payload?.nickname ??
          ""
      ).trim();

    const room =
      devilRooms[
        roomId
      ];

    if (
      !room ||
      room.status !==
        "playing" ||
      !room.gamePlayers
    ) {
      callback?.({
        ok:
          false,

        message:
          "진행 중인 감자 전쟁을 찾을 수 없습니다.",
      });

      return;
    }

    /*
     * 1순위: 게임 시작 당시의 고정 playerId.
     */
    let gamePlayer =
      requestedPlayerId
        ? room.gamePlayers[
            requestedPlayerId
          ]
        : null;

    /*
     * playerId가 없거나 잘못 전달된 경우 nickname으로 복구.
     * 대기실에서 같은 닉네임을 막고 있으므로 방 안에서는
     * 한 명만 검색된다.
     */
    if (
      !gamePlayer &&
      requestedNickname
    ) {
      gamePlayer =
        Object.values(
          room.gamePlayers
        ).find(
          player =>
            player.leftGame !==
              true &&
            player.nickname ===
              requestedNickname
        ) ??
        null;
    }

    if (
      !gamePlayer ||
      gamePlayer.leftGame ===
        true
    ) {
      console.log(
        "❌ GAME JOIN FAILED",
        {
          roomId,
          requestedPlayerId,
          requestedNickname,
          availablePlayers:
            Object.values(
              room.gamePlayers
            ).map(
              player => ({
                id:
                  player.id,
                nickname:
                  player.nickname,
                leftGame:
                  player.leftGame,
                connectedSocketId:
                  player.connectedSocketId,
              })
            ),
        }
      );

      callback?.({
        ok:
          false,

        message:
          "이 게임의 참가자 정보를 찾을 수 없습니다.",
      });

      return;
    }

    /*
     * 이전 Socket이 아직 연결된 것으로 남아 있더라도
     * 최신 게임 화면 Socket을 기준으로 다시 연결한다.
     */
    gamePlayer.connectedSocketId =
      socket.id;

    gamePlayer.disconnectedAt =
      null;

    socket.join(
      getSocketRoomName(
        room.id
      )
    );

    players[
      socket.id
    ] = {
      id:
        socket.id,

      nickname:
        gamePlayer.nickname,

      x:
        gamePlayer.x,

      y:
        gamePlayer.y,

      characterStyle:
        gamePlayer.characterStyle,
    };

    const publicState =
      getPublicGameState(
        room
      );

    console.log(
      "✅ GAME JOIN SUCCESS",
      {
        roomId:
          room.id,
        playerId:
          gamePlayer.id,
        nickname:
          gamePlayer.nickname,
        socketId:
          socket.id,
        publicPlayerCount:
          publicState.players.length,
        publicPlayers:
          publicState.players.map(
            player => ({
              id:
                player.id,
              nickname:
                player.nickname,
              state:
                player.state,
            })
          ),
      }
    );

    callback?.({
      ok:
        true,

      playerId:
        gamePlayer.id,

      self: {
        ...getPublicGamePlayer(
          gamePlayer
        ),

        role:
          gamePlayer.role,

        missionIds:
          gamePlayer.missionIds ??
          [],

        completedMissionIds:
          gamePlayer
            .completedMissionIds ??
          [],
      },

      state:
        publicState,
    });

    /*
     * 같은 방의 모든 클라이언트가 최신 참가자 목록을
     * 다시 받도록 전체 상태를 브로드캐스트한다.
     */
    broadcastGameState(
      room
    );
  }
);

/* =====================================================
   Game Move
===================================================== */

socket.on(
  "devilGame:move",
  position => {
    const room =
      findGameRoomBySocket(
        socket.id
      );

    if (!room) {
      return;
    }

    if (
      room.meeting?.active
    ) {
      return;
    }

    const player =
      findGamePlayerBySocket(
        room,
        socket.id
      );

    if (!player) {
      return;
    }

    const x =
      Number(
        position?.x
      );

    const y =
      Number(
        position?.y
      );

    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y)
    ) {
      return;
    }

    if (
      x < 0 ||
      x >
        POTATO_WAR_MAP_WIDTH ||
      y < 0 ||
      y >
        POTATO_WAR_MAP_HEIGHT
    ) {
      return;
    }

    player.x =
      x;

    player.y =
      y;

    player.moving =
      Boolean(
        position?.moving
      );

    socket
      .to(
        getSocketRoomName(
          room.id
        )
      )
      .emit(
        "devilGame:player-moved",
        {
          id:
            player.id,

          x,

          y,

          moving:
            player.moving,
        }
      );
  }
);

/* =====================================================
   Mission Complete
===================================================== */

socket.on(
  "devilGame:missionComplete",
  (
    payload = {},
    callback
  ) => {
    const room =
      findGameRoomBySocket(
        socket.id
      );

    if (!room) {
      callback?.({
        ok:
          false,

        message:
          "게임방을 찾을 수 없습니다.",
      });

      return;
    }

    if (
      room.meeting?.active
    ) {
      callback?.({
        ok:
          false,

        message:
          "긴급회의 중에는 미션을 수행할 수 없습니다.",
      });

      return;
    }

    const player =
      findGamePlayerBySocket(
        room,
        socket.id
      );

    /*
     * 생존자는 살아있거나 유령 상태일 때 미션 수행 가능.
     * 악마의 가짜 미션은 완료 처리하지 않는다.
     */
    if (
      !player ||
      player.role !==
        "survivor" ||
      ![
        "alive",
        "ghost",
      ].includes(
        player.state
      )
    ) {
      callback?.({
        ok:
          false,

        message:
          "현재 미션을 수행할 수 없습니다.",
      });

      return;
    }

    const missionId =
      String(
        payload?.missionId ??
          ""
      ).trim();

    if (
      !player
        .missionIds
        ?.includes(
          missionId
        )
    ) {
      callback?.({
        ok:
          false,

        message:
          "배정되지 않은 미션입니다.",
      });

      return;
    }

    player.completedMissionIds ??=
      [];

    if (
      player
        .completedMissionIds
        .includes(
          missionId
        )
    ) {
      callback?.({
        ok:
          true,

        alreadyCompleted:
          true,

        completedMissionIds:
          player
            .completedMissionIds,

        completedCount:
          player
            .completedMissionIds
            .length,

        totalCount:
          player
            .missionIds
            .length,
      });

      return;
    }

    player
      .completedMissionIds
      .push(
        missionId
      );

    const missionProgress =
      getSurvivorMissionProgress(
        room
      );

    callback?.({
      ok:
        true,

      missionId,

      completedMissionIds:
        player
          .completedMissionIds,

      completedCount:
        player
          .completedMissionIds
          .length,

      totalCount:
        player
          .missionIds
          .length,

      missionProgress,
    });

    broadcastGameState(
      room
    );

    /*
     * 전체 생존팀 미션 100% 완료
     * → 즉시 생존팀 승리
     */
    if (
      missionProgress.total >
        0 &&
      missionProgress.completed >=
        missionProgress.total
    ) {
      finishPotatoWar(
        room,
        "survivor",
        "all-missions-completed"
      );

      return;
    }
  }
);

/* =====================================================
   Devil Kill
===================================================== */

socket.on(
  "devilGame:kill",
  (
    payload = {},
    callback
  ) => {
    const room =
      findGameRoomBySocket(
        socket.id
      );

    if (!room) {
      callback?.({
        ok:
          false,

        message:
          "게임방을 찾을 수 없습니다.",
      });

      return;
    }

    if (
      room.meeting?.active
    ) {
      callback?.({
        ok:
          false,

        message:
          "긴급회의 중에는 처치할 수 없습니다.",
      });

      return;
    }

    const killer =
      findGamePlayerBySocket(
        room,
        socket.id
      );

    const victimId =
      String(
        payload?.victimId ??
          ""
      );

    const victim =
      room
        .gamePlayers?.[
          victimId
        ];

    if (
      !killer ||
      killer.role !==
        "devil" ||
      killer.state !==
        "alive"
    ) {
      callback?.({
        ok:
          false,

        message:
          "처치할 수 없는 상태입니다.",
      });

      return;
    }

    if (
      !victim ||
      victim.id ===
        killer.id ||
      victim.state !==
        "alive" ||
      victim.role !==
        "survivor" ||
      victim.leftGame ===
        true
    ) {
      callback?.({
        ok:
          false,

        message:
          "대상을 처치할 수 없습니다.",
      });

      return;
    }

    const now =
      Date.now();

    const elapsed =
      now -
      Number(
        killer.lastKillAt ??
          0
      );

    if (
      elapsed <
      POTATO_WAR_KILL_COOLDOWN_MS
    ) {
      callback?.({
        ok:
          false,

        message:
          "처치 쿨타임입니다.",

        remainingMs:
          POTATO_WAR_KILL_COOLDOWN_MS -
          elapsed,
      });

      return;
    }

    const distance =
      getDistance(
        killer,
        victim
      );

    if (
      distance >
      POTATO_WAR_KILL_RANGE
    ) {
      callback?.({
        ok:
          false,

        message:
          "생존자에게 더 가까이 가야 합니다.",
      });

      return;
    }

    killer.lastKillAt =
      now;

    victim.state =
      "ghost";

    const corpse = {
      id:
        createId(),

      victimId:
        victim.id,

      nickname:
        victim.nickname,

      characterStyle:
        victim.characterStyle,

      x:
        victim.x,

      y:
        victim.y,

      createdAt:
        now,
    };

    room.corpses.push(
      corpse
    );

    const eventPayload = {
      roomId:
        room.id,

      killerId:
        killer.id,

      victimId:
        victim.id,

      corpse,

      cooldownEndsAt:
        now +
        POTATO_WAR_KILL_COOLDOWN_MS,
    };

    io
      .to(
        getSocketRoomName(
          room.id
        )
      )
      .emit(
        "devilGame:kill-confirmed",
        eventPayload
      );

    broadcastGameState(
      room
    );

    callback?.({
      ok:
        true,

      cooldownEndsAt:
        eventPayload
          .cooldownEndsAt,
    });

    checkGameEnd(
      room
    );
  }
);

/* =====================================================
   Report Corpse
===================================================== */

socket.on(
  "devilGame:report-corpse",
  (
    payload = {},
    callback
  ) => {
    const room =
      findGameRoomBySocket(
        socket.id
      );

    if (
      !room ||
      room.status !==
        "playing"
    ) {
      callback?.({
        ok:
          false,

        message:
          "진행 중인 게임을 찾을 수 없습니다.",
      });

      return;
    }

    if (
      room.meeting?.active
    ) {
      callback?.({
        ok:
          false,

        message:
          "이미 긴급회의가 진행 중입니다.",
      });

      return;
    }

    const reporter =
      findGamePlayerBySocket(
        room,
        socket.id
      );

    if (
      !reporter ||
      reporter.state !==
        "alive"
    ) {
      callback?.({
        ok:
          false,

        message:
          "살아있는 감자만 시체를 신고할 수 있습니다.",
      });

      return;
    }

    const corpseId =
      String(
        payload?.corpseId ??
          ""
      );

    const corpse =
      room.corpses.find(
        item =>
          item.id ===
          corpseId
      );

    if (!corpse) {
      callback?.({
        ok:
          false,

        message:
          "신고할 수 있는 시체가 없습니다.",
      });

      return;
    }

    const distance =
      getDistance(
        reporter,
        corpse
      );

    if (
      distance >
      POTATO_WAR_REPORT_DISTANCE
    ) {
      callback?.({
        ok:
          false,

        message:
          "시체에 더 가까이 가야 합니다.",
      });

      return;
    }

    room.corpses =
      room.corpses.filter(
        item =>
          item.id !==
          corpse.id
      );

    const meetingId =
      createId();

    room.meeting = {
      id:
        meetingId,

      active:
        true,

      kind:
        "corpse",

      phase:
        "discussion",

      reporterId:
        reporter.id,

      reporterNickname:
        reporter.nickname,

      corpseId:
        corpse.id,

      victimId:
        corpse.victimId,

      victimNickname:
        corpse.nickname,

      messages: [],

      votes: {},

      startedAt:
        Date.now(),

      phaseEndsAt:
        Date.now() +
        POTATO_WAR_DISCUSSION_MS,
    };

    Object.values(
      room.gamePlayers
    ).forEach(
      player => {
        player.moving =
          false;
      }
    );

    io
      .to(
        getSocketRoomName(
          room.id
        )
      )
      .emit(
        "devilGame:meeting-started",
        getPublicMeeting(
          room
        )
      );

    broadcastGameState(
      room
    );

    callback?.({
      ok:
        true,

      meeting:
        getPublicMeeting(
          room
        ),
    });

    setTimeout(
      () => {
        startMeetingVoting(
          devilRooms[
            room.id
          ],
          meetingId
        );
      },
      POTATO_WAR_DISCUSSION_MS
    );
  }
);

/* =====================================================
   Manual Emergency Meeting
===================================================== */

socket.on(
  "devilGame:emergency-meeting",
  (
    payload = {},
    callback
  ) => {
    const room =
      findGameRoomBySocket(
        socket.id
      );

    if (
      !room ||
      room.status !==
        "playing"
    ) {
      callback?.({
        ok:
          false,

        message:
          "진행 중인 게임을 찾을 수 없습니다.",
      });

      return;
    }

    if (
      room.meeting?.active
    ) {
      callback?.({
        ok:
          false,

        message:
          "이미 긴급회의가 진행 중입니다.",
      });

      return;
    }

    const reporter =
      findGamePlayerBySocket(
        room,
        socket.id
      );

    if (
      !reporter ||
      reporter.state !==
        "alive" ||
      reporter.leftGame ===
        true
    ) {
      callback?.({
        ok:
          false,

        message:
          "살아있는 감자만 긴급회의를 소집할 수 있습니다.",
      });

      return;
    }

    reporter.emergencyMeetingUses ??= 0;
    /*
 * 한 플레이어당 수동 긴급회의는
 * 게임 중 1회만 사용할 수 있다.
 */
if (
  reporter.emergencyMeetingUses >=
  POTATO_WAR_EMERGENCY_MEETING_LIMIT
) {
  callback?.({
    ok:
      false,

    message:
      "긴급회의는 게임 중 한 번만 사용할 수 있습니다.",
  });

  return;
}

/*
 * 중앙 회의 테이블 근처인지 확인.
 */
const distance =
  getDistance(
    {
      x:
        reporter.x,

      y:
        reporter.y,
    },

    POTATO_WAR_EMERGENCY_MEETING_POSITION
  );

if (
  distance >
  POTATO_WAR_EMERGENCY_MEETING_DISTANCE
) {
  callback?.({
    ok:
      false,

    message:
      "회의 테이블 근처에서만 긴급회의를 소집할 수 있습니다.",
  });

  return;
}

/*
 * 사용 횟수 증가.
 */
reporter.emergencyMeetingUses +=
  1;

const meetingId =
  createId();

room.meeting = {
  id:
    meetingId,

  active:
    true,

  kind:
    "emergency",

  phase:
    "discussion",

  reporterId:
    reporter.id,

  reporterNickname:
    reporter.nickname,

  corpseId:
    null,

  victimId:
    null,

  victimNickname:
    null,

  messages: [],

  votes: {},

  startedAt:
    Date.now(),

  phaseEndsAt:
    Date.now() +
    POTATO_WAR_DISCUSSION_MS,
};

/*
 * 회의 시작 시
 * 모든 플레이어의 이동 상태를 정지시킨다.
 */
Object.values(
  room.gamePlayers
).forEach(
  player => {
    player.moving =
      false;
  }
);

io
  .to(
    getSocketRoomName(
      room.id
    )
  )
  .emit(
    "devilGame:meeting-started",
    getPublicMeeting(
      room
    )
  );

broadcastGameState(
  room
);

callback?.({
  ok:
    true,

  meeting:
    getPublicMeeting(
      room
    ),

  remainingUses:
    Math.max(
      0,

      POTATO_WAR_EMERGENCY_MEETING_LIMIT -
        reporter.emergencyMeetingUses
    ),
});

/*
 * 토론 시간이 끝나면
 * 자동으로 투표 단계로 이동.
 */
setTimeout(
  () => {
    startMeetingVoting(
      devilRooms[
        room.id
      ],
      meetingId
    );
  },
  POTATO_WAR_DISCUSSION_MS
);
});

/* =====================================================
   Meeting Chat
===================================================== */

socket.on(
  "devilGame:meeting-chat",
  (
    payload = {},
    callback
  ) => {
    const room =
      findGameRoomBySocket(
        socket.id
      );

    if (
      !room ||
      !room.meeting ||
      !room.meeting.active
    ) {
      callback?.({
        ok:
          false,

        message:
          "현재 진행 중인 회의가 없습니다.",
      });

      return;
    }

    /*
     * 결과 표시 단계에서는
     * 채팅 불가.
     */
    if (
      room.meeting.phase ===
      "result"
    ) {
      callback?.({
        ok:
          false,

        message:
          "투표 결과가 표시 중입니다.",
      });

      return;
    }

    const player =
      findGamePlayerBySocket(
        room,
        socket.id
      );

    /*
     * 살아있는 플레이어만
     * 회의 채팅 가능.
     *
     * 유령은 회의 내용을 볼 수는 있지만
     * 채팅에는 참여하지 못한다.
     */
    if (
      !player ||
      player.state !==
        "alive" ||
      player.leftGame ===
        true
    ) {
      callback?.({
        ok:
          false,

        message:
          "현재 회의 채팅에 참여할 수 없습니다.",
      });

      return;
    }

    const message =
      String(
        payload?.message ??
          ""
      )
        .trim()
        .slice(
          0,
          200
        );

    if (!message) {
      callback?.({
        ok:
          false,

        message:
          "메시지를 입력해주세요.",
      });

      return;
    }

    const chatMessage = {
      id:
        createId(),

      playerId:
        player.id,

      nickname:
        player.nickname,

      message,

      createdAt:
        Date.now(),
    };

    room.meeting.messages ??=
      [];

    room.meeting.messages.push(
      chatMessage
    );

    /*
     * 회의 채팅 기록이 지나치게 커지는 것을 방지.
     */
    if (
      room.meeting.messages
        .length > 100
    ) {
      room.meeting.messages.shift();
    }

    io
      .to(
        getSocketRoomName(
          room.id
        )
      )
      .emit(
        "devilGame:meeting-chat",
        chatMessage
      );

    callback?.({
      ok:
        true,

      message:
        chatMessage,
    });
  }
);

/* =====================================================
   Meeting Vote
===================================================== */

socket.on(
  "devilGame:meeting-vote",
  (
    payload = {},
    callback
  ) => {
    const room =
      findGameRoomBySocket(
        socket.id
      );

    if (
      !room ||
      !room.meeting ||
      !room.meeting.active
    ) {
      callback?.({
        ok:
          false,

        message:
          "현재 진행 중인 회의가 없습니다.",
      });

      return;
    }

    if (
      room.meeting.phase !==
      "voting"
    ) {
      callback?.({
        ok:
          false,

        message:
          "현재는 투표 시간이 아닙니다.",
      });

      return;
    }

    const voter =
      findGamePlayerBySocket(
        room,
        socket.id
      );

    /*
     * 살아있는 플레이어만 투표 가능.
     */
    if (
      !voter ||
      voter.state !==
        "alive" ||
      voter.leftGame ===
        true
    ) {
      callback?.({
        ok:
          false,

        message:
          "현재 투표할 수 없습니다.",
      });

      return;
    }

    room.meeting.votes ??=
      {};

    /*
     * 한 사람당 한 번만 투표.
     */
    if (
      Object.prototype.hasOwnProperty.call(
        room.meeting.votes,
        voter.id
      )
    ) {
      callback?.({
        ok:
          false,

        message:
          "이미 투표했습니다.",
      });

      return;
    }

    const targetId =
      String(
        payload?.targetId ??
          ""
      ).trim();

    /*
     * skip 투표.
     */
    if (
      targetId ===
      "skip"
    ) {
      room.meeting.votes[
        voter.id
      ] =
        "skip";
    } else {
      const target =
        room
          .gamePlayers?.[
            targetId
          ];

      if (
        !target ||
        target.state !==
          "alive" ||
        target.leftGame ===
          true
      ) {
        callback?.({
          ok:
            false,

          message:
            "투표할 수 없는 대상입니다.",
        });

        return;
      }

      room.meeting.votes[
        voter.id
      ] =
        target.id;
    }

    callback?.({
      ok:
        true,

      targetId,
    });

    /*
     * 누가 투표했는지만 공개한다.
     *
     * 누구에게 투표했는지는
     * 투표 종료 전까지 공개하지 않는다.
     */
    io
      .to(
        getSocketRoomName(
          room.id
        )
      )
      .emit(
        "devilGame:meeting-voted",
        {
          voterId:
            voter.id,
        }
      );

    broadcastGameState(
      room
    );

    /*
     * 살아있는 모든 플레이어가 투표했다면
     * 남은 시간을 기다리지 않고 즉시 개표.
     */
    const participants =
      getMeetingParticipants(
        room
      );

    const votedCount =
      Object.keys(
        room.meeting.votes
      ).length;

    if (
      participants.length >
        0 &&
      votedCount >=
        participants.length
    ) {
      finishMeetingVote(
        room
      );
    }
  }
);

/* =====================================================
   Game Leave
===================================================== */

socket.on(
  "devilGame:leave",
  (
    payload = {},
    callback
  ) => {
    const room =
      findGameRoomBySocket(
        socket.id
      );

    if (!room) {
      callback?.({
        ok:
          true,
      });

      return;
    }

    const gamePlayer =
      findGamePlayerBySocket(
        room,
        socket.id
      );

    if (!gamePlayer) {
      callback?.({
        ok:
          true,
      });

      return;
    }

    /*
     * 명시적으로 게임 나가기를 선택한 경우.
     *
     * 단순 Socket disconnect와 구분하기 위해
     * leftGame을 true로 설정한다.
     */
    gamePlayer.leftGame =
      true;

    gamePlayer.connectedSocketId =
      null;

    /*
     * 게임에서 명시적으로 나간 플레이어를
     * 사무실 목록에 다시 반영한다.
     */
    io.emit(
      "players:update",
      getPublicOfficePlayers()
    );

    gamePlayer.disconnectedAt =
      Date.now();

    gamePlayer.moving =
      false;

    socket.leave(
      getSocketRoomName(
        room.id
      )
    );

    callback?.({
      ok:
        true,
    });

    io
      .to(
        getSocketRoomName(
          room.id
        )
      )
      .emit(
        "devilGame:player-left",
        {
          playerId:
            gamePlayer.id,

          nickname:
            gamePlayer.nickname,
        }
      );

    broadcastGameState(
      room
    );

    /*
     * 실제 퇴장으로 인한
     * 인원 부족 승패를 검사한다.
     */
    checkGameEnd(
      room
    );
  }
);

/* =====================================================
   Return To Office
===================================================== */

socket.on(
  "devilGame:return-office",
  (
    payload = {},
    callback
  ) => {
    const requestedRoomId =
      String(
        payload?.roomId ??
          ""
      )
        .trim()
        .toUpperCase();

    let room =
      requestedRoomId
        ? devilRooms[
            requestedRoomId
          ]
        : null;

    if (!room) {
      room =
        Object.values(
          devilRooms
        ).find(
          currentRoom =>
            Object.values(
              currentRoom
                .gamePlayers ??
                {}
            ).some(
              player =>
                player
                  .connectedSocketId ===
                socket.id
            )
        );
    }

    if (!room) {
      callback?.({
        ok:
          true,
      });

      return;
    }

    const gamePlayer =
      findGamePlayerBySocket(
        room,
        socket.id
      );

    if (gamePlayer) {
      gamePlayer.returnedToOffice =
        true;
    }

    callback?.({
      ok:
        true,
    });
  }
);

/* =====================================================
   Disconnect
===================================================== */

socket.on(
  "disconnect",
  () => {
    console.log(
      "🥔 연결 종료:",
      socket.id
    );

    /*
     * 먼저 진행 중인 게임 참가자인지 확인.
     */
    const gameRoom =
      findGameRoomBySocket(
        socket.id
      );

    const gamePlayer =
      gameRoom
        ? findGamePlayerBySocket(
            gameRoom,
            socket.id
          )
        : null;

    /*
     * 진행 중인 게임에서는
     * 단순 네트워크 disconnect를 즉시 퇴장으로
     * 처리하지 않는다.
     *
     * 페이지 전환 / 앱 백그라운드 등으로
     * Socket이 잠시 끊길 수 있기 때문이다.
     */
    if (
      gameRoom &&
      gamePlayer &&
      gamePlayer.leftGame !==
        true
    ) {
      const disconnectedAt =
        Date.now();

      gamePlayer.disconnectedAt =
        disconnectedAt;

      gamePlayer.connectedSocketId =
        null;

      gamePlayer.moving =
        false;

      /*
       * 사무실 Socket 데이터는 제거.
       */
      delete players[
        socket.id
      ];

      io.emit(
      "players:update",
      getPublicOfficePlayers()
    );

      /*
       * 재접속 유예시간 이후에도
       * 돌아오지 않았다면 실제 퇴장 처리.
       */
      setTimeout(
        () => {
          const currentRoom =
            devilRooms[
              gameRoom.id
            ];

          if (
            !currentRoom ||
            currentRoom.status !==
              "playing"
          ) {
            return;
          }

          const currentPlayer =
            currentRoom
              .gamePlayers?.[
                gamePlayer.id
              ];

          if (
            !currentPlayer ||
            currentPlayer.leftGame ===
              true
          ) {
            return;
          }

          /*
           * 이미 다른 Socket으로 재접속했다면
           * 퇴장 처리하지 않는다.
           */
          if (
            currentPlayer
              .connectedSocketId
          ) {
            return;
          }

          /*
           * 가장 최근 disconnect와
           * 이 타이머가 같은 disconnect인지 확인.
           */
          if (
            currentPlayer
              .disconnectedAt !==
            disconnectedAt
          ) {
            return;
          }

          currentPlayer.leftGame =
            true;

          io
            .to(
              getSocketRoomName(
                currentRoom.id
              )
            )
            .emit(
              "devilGame:player-left",
              {
                playerId:
                  currentPlayer.id,

                nickname:
                  currentPlayer.nickname,
              }
            );

          broadcastGameState(
            currentRoom
          );

          checkGameEnd(
            currentRoom
          );
        },
        POTATO_WAR_RECONNECT_GRACE_MS
      );

      return;
    }

    /*
     * 게임 중이 아니라면
     * 일반 대기실에서 제거한다.
     */
    const waitingRoom =
      findPlayerRoom(
        socket.id
      );

    if (
      waitingRoom &&
      waitingRoom.status !==
        "playing"
    ) {
      const index =
        waitingRoom.players.indexOf(
          socket.id
        );

      if (
        index !== -1
      ) {
        waitingRoom.players.splice(
          index,
          1
        );
      }

      if (
        waitingRoom.ready
      ) {
        delete waitingRoom.ready[
          socket.id
        ];
      }

      /*
       * 방장이 나간 경우
       * 남은 첫 번째 플레이어에게 방장 위임.
       */
      if (
        waitingRoom.hostId ===
        socket.id
      ) {
        waitingRoom.hostId =
          waitingRoom.players[
            0
          ] ??
          null;
      }

      /*
       * 방에 아무도 남지 않았다면 삭제.
       */
      if (
        waitingRoom.players
          .length === 0
      ) {
        delete devilRooms[
          waitingRoom.id
        ];
      } else {
        /*
         * 카운트다운 도중 사람이 나가서
         * 최소 인원이 깨진 경우 다시 waiting.
         */
        if (
          waitingRoom.status ===
            "countdown" &&
          waitingRoom.players
            .length <
            DEVIL_GAME_MIN_PLAYERS
        ) {
          waitingRoom.status =
            "waiting";

          waitingRoom.countdownEndsAt =
            null;
        }

        broadcastRoomUpdate(
          waitingRoom
        );
      }

      broadcastRoomList();
    }

    const player =
      players[
        socket.id
      ];

    if (player) {
      const message = {
        id:
          createId(),

        type:
          "system",

        message:
          `${player.nickname} 감자가 퇴장했습니다.`,

        createdAt:
          Date.now(),
      };

      addChatMessage(
        message
      );

      io.emit(
        "chat:message",
        message
      );
    }

    delete players[
      socket.id
    ];

    io.emit(
      "players:update",
      getPublicOfficePlayers()
    );
  }
);
  }
);

/* =========================================================
   Health Check
========================================================= */

app.get(
  "/",
  (
    req,
    res
  ) => {
    res.send(
      "Gamja Office Socket Server 🥔"
    );
  }
);

app.get(
  "/health",
  (
    req,
    res
  ) => {
    res.json({
      ok:
        true,

      players:
        Object.keys(
          players
        ).length,

      rooms:
        Object.keys(
          devilRooms
        ).length,

      timestamp:
        Date.now(),
    });
  }
);

/* =========================================================
   Start
========================================================= */

server.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `🥔 Gamja Office server running on port ${PORT}`
    );

    console.log(
      "😈 악마 규칙: 3~4명 1명 / 5~6명 2명"
    );

    console.log(
      `🎯 개인 미션: ${POTATO_WAR_MISSIONS_PER_PLAYER}개`
    );

    console.log(
      "🚨 시체 신고 / 긴급회의 / 회의채팅 / 투표 활성화"
    );

    console.log(
      `📣 수동 긴급회의: 플레이어당 ${POTATO_WAR_EMERGENCY_MEETING_LIMIT}회`
    );
  }
);