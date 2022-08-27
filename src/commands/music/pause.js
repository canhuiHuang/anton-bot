const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Pauses current song"),
  async execute(interaction, client) {
    await interaction.deferReply({
      fetchReply: true,
    });
    if (!interaction.member.voice.channel) {
      return await interaction.reply({
        content: "You need to be in a Voice channel to use this command",
        ephemeral: true,
      });
    }

    const queue = client.player.getQueue(interaction.guildId);

    if (!queue)
      return await interaction.editReply({
        content: "There are no songs in the queue",
        ephemeral: true,
      });

    queue.setPaused(true);
    await interaction.editReply({
      content: `Song has been paused. Use '/resume' to resume the song.`,
    });
  },
};
