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
      "devilGame:blackout",
      getPublicBlackoutState(
        room
      )
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
    "devilGame:blackout",
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

function getAliveSurvivors(room) {
  return getAliveGamePlayers(room).filter(
    (player) => player.role === "survivor"
  );
}

function getAliveDevils(room) {
  return getAliveGamePlayers(room).filter(
    (player) => player.role === "devil"
  );
}

function getGameWinners(room, winningTeam) {
  return Object.values(room?.gamePlayers ?? {})
    .filter(
      (player) =>
        player.leftGame !== true &&
        player.role === winningTeam
    )
    .map((player) => ({
      id: player.id,
      nickname: player.nickname,
      characterStyle: player.characterStyle,
      role: player.role,
    }));
}

function finishDevilGame(room, winningTeam, reason) {
  if (!room || room.status !== "playing") {
    return;
  }

  room.status = "finished";

  /*
   * 게임 종료 시 정전을 반드시 해제한다.
   */
  room.blackout = {
    active: false,
    activatedBy: null,
    changedAt: Date.now(),
    cooldownEndsAt: 0,
  };

  if (room.meeting) {
    room.meeting.active = false;
  }

  const result = {
    winningTeam,
    reason,
    winners: getGameWinners(room, winningTeam),
  };

  room.gameResult = result;

  io.to(getSocketRoomName(room.id)).emit(
    "devilGame:blackout",
    getPublicBlackoutState(room)
  );

  io.to(getSocketRoomName(room.id)).emit(
    "devilGame:result",
    result
  );

  broadcastRoomList();

  console.log(
    `🏁 감자전쟁 종료: ${room.id} / ${winningTeam} / ${reason}`
  );
}

function checkDevilGameResult(room) {
  if (!room || room.status !== "playing") {
    return false;
  }

  const aliveSurvivors = getAliveSurvivors(room);
  const aliveDevils = getAliveDevils(room);

  /*
   * 악마가 모두 제거되면 생존자 승리.
   */
  if (aliveDevils.length === 0) {
    finishDevilGame(
      room,
      "survivor",
      "모든 악마 감자가 제거되었습니다!"
    );

    return true;
  }

  /*
   * 생존자가 모두 사망하면 악마 승리.
   */
  if (aliveSurvivors.length === 0) {
    finishDevilGame(
      room,
      "devil",
      "모든 생존자 감자가 제거되었습니다!"
    );

    return true;
  }

  /*
   * 악마 수가 생존자 수 이상이 되면
   * 생존자들이 더 이상 악마를 투표로 제거할 수 없으므로
   * 악마 승리.
   */
  if (aliveDevils.length >= aliveSurvivors.length) {
    finishDevilGame(
      room,
      "devil",
      "악마 감자가 생존자 감자 수와 같거나 많아졌습니다!"
    );

    return true;
  }

  /*
   * 생존자 개인 미션 전체 달성 확인.
   */
  const progress = getSurvivorMissionProgress(room);

  if (
    progress.total > 0 &&
    progress.completed >= progress.total
  ) {
    finishDevilGame(
      room,
      "survivor",
      "모든 생존자 감자가 미션을 완료했습니다!"
    );

    return true;
  }

  return false;
}

/* =========================================================
   Corpse Helpers
========================================================= */

function createCorpse(room, victim) {
  const corpse = {
    id: `corpse-${createId()}`,
    victimId: victim.id,
    victimNickname: victim.nickname,
    characterStyle: victim.characterStyle,
    x: victim.x,
    y: victim.y,
    createdAt: Date.now(),
    reported: false,
  };

  room.corpses.push(corpse);

  return corpse;
}

function findCorpseById(room, corpseId) {
  return (
    (room?.corpses ?? []).find(
      (corpse) => corpse.id === corpseId
    ) ?? null
  );
}

function getNearestReportableCorpse(room, reporter) {
  if (!room || !reporter) {
    return null;
  }

  let nearestCorpse = null;
  let nearestDistance = Infinity;

  for (const corpse of room.corpses ?? []) {
    if (corpse.reported) {
      continue;
    }

    const distance = getDistance(reporter, corpse);

    if (
      distance <= POTATO_WAR_REPORT_DISTANCE &&
      distance < nearestDistance
    ) {
      nearestCorpse = corpse;
      nearestDistance = distance;
    }
  }

  return nearestCorpse;
}

/* =========================================================
   Meeting Helpers
========================================================= */

function clearMeetingTimers(room) {
  if (!room?.meeting) {
    return;
  }

  if (room.meeting.discussionTimer) {
    clearTimeout(room.meeting.discussionTimer);
  }

  if (room.meeting.votingTimer) {
    clearTimeout(room.meeting.votingTimer);
  }

  if (room.meeting.resultTimer) {
    clearTimeout(room.meeting.resultTimer);
  }

  room.meeting.discussionTimer = null;
  room.meeting.votingTimer = null;
  room.meeting.resultTimer = null;
}

function broadcastMeeting(room) {
  if (!room) {
    return;
  }

  io.to(getSocketRoomName(room.id)).emit(
    "devilGame:meeting",
    getPublicMeeting(room)
  );

  broadcastGameState(room);
}

function createMeetingMessage(player, text) {
  return {
    id: `meeting-message-${createId()}`,
    playerId: player.id,
    nickname: player.nickname,
    text,
    createdAt: Date.now(),
  };
}

function startMeetingVoting(room) {
  if (
    !room?.meeting ||
    !room.meeting.active ||
    room.meeting.phase !== "discussion"
  ) {
    return;
  }

  room.meeting.phase = "voting";
  room.meeting.phaseEndsAt =
    Date.now() + POTATO_WAR_VOTING_MS;

  broadcastMeeting(room);

  room.meeting.votingTimer = setTimeout(() => {
    finishMeetingVoting(room);
  }, POTATO_WAR_VOTING_MS);
}

function getEligibleVoters(room) {
  return Object.values(room?.gamePlayers ?? {}).filter(
    (player) =>
      player.leftGame !== true &&
      player.state === "alive"
  );
}

function allEligiblePlayersVoted(room) {
  const eligible = getEligibleVoters(room);

  if (eligible.length === 0) {
    return true;
  }

  const votes = room?.meeting?.votes ?? {};

  return eligible.every((player) =>
    Object.prototype.hasOwnProperty.call(
      votes,
      player.id
    )
  );
}

function calculateVoteResult(room) {
  const meeting = room?.meeting;

  if (!meeting) {
    return {
      ejectedPlayerId: null,
      ejectedPlayer: null,
      skipped: true,
      tie: false,
      counts: {},
      skipVotes: 0,
    };
  }

  const counts = {};
  let skipVotes = 0;

  for (const targetId of Object.values(meeting.votes ?? {})) {
    if (!targetId || targetId === "skip") {
      skipVotes += 1;
      continue;
    }

    counts[targetId] =
      Number(counts[targetId] ?? 0) + 1;
  }

  let highestCount = 0;
  let highestPlayerIds = [];

  for (const [playerId, count] of Object.entries(counts)) {
    if (count > highestCount) {
      highestCount = count;
      highestPlayerIds = [playerId];
    } else if (count === highestCount) {
      highestPlayerIds.push(playerId);
    }
  }

  /*
   * 스킵 표가 최다 득표와 같거나 많으면 추방 없음.
   */
  if (
    skipVotes >= highestCount ||
    highestPlayerIds.length === 0
  ) {
    return {
      ejectedPlayerId: null,
      ejectedPlayer: null,
      skipped: true,
      tie:
        highestCount > 0 &&
        skipVotes === highestCount,
      counts,
      skipVotes,
    };
  }

  /*
   * 플레이어끼리 동률이면 추방 없음.
   */
  if (highestPlayerIds.length !== 1) {
    return {
      ejectedPlayerId: null,
      ejectedPlayer: null,
      skipped: false,
      tie: true,
      counts,
      skipVotes,
    };
  }

  const ejectedPlayerId = highestPlayerIds[0];

  const ejectedPlayer =
    findGamePlayerById(room, ejectedPlayerId);

  return {
    ejectedPlayerId,
    ejectedPlayer,
    skipped: false,
    tie: false,
    counts,
    skipVotes,
  };
}

function finishMeetingVoting(room) {
  if (
    !room?.meeting ||
    !room.meeting.active ||
    room.meeting.phase === "result"
  ) {
    return;
  }

  const meeting = room.meeting;

  if (meeting.votingTimer) {
    clearTimeout(meeting.votingTimer);
    meeting.votingTimer = null;
  }

  const voteResult = calculateVoteResult(room);

  meeting.phase = "result";
  meeting.phaseEndsAt =
    Date.now() + POTATO_WAR_VOTE_RESULT_MS;

  meeting.voteResult = {
    ejectedPlayerId:
      voteResult.ejectedPlayerId,

    ejectedNickname:
      voteResult.ejectedPlayer?.nickname ?? null,

    ejectedRole:
      voteResult.ejectedPlayer?.role ?? null,

    skipped:
      voteResult.skipped,

    tie:
      voteResult.tie,

    counts:
      voteResult.counts,

    skipVotes:
      voteResult.skipVotes,
  };

  if (voteResult.ejectedPlayer) {
    voteResult.ejectedPlayer.state = "dead";
    voteResult.ejectedPlayer.moving = false;
  }

  io.to(getSocketRoomName(room.id)).emit(
    "devilGame:meeting-result",
    meeting.voteResult
  );

  broadcastMeeting(room);

  meeting.resultTimer = setTimeout(() => {
    endMeeting(room);
  }, POTATO_WAR_VOTE_RESULT_MS);
}

function endMeeting(room) {
  if (!room?.meeting) {
    return;
  }

  clearMeetingTimers(room);

  /*
   * 신고된 시체는 회의 종료 후 제거한다.
   */
  if (room.meeting.corpseId) {
    room.corpses = (room.corpses ?? []).filter(
      (corpse) =>
        corpse.id !== room.meeting.corpseId
    );
  }

  room.meeting.active = false;

  const endedMeeting = room.meeting;

  room.meeting = null;

  io.to(getSocketRoomName(room.id)).emit(
    "devilGame:meeting-ended",
    {
      meetingId: endedMeeting.id,
    }
  );

  broadcastGameState(room);

  checkDevilGameResult(room);
}

function startMeeting(room, reporter, options = {}) {
  if (
    !room ||
    !reporter ||
    room.status !== "playing" ||
    room.meeting?.active
  ) {
    return {
      ok: false,
      message: "현재 회의를 시작할 수 없습니다.",
    };
  }

  if (reporter.state !== "alive") {
    return {
      ok: false,
      message: "살아있는 감자만 회의를 시작할 수 있습니다.",
    };
  }

  const kind =
    options.kind === "emergency"
      ? "emergency"
      : "corpse";

  const corpse =
    kind === "corpse"
      ? options.corpse ?? null
      : null;

  if (kind === "corpse" && !corpse) {
    return {
      ok: false,
      message: "신고할 시체를 찾을 수 없습니다.",
    };
  }

  if (corpse) {
    corpse.reported = true;
  }

  /*
   * 회의가 시작되면 정전을 강제로 해제한다.
   * 회의 화면에서 기존 정전이 계속 유지되는 문제를 방지.
   */
  if (room.blackout?.active) {
    room.blackout = {
      active: false,
      activatedBy: null,
      changedAt: Date.now(),
      cooldownEndsAt:
        Number(room.blackout.cooldownEndsAt ?? 0),
    };

    io.to(getSocketRoomName(room.id)).emit(
      "devilGame:blackout",
      getPublicBlackoutState(room)
    );
  }

  room.meeting = {
    id: `meeting-${createId()}`,
    active: true,
    kind,
    phase: "discussion",

    reporterId: reporter.id,
    reporterNickname: reporter.nickname,

    corpseId: corpse?.id ?? null,
    victimId: corpse?.victimId ?? null,

    /*
     * 긴급회의에는 희생자가 없으므로 반드시 null.
     */
    victimNickname:
      corpse?.victimNickname ?? null,

    startedAt: Date.now(),
    phaseEndsAt:
      Date.now() + POTATO_WAR_DISCUSSION_MS,

    messages: [],
    votes: {},
    voteResult: null,

    discussionTimer: null,
    votingTimer: null,
    resultTimer: null,
  };

  broadcastMeeting(room);

  room.meeting.discussionTimer = setTimeout(() => {
    startMeetingVoting(room);
  }, POTATO_WAR_DISCUSSION_MS);

  return {
    ok: true,
    meeting: getPublicMeeting(room),
  };
}

/* =========================================================
   Player Reconnect Helpers
========================================================= */

function findReconnectableGamePlayer(room, nickname) {
  if (!room?.gamePlayers || !nickname) {
    return null;
  }

  const normalizedNickname =
    String(nickname).trim();

  if (!normalizedNickname) {
    return null;
  }

  return (
    Object.values(room.gamePlayers).find(
      (gamePlayer) =>
        gamePlayer.leftGame !== true &&
        gamePlayer.nickname === normalizedNickname
    ) ?? null
  );
}

function reconnectGamePlayer(room, gamePlayer, socket) {
  if (!room || !gamePlayer || !socket) {
    return;
  }

  gamePlayer.connectedSocketId = socket.id;

  socket.join(
    getSocketRoomName(room.id)
  );

  socket.emit(
    "devilGame:state",
    getPublicGameState(room)
  );

  socket.emit(
    "devilGame:blackout",
    getPublicBlackoutState(room)
  );

  if (room.meeting?.active) {
    socket.emit(
      "devilGame:meeting",
      getPublicMeeting(room)
    );
  }

  if (room.gameResult) {
    socket.emit(
      "devilGame:result",
      room.gameResult
    );
  }

  broadcastGameState(room);
}

/* =========================================================
   Remove Lobby Player
========================================================= */

function removePlayerFromLobbyRoom(socketId) {
  const room = findPlayerRoom(socketId);

  if (!room) {
    return;
  }

  room.players = room.players.filter(
    (id) => id !== socketId
  );

  if (room.ready) {
    delete room.ready[socketId];
  }

  if (room.roles) {
    delete room.roles[socketId];
  }

  if (room.hostId === socketId) {
    room.hostId =
      room.players[0] ?? null;
  }

  if (room.players.length === 0) {
    delete devilRooms[room.id];

    broadcastRoomList();
    return;
  }

  broadcastRoomUpdate(room);
}

/* =========================================================
   Socket Connection
========================================================= */

io.on("connection", (socket) => {
  console.log(
    "🟢 Socket connected:",
    socket.id
  );

  /* =======================================================
     Main Office Join
  ======================================================= */

  socket.on(
    "office:join",
    (payload = {}, callback) => {
      const nickname =
        String(
          payload.nickname ?? ""
        ).trim() ||
        `감자-${socket.id.slice(0, 4)}`;

      const characterStyle =
        payload.characterStyle ?? {};

      players[socket.id] = {
        id: socket.id,
        nickname,
        characterStyle,
        x: Number(payload.x ?? 600),
        y: Number(payload.y ?? 400),
        moving: false,
        direction: "down",
      };

      socket.emit(
        "office:players",
        getPublicOfficePlayers()
      );

      socket.broadcast.emit(
        "office:player-joined",
        players[socket.id]
      );

      callback?.({
        ok: true,
        player: players[socket.id],
      });

      console.log(
        "🥔 사무실 입장:",
        nickname,
        socket.id
      );
    }
  );

  /* =======================================================
     Main Office Move
  ======================================================= */

  socket.on(
    "office:move",
    (payload = {}) => {
      const player =
        players[socket.id];

      if (!player) {
        return;
      }

      player.x =
        Number(payload.x ?? player.x);

      player.y =
        Number(payload.y ?? player.y);

      player.moving =
        Boolean(payload.moving);

      if (payload.direction) {
        player.direction =
          payload.direction;
      }

      socket.broadcast.emit(
        "office:player-moved",
        player
      );
    }
  );

  /* =======================================================
     Main Office Chat
  ======================================================= */

  socket.on(
    "office:chat",
    (payload = {}, callback) => {
      const player =
        players[socket.id];

      if (!player) {
        callback?.({
          ok: false,
          message: "플레이어 정보를 찾을 수 없습니다.",
        });

        return;
      }

      const text =
        String(
          payload.text ?? ""
        ).trim();

      if (!text) {
        callback?.({
          ok: false,
          message: "메시지를 입력해주세요.",
        });

        return;
      }

      const message = {
        id: `chat-${createId()}`,
        playerId: player.id,
        nickname: player.nickname,
        text,
        createdAt: Date.now(),
      };

      addChatMessage(message);

      io.emit(
        "office:chat",
        message
      );

      callback?.({
        ok: true,
      });
    }
  );

  /* =======================================================
     Request Room List
  ======================================================= */

  socket.on(
    "devilRooms:list",
    (callback) => {
      callback?.({
        ok: true,
        rooms: getPublicRooms(),
      });
    }
  );

  /* =======================================================
     Create Devil Room
  ======================================================= */

  socket.on(
    "devilRoom:create",
    (payload = {}, callback) => {
      const officePlayer =
        players[socket.id];

      if (!officePlayer) {
        callback?.({
          ok: false,
          message:
            "먼저 사무실에 입장해주세요.",
        });

        return;
      }

      /*
       * 기존 로비방이 있으면 먼저 제거.
       */
      removePlayerFromLobbyRoom(
        socket.id
      );

      const roomId =
        createRoomCode();

      const requestedMaxPlayers =
        Number(
          payload.maxPlayers ??
            DEVIL_GAME_DEFAULT_MAX_PLAYERS
        );

      const maxPlayers =
        Math.max(
          DEVIL_GAME_MIN_PLAYERS,
          Math.min(
            DEVIL_GAME_MAX_PLAYERS,
            Number.isFinite(
              requestedMaxPlayers
            )
              ? requestedMaxPlayers
              : DEVIL_GAME_DEFAULT_MAX_PLAYERS
          )
        );

      const room = {
        id: roomId,
        hostId: socket.id,
        status: "waiting",
        maxPlayers,
        countdownEndsAt: null,

        players: [
          socket.id,
        ],

        ready: {
          [socket.id]: true,
        },

        roles: {},

        gamePlayers: null,
        corpses: [],
        meeting: null,
        gameResult: null,

        /*
         * 로비 단계에서도 기본 정전 상태를 생성.
         */
        blackout: {
          active: false,
          activatedBy: null,
          changedAt: null,
          cooldownEndsAt: 0,
        },
      };

      devilRooms[roomId] =
        room;

      socket.join(
        getSocketRoomName(
          roomId
        )
      );

      broadcastRoomUpdate(
        room
      );

      callback?.({
        ok: true,
        room:
          getPublicRoom(
            room
          ),
      });

      console.log(
        "🏠 감자전쟁 방 생성:",
        roomId
      );
    }
  );

  /* =======================================================
     Join Devil Room
  ======================================================= */

  socket.on(
    "devilRoom:join",
    (payload = {}, callback) => {
      const roomId =
        String(
          payload.roomId ?? ""
        ).trim();

      const room =
        devilRooms[roomId];

      if (!room) {
        callback?.({
          ok: false,
          message:
            "방을 찾을 수 없습니다.",
        });

        return;
      }

      /*
       * 진행 중인 게임 재접속 처리.
       */
      if (
        room.status === "playing" ||
        room.status === "finished"
      ) {
        const nickname =
          String(
            payload.nickname ??
              players[socket.id]
                ?.nickname ??
              ""
          ).trim();

        const reconnectPlayer =
          findReconnectableGamePlayer(
            room,
            nickname
          );

        if (reconnectPlayer) {
          reconnectGamePlayer(
            room,
            reconnectPlayer,
            socket
          );

          callback?.({
            ok: true,
            reconnected: true,
            room:
              getPublicRoom(
                room
              ),
            gameState:
              getPublicGameState(
                room
              ),
            role:
              reconnectPlayer.role,
            playerId:
              reconnectPlayer.id,

            /*
             * 재접속 응답에도 현재 정전 상태 포함.
             */
            blackout:
              getPublicBlackoutState(
                room
              ),
          });

          return;
        }

        callback?.({
          ok: false,
          message:
            "이미 게임이 시작된 방입니다.",
        });

        return;
      }

      const officePlayer =
        players[socket.id];

      if (!officePlayer) {
        callback?.({
          ok: false,
          message:
            "먼저 사무실에 입장해주세요.",
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

      if (
        room.players.length >=
        room.maxPlayers
      ) {
        callback?.({
          ok: false,
          message:
            "방의 정원이 가득 찼습니다.",
        });

        return;
      }

      removePlayerFromLobbyRoom(
        socket.id
      );

      room.players.push(
        socket.id
      );

      room.ready[
        socket.id
      ] = false;

      socket.join(
        getSocketRoomName(
          room.id
        )
      );

      broadcastRoomUpdate(
        room
      );

      callback?.({
        ok: true,
        room:
          getPublicRoom(
            room
          ),
      });

      console.log(
        "🚪 감자전쟁 방 입장:",
        room.id,
        officePlayer.nickname
      );
    }
  );

  /* =======================================================
     Leave Devil Room
  ======================================================= */

  socket.on(
    "devilRoom:leave",
    (payload = {}, callback) => {
      const roomId =
        String(
          payload.roomId ?? ""
        ).trim();

      const room =
        devilRooms[roomId];

      if (!room) {
        callback?.({
          ok: true,
        });

        return;
      }

      if (
        room.status === "playing"
      ) {
        callback?.({
          ok: false,
          message:
            "게임 진행 중에는 로비 나가기를 사용할 수 없습니다.",
        });

        return;
      }

      room.players =
        room.players.filter(
          (id) =>
            id !== socket.id
        );

      delete room.ready[
        socket.id
      ];

      delete room.roles[
        socket.id
      ];

      socket.leave(
        getSocketRoomName(
          room.id
        )
      );

      if (
        room.hostId ===
        socket.id
      ) {
        room.hostId =
          room.players[0] ??
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

        callback?.({
          ok: true,
        });

        return;
      }

      broadcastRoomUpdate(
        room
      );

      callback?.({
        ok: true,
      });
    }
  );

  /* =======================================================
     Ready
  ======================================================= */

  socket.on(
    "devilRoom:ready",
    (payload = {}, callback) => {
      const roomId =
        String(
          payload.roomId ?? ""
        ).trim();

      const room =
        devilRooms[roomId];

      if (!room) {
        callback?.({
          ok: false,
          message:
            "방을 찾을 수 없습니다.",
        });

        return;
      }

      if (
        !room.players.includes(
          socket.id
        )
      ) {
        callback?.({
          ok: false,
          message:
            "방 참가자가 아닙니다.",
        });

        return;
      }

      if (
        socket.id ===
        room.hostId
      ) {
        room.ready[
          socket.id
        ] = true;
      } else {
        room.ready[
          socket.id
        ] =
          payload.ready ===
          undefined
            ? !room.ready[
                socket.id
              ]
            : Boolean(
                payload.ready
              );
      }

      broadcastRoomUpdate(
        room
      );

      callback?.({
        ok: true,
        room:
          getPublicRoom(
            room
          ),
      });
    }
  );

  /* =======================================================
     Start Game
  ======================================================= */

  socket.on(
    "devilRoom:start",
    (payload = {}, callback) => {
      const roomId =
        String(
          payload.roomId ?? ""
        ).trim();

      const room =
        devilRooms[roomId];

      if (!room) {
        callback?.({
          ok: false,
          message:
            "방을 찾을 수 없습니다.",
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
            "이미 게임 시작 절차가 진행 중입니다.",
        });

        return;
      }

      if (
        room.players.length <
        DEVIL_GAME_MIN_PLAYERS
      ) {
        callback?.({
          ok: false,
          message: `최소 ${DEVIL_GAME_MIN_PLAYERS}명이 필요합니다.`,
        });

        return;
      }

      const allReady =
        room.players.every(
          (playerId) =>
            playerId ===
              room.hostId ||
            Boolean(
              room.ready[
                playerId
              ]
            )
        );

      if (!allReady) {
        callback?.({
          ok: false,
          message:
            "아직 준비하지 않은 감자가 있습니다.",
        });

        return;
      }

      room.status =
        "countdown";

      room.countdownEndsAt =
        Date.now() +
        POTATO_WAR_START_COUNTDOWN_MS;

      room.roles =
        assignRoles(room);

      /*
       * 새 게임 시작 준비 시 이전 정전 상태 제거.
       */
      room.blackout = {
        active: false,
        activatedBy: null,
        changedAt: null,
        cooldownEndsAt: 0,
      };

      broadcastRoomUpdate(
        room
      );

      callback?.({
        ok: true,
        countdownEndsAt:
          room.countdownEndsAt,
      });

      setTimeout(() => {
        const currentRoom =
          devilRooms[roomId];

        if (
          !currentRoom ||
          currentRoom.status !==
            "countdown"
        ) {
          return;
        }

        currentRoom.status =
          "playing";

        currentRoom.countdownEndsAt =
          null;

        currentRoom.gameResult =
          null;

        createGameRuntime(
          currentRoom
        );

        for (
          const playerSocketId of
          currentRoom.players
        ) {
          const gamePlayer =
            currentRoom.gamePlayers?.[
              playerSocketId
            ];

          if (!gamePlayer) {
            continue;
          }

          io.to(
            playerSocketId
          ).emit(
            "devilGame:started",
            {
              roomId:
                currentRoom.id,

              role:
                gamePlayer.role,

              playerId:
                gamePlayer.id,

              missionIds:
                gamePlayer.missionIds,

              gameState:
                getPublicGameState(
                  currentRoom
                ),

              blackout:
                getPublicBlackoutState(
                  currentRoom
                ),
            }
          );
        }

        broadcastGameState(
          currentRoom
        );

        broadcastRoomList();

        console.log(
          "🎮 감자전쟁 시작:",
          currentRoom.id
        );
      }, POTATO_WAR_START_COUNTDOWN_MS);
    }
  );

  /* =======================================================
     Game State Request
  ======================================================= */

  socket.on(
    "devilGame:get-state",
    (payload = {}, callback) => {
      const roomId =
        String(
          payload.roomId ?? ""
        ).trim();

      const room =
        devilRooms[roomId];

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

        gameState:
          getPublicGameState(
            room
          ),

        /*
         * 새로 접속하거나 새로고침한 경우에도
         * 현재 정전 상태를 받을 수 있다.
         */
        blackout:
          getPublicBlackoutState(
            room
          ),
      });
    }
  );

  /* =======================================================
     Game Movement
  ======================================================= */

  socket.on(
    "devilGame:move",
    (payload = {}) => {
      const room =
        findGameRoomBySocketId(
          socket.id
        );

      if (!room) {
        return;
      }

      const gamePlayer =
        findGamePlayerBySocketId(
          room,
          socket.id
        );

      if (
        !gamePlayer ||
        gamePlayer.state !==
          "alive" ||
        room.meeting?.active
      ) {
        return;
      }

      const nextX =
        Number(
          payload.x ??
            gamePlayer.x
        );

      const nextY =
        Number(
          payload.y ??
            gamePlayer.y
        );

      gamePlayer.x =
        Math.max(
          0,
          Math.min(
            POTATO_WAR_MAP_WIDTH,
            Number.isFinite(
              nextX
            )
              ? nextX
              : gamePlayer.x
          )
        );

      gamePlayer.y =
        Math.max(
          0,
          Math.min(
            POTATO_WAR_MAP_HEIGHT,
            Number.isFinite(
              nextY
            )
              ? nextY
              : gamePlayer.y
          )
        );

      gamePlayer.moving =
        Boolean(
          payload.moving
        );

      if (
        typeof payload.direction ===
        "string"
      ) {
        gamePlayer.direction =
          payload.direction;
      }

      socket
        .to(
          getSocketRoomName(
            room.id
          )
        )
        .emit(
          "devilGame:player-moved",
          getPublicGamePlayer(
            gamePlayer
          )
        );
    }
  );

  /* =======================================================
     BLACKOUT
     악마가 누르면 서버가 방 전체의 정전 상태를 관리한다.
  ======================================================= */

  socket.on(
    "devilGame:blackout",
    (payload = {}, callback) => {
      const requestedRoomId =
        String(
          payload.roomId ?? ""
        ).trim();

      const room =
        requestedRoomId
          ? devilRooms[
              requestedRoomId
            ]
          : findGameRoomBySocketId(
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

      const gamePlayer =
        findGamePlayerBySocketId(
          room,
          socket.id
        );

      const validation =
        canUseBlackout(
          room,
          gamePlayer
        );

      if (!validation.ok) {
        callback?.(
          validation
        );

        return;
      }

      const blackout =
        ensureBlackoutState(
          room
        );

      const now =
        Date.now();

      if (blackout.active) {
        /*
         * 현재 정전 중이면 다시 눌러 OFF.
         */
        blackout.active =
          false;

        blackout.activatedBy =
          null;

        blackout.changedAt =
          now;

        /*
         * 정전을 해제한 시점부터 다음 사용 쿨타임 계산.
         */
        blackout.cooldownEndsAt =
          now +
          POTATO_WAR_BLACKOUT_COOLDOWN_MS;

        console.log(
          `💡 정전 해제: ${room.id} / ${gamePlayer.nickname}`
        );
      } else {
        /*
         * 정전이 꺼져 있으면 ON.
         */
        blackout.active =
          true;

        blackout.activatedBy =
          gamePlayer.id;

        blackout.changedAt =
          now;

        console.log(
          `🌑 정전 발생: ${room.id} / ${gamePlayer.nickname}`
        );
      }

      /*
       * 같은 방의 모든 클라이언트에게 상태를 보낸다.
       *
       * 클라이언트:
       * role === "survivor" -> active 적용
       * role === "devil"    -> 화면 정전시키지 않음
       */
      broadcastBlackout(
        room
      );

      callback?.({
        ok: true,
        blackout:
          getPublicBlackoutState(
            room
          ),
      });
    }
  );

  /* =======================================================
     Kill
  ======================================================= */

  socket.on(
    "devilGame:kill",
    (payload = {}, callback) => {
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

      const victim =
        findGamePlayerById(
          room,
          targetId
        );

      if (
        !victim ||
        victim.state !==
          "alive" ||
        victim.role ===
          "devil"
      ) {
        callback?.({
          ok: false,
          message:
            "처치할 수 없는 대상입니다.",
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
        callback?.({
          ok: false,
          message:
            "아직 처치 쿨타임입니다.",
        });

        return;
      }

      killer.lastKillAt =
        now;

      victim.state =
        "dead";

      victim.moving =
        false;

      const corpse =
        createCorpse(
          room,
          victim
        );

      io.to(
        getSocketRoomName(
          room.id
        )
      ).emit(
        "devilGame:killed",
        {
          killerId:
            killer.id,

          victimId:
            victim.id,

          corpse,
        }
      );

      broadcastGameState(
        room
      );

      callback?.({
        ok: true,
        corpse,
      });

      checkDevilGameResult(
        room
      );
    }
  );
    /* =======================================================
     Report Corpse
  ======================================================= */

  socket.on(
    "devilGame:report",
    (payload = {}, callback) => {
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

      if (room.meeting?.active) {
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
        reporter.state !== "alive"
      ) {
        callback?.({
          ok: false,
          message:
            "살아있는 감자만 시체를 신고할 수 있습니다.",
        });

        return;
      }

      let corpse = null;

      const requestedCorpseId =
        String(
          payload.corpseId ?? ""
        ).trim();

      if (requestedCorpseId) {
        const candidate =
          findCorpseById(
            room,
            requestedCorpseId
          );

        if (
          candidate &&
          !candidate.reported &&
          getDistance(
            reporter,
            candidate
          ) <=
            POTATO_WAR_REPORT_DISTANCE
        ) {
          corpse =
            candidate;
        }
      }

      /*
       * corpseId가 없거나 유효하지 않은 경우
       * 현재 플레이어 근처에서 가장 가까운
       * 신고 가능한 시체를 찾는다.
       */
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
            kind: "corpse",
            corpse,
          }
        );

      callback?.(
        result
      );

      if (result.ok) {
        console.log(
          `📢 시체 신고: ${room.id} / ${reporter.nickname} -> ${corpse.victimNickname}`
        );
      }
    }
  );

  /* =======================================================
     Emergency Meeting

     중앙 회의 테이블 근처에서만 가능.
     한 플레이어당 게임 중 1회.
  ======================================================= */

  socket.on(
    "devilGame:emergency-meeting",
    (payload = {}, callback) => {
      const requestedRoomId =
        String(
          payload.roomId ?? ""
        ).trim();

      const room =
        requestedRoomId
          ? devilRooms[
              requestedRoomId
            ]
          : findGameRoomBySocketId(
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

      const usedCount =
        Number(
          reporter.emergencyMeetingUses ??
            0
        );

      if (
        usedCount >=
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
        usedCount + 1;

      const result =
        startMeeting(
          room,
          reporter,
          {
            kind:
              "emergency",
          }
        );

      /*
       * 혹시 회의 시작에 실패하면
       * 사용 횟수를 되돌린다.
       */
      if (!result.ok) {
        reporter.emergencyMeetingUses =
          usedCount;

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

  /* =======================================================
     Meeting Chat
  ======================================================= */

  socket.on(
    "devilGame:meeting-chat",
    (payload = {}, callback) => {
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

      /*
       * 결과 표시 단계에서는 채팅 불가.
       */
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

      /*
       * 죽은 플레이어는 회의 채팅 불가.
       */
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
          payload.text ?? ""
        ).trim();

      if (!text) {
        callback?.({
          ok: false,
          message:
            "메시지를 입력해주세요.",
        });

        return;
      }

      /*
       * 지나치게 긴 메시지 방지.
       */
      const safeText =
        text.slice(
          0,
          300
        );

      const message =
        createMeetingMessage(
          player,
          safeText
        );

      meeting.messages.push(
        message
      );

      /*
       * 회의 채팅은 너무 많이 쌓이지 않도록
       * 최근 100개까지만 유지.
       */
      if (
        meeting.messages.length >
        100
      ) {
        meeting.messages.shift();
      }

      io.to(
        getSocketRoomName(
          room.id
        )
      ).emit(
        "devilGame:meeting-message",
        message
      );

      callback?.({
        ok: true,
        message,
      });
    }
  );

  /* =======================================================
     Meeting Vote
  ======================================================= */

  socket.on(
    "devilGame:meeting-vote",
    (payload = {}, callback) => {
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

      /*
       * 이미 투표했다면 중복 투표 불가.
       */
      if (
        Object.prototype.hasOwnProperty.call(
          meeting.votes,
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

      /*
       * 클라이언트 버전 호환:
       *
       * targetId
       * playerId
       *
       * 두 형식을 모두 허용.
       */
      const rawTargetId =
        payload.targetId ??
        payload.playerId ??
        "skip";

      const targetId =
        String(
          rawTargetId
        ).trim();

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
        targetId ||
        "skip";

      /*
       * 이전/현재 클라이언트 모두 사용할 수 있도록
       * playerId와 voterId를 함께 보낸다.
       */
      io.to(
        getSocketRoomName(
          room.id
        )
      ).emit(
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

      /*
       * 살아있는 모든 플레이어가 투표했으면
       * 타이머를 기다리지 않고 즉시 결과 계산.
       */
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

  /* =======================================================
     Mission Complete
  ======================================================= */

  socket.on(
    "devilGame:mission-complete",
    (payload = {}, callback) => {
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

      io.to(
        getSocketRoomName(
          room.id
        )
      ).emit(
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

  /* =======================================================
     Explicit Return To Office

     승리/패배 화면의
     "사무실로 돌아가기" 버튼에서 사용.
  ======================================================= */

  socket.on(
    "devilGame:return-office",
    (payload = {}, callback) => {
      const requestedRoomId =
        String(
          payload.roomId ?? ""
        ).trim();

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
          ) ?? null;
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
        );

      if (gamePlayer) {
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

      /*
       * 사무실 플레이어 목록을 다시 갱신.
       */
      io.emit(
        "office:players",
        getPublicOfficePlayers()
      );

      callback?.({
        ok: true,
      });

      console.log(
        `🏢 사무실 복귀: ${room.id} / ${
          gamePlayer?.nickname ??
          socket.id
        }`
      );

      /*
       * 게임 참가자 전원이 사무실로 복귀했는지 확인.
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
          `🧹 종료된 감자전쟁 방 제거: ${room.id}`
        );

        return;
      }

      broadcastGameState(
        room
      );
    }
  );

  /* =======================================================
     Legacy Return To Office Compatibility

     혹시 이전 DevilGameWorld에서
     returnOffice 형태를 사용하고 있다면 호환.
  ======================================================= */

  socket.on(
    "devilGame:returnOffice",
    (payload = {}, callback) => {
      const requestedRoomId =
        String(
          payload.roomId ?? ""
        ).trim();

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
          ) ?? null;
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

      if (gamePlayer) {
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

      io.emit(
        "office:players",
        getPublicOfficePlayers()
      );

      callback?.({
        ok: true,
      });

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

        return;
      }

      broadcastGameState(
        room
      );
    }
  );

  /* =======================================================
     Disconnect
  ======================================================= */

  socket.on(
    "disconnect",
    () => {
      console.log(
        "🔴 Socket disconnected:",
        socket.id
      );

      /*
       * 진행 중 게임에 참가하고 있던 플레이어인지 확인.
       */
      const gameRoom =
        findGameRoomBySocketId(
          socket.id
        );

      const gamePlayer =
        gameRoom
          ? findGamePlayerBySocketId(
              gameRoom,
              socket.id
            )
          : null;

      /*
       * 메인 사무실 플레이어 정보.
       */
      const officePlayer =
        players[
          socket.id
        ];

      /*
       * 로비방에서 제거.
       * 단, 진행 중 게임은 아래에서 별도 처리한다.
       */
      const lobbyRoom =
        findPlayerRoom(
          socket.id
        );

      if (
        lobbyRoom &&
        lobbyRoom.status !==
          "playing" &&
        lobbyRoom.status !==
          "finished"
      ) {
        lobbyRoom.players =
          lobbyRoom.players.filter(
            id =>
              id !==
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

        if (
          lobbyRoom.hostId ===
          socket.id
        ) {
          lobbyRoom.hostId =
            lobbyRoom.players[
              0
            ] ?? null;
        }

        if (
          lobbyRoom.players
            .length === 0
        ) {
          delete devilRooms[
            lobbyRoom.id
          ];

          broadcastRoomList();
        } else {
          broadcastRoomUpdate(
            lobbyRoom
          );
        }
      }

      /*
       * 메인 사무실에서는 즉시 제거.
       */
      if (officePlayer) {
        delete players[
          socket.id
        ];

        socket.broadcast.emit(
          "office:player-left",
          socket.id
        );
      }

      /*
       * 게임 중 연결이 끊겼다면 바로 게임에서 제거하지 않는다.
       * 모바일 브라우저/PWA 전환이나 일시적인 네트워크 끊김을
       * 고려해 일정 시간 재접속을 기다린다.
       */
      if (
        gameRoom &&
        gamePlayer
      ) {
        const disconnectedSocketId =
          socket.id;

        gamePlayer.connectedSocketId =
          null;

        gamePlayer.moving =
          false;

        console.log(
          `⏳ 감자전쟁 재접속 대기: ${gameRoom.id} / ${gamePlayer.nickname}`
        );

        setTimeout(
          () => {
            const currentRoom =
              devilRooms[
                gameRoom.id
              ];

            if (
              !currentRoom ||
              !currentRoom.gamePlayers
            ) {
              return;
            }

            const currentPlayer =
              Object.values(
                currentRoom.gamePlayers
              ).find(
                player =>
                  player.id ===
                    gamePlayer.id
              );

            if (!currentPlayer) {
              return;
            }

            /*
             * 이미 새 소켓으로 재접속했다면 아무것도 하지 않는다.
             */
            if (
              currentPlayer.connectedSocketId
            ) {
              return;
            }

            /*
             * 원래 끊긴 플레이어가 맞는지 확인.
             */
            if (
              currentPlayer.id !==
              gamePlayer.id
            ) {
              return;
            }

            currentPlayer.leftGame =
              true;

            currentPlayer.moving =
              false;

            console.log(
              `🚪 감자전쟁 이탈 확정: ${currentRoom.id} / ${currentPlayer.nickname} / ${disconnectedSocketId}`
            );

            /*
             * 게임이 아직 진행 중이면
             * 남은 인원 기준으로 승리 조건을 다시 확인.
             */
            if (
              currentRoom.status ===
              "playing"
            ) {
              broadcastGameState(
                currentRoom
              );

              checkDevilGameResult(
                currentRoom
              );
            }

            /*
             * 종료된 게임이고 남아있는 참가자가 없다면 방 제거.
             */
            if (
              currentRoom.status ===
              "finished"
            ) {
              const remaining =
                Object.values(
                  currentRoom.gamePlayers
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
                  currentRoom
                );

                delete devilRooms[
                  currentRoom.id
                ];

                broadcastRoomList();
              }
            }
          },
          POTATO_WAR_RECONNECT_GRACE_MS
        );
      }

      /*
       * 현재 사무실 인원 목록 갱신.
       */
      io.emit(
        "office:players",
        getPublicOfficePlayers()
      );
    }
  );
});
/* =========================================================
   Health Check
========================================================= */

app.get(
  "/",
  (req, res) => {
    res.status(200).json({
      ok: true,
      service:
        "gamja-office-server",
      message:
        "Gamja Office Socket.IO server is running.",
      timestamp:
        new Date().toISOString(),
    });
  }
);

app.get(
  "/health",
  (req, res) => {
    res.status(200).json({
      ok: true,
      socketIo: true,
      connectedSockets:
        io.engine.clientsCount,
      officePlayers:
        Object.keys(players)
          .length,
      devilRooms:
        Object.keys(
          devilRooms
        ).length,
      timestamp:
        new Date().toISOString(),
    });
  }
);

/* =========================================================
   Debug Room Summary

   실제 게임 데이터 전체를 외부에 노출하지 않고
   현재 방 개수/상태 정도만 확인한다.
========================================================= */

app.get(
  "/status",
  (req, res) => {
    const roomSummary =
      Object.values(
        devilRooms
      ).map(
        room => ({
          id:
            room.id,

          status:
            room.status,

          playerCount:
            room.status ===
              "playing" ||
            room.status ===
              "finished"
              ? Object.values(
                  room.gamePlayers ??
                    {}
                ).filter(
                  player =>
                    player.leftGame !==
                    true
                ).length
              : room.players
                  ?.length ??
                0,

          blackout:
            Boolean(
              room.blackout
                ?.active
            ),

          meeting:
            Boolean(
              room.meeting
                ?.active
            ),
        })
      );

    res.status(200).json({
      ok: true,
      rooms:
        roomSummary,
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
      "❌ Uncaught Exception:",
      error
    );
  }
);

process.on(
  "unhandledRejection",
  reason => {
    console.error(
      "❌ Unhandled Rejection:",
      reason
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
   * 진행 중인 회의 타이머 정리.
   */
  for (
    const room of
    Object.values(
      devilRooms
    )
  ) {
    clearMeetingTimers(
      room
    );
  }

  io.close(() => {
    server.close(() => {
      console.log(
        "✅ Server closed."
      );

      process.exit(0);
    });
  });

  /*
   * 혹시 Socket.IO 연결 때문에 정상 종료되지 않을 경우
   * 일정 시간 후 강제 종료.
   */
  setTimeout(() => {
    console.error(
      "⚠️ Forced shutdown."
    );

    process.exit(1);
  }, 10_000).unref();
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
      "============================================"
    );

    console.log(
      "🥔 Gamja Office Server"
    );

    console.log(
      `🚀 Server running on port ${PORT}`
    );

    console.log(
      "🎮 Potato War Socket.IO ready"
    );

    console.log(
      "🌑 Survivor blackout synchronization ready"
    );

    console.log(
      "============================================"
    );
  }
);
