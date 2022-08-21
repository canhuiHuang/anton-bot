const { getChannel } = require("../../../utils/crud");
const { getStringFromArrayObj } = require("../../../utils/common.js");

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  voice(interaction, client, teamsAmount = 2) {
    // Body

    interaction.reply({
      content: "voice",
    });
  },
};
