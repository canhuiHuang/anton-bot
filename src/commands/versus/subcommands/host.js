const {
  getChannel,
  getVersusRecord,
  getPlayersRecords,
} = require("../../../utils/crud");
const {
  getStringFromArrayObj,
  getRandomizedTeams,
} = require("../../../utils/common.js");

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  host(interaction, client, teamsAmount = 2) {
    const date = Date.now();
    const host = interaction.user;

    // Create versus session
    const versusId = `${date}${host.username}${Math.random()
      .toString(36)
      .substring(2)}`;
    const versusInstance = {
      identifier: versusId,
      players: [
        {
          id: host.id,
          username: host.username,
          discriminator: host.discriminator,
          avatar: host.avatar,
        },
      ],
      host: host.username,
      hostAvatar: host.avatar,
      timestamp: date,
    };

    getChannel(interaction, client, "DB", "versus")
      .then((versusChannel) => {
        versusChannel.send(JSON.stringify(versusInstance));

        const embed = new EmbedBuilder({
          title: "Versus",
          color: client.color,
          timestamp: date,
          fields: [
            {
              name: "Jugadores:",
              value: `${host.username}`,
              inline: true,
            },
          ],
          footer: {
            iconURL: host.displayAvatarURL(),
            text: `Hosteado por ${host.username}.`,
          },
        });

        let row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("vs-join")
            .setLabel("Join")
            .setStyle(ButtonStyle.Primary)
        );

        // Buttons listeners
        const filter = (i) => {
          if (["vs-join", "vs-start"].includes(i.customId)) {
            if (i.customId === "vs-start") {
              return i.user.id === host.id;
            } else {
              return true;
            }
          }
          return false;
        };

        const collector = interaction.channel.createMessageComponentCollector({
          filter,
          time: 1500000,
        });

        collector.on("collect", async (i) => {
          if (i.customId === "vs-join") {
            getVersusRecord(versusChannel, versusId).then((message) => {
              const versus = JSON.parse(message.content);

              const alreadyMember = versus.players.filter(
                (player) => player.id === i.user.id
              );

              if (alreadyMember.length === 0) {
                versus.players.push({
                  id: i.user.id,
                  username: i.user.username,
                  discriminator: i.user.discriminator,
                  avatar: i.user.avatar,
                });

                message.edit(JSON.stringify(versus));

                embed.setFields({
                  name: "Jugadores:",
                  value: getStringFromArrayObj(versus.players, "username"),
                  inline: true,
                });

                if (versus.players.length >= teamsAmount) {
                  row = new ActionRowBuilder()
                    .addComponents(
                      new ButtonBuilder()
                        .setCustomId("vs-join")
                        .setLabel("Join")
                        .setStyle(ButtonStyle.Primary)
                    )
                    .addComponents(
                      new ButtonBuilder()
                        .setCustomId("vs-start")
                        .setLabel("Start")
                        .setStyle(ButtonStyle.Success)
                    );
                }

                interaction.channel.send({
                  embeds: [embed],
                  components: [row],
                });
              }
            });
          } else if (i.customId === "vs-start") {
            collector.stop("Match starting...");
          }
          await i.update({
            components: [row],
          });
        });

        collector.on("end", async (collected) => {
          try {
            // Delete record from versus
            const versusRecord = await getVersusRecord(versusChannel, versusId);
            const versusContent = JSON.parse(versusRecord.content);

            versusRecord.delete();

            // Generate teams
            const teams = getRandomizedTeams(
              versusContent.players,
              teamsAmount
            );

            const fields = [];
            teams.forEach((team, idx) => {
              fields.push({
                name: `Team ${idx + 1}`,
                value: getStringFromArrayObj(team, "username", "\n"),
                inline: true,
              });
            });

            const embed = new EmbedBuilder({
              title: "Versus",
              color: client.color,
              timestamp: date,
              fields,
              footer: {
                iconURL: host.displayAvatarURL(),
                text: `Hosteado por ${host.username}.`,
              },
            });

            // Update players' records
            const playerIds = [];
            for (const player of versusContent.players) {
              playerIds.push(player.id);
            }

            const playersChannel = await getChannel(
              interaction,
              client,
              "DB",
              "players"
            );

            const playersOnRecord = await getPlayersRecords(
              playersChannel,
              playerIds
            );

            const getPlayerRecord = (playerId) => {
              for (const playerRecord of playersOnRecord) {
                if (JSON.parse(playerRecord.content).id === playerId) {
                  return playerRecord;
                }
              }
              return undefined;
            };

            for (let idx = 0; idx < teams.length; idx++) {
              const team = teams[idx];
              for (const player of team) {
                // Get player record
                const playerRecord = getPlayerRecord(player.id);

                const opponents = [];
                for (let j = 0; j < teams.length; j++) {
                  if (j !== idx) {
                    opponents.push(...teams[j]);
                  }
                }

                // update record
                if (playerRecord) {
                  const playerContent = JSON.parse(playerRecord.content);

                  // Update partners
                  for (const partner of team) {
                    if (partner.id !== player.id) {
                      // Update partner
                      if (Object.hasOwn(playerContent.partners, partner.id)) {
                        playerContent.partners[partner.id].count++;
                      } else {
                        // Add partner
                        playerContent.partners[partner.id] = {
                          id: partner.id,
                          count: 1,
                        };
                      }
                    }
                  }

                  // Update opponents
                  for (const opponent of opponents) {
                    // Update opponent
                    if (Object.hasOwn(playerContent.opponents, opponent.id)) {
                      playerContent.opponents[opponent.id].count++;
                    } else {
                      // Add opponent
                      playerContent.opponents[opponent.id] = {
                        id: opponent.id,
                        count: 1,
                      };
                    }
                  }

                  // Save
                  playerRecord.edit(JSON.stringify(playerContent));
                } else {
                  // If record doesn't exit, create it
                  const playerContent = {
                    id: player.id,
                    partners: {},
                    opponents: {},
                  };

                  // Update partners
                  for (const partner of team) {
                    if (partner.id !== player.id) {
                      // Add partner
                      playerContent.partners[partner.id] = {
                        id: partner.id,
                        count: 1,
                      };
                    }
                  }

                  // Update opponents
                  for (const opponent of opponents) {
                    // Add opponent
                    playerContent.opponents[opponent.id] = {
                      id: opponent.id,
                      count: 1,
                    };
                  }

                  playersChannel.send({
                    content: JSON.stringify(playerContent),
                  });
                }
              }
            }

            // Publish teams on channel
            interaction.channel.send({
              embeds: [embed],
            });
          } catch (error) {
            console.error(error);
            interaction.channel.send({
              content: "Something wrong happened. Cannot start.",
            });
          }
        });

        interaction.reply({
          embeds: [embed],
          components: [row],
        });
      })
      .catch(() => {
        interaction.reply({
          content: "Something wrong happened",
        });
      });
  },
};
