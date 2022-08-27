const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skips current song"),
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

    const currentSong = queue.current;

    queue.skip();
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(`${currentSong.title} has been skipped.`)
          .setThumbnail(currentSong.thumbnail),
      ],
    });
  },
};
