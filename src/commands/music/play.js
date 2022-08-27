const { SlashCommandBuilder } = require("discord.js");
const { QueryType } = require("discord-player");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("on development")
    .addStringOption((option) =>
      option.setName("query").setDescription("Play song by name or youtube url")
    ),
  async execute(interaction, client) {
    const message = await interaction.deferReply({
      fetchReply: true,
    });

    if (!interaction.member.voice.channel) {
      return await interaction.editReply(
        "You need to be in a Voice channel to use this command"
      );
    }

    const queue = await client.player.createQueue(interaction.guild);
    if (!queue.connection)
      await queue.connect(interaction.member.voice.channel);

    let embed = new EmbedBuilder();

    let url = interaction.options.getString("query");
    const result = await client.player.search(url, {
      requestedBy: interaction.user,
      searchEngine: QueryType.YOUTUBE_VIDEO,
    });

    console.log(result);

    if (result.tracks.length === 0) {
      return await interaction.editReply("No results");
    }

    const song = result.tracks[0];
    await queue.addTrack(song);
    embed
      .setDescription(
        `**[${song.title}]{${song.url}}** has been added to the Queue`
      )
      .setThumbnail(song.thumbnail)
      .setFooter({
        text: `Duration: ${song.duration}`,
      });

    if (!queue.playing) await queue.play();

    await interaction.editReply({
      embeds: [embed],
    });
  },
};
