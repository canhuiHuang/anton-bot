const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("displays the current song queue")
    .addNumberOption((option) =>
      option
        .setName("page")
        .setDescription("Page number of the queue")
        .setMinValue(1)
    ),

  async execute(interaction, client) {
    await interaction.deferReply({
      fetchReply: true,
    });

    if (!interaction.member.voice.channel) {
      return await interaction.editReply({
        content: "You need to be in a Voice channel to use this command",
        ephemeral: true,
      });
    }

    const queue = client.player.getQueue(interaction.guildId);
    if (!queue || !queue.playing) {
      return await interaction.editReply("There are no songs in the queue");
    }

    const totalPages = Math.ceil(queue.tracks.length / 10) || 1;
    const page = (interaction.options.getNumber("page") || 1) - 1;

    if (page > totalPages)
      return await interaction.editReply({
        content: `Invalid Page. There are only a total of ${totalPages} pages of songs`,
        ephemeral: true,
      });

    const queueString = queue.tracks
      .slice(page * 10, page * 10 + 10)
      .map((song, i) => {
        return `${page * 10 + i + 1}. [${song.title}]{Duration: ${
          song.duration
        }} - <@${song.requestedBy.id}>`;
      })
      .join("\n");

    const currentSong = queue.current;

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `Currently Playing\n` +
              (currentSong
                ? `[${currentSong.title}]{${currentSong.duration}}  - <@${currentSong.requestedBy.id}>`
                : "None") +
              `\n\n~Queue~\n${queueString}`
          )
          .setFooter({
            text: `Page ${page + 1} of ${totalPages}`,
          })
          .setThumbnail(currentSong.setThumbnail),
      ],
    });
  },
};
