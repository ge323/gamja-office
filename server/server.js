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
  5;

const DEVIL_GAME_MAX_PLAYERS =
  5;

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
 * 수동 긴급회의는 한 플레이이어당 게임 중 1회.
 */
const POTATO_WAR_EMERGENCY_MEETING_LIMIT =
  1;

/*
 * 중앙 회의 테이블 근처에서만 수동 긴급회의 사용 가능.
 */
const POTATO_WAR_EMERGENCY_MEETING_DISTANCE =
  190;

const POTATO_WAR_EMERGENCY_MEETING_POSITION = {
  x: 1095,
  y: 1160,
};

/* =========================================================
   Blackout Constants

   정전 규칙
   - 악마가 정전을 켜면 생존자에게만 적용
   - 악마는 정전 영향을 받지 않음
   - 같은 게임방 참가자끼리만 동기화
========================================================= */

const POTATO_WAR_BLACKOUT_COOLDOWN_MS =
  15_000;

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
   * 5명 : 악마 2명
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

  /*
   * 정전은 게임 시작 시 항상 OFF.
   */
  room.blackout = {
    active: false,
    activatedBy: null,
    changedAt: null,
    cooldownEndsAt: 0,
  };

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

        moving:
          false,

        direction:
          "down",

        spawnId:
          spawn.id,

        missionIds,

        completedMissionIds:
          [],

        lastKillAt:
          0,

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

    direction:
      gamePlayer.direction ??
      "down",

    emergencyMeetingUses:
      Number(
        gamePlayer.emergencyMeetingUses ??
        0
      ),
  };
}

/* =========================================================
   Public Blackout State
========================================================= */

function getPublicBlackoutState(
  room
) {
  return {
    active:
      Boolean(
        room?.blackout?.active
      ),

    activatedBy:
      room?.blackout?.activatedBy ??
      null,

    changedAt:
      room?.blackout?.changedAt ??
      null,

    cooldownEndsAt:
      Number(
        room?.blackout?.cooldownEndsAt ??
        0
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

    missionProgress:
      getSurvivorMissionProgress(
        room
      ),

    meeting:
      getPublicMeeting(
        room
      ),

    /*
     * 현재 정전 상태도 게임 상태에 포함한다.
     * 재접속한 클라이언트가 현재 정전 상태를
     * 즉시 복구할 수 있게 하기 위함.
     */
    blackout:
      getPublicBlackoutState(
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
   Blackout Broadcast

   주의:
   서버는 방 전체에 상태를 전송한다.

   실제 화면을 어둡게 만드는지는
   클라이언트가 자신의 role을 확인해서 결정한다.

   survivor -> blackout.active 적용
   devil    -> blackout 무시
========================================================= */

function broadcastBlackout(
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
      "devilGame:blackout-changed",
      {
        active:
          Boolean(
            room.blackout?.active
          ),

        activatedBy:
          room.blackout
            ?.activatedBy ??
          null,

        changedAt:
          room.blackout
            ?.changedAt ??
          null,

        cooldownEndsAt:
          Number(
            room.blackout
              ?.cooldownEndsAt ??
            0
          ),
      }
    );

  broadcastGameState(
    room
  );
}

/* =========================================================
   Find Game Room / Player
========================================================= */

function findGameRoomBySocketId(socketId) {
  return Object.values(devilRooms).find((room) => {
    if (room.status !== "playing" || !room.gamePlayers) {
      return false;
    }

    return Object.values(room.gamePlayers).some(
      (gamePlayer) =>
        gamePlayer.connectedSocketId === socketId &&
        gamePlayer.leftGame !== true
    );
  });
}

function findGamePlayerBySocketId(room, socketId) {
  if (!room?.gamePlayers) {
    return null;
  }

  return (
    Object.values(room.gamePlayers).find(
      (gamePlayer) =>
        gamePlayer.connectedSocketId === socketId &&
        gamePlayer.leftGame !== true
    ) ?? null
  );
}

function findGamePlayerById(room, playerId) {
  if (!room?.gamePlayers || !playerId) {
    return null;
  }

  return (
    Object.values(room.gamePlayers).find(
      (gamePlayer) =>
        gamePlayer.id === playerId &&
        gamePlayer.leftGame !== true
    ) ?? null
  );
}

/* =========================================================
   Blackout Helpers
========================================================= */

function ensureBlackoutState(room) {
  if (!room.blackout) {
    room.blackout = {
      active: false,
      activatedBy: null,
      changedAt: null,
      cooldownEndsAt: 0,
    };
  }

  return room.blackout;
}

function resetBlackout(room) {
  if (!room) {
    return;
  }

  room.blackout = {
    active: false,
    activatedBy: null,
    changedAt: Date.now(),
    cooldownEndsAt: 0,
  };

  io.to(getSocketRoomName(room.id)).emit(
    "devilGame:blackout-changed",
    getPublicBlackoutState(room)
  );
}

function canUseBlackout(room, gamePlayer) {
  if (!room || !gamePlayer) {
    return {
      ok: false,
      message: "게임 정보를 찾을 수 없습니다.",
    };
  }

  if (room.status !== "playing") {
    return {
      ok: false,
      message: "현재 게임이 진행 중이 아닙니다.",
    };
  }

  if (gamePlayer.role !== "devil") {
    return {
      ok: false,
      message: "악마 감자만 정전을 사용할 수 있습니다.",
    };
  }

  if (gamePlayer.state !== "alive") {
    return {
      ok: false,
      message: "살아있는 악마 감자만 정전을 사용할 수 있습니다.",
    };
  }

  if (gamePlayer.leftGame === true) {
    return {
      ok: false,
      message: "게임에서 나간 플레이어입니다.",
    };
  }

  if (room.meeting?.active) {
    return {
      ok: false,
      message: "회의 중에는 정전을 사용할 수 없습니다.",
    };
  }

  const blackout = ensureBlackoutState(room);

  /*
   * 정전이 이미 켜져 있을 때 다시 누르는 것은
   * 정전 해제이므로 쿨타임을 검사하지 않는다.
   */
  if (!blackout.active) {
    const now = Date.now();

    if (now < Number(blackout.cooldownEndsAt ?? 0)) {
      const remainingMs =
        Number(blackout.cooldownEndsAt ?? 0) - now;

      return {
        ok: false,
        message: `정전 쿨타임이 ${Math.ceil(
          remainingMs / 1000
        )}초 남았습니다.`,
      };
    }
  }

  return {
    ok: true,
  };
}

/* =========================================================
   Game Result Helpers
========================================================= */

function getAliveGamePlayers(room) {
  return Object.values(room?.gamePlayers ?? {}).filter(
    (player) =>
      player.leftGame !== true &&
      player.state === "alive"
  );
}
function getAliveSurvivors(
  room
) {
  return getAliveGamePlayers(
    room
  ).filter(
    player =>
      player.role ===
      "survivor"
  );
}

function getAliveDevils(
  room
) {
  return getAliveGamePlayers(
    room
  ).filter(
    player =>
      player.role ===
      "devil"
  );
}

/* =========================================================
   Finish Potato War
========================================================= */

function finishPotatoWar(
  room,
  winner,
  reason
) {
  if (
    !room ||
    room.status ===
      "finished"
  ) {
    return;
  }

  room.status =
    "finished";

  room.finishedAt =
    Date.now();

  room.winner =
    winner;

  room.finishReason =
    reason;

  /*
   * 게임 종료 시 정전도 해제.
   */
  resetBlackout(
    room
  );

  clearMeetingTimers(
    room
  );

  const result = {
    winner,
    reason,

    finishedAt:
      room.finishedAt,
  };

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

  broadcastGameState(
    room
  );

  broadcastRoomList();

  console.log(
    `🏁 감자전쟁 종료: ${room.id} / ${winner} / ${reason}`
  );
}

/* =========================================================
   Check Potato War Result
========================================================= */

function checkDevilGameResult(
  room
) {
  if (
    !room ||
    room.status !==
      "playing"
  ) {
    return;
  }

  const aliveSurvivors =
    getAliveSurvivors(
      room
    );

  const aliveDevils =
    getAliveDevils(
      room
    );

  /*
   * 악마가 모두 제거되면
   * 생존자 승리.
   */
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

  /*
   * 생존자가 모두 제거되면
   * 악마 승리.
   */
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

  /*
   * 악마 수가 생존자 수 이상이 되면
   * 악마 승리.
   */
  if (
    aliveDevils.length >=
    aliveSurvivors.length
  ) {
    finishPotatoWar(
      room,
      "devil",
      "devils-reached-parity"
    );

    return;
  }

  /*
   * 모든 생존자 미션이 완료되면
   * 생존자 승리.
   */
  const progress =
    getSurvivorMissionProgress(
      room
    );

  if (
    progress.total > 0 &&
    progress.completed >=
      progress.total
  ) {
    finishPotatoWar(
      room,
      "survivor",
      "all-missions-completed"
    );
  }
}

/* =========================================================
   Corpse Helpers
========================================================= */

function findCorpseById(
  room,
  corpseId
) {
  if (
    !room ||
    !Array.isArray(
      room.corpses
    )
  ) {
    return null;
  }

  return (
    room.corpses.find(
      corpse =>
        corpse.id ===
        corpseId
    ) ??
    null
  );
}

function getNearestReportableCorpse(
  room,
  reporter
) {
  if (
    !room ||
    !reporter
  ) {
    return null;
  }

  let nearest =
    null;

  let nearestDistance =
    Infinity;

  for (
    const corpse of
    room.corpses ?? []
  ) {
    if (
      corpse.reported
    ) {
      continue;
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
      continue;
    }

    if (
      distance <
      nearestDistance
    ) {
      nearest =
        corpse;

      nearestDistance =
        distance;
    }
  }

  return nearest;
}

/* =========================================================
   Meeting Timers
========================================================= */

function clearMeetingTimers(
  room
) {
  if (!room) {
    return;
  }

  if (
    room.discussionTimer
  ) {
    clearTimeout(
      room.discussionTimer
    );

    room.discussionTimer =
      null;
  }

  if (
    room.votingTimer
  ) {
    clearTimeout(
      room.votingTimer
    );

    room.votingTimer =
      null;
  }

  if (
    room.voteResultTimer
  ) {
    clearTimeout(
      room.voteResultTimer
    );

    room.voteResultTimer =
      null;
  }
}

/* =========================================================
   Meeting Message
========================================================= */

function createMeetingMessage(
  player,
  text
) {
  return {
    id:
      createId(),

    playerId:
      player.id,

    nickname:
      player.nickname,

    text,

    createdAt:
      Date.now(),
  };
}

/* =========================================================
   Broadcast Meeting
========================================================= */

function broadcastMeeting(
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
      "devilGame:meeting",
      getPublicMeeting(
        room
      )
    );

  broadcastGameState(
    room
  );
}

/* =========================================================
   Start Meeting
========================================================= */

function startMeeting(
  room,
  reporter,
  options = {}
) {
  if (
    !room ||
    room.status !==
      "playing"
  ) {
    return {
      ok: false,
      message:
        "현재 게임이 진행 중이 아닙니다.",
    };
  }

  if (
    room.meeting?.active
  ) {
    return {
      ok: false,
      message:
        "이미 회의가 진행 중입니다.",
    };
  }

  if (
    !reporter ||
    reporter.state !==
      "alive"
  ) {
    return {
      ok: false,
      message:
        "살아있는 감자만 회의를 소집할 수 있습니다.",
    };
  }

  /*
   * 회의가 시작되면 정전은 자동 해제.
   */
  resetBlackout(
    room
  );

  const kind =
    options.kind ??
    "corpse";

  const corpse =
    options.corpse ??
    null;

  if (corpse) {
    corpse.reported =
      true;
  }

  clearMeetingTimers(
    room
  );

  const now =
    Date.now();

  room.meeting = {
    id:
      createId(),

    active:
      true,

    kind,

    phase:
      "discussion",

    reporterId:
      reporter.id,

    reporterNickname:
      reporter.nickname,

    corpseId:
      corpse?.id ??
      null,

    victimId:
      corpse?.victimId ??
      null,

    victimNickname:
      corpse?.victimNickname ??
      null,

    startedAt:
      now,

    phaseEndsAt:
      now +
      POTATO_WAR_DISCUSSION_MS,

    messages:
      [],

    votes:
      {},

    result:
      null,
  };

  /*
   * 모든 플레이어의 이동을 정지.
   */
  Object.values(
    room.gamePlayers ??
      {}
  ).forEach(
    player => {
      player.moving =
        false;
    }
  );

  broadcastMeeting(
    room
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

  room.discussionTimer =
    setTimeout(
      () => {
        startMeetingVoting(
          room
        );
      },
      POTATO_WAR_DISCUSSION_MS
    );

  return {
    ok: true,

    meeting:
      getPublicMeeting(
        room
      ),
  };
}

/* =========================================================
   Start Meeting Voting
========================================================= */

function startMeetingVoting(
  room
) {
  if (
    !room ||
    !room.meeting ||
    !room.meeting.active
  ) {
    return;
  }

  if (
    room.meeting.phase !==
    "discussion"
  ) {
    return;
  }

  if (
    room.discussionTimer
  ) {
    clearTimeout(
      room.discussionTimer
    );

    room.discussionTimer =
      null;
  }

  room.meeting.phase =
    "voting";

  room.meeting.phaseEndsAt =
    Date.now() +
    POTATO_WAR_VOTING_MS;

  broadcastMeeting(
    room
  );

  io
    .to(
      getSocketRoomName(
        room.id
      )
    )
    .emit(
      "devilGame:meeting-voting",
      getPublicMeeting(
        room
      )
    );

  room.votingTimer =
    setTimeout(
      () => {
        finishMeetingVoting(
          room
        );
      },
      POTATO_WAR_VOTING_MS
    );
}

/* =========================================================
   Eligible Meeting Voters
========================================================= */

function getEligibleMeetingVoters(
  room
) {
  return Object.values(
    room.gamePlayers ??
      {}
  ).filter(
    player =>
      player.leftGame !==
        true &&
      player.state ===
        "alive"
  );
}

function allEligiblePlayersVoted(
  room
) {
  if (
    !room?.meeting
  ) {
    return false;
  }

  const voters =
    getEligibleMeetingVoters(
      room
    );

  if (
    voters.length ===
    0
  ) {
    return false;
  }

  return voters.every(
    player =>
      Object.prototype.hasOwnProperty.call(
        room.meeting.votes ??
          {},
        player.id
      )
  );
}

/* =========================================================
   Finish Meeting Voting
========================================================= */

function finishMeetingVoting(
  room
) {
  if (
    !room ||
    !room.meeting ||
    !room.meeting.active
  ) {
    return;
  }

  if (
    room.meeting.phase ===
    "result"
  ) {
    return;
  }

  if (
    room.votingTimer
  ) {
    clearTimeout(
      room.votingTimer
    );

    room.votingTimer =
      null;
  }

  const meeting =
    room.meeting;

  const counts = {};

  Object.values(
    meeting.votes ??
      {}
  ).forEach(
    targetId => {
      const key =
        targetId ||
        "skip";

      counts[key] =
        (counts[key] ??
          0) +
        1;
    }
  );

  let highestCount =
    0;

  let highestTargets =
    [];

  Object.entries(
    counts
  ).forEach(
    ([
      targetId,
      count,
    ]) => {
      if (
        count >
        highestCount
      ) {
        highestCount =
          count;

        highestTargets = [
          targetId,
        ];

        return;
      }

      if (
        count ===
        highestCount
      ) {
        highestTargets.push(
          targetId
        );
      }
    }
  );

  let ejectedPlayer =
    null;

  let skipped =
    false;

  let tied =
    false;

  /*
   * 아무도 투표하지 않은 경우.
   */
  if (
    highestCount ===
    0
  ) {
    skipped =
      true;
  } else if (
    highestTargets.length >
    1
  ) {
    /*
     * 공동 1위는 아무도 추방되지 않음.
     */
    tied =
      true;
  } else {
    const targetId =
      highestTargets[0];

    if (
      targetId ===
      "skip"
    ) {
      skipped =
        true;
    } else {
      const target =
        findGamePlayerById(
          room,
          targetId
        );

      if (
        target &&
        target.state ===
          "alive"
      ) {
        target.state =
          "ghost";

        target.moving =
          false;

        ejectedPlayer =
          target;
      }
    }
  }

  meeting.phase =
    "result";

  meeting.phaseEndsAt =
    Date.now() +
    POTATO_WAR_VOTE_RESULT_MS;

  meeting.result = {
    ejectedPlayerId:
      ejectedPlayer?.id ??
      null,

    ejectedNickname:
      ejectedPlayer?.nickname ??
      null,

    ejectedRole:
      ejectedPlayer?.role ??
      null,

    skipped,

    tied,

    counts,
  };

  const publicResult = {
    meetingId:
      meeting.id,

    ejectedPlayerId:
      ejectedPlayer?.id ??
      null,

    ejectedNickname:
      ejectedPlayer?.nickname ??
      null,

    /*
     * 투표 결과에서 역할 공개.
     */
    ejectedRole:
      ejectedPlayer?.role ??
      null,

    skipped,

    tied,

    counts,

    phaseEndsAt:
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
      publicResult
    );

  broadcastMeeting(
    room
  );

  /*
   * 추방으로 승패가 결정될 수도 있으므로 확인.
   */
  checkDevilGameResult(
    room
  );

  /*
   * 게임이 이미 종료됐다면
   * 회의 종료 타이머를 만들 필요 없음.
   */
  if (
    room.status !==
    "playing"
  ) {
    return;
  }

  room.voteResultTimer =
    setTimeout(
      () => {
        endMeeting(
          room
        );
      },
      POTATO_WAR_VOTE_RESULT_MS
    );
}

/* =========================================================
   End Meeting
========================================================= */

function endMeeting(
  room
) {
  if (
    !room ||
    !room.meeting
  ) {
    return;
  }

  clearMeetingTimers(
    room
  );

  const oldMeeting =
    room.meeting;

  room.meeting =
    null;

  io
    .to(
      getSocketRoomName(
        room.id
      )
    )
    .emit(
      "devilGame:meeting-ended",
      {
        meetingId:
          oldMeeting.id,
      }
    );

  broadcastGameState(
    room
  );
}

/* =========================================================
   Reconnect Game Player
========================================================= */

function reconnectGamePlayer(
  room,
  gamePlayer,
  socket
) {
  if (
    !room ||
    !gamePlayer ||
    !socket
  ) {
    return;
  }

  gamePlayer.connectedSocketId =
    socket.id;

  gamePlayer.leftGame =
    false;

  socket.join(
    getSocketRoomName(
      room.id
    )
  );

  /*
   * 재접속 즉시 현재 게임 상태 전달.
   */
  socket.emit(
    "devilGame:state",
    getPublicGameState(
      room
    )
  );

  /*
   * 중요:
   * 재접속 시 현재 정전 상태도
   * blackout-changed 이벤트로 다시 전달한다.
   */
  socket.emit(
    "devilGame:blackout-changed",
    getPublicBlackoutState(
      room
    )
  );

  if (
    room.meeting?.active
  ) {
    socket.emit(
      "devilGame:meeting",
      getPublicMeeting(
        room
      )
    );
  }
}

/* =========================================================
   Socket.IO Connection
========================================================= */

io.on(
  "connection",
  socket => {
    console.log(
      "🟢 Socket connected:",
      socket.id
    );

    /* =====================================================
       Office Join
    ===================================================== */

    socket.on(
      "office:join",
      (
        payload = {},
        callback
      ) => {
        const nickname =
          String(
            payload.nickname ??
              ""
          )
            .trim()
            .slice(
              0,
              30
            );

        if (!nickname) {
          callback?.({
            ok: false,
            message:
              "닉네임을 입력해주세요.",
          });

          return;
        }

        const characterStyle =
          payload.characterStyle ??
          {};

        players[
          socket.id
        ] = {
          id:
            socket.id,

          nickname,

          characterStyle,

          x:
            Number(
              payload.x ??
              0
            ),

          y:
            Number(
              payload.y ??
              0
            ),

          moving:
            false,

          direction:
            "down",

          joinedAt:
            Date.now(),
        };

        callback?.({
          ok: true,

          player:
            players[
              socket.id
            ],

          players:
            getPublicOfficePlayers(),

          chatHistory,
        });

        socket.broadcast.emit(
          "office:player-joined",
          players[
            socket.id
          ]
        );

        io.emit(
          "office:players",
          getPublicOfficePlayers()
        );

        console.log(
          `🥔 Office join: ${nickname} / ${socket.id}`
        );
      }
    );

    /* =====================================================
       Office Movement
    ===================================================== */

    socket.on(
      "office:move",
      payload => {
        const player =
          players[
            socket.id
          ];

        if (!player) {
          return;
        }

        const x =
          Number(
            payload.x
          );

        const y =
          Number(
            payload.y
          );

        if (
          !Number.isFinite(
            x
          ) ||
          !Number.isFinite(
            y
          )
        ) {
          return;
        }

        player.x =
          x;

        player.y =
          y;

        player.moving =
          Boolean(
            payload.moving
          );

        player.direction =
          payload.direction ??
          player.direction ??
          "down";

        socket.broadcast.emit(
          "office:player-moved",
          {
            id:
              socket.id,

            x:
              player.x,

            y:
              player.y,

            moving:
              player.moving,

            direction:
              player.direction,
          }
        );
      }
    );

    /* =====================================================
       Office Chat
    ===================================================== */

    socket.on(
      "office:chat",
      (
        payload = {},
        callback
      ) => {
        const player =
          players[
            socket.id
          ];

        if (!player) {
          callback?.({
            ok: false,
            message:
              "플레이어 정보를 찾을 수 없습니다.",
          });

          return;
        }

        const message =
          String(
            payload.message ??
              ""
          )
            .trim()
            .slice(
              0,
              200
            );

        if (!message) {
          callback?.({
            ok: false,
            message:
              "메시지를 입력해주세요.",
          });

          return;
        }

        const chatMessage = {
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

        addChatMessage(
          chatMessage
        );

        io.emit(
          "office:chat",
          chatMessage
        );

        callback?.({
          ok: true,
          message:
            chatMessage,
        });
      }
    );

    /* =====================================================
       Devil Room List
    ===================================================== */

    socket.on(
      "devilRooms:list",
      callback => {
        callback?.({
          ok: true,

          rooms:
            getPublicRooms(),
        });
      }
    );

    /* =====================================================
       Create Devil Room
    ===================================================== */

    socket.on(
      "devilRoom:create",
      (
        payload = {},
        callback
      ) => {
        const player =
          players[
            socket.id
          ];

        if (!player) {
          callback?.({
            ok: false,
            message:
              "먼저 사무실에 입장해주세요.",
          });

          return;
        }

        const existingRoom =
          findPlayerRoom(
            socket.id
          );

        if (
          existingRoom
        ) {
          callback?.({
            ok: false,
            message:
              "이미 다른 게임방에 참가 중입니다.",
          });

          return;
        }

        const roomId =
          createRoomCode();

        /*
         * 클라이언트가 6명을 요청하더라도
         * 서버에서 최대 5명으로 제한.
         */
        const requestedMaxPlayers =
          Number(
            payload.maxPlayers ??
              DEVIL_GAME_DEFAULT_MAX_PLAYERS
          );

        const maxPlayers =
          Math.min(
            DEVIL_GAME_MAX_PLAYERS,
            Math.max(
              DEVIL_GAME_MIN_PLAYERS,
              Number.isFinite(
                requestedMaxPlayers
              )
                ? Math.floor(
                    requestedMaxPlayers
                  )
                : DEVIL_GAME_DEFAULT_MAX_PLAYERS
            )
          );

        devilRooms[
          roomId
        ] = {
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
            /*
             * 방장도 준비 버튼을 눌러야
             * 게임 시작 가능.
             */
            [socket.id]:
              false,
          },

          roles:
            null,

          countdownEndsAt:
            null,

          gamePlayers:
            null,

          corpses:
            [],

          meeting:
            null,

          blackout: {
            active:
              false,

            activatedBy:
              null,

            changedAt:
              null,

            cooldownEndsAt:
              0,
          },

          createdAt:
            Date.now(),
        };

        socket.join(
          getSocketRoomName(
            roomId
          )
        );

        const room =
          devilRooms[
            roomId
          ];

        callback?.({
          ok: true,

          room:
            getPublicRoom(
              room
            ),
        });

        broadcastRoomUpdate(
          room
        );

        console.log(
          `😈 감자전쟁 방 생성: ${roomId} / ${player.nickname}`
        );
      }
    );

    /* =====================================================
       Join Devil Room
    ===================================================== */

    socket.on(
      "devilRoom:join",
      (
        payload = {},
        callback
      ) => {
        const player =
          players[
            socket.id
          ];

        if (!player) {
          callback?.({
            ok: false,
            message:
              "먼저 사무실에 입장해주세요.",
          });

          return;
        }

        const roomId =
          String(
            payload.roomId ??
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
            ok: false,
            message:
              "존재하지 않는 게임방입니다.",
          });

          return;
        }

        if (
          room.status !==
          "waiting"
        ) {
          callback?.({
            ok: false,
            message:
              "이미 게임이 시작된 방입니다.",
          });

          return;
        }

        const existingRoom =
          findPlayerRoom(
            socket.id
          );

        if (
          existingRoom &&
          existingRoom.id !==
            room.id
        ) {
          callback?.({
            ok: false,
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
          socket.join(
            getSocketRoomName(
              room.id
            )
          );

          callback?.({
            ok: true,

            room:
              getPublicRoom(
                room
              ),
          });

          return;
        }

        /*
         * 최대 5명 제한.
         */
        if (
          room.players.length >=
          Math.min(
            room.maxPlayers,
            DEVIL_GAME_MAX_PLAYERS
          )
        ) {
          callback?.({
            ok: false,
            message:
              "게임방이 가득 찼습니다.",
          });

          return;
        }

        room.players.push(
          socket.id
        );

        room.ready[
          socket.id
        ] =
          false;

        socket.join(
          getSocketRoomName(
            room.id
          )
        );

        callback?.({
          ok: true,

          room:
            getPublicRoom(
              room
            ),
        });

        broadcastRoomUpdate(
          room
        );

        console.log(
          `➕ 감자전쟁 방 입장: ${room.id} / ${player.nickname}`
        );
      }
    );

    /* =====================================================
       Leave Devil Room
    ===================================================== */

    socket.on(
      "devilRoom:leave",
      (
        payload = {},
        callback
      ) => {
        const room =
          findPlayerRoom(
            socket.id
          );

        if (!room) {
          callback?.({
            ok: true,
          });

          return;
        }

        /*
         * 이미 실제 게임이 시작됐다면
         * 로비 leave 이벤트로 제거하지 않는다.
         */
        if (
          room.status ===
            "playing"
        ) {
          callback?.({
            ok: false,
            message:
              "게임 진행 중에는 이 방식으로 방을 나갈 수 없습니다.",
          });

          return;
        }

        room.players =
          room.players.filter(
            id =>
              id !==
              socket.id
          );

        if (
          room.ready
        ) {
          delete room.ready[
            socket.id
          ];
        }

        if (
          room.roles
        ) {
          delete room.roles[
            socket.id
          ];
        }

        socket.leave(
          getSocketRoomName(
            room.id
          )
        );

        /*
         * 방장이 나가면 다음 플레이어를 방장으로 지정.
         */
        if (
          room.hostId ===
          socket.id
        ) {
          room.hostId =
            room.players[
              0
            ] ??
            null;
        }

        if (
          room.players.length ===
          0
        ) {
          delete devilRooms[
            room.id
          ];

          broadcastRoomList();
        } else {
          broadcastRoomUpdate(
            room
          );
        }

        callback?.({
          ok: true,
        });
      }
    );

    /* =====================================================
       Ready Toggle
    ===================================================== */

    socket.on(
      "devilRoom:ready",
      (
        payload = {},
        callback
      ) => {
        const room =
          findPlayerRoom(
            socket.id
          );

        if (!room) {
          callback?.({
            ok: false,
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
            ok: false,
            message:
              "현재 준비 상태를 변경할 수 없습니다.",
          });

          return;
        }

        room.ready[
          socket.id
        ] =
          !Boolean(
            room.ready[
              socket.id
            ]
          );

        callback?.({
          ok: true,

          ready:
            room.ready[
              socket.id
            ],
        });

        broadcastRoomUpdate(
          room
        );
      }
    );

    /* =====================================================
       Start Devil Game
    ===================================================== */

    socket.on(
      "devilRoom:start",
      (
        payload = {},
        callback
      ) => {
        const room =
          findPlayerRoom(
            socket.id
          );

        if (!room) {
          callback?.({
            ok: false,
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
            ok: false,
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
            ok: false,
            message:
              "이미 게임이 시작 중입니다.",
          });

          return;
        }

        if (
          room.players.length <
          DEVIL_GAME_MIN_PLAYERS
        ) {
          callback?.({
            ok: false,
            message:
              `최소 ${DEVIL_GAME_MIN_PLAYERS}명이 필요합니다.`,
          });

          return;
        }

        /*
         * 서버에서도 5명을 초과하는 방은 시작 불가.
         */
        if (
          room.players.length >
          DEVIL_GAME_MAX_PLAYERS
        ) {
          callback?.({
            ok: false,
            message:
              `게임은 최대 ${DEVIL_GAME_MAX_PLAYERS}명까지 가능합니다.`,
          });

          return;
        }

        const allReady =
          room.players.every(
            playerSocketId =>
              room.ready?.[
                playerSocketId
              ] ===
              true
          );

        if (
          !allReady
        ) {
          callback?.({
            ok: false,
            message:
              "모든 참가자가 준비해야 게임을 시작할 수 있습니다.",
          });

          return;
        }

        room.status =
          "countdown";

        room.countdownEndsAt =
          Date.now() +
          POTATO_WAR_START_COUNTDOWN_MS;

        room.roles =
          assignRoles(
            room
          );

        callback?.({
          ok: true,

          countdownEndsAt:
            room.countdownEndsAt,
        });

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
            "devilRoom:countdown",
            {
              roomId:
                room.id,

              countdownEndsAt:
                room.countdownEndsAt,
            }
          );

        setTimeout(
          () => {
            const currentRoom =
              devilRooms[
                room.id
              ];

            if (
              !currentRoom ||
              currentRoom.status !==
                "countdown"
            ) {
              return;
            }

            /*
             * 카운트다운 중 누군가 빠져
             * 최소 인원보다 적어졌다면 시작 취소.
             */
            if (
              currentRoom.players
                .length <
              DEVIL_GAME_MIN_PLAYERS
            ) {
              currentRoom.status =
                "waiting";

              currentRoom.countdownEndsAt =
                null;

              currentRoom.roles =
                null;

              broadcastRoomUpdate(
                currentRoom
              );

              return;
            }

            currentRoom.status =
              "playing";

            currentRoom.countdownEndsAt =
              null;

            createGameRuntime(
              currentRoom
            );

            io
              .to(
                getSocketRoomName(
                  currentRoom.id
                )
              )
              .emit(
                "devilGame:started",
                {
                  roomId:
                    currentRoom.id,
                }
              );

            broadcastGameState(
              currentRoom
            );

            broadcastRoomList();

            console.log(
              `🎮 감자전쟁 시작: ${currentRoom.id} / ${currentRoom.players.length}명`
            );
          },
          POTATO_WAR_START_COUNTDOWN_MS
        );
      }
    );

    /* =====================================================
       Devil Game Join / Reconnect
    ===================================================== */

    socket.on(
      "devilGame:join",
      (
        payload = {},
        callback
      ) => {
        const roomId =
          String(
            payload.roomId ??
              ""
          )
            .trim()
            .toUpperCase();

        const room =
          devilRooms[
            roomId
          ];

        if (
          !room ||
          (
            room.status !==
              "playing" &&
            room.status !==
              "finished"
          )
        ) {
          callback?.({
            ok: false,
            message:
              "진행 중인 게임방을 찾을 수 없습니다.",
          });

          return;
        }

        const requestedPlayerId =
          String(
            payload.playerId ??
              ""
          ).trim();

        const requestedNickname =
          String(
            payload.nickname ??
              ""
          ).trim();

        let gamePlayer =
          null;

        /*
         * 1순위:
         * 안정적인 playerId로 찾기.
         */
        if (
          requestedPlayerId
        ) {
          gamePlayer =
            Object.values(
              room.gamePlayers ??
                {}
            ).find(
              player =>
                player.id ===
                requestedPlayerId
            ) ??
            null;
        }

        /*
         * 2순위:
         * 기존 소켓 ID.
         */
        if (
          !gamePlayer
        ) {
          gamePlayer =
            Object.values(
              room.gamePlayers ??
                {}
            ).find(
              player =>
                player.connectedSocketId ===
                  socket.id
            ) ??
            null;
        }

        /*
         * 3순위:
         * 닉네임 fallback.
         */
        if (
          !gamePlayer &&
          requestedNickname
        ) {
          gamePlayer =
            Object.values(
              room.gamePlayers ??
                {}
            ).find(
              player =>
                player.nickname ===
                  requestedNickname &&
                player.leftGame !==
                  true
            ) ??
            null;
        }

        if (
          !gamePlayer
        ) {
          callback?.({
            ok: false,
            message:
              "게임 참가자 정보를 찾을 수 없습니다.",
          });

          return;
        }

        reconnectGamePlayer(
          room,
          gamePlayer,
          socket
        );

        callback?.({
          ok: true,

          self: {
            id:
              gamePlayer.id,

            nickname:
              gamePlayer.nickname,

            characterStyle:
              gamePlayer.characterStyle,

            role:
              gamePlayer.role,

            state:
              gamePlayer.state,

            x:
              gamePlayer.x,

            y:
              gamePlayer.y,

            direction:
              gamePlayer.direction,

            missionIds:
              gamePlayer.missionIds,

            completedMissionIds:
              gamePlayer.completedMissionIds,

            emergencyMeetingUses:
              Number(
                gamePlayer.emergencyMeetingUses ??
                0
              ),
          },

          state:
            getPublicGameState(
              room
            ),

          blackout:
            getPublicBlackoutState(
              room
            ),
        });

        /*
         * 같은 방의 다른 플레이어에게도
         * 재접속 상태를 갱신.
         */
        broadcastGameState(
          room
        );

        console.log(
          `🔄 감자전쟁 접속: ${room.id} / ${gamePlayer.nickname} / ${gamePlayer.role}`
        );
      }
    );

    /* =====================================================
       Game Movement
    ===================================================== */

    socket.on(
      "devilGame:move",
      payload => {
        const room =
          findGameRoomBySocketId(
            socket.id
          );

        if (
          !room ||
          room.status !==
            "playing"
        ) {
          return;
        }

        if (
          room.meeting?.active
        ) {
          return;
        }

        const gamePlayer =
          findGamePlayerBySocketId(
            room,
            socket.id
          );

        if (!gamePlayer) {
          return;
        }

        const x =
          Number(
            payload.x
          );

        const y =
          Number(
            payload.y
          );

        if (
          !Number.isFinite(
            x
          ) ||
          !Number.isFinite(
            y
          )
        ) {
          return;
        }

        /*
         * 서버에서도 맵 바깥 좌표 방지.
         */
        gamePlayer.x =
          Math.max(
            0,
            Math.min(
              POTATO_WAR_MAP_WIDTH,
              x
            )
          );

        gamePlayer.y =
          Math.max(
            0,
            Math.min(
              POTATO_WAR_MAP_HEIGHT,
              y
            )
          );

        gamePlayer.moving =
          Boolean(
            payload.moving
          );

        gamePlayer.direction =
          payload.direction ??
          gamePlayer.direction ??
          "down";

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
                gamePlayer.id,

              x:
                gamePlayer.x,

              y:
                gamePlayer.y,

              moving:
                gamePlayer.moving,

              direction:
                gamePlayer.direction,
            }
          );
      }
    );

    /* =====================================================
       Devil Blackout

       클라이언트 요청:
       emit("devilGame:blackout")

       서버 전달:
       emit("devilGame:blackout-changed")
    ===================================================== */

    socket.on(
      "devilGame:blackout",
      (
        payload = {},
        callback
      ) => {
        const room =
          findGameRoomBySocketId(
            socket.id
          );

        if (!room) {
          callback?.({
            ok: false,
            message:
              "진행 중인 게임방을 찾을 수 없습니다.",
          });

          return;
        }

        const gamePlayer =
          findGamePlayerBySocketId(
            room,
            socket.id
          );

        const permission =
          canUseBlackout(
            room,
            gamePlayer
          );

        if (
          !permission.ok
        ) {
          callback?.(
            permission
          );

          return;
        }

        const requestedRoomId =
          String(
            payload.roomId ??
              ""
          )
            .trim()
            .toUpperCase();

        if (
          requestedRoomId &&
          requestedRoomId !==
            String(
              room.id
            ).toUpperCase()
        ) {
          callback?.({
            ok: false,
            message:
              "게임방 정보가 일치하지 않습니다.",
          });

          return;
        }

        const blackout =
          ensureBlackoutState(
            room
          );

        const now =
          Date.now();

        /*
         * 현재 OFF라면 ON.
         */
        if (
          !blackout.active
        ) {
          blackout.active =
            true;

          blackout.activatedBy =
            gamePlayer.id;

          blackout.changedAt =
            now;

          /*
           * 다음 정전 ON 가능 시각.
           * 현재 정전을 끄는 것은 언제든 가능.
           */
          blackout.cooldownEndsAt =
            now +
            POTATO_WAR_BLACKOUT_COOLDOWN_MS;

          console.log(
            `🌑 정전 ON: ${room.id} / ${gamePlayer.nickname}`
          );
        } else {
          /*
           * 현재 ON이라면 OFF.
           */
          blackout.active =
            false;

          blackout.activatedBy =
            null;

          blackout.changedAt =
            now;

          console.log(
            `💡 정전 OFF: ${room.id} / ${gamePlayer.nickname}`
          );
        }

        /*
         * 같은 게임방의 PC/모바일 참가자 모두에게
         * 동일한 정전 상태를 전달한다.
         *
         * 실제 화면을 어둡게 하는 것은
         * DevilGameWorld에서 survivor만 처리.
         */
        broadcastBlackout(
          room
        );

        callback?.({
          ok: true,

          active:
            Boolean(
              blackout.active
            ),

          cooldownEndsAt:
            Number(
              blackout.cooldownEndsAt ??
              0
            ),
        });
      }
    );

    /* =====================================================
       Mission Complete
    ===================================================== */

    socket.on(
      "devilGame:mission-complete",
      (
        payload = {},
        callback
      ) => {
        const room =
          findGameRoomBySocketId(
            socket.id
          );

        if (!room) {
          callback?.({
            ok: false,
            message:
              "게임방을 찾을 수 없습니다.",
          });

          return;
        }

        if (
          room.status !==
          "playing"
        ) {
          callback?.({
            ok: false,
            message:
              "현재 게임이 진행 중이 아닙니다.",
          });

          return;
        }

        if (
          room.meeting?.active
        ) {
          callback?.({
            ok: false,
            message:
              "회의 중에는 미션을 완료할 수 없습니다.",
          });

          return;
        }

        const gamePlayer =
          findGamePlayerBySocketId(
            room,
            socket.id
          );

        if (!gamePlayer) {
          callback?.({
            ok: false,
            message:
              "게임 참가자를 찾을 수 없습니다.",
          });

          return;
        }

        if (
          gamePlayer.role !==
          "survivor"
        ) {
          callback?.({
            ok: false,
            message:
              "생존자 감자만 미션을 완료할 수 있습니다.",
          });

          return;
        }

        if (
          gamePlayer.state !==
          "alive"
        ) {
          callback?.({
            ok: false,
            message:
              "사망한 감자는 미션을 진행할 수 없습니다.",
          });

          return;
        }

        const missionId =
          String(
            payload.missionId ??
              ""
          ).trim();

        if (!missionId) {
          callback?.({
            ok: false,
            message:
              "미션 정보가 없습니다.",
          });

          return;
        }

        const assignedMissions =
          new Set(
            gamePlayer.missionIds ??
              []
          );

        if (
          !assignedMissions.has(
            missionId
          )
        ) {
          callback?.({
            ok: false,
            message:
              "현재 플레이어에게 배정되지 않은 미션입니다.",
          });

          return;
        }

        if (
          gamePlayer.completedMissionIds.includes(
            missionId
          )
        ) {
          callback?.({
            ok: true,

            alreadyCompleted:
              true,

            missionProgress:
              getSurvivorMissionProgress(
                room
              ),
          });

          return;
        }

        gamePlayer.completedMissionIds.push(
          missionId
        );

        const progress =
          getSurvivorMissionProgress(
            room
          );

        io
          .to(
            getSocketRoomName(
              room.id
            )
          )
          .emit(
            "devilGame:mission-progress",
            progress
          );

        broadcastGameState(
          room
        );

        callback?.({
          ok: true,

          missionId,

          missionProgress:
            progress,
        });

        console.log(
          `✅ 미션 완료: ${room.id} / ${gamePlayer.nickname} / ${missionId} (${progress.completed}/${progress.total})`
        );

        checkDevilGameResult(
          room
        );
      }
    );
        /* =====================================================
       Kill
    ===================================================== */

    socket.on(
      "devilGame:kill",
      (
        payload = {},
        callback
      ) => {
        const room =
          findGameRoomBySocketId(
            socket.id
          );

        if (!room) {
          callback?.({
            ok: false,
            message:
              "게임방을 찾을 수 없습니다.",
          });

          return;
        }

        if (
          room.status !==
          "playing"
        ) {
          callback?.({
            ok: false,
            message:
              "현재 게임이 진행 중이 아닙니다.",
          });

          return;
        }

        if (
          room.meeting?.active
        ) {
          callback?.({
            ok: false,
            message:
              "회의 중에는 처치할 수 없습니다.",
          });

          return;
        }

        const killer =
          findGamePlayerBySocketId(
            room,
            socket.id
          );

        if (
          !killer ||
          killer.role !==
            "devil" ||
          killer.state !==
            "alive"
        ) {
          callback?.({
            ok: false,
            message:
              "현재 처치할 수 없습니다.",
          });

          return;
        }

        const targetId =
          String(
            payload.targetId ??
              ""
          ).trim();

        if (!targetId) {
          callback?.({
            ok: false,
            message:
              "처치 대상을 찾을 수 없습니다.",
          });

          return;
        }

        const victim =
          findGamePlayerById(
            room,
            targetId
          );

        if (!victim) {
          callback?.({
            ok: false,
            message:
              "처치 대상을 찾을 수 없습니다.",
          });

          return;
        }

        if (
          victim.id ===
          killer.id
        ) {
          callback?.({
            ok: false,
            message:
              "자기 자신은 처치할 수 없습니다.",
          });

          return;
        }

        if (
          victim.role ===
          "devil"
        ) {
          callback?.({
            ok: false,
            message:
              "다른 악마 감자는 처치할 수 없습니다.",
          });

          return;
        }

        if (
          victim.state !==
          "alive"
        ) {
          callback?.({
            ok: false,
            message:
              "이미 사망한 대상입니다.",
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
            ok: false,
            message:
              "대상이 너무 멀리 있습니다.",
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
          const remaining =
            POTATO_WAR_KILL_COOLDOWN_MS -
            elapsed;

          callback?.({
            ok: false,

            message:
              `처치 쿨타임이 ${Math.ceil(
                remaining /
                  1000
              )}초 남았습니다.`,
          });

          return;
        }

        killer.lastKillAt =
          now;

        victim.state =
          "ghost";

        victim.moving =
          false;

        const corpse = {
          id:
            `corpse-${createId()}`,

          victimId:
            victim.id,

          victimNickname:
            victim.nickname,

          characterStyle:
            victim.characterStyle,

          x:
            victim.x,

          y:
            victim.y,

          createdAt:
            now,

          reported:
            false,
        };

        room.corpses.push(
          corpse
        );

        io
          .to(
            getSocketRoomName(
              room.id
            )
          )
          .emit(
            "devilGame:killed",
            {
              killerId:
                killer.id,

              victimId:
                victim.id,

              corpse,

              killCooldownEndsAt:
                now +
                POTATO_WAR_KILL_COOLDOWN_MS,
            }
          );

        broadcastGameState(
          room
        );

        callback?.({
          ok: true,

          corpse,

          killCooldownEndsAt:
            now +
            POTATO_WAR_KILL_COOLDOWN_MS,
        });

        console.log(
          `🔪 처치: ${room.id} / ${killer.nickname} -> ${victim.nickname}`
        );

        checkDevilGameResult(
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
          findGameRoomBySocketId(
            socket.id
          );

        if (!room) {
          callback?.({
            ok: false,
            message:
              "게임방을 찾을 수 없습니다.",
          });

          return;
        }

        if (
          room.status !==
          "playing"
        ) {
          callback?.({
            ok: false,
            message:
              "현재 게임이 진행 중이 아닙니다.",
          });

          return;
        }

        if (
          room.meeting?.active
        ) {
          callback?.({
            ok: false,
            message:
              "이미 회의가 진행 중입니다.",
          });

          return;
        }

        const reporter =
          findGamePlayerBySocketId(
            room,
            socket.id
          );

        if (
          !reporter ||
          reporter.state !==
            "alive"
        ) {
          callback?.({
            ok: false,
            message:
              "살아있는 감자만 신고할 수 있습니다.",
          });

          return;
        }

        const requestedCorpseId =
          String(
            payload.corpseId ??
              ""
          ).trim();

        let corpse =
          null;

        if (
          requestedCorpseId
        ) {
          const candidate =
            findCorpseById(
              room,
              requestedCorpseId
            );

          if (
            candidate &&
            !candidate.reported
          ) {
            const distance =
              getDistance(
                reporter,
                candidate
              );

            if (
              distance <=
              POTATO_WAR_REPORT_DISTANCE
            ) {
              corpse =
                candidate;
            }
          }
        }

        if (!corpse) {
          corpse =
            getNearestReportableCorpse(
              room,
              reporter
            );
        }

        if (!corpse) {
          callback?.({
            ok: false,
            message:
              "근처에 신고할 수 있는 시체가 없습니다.",
          });

          return;
        }

        const result =
          startMeeting(
            room,
            reporter,
            {
              kind:
                "corpse",

              corpse,
            }
          );

        callback?.(
          result
        );

        if (
          result.ok
        ) {
          console.log(
            `📢 시체 신고: ${room.id} / ${reporter.nickname} -> ${corpse.victimNickname}`
          );
        }
      }
    );

    /* =====================================================
       Legacy Report Compatibility
    ===================================================== */

    socket.on(
      "devilGame:report",
      (
        payload = {},
        callback
      ) => {
        const room =
          findGameRoomBySocketId(
            socket.id
          );

        if (!room) {
          callback?.({
            ok: false,
            message:
              "게임방을 찾을 수 없습니다.",
          });

          return;
        }

        const reporter =
          findGamePlayerBySocketId(
            room,
            socket.id
          );

        if (
          !reporter ||
          reporter.state !==
            "alive"
        ) {
          callback?.({
            ok: false,
            message:
              "살아있는 감자만 신고할 수 있습니다.",
          });

          return;
        }

        let corpse =
          null;

        const requestedCorpseId =
          String(
            payload.corpseId ??
              ""
          ).trim();

        if (
          requestedCorpseId
        ) {
          corpse =
            findCorpseById(
              room,
              requestedCorpseId
            );
        }

        if (
          !corpse ||
          corpse.reported
        ) {
          corpse =
            getNearestReportableCorpse(
              room,
              reporter
            );
        }

        if (!corpse) {
          callback?.({
            ok: false,
            message:
              "근처에 신고할 수 있는 시체가 없습니다.",
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
            ok: false,
            message:
              "시체에서 너무 멀리 떨어져 있습니다.",
          });

          return;
        }

        const result =
          startMeeting(
            room,
            reporter,
            {
              kind:
                "corpse",

              corpse,
            }
          );

        callback?.(
          result
        );
      }
    );

    /* =====================================================
       Emergency Meeting
    ===================================================== */

    socket.on(
      "devilGame:emergency-meeting",
      (
        payload = {},
        callback
      ) => {
        const room =
          findGameRoomBySocketId(
            socket.id
          );

        if (!room) {
          callback?.({
            ok: false,
            message:
              "게임방을 찾을 수 없습니다.",
          });

          return;
        }

        if (
          room.status !==
          "playing"
        ) {
          callback?.({
            ok: false,
            message:
              "현재 게임이 진행 중이 아닙니다.",
          });

          return;
        }

        if (
          room.meeting?.active
        ) {
          callback?.({
            ok: false,
            message:
              "이미 회의가 진행 중입니다.",
          });

          return;
        }

        const reporter =
          findGamePlayerBySocketId(
            room,
            socket.id
          );

        if (
          !reporter ||
          reporter.state !==
            "alive"
        ) {
          callback?.({
            ok: false,
            message:
              "살아있는 감자만 긴급회의를 소집할 수 있습니다.",
          });

          return;
        }

        const currentUses =
          Number(
            reporter.emergencyMeetingUses ??
              0
          );

        if (
          currentUses >=
          POTATO_WAR_EMERGENCY_MEETING_LIMIT
        ) {
          callback?.({
            ok: false,
            message:
              "긴급회의는 게임당 1회만 사용할 수 있습니다.",
          });

          return;
        }

        const distance =
          getDistance(
            reporter,
            POTATO_WAR_EMERGENCY_MEETING_POSITION
          );

        if (
          distance >
          POTATO_WAR_EMERGENCY_MEETING_DISTANCE
        ) {
          callback?.({
            ok: false,
            message:
              "회의 테이블 근처에서만 긴급회의를 소집할 수 있습니다.",
          });

          return;
        }

        reporter.emergencyMeetingUses =
          currentUses +
          1;

        const result =
          startMeeting(
            room,
            reporter,
            {
              kind:
                "emergency",
            }
          );

        if (
          !result.ok
        ) {
          reporter.emergencyMeetingUses =
            currentUses;

          callback?.(
            result
          );

          return;
        }

        broadcastGameState(
          room
        );

        callback?.({
          ok: true,

          meeting:
            getPublicMeeting(
              room
            ),

          emergencyMeetingUses:
            reporter.emergencyMeetingUses,
        });

        console.log(
          `🚨 긴급회의: ${room.id} / ${reporter.nickname}`
        );
      }
    );

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
          findGameRoomBySocketId(
            socket.id
          );

        if (!room) {
          callback?.({
            ok: false,
            message:
              "게임방을 찾을 수 없습니다.",
          });

          return;
        }

        const meeting =
          room.meeting;

        if (
          !meeting ||
          !meeting.active
        ) {
          callback?.({
            ok: false,
            message:
              "현재 진행 중인 회의가 없습니다.",
          });

          return;
        }

        if (
          meeting.phase ===
          "result"
        ) {
          callback?.({
            ok: false,
            message:
              "투표 결과가 표시 중입니다.",
          });

          return;
        }

        const player =
          findGamePlayerBySocketId(
            room,
            socket.id
          );

        if (!player) {
          callback?.({
            ok: false,
            message:
              "플레이어 정보를 찾을 수 없습니다.",
          });

          return;
        }

        if (
          player.state !==
          "alive"
        ) {
          callback?.({
            ok: false,
            message:
              "사망한 감자는 회의 채팅을 사용할 수 없습니다.",
          });

          return;
        }

        const text =
          String(
            payload.text ??
            payload.message ??
              ""
          )
            .trim()
            .slice(
              0,
              300
            );

        if (!text) {
          callback?.({
            ok: false,
            message:
              "메시지를 입력해주세요.",
          });

          return;
        }

        const message =
          createMeetingMessage(
            player,
            text
          );

        meeting.messages.push(
          message
        );

        if (
          meeting.messages.length >
          100
        ) {
          meeting.messages.shift();
        }

        io
          .to(
            getSocketRoomName(
              room.id
            )
          )
          .emit(
            "devilGame:meeting-message",
            message
          );

        callback?.({
          ok: true,

          message,
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
          findGameRoomBySocketId(
            socket.id
          );

        if (!room) {
          callback?.({
            ok: false,
            message:
              "게임방을 찾을 수 없습니다.",
          });

          return;
        }

        const meeting =
          room.meeting;

        if (
          !meeting ||
          !meeting.active
        ) {
          callback?.({
            ok: false,
            message:
              "현재 진행 중인 회의가 없습니다.",
          });

          return;
        }

        if (
          meeting.phase !==
          "voting"
        ) {
          callback?.({
            ok: false,
            message:
              "현재는 투표 시간이 아닙니다.",
          });

          return;
        }

        const voter =
          findGamePlayerBySocketId(
            room,
            socket.id
          );

        if (
          !voter ||
          voter.state !==
            "alive"
        ) {
          callback?.({
            ok: false,
            message:
              "살아있는 감자만 투표할 수 있습니다.",
          });

          return;
        }

        if (
          Object.prototype.hasOwnProperty.call(
            meeting.votes ??
              {},
            voter.id
          )
        ) {
          callback?.({
            ok: false,
            message:
              "이미 투표했습니다.",
          });

          return;
        }

        const rawTargetId =
          payload.targetId ??
          payload.playerId ??
          "skip";

        const targetId =
          String(
            rawTargetId
          ).trim() ||
          "skip";

        if (
          targetId !==
          "skip"
        ) {
          const target =
            findGamePlayerById(
              room,
              targetId
            );

          if (
            !target ||
            target.state !==
              "alive"
          ) {
            callback?.({
              ok: false,
              message:
                "투표할 수 없는 대상입니다.",
            });

            return;
          }
        }

        meeting.votes[
          voter.id
        ] =
          targetId;

        io
          .to(
            getSocketRoomName(
              room.id
            )
          )
          .emit(
            "devilGame:meeting-voted",
            {
              playerId:
                voter.id,

              voterId:
                voter.id,
            }
          );

        broadcastMeeting(
          room
        );

        callback?.({
          ok: true,
        });

        if (
          allEligiblePlayersVoted(
            room
          )
        ) {
          finishMeetingVoting(
            room
          );
        }
      }
    );

    /* =====================================================
       Get Game State
    ===================================================== */

    socket.on(
      "devilGame:get-state",
      (
        payload = {},
        callback
      ) => {
        const roomId =
          String(
            payload.roomId ??
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
            ok: false,
            message:
              "게임방을 찾을 수 없습니다.",
          });

          return;
        }

        const gamePlayer =
          findGamePlayerBySocketId(
            room,
            socket.id
          ) ??
          findGamePlayerById(
            room,
            String(
              payload.playerId ??
                ""
            ).trim()
          );

        if (!gamePlayer) {
          callback?.({
            ok: false,
            message:
              "게임 참가자를 찾을 수 없습니다.",
          });

          return;
        }

        callback?.({
          ok: true,

          role:
            gamePlayer.role,

          playerId:
            gamePlayer.id,

          missionIds:
            gamePlayer.missionIds,

          completedMissionIds:
            gamePlayer.completedMissionIds,

          gameState:
            getPublicGameState(
              room
            ),

          blackout:
            getPublicBlackoutState(
              room
            ),
        });
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
            payload.roomId ??
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
              candidate =>
                candidate.gamePlayers &&
                Object.values(
                  candidate.gamePlayers
                ).some(
                  player =>
                    player.connectedSocketId ===
                      socket.id
                )
            ) ??
            null;
        }

        if (!room) {
          callback?.({
            ok: true,
          });

          return;
        }

        const gamePlayer =
          findGamePlayerBySocketId(
            room,
            socket.id
          ) ??
          Object.values(
            room.gamePlayers ??
              {}
          ).find(
            player =>
              player.connectedSocketId ===
                socket.id
          ) ??
          null;

        if (
          gamePlayer
        ) {
          gamePlayer.returnedToOffice =
            true;

          gamePlayer.leftGame =
            true;

          gamePlayer.moving =
            false;
        }

        socket.leave(
          getSocketRoomName(
            room.id
          )
        );

        callback?.({
          ok: true,
        });

        io.emit(
          "office:players",
          getPublicOfficePlayers()
        );

        const remaining =
          Object.values(
            room.gamePlayers ??
              {}
          ).filter(
            player =>
              player.leftGame !==
              true
          );

        if (
          remaining.length ===
          0
        ) {
          clearMeetingTimers(
            room
          );

          delete devilRooms[
            room.id
          ];

          broadcastRoomList();

          console.log(
            `🧹 감자전쟁 방 제거: ${room.id}`
          );

          return;
        }

        broadcastGameState(
          room
        );

        console.log(
          `🏢 사무실 복귀: ${room.id} / ${
            gamePlayer?.nickname ??
            socket.id
          }`
        );
      }
    );

    /* =====================================================
       Legacy Return Compatibility
    ===================================================== */

    socket.on(
      "devilGame:returnOffice",
      (
        payload = {},
        callback
      ) => {
        const requestedRoomId =
          String(
            payload.roomId ??
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
              candidate =>
                Object.values(
                  candidate.gamePlayers ??
                    {}
                ).some(
                  player =>
                    player.connectedSocketId ===
                      socket.id
                )
            ) ??
            null;
        }

        if (!room) {
          callback?.({
            ok: true,
          });

          return;
        }

        const gamePlayer =
          Object.values(
            room.gamePlayers ??
              {}
          ).find(
            player =>
              player.connectedSocketId ===
              socket.id
          );

        if (
          gamePlayer
        ) {
          gamePlayer.returnedToOffice =
            true;

          gamePlayer.leftGame =
            true;

          gamePlayer.moving =
            false;
        }

        socket.leave(
          getSocketRoomName(
            room.id
          )
        );

        callback?.({
          ok: true,
        });

        io.emit(
          "office:players",
          getPublicOfficePlayers()
        );

        const remaining =
          Object.values(
            room.gamePlayers ??
              {}
          ).filter(
            player =>
              player.leftGame !==
              true
          );

        if (
          remaining.length ===
          0
        ) {
          clearMeetingTimers(
            room
          );

          delete devilRooms[
            room.id
          ];

          broadcastRoomList();

          return;
        }

        broadcastGameState(
          room
        );
      }
    );
        /* =====================================================
       Disconnect
    ===================================================== */

    socket.on(
      "disconnect",
      reason => {
        console.log(
          "🔴 Socket disconnected:",
          socket.id,
          reason
        );

        /*
         * 현재 게임 중인 플레이어인지 먼저 확인한다.
         *
         * 게임 중이라면 페이지 이동 / 새로고침 등으로
         * Socket ID가 잠시 바뀔 수 있으므로
         * 바로 게임에서 제거하지 않는다.
         */
        const activeGameRoom =
          Object.values(
            devilRooms
          ).find(
            room =>
              room.gamePlayers &&
              Object.values(
                room.gamePlayers
              ).some(
                gamePlayer =>
                  gamePlayer.connectedSocketId ===
                    socket.id &&
                  gamePlayer.leftGame !==
                    true
              )
          ) ??
          null;

        let disconnectedGamePlayer =
          null;

        if (
          activeGameRoom
        ) {
          disconnectedGamePlayer =
            Object.values(
              activeGameRoom.gamePlayers ??
                {}
            ).find(
              gamePlayer =>
                gamePlayer.connectedSocketId ===
                socket.id &&
              gamePlayer.leftGame !==
                true
            ) ??
            null;
        }

        /*
         * 게임 중 플레이어.
         */
        if (
          activeGameRoom &&
          disconnectedGamePlayer
        ) {
          const roomId =
            activeGameRoom.id;

          const playerId =
            disconnectedGamePlayer.id;

          /*
           * 일단 연결만 끊긴 상태로 만든다.
           *
           * leftGame은 아직 true로 만들지 않는다.
           * 15초 안에 재접속하면 기존 플레이어를 그대로 복구한다.
           */
          disconnectedGamePlayer.connectedSocketId =
            null;

          disconnectedGamePlayer.moving =
            false;

          console.log(
            `⏳ 재접속 대기: ${roomId} / ${disconnectedGamePlayer.nickname}`
          );

          broadcastGameState(
            activeGameRoom
          );

          setTimeout(
            () => {
              const room =
                devilRooms[
                  roomId
                ];

              if (
                !room ||
                !room.gamePlayers
              ) {
                return;
              }

              const gamePlayer =
                findGamePlayerById(
                  room,
                  playerId
                );

              if (
                !gamePlayer
              ) {
                return;
              }

              /*
               * 새로운 Socket ID로 이미 재접속했다면
               * 아무것도 하지 않는다.
               */
              if (
                gamePlayer.connectedSocketId
              ) {
                console.log(
                  `🔄 재접속 성공: ${roomId} / ${gamePlayer.nickname}`
                );

                return;
              }

              /*
               * 유예시간 동안 돌아오지 않았다면
               * 실제 게임 이탈로 처리한다.
               */
              gamePlayer.leftGame =
                true;

              gamePlayer.moving =
                false;

              console.log(
                `🚪 게임 이탈 처리: ${roomId} / ${gamePlayer.nickname}`
              );

              /*
               * 회의 중이었다면
               * 해당 플레이어가 아직 투표하지 않았어도
               * 남은 플레이어만으로 전원 투표 여부를 다시 검사.
               */
              if (
                room.meeting?.active &&
                room.meeting.phase ===
                  "voting" &&
                allEligiblePlayersVoted(
                  room
                )
              ) {
                finishMeetingVoting(
                  room
                );
              }

              broadcastGameState(
                room
              );

              /*
               * 플레이어 이탈로
               * 생존자/악마 숫자가 바뀌었으므로
               * 승패를 다시 확인한다.
               */
              checkDevilGameResult(
                room
              );

              /*
               * 게임에 남은 플레이어가 없다면
               * 방을 제거한다.
               */
              const remainingPlayers =
                Object.values(
                  room.gamePlayers ??
                    {}
                ).filter(
                  player =>
                    player.leftGame !==
                      true
                );

              if (
                remainingPlayers.length ===
                0
              ) {
                clearMeetingTimers(
                  room
                );

                delete devilRooms[
                  room.id
                ];

                broadcastRoomList();

                console.log(
                  `🧹 빈 게임방 제거: ${room.id}`
                );
              }
            },
            POTATO_WAR_RECONNECT_GRACE_MS
          );
        } else {
          /*
           * 실제 게임 중이 아니라
           * 로비에서 연결이 끊어진 경우.
           */
          const lobbyRoom =
            findPlayerRoom(
              socket.id
            );

          if (
            lobbyRoom
          ) {
            lobbyRoom.players =
              lobbyRoom.players.filter(
                playerSocketId =>
                  playerSocketId !==
                  socket.id
              );

            if (
              lobbyRoom.ready
            ) {
              delete lobbyRoom.ready[
                socket.id
              ];
            }

            if (
              lobbyRoom.roles
            ) {
              delete lobbyRoom.roles[
                socket.id
              ];
            }

            /*
             * 방장이 나갔다면
             * 다음 참가자를 방장으로 지정.
             */
            if (
              lobbyRoom.hostId ===
              socket.id
            ) {
              lobbyRoom.hostId =
                lobbyRoom.players[
                  0
                ] ??
                null;
            }

            /*
             * 카운트다운 중 플레이어가 나가
             * 최소 인원 미만이 되면 시작 취소.
             */
            if (
              lobbyRoom.status ===
                "countdown" &&
              lobbyRoom.players.length <
                DEVIL_GAME_MIN_PLAYERS
            ) {
              lobbyRoom.status =
                "waiting";

              lobbyRoom.countdownEndsAt =
                null;

              lobbyRoom.roles =
                null;
            }

            if (
              lobbyRoom.players.length ===
              0
            ) {
              delete devilRooms[
                lobbyRoom.id
              ];

              broadcastRoomList();

              console.log(
                `🧹 빈 로비 제거: ${lobbyRoom.id}`
              );
            } else {
              broadcastRoomUpdate(
                lobbyRoom
              );
            }
          }
        }

        /*
         * 일반 사무실 플레이어 목록에서도 제거.
         */
        const officePlayer =
          players[
            socket.id
          ];

        if (
          officePlayer
        ) {
          delete players[
            socket.id
          ];

          /*
           * 실제 게임 중 잠깐 연결이 끊어진 플레이어는
           * gamePlayers 안에 정보가 따로 남아있으므로
           * 게임 재접속에는 영향을 주지 않는다.
           */
          io.emit(
            "office:player-left",
            {
              id:
                socket.id,
            }
          );

          io.emit(
            "office:players",
            getPublicOfficePlayers()
          );
        }
      }
    );
  }
);

/* =========================================================
   HTTP Routes
========================================================= */

app.get(
  "/",
  (
    req,
    res
  ) => {
    res.json({
      ok: true,

      name:
        "Gamja Office Socket Server",

      message:
        "🥔 Gamja Office server is running.",

      connectedPlayers:
        Object.keys(
          players
        ).length,

      devilRooms:
        Object.keys(
          devilRooms
        ).length,

      timestamp:
        Date.now(),
    });
  }
);

app.get(
  "/health",
  (
    req,
    res
  ) => {
    res.status(
      200
    ).json({
      ok: true,

      status:
        "healthy",

      connectedPlayers:
        Object.keys(
          players
        ).length,

      devilRooms:
        Object.keys(
          devilRooms
        ).length,

      timestamp:
        Date.now(),
    });
  }
);

/* =========================================================
   Debug Room Endpoint
========================================================= */

app.get(
  "/debug/rooms",
  (
    req,
    res
  ) => {
    /*
     * 역할 정보 같은 민감한 게임 정보는
     * 공개하지 않고 로비 정보만 반환한다.
     */
    res.json({
      ok: true,

      rooms:
        getPublicRooms(),

      count:
        Object.keys(
          devilRooms
        ).length,
    });
  }
);

/* =========================================================
   Error Handling
========================================================= */

process.on(
  "uncaughtException",
  error => {
    console.error(
      "❌ uncaughtException:",
      error
    );
  }
);

process.on(
  "unhandledRejection",
  error => {
    console.error(
      "❌ unhandledRejection:",
      error
    );
  }
);

/* =========================================================
   Graceful Shutdown
========================================================= */

function shutdown(
  signal
) {
  console.log(
    `🛑 ${signal} received. Server shutting down...`
  );

  /*
   * 연결된 클라이언트에게
   * 서버 종료 예정임을 알려준다.
   */
  io.emit(
    "server:shutdown",
    {
      message:
        "서버가 재시작됩니다.",

      timestamp:
        Date.now(),
    }
  );

  server.close(
    () => {
      console.log(
        "✅ HTTP server closed."
      );

      process.exit(
        0
      );
    }
  );

  /*
   * 정상 종료가 지연될 경우
   * 강제 종료.
   */
  setTimeout(
    () => {
      console.error(
        "⚠️ Forced server shutdown."
      );

      process.exit(
        1
      );
    },
    10_000
  ).unref();
}

process.on(
  "SIGTERM",
  () => {
    shutdown(
      "SIGTERM"
    );
  }
);

process.on(
  "SIGINT",
  () => {
    shutdown(
      "SIGINT"
    );
  }
);

/* =========================================================
   Start Server
========================================================= */

server.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      "=========================================="
    );

    console.log(
      "🥔 Gamja Office Socket Server"
    );

    console.log(
      `🚀 Server running on port ${PORT}`
    );

    console.log(
      `😈 Potato War players: ${DEVIL_GAME_MIN_PLAYERS} ~ ${DEVIL_GAME_MAX_PLAYERS}`
    );

    console.log(
      `🌑 Blackout event: devilGame:blackout -> devilGame:blackout-changed`
    );

    console.log(
      "=========================================="
    );
  }
);