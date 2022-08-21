// General
const getChannelMessagesByKey = (
  interaction,
  client,
  category,
  channelName,
  keyName,
  targets
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const channel = await getChannel(
        interaction,
        client,
        category,
        channelName
      );
      const messages = await getRecordsByKey(channel, keyName, targets);
      resolve(messages);
    } catch (error) {
      reject(error);
    }
  });
};

// Channel
const getChannel = (interaction, client, category, channelName) => {
  return new Promise((resolve, reject) => {
    for (const channelMap of interaction.guild.channels.cache) {
      const channel = channelMap[1];
      if (channel.name === channelName) {
        interaction.guild.channels
          .fetch(channel.parentId)
          .then((parent) => {
            if (parent.name === category) {
              resolve(channel);
            }
          })
          .catch((err) => {
            reject(err);
          });
      }
    }
  });
};

// Records
const getRecordsByKey = (channel, keyName, targets) => {
  return new Promise((resolve, reject) => {
    channel.messages
      .fetch()
      .then((messages) => {
        const filteredMessages = [];
        for (const message of messages) {
          if (targets.includes(JSON.parse(message[1].content)[keyName])) {
            filteredMessages.push(message[1]);
          }
        }
        resolve(filteredMessages);
      })
      .catch((error) => reject(error));
  });
};

const getRecordByKey = (channel, keyName, keyTarget) => {
  return new Promise((resolve, reject) => {
    channel.messages
      .fetch()
      .then((messages) => {
        for (const message of messages) {
          if (JSON.parse(message[1].content)[keyName] === keyTarget) {
            resolve(message[1]);
          }
        }
        resolve(undefined);
      })
      .catch((error) => reject(error));
  });
};

// Players
const getPlayersRecords = (playersChannel, playerIds) => {
  return new Promise(async (resolve, reject) => {
    playersChannel.messages
      .fetch()
      .then((playerRecords) => {
        const filteredPlayers = [];
        for (const playerRecord of playerRecords) {
          if (playerIds.includes(JSON.parse(playerRecord[1].content).id)) {
            filteredPlayers.push(playerRecord[1]);
          }
        }

        resolve(filteredPlayers);
      })
      .catch((error) => reject(error));
  });
};

// Get list of player(newPlayers & oldPlayers) records
const getPlayersRecordsDeprecated = (interaction, client, playerIds) => {
  return new Promise(async (resolve, reject) => {
    const playersChannel = await getChannel(
      interaction,
      client,
      "DB",
      "players"
    );
    playersChannel.messages
      .fetch()
      .then((playerRecords) => {
        const playersOnRecord = [];
        const filteredPlayers = [];
        const newPlayerIds = [];
        for (const playerRecord of playerRecords) {
          const playerId = JSON.parse(playerRecord[1].content).id;
          if (playerIds.includes(playerId)) {
            filteredPlayers.push(playerRecord[1]);
            playersOnRecord.push(playerId);
          }
        }

        // New players
        for (const playerId of playerIds) {
          if (!playersOnRecord.includes(playerId)) {
            newPlayerIds.push(playerId);
          }
        }
        resolve({
          oldPlayers: filteredPlayers,
          newPlayerIds,
        });
      })
      .catch((error) => reject(error));
  });
};

// Versus
const getVersusRecord = (channel, identifier) => {
  return new Promise((resolve, reject) => {
    channel.messages
      .fetch()
      .then((messages) => {
        for (const message of messages) {
          if (JSON.parse(message[1].content).identifier === identifier) {
            resolve(message[1]);
          }
        }
        resolve(undefined);
      })
      .catch((error) => reject(error));
  });
};

module.exports = {
  // General
  getChannelMessagesByKey,

  // Channels
  getChannel,

  // Records
  getRecordsByKey,
  getRecordByKey,

  // Players
  getPlayersRecords,

  // Versus
  getVersusRecord,
};
