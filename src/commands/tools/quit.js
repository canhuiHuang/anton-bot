const { SlashCommandBuilder } = require("discord.js");
const { getVoiceConnection } = require("@discordjs/voice");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("quit")
    .setDescription("Patea al bot fuera del canal de voz"),
  async execute(interaction, client) {
    await interaction.deferReply({
      fetchReply: true,
    });
    if (!interaction.member.voice.channel) {
      return await interaction.reply(
        "You need to be in a Voice channel to use this command"
      );
    }

    const voiceConnection = getVoiceConnection(interaction.guild.id);

    if (voiceConnection) {
      voiceConnection.disconnect();
      await interaction.editReply({
        content: "Left",
        ephemeral: true,
      });
    } else {
      await interaction.editReply({
        content: "Could not leave",
        ephemeral: true,
      });
    }
  },
};
