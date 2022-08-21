const {
  accurateSplit,
  getRandomizedTeams,
} = require("../../../utils/common.js");

const { EmbedBuilder } = require("discord.js");

module.exports = {
  text(interaction, client, playersList, teamsAmount = 2) {
    // Get players list
    const players = accurateSplit(playersList);

    // Generate teams
    const teams = getRandomizedTeams(players, teamsAmount);

    // Post results on channel
    const fields = [];
    teams.forEach((team, idx) => {
      fields.push({
        name: `Team ${idx + 1}`,
        value: team.join("\n"),
        inline: true,
      });
    });

    const embed = new EmbedBuilder({
      title: "Versus",
      color: client.color,
      timestamp: Date.now(),
      fields,
      footer: {
        iconURL: interaction.user.displayAvatarURL(),
        text: `Creado por ${interaction.user.username}.`,
      },
    });
    interaction.reply({
      embeds: [embed],
    });

    // Update players records? PENDING
  },
};
