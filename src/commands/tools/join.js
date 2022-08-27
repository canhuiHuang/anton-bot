const { SlashCommandBuilder } = require("discord.js");
const { joinVoiceChannel } = require("@discordjs/voice");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription("Join to voice channel"),
  async execute(interaction, client) {
    await interaction.deferReply({
      fetchReply: true,
    });
    if (!interaction.member.voice.channel) {
      return await interaction.reply(
        "You need to be in a Voice channel to use this command"
      );
    }

    const voiceConnection = joinVoiceChannel({
      channelId: interaction.member.voice.channel.id,
      guildId: interaction.guild.id,
      adapterCreator: interaction.guild.voiceAdapterCreator,
    });

    if (voiceConnection) {
      await interaction.editReply({
        content: "Joined",
        ephemeral: true,
      });
    } else {
      await interaction.editReply({
        content: "Could not join",
        ephemeral: true,
      });
    }
  },
};
