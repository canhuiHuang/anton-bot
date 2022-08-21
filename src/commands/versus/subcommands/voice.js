const { getChannel } = require("../../../utils/crud");
const {
  getStringFromArrayObj,
  accurateSplit,
} = require("../../../utils/common.js");

const { EmbedBuilder } = require("discord.js");

module.exports = {
  voice(interaction, client, teamsAmount = 2, filter) {
    // Body

    interaction.reply({
      content: "voice",
    });
  },
};
