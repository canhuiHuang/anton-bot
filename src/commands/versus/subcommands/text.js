const { getChannel } = require("../../../utils/crud");
const { getStringFromArrayObj } = require("../../../utils/common.js");

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  text(interaction, client, teamsAmount = 2) {
    // Body

    interaction.reply({
      content: "text",
    });
  },
};
