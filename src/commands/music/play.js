const { SlashCommandBuilder } = require("discord.js");
const { QueryType } = require("discord-player");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Add song to the queue to be played")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription(
          "Insert youtube video url, search keys, or playlist url"
        )
        .setRequired(true)
    ),
  async execute(interaction, client) {
    await interaction.deferReply({
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

    let query = interaction.options.getString("query");
    let embed = new EmbedBuilder();
    let result = [];
    const searchTypes = ["YOUTUBE_VIDEO", "YOUTUBE_PLAYLIST", "AUTO"];
    for (const type of searchTypes) {
      result = await client.player.search(query, {
        requestedBy: interaction.user,
        searchEngine: QueryType[type],
      });
      if (result.tracks.length === 0) {
        continue;
      } else {
        const { tracks, playlist } = result;
        const song = tracks[0];
        let description;
        let footer;

        switch (type) {
          case "YOUTUBE_VIDEO":
            await queue.addTrack(song);
            description = `[${song.title}]{${song.url}} has been added to the queue`;
            footer = { text: `Duration: ${song.duration}` };
            break;
          case "YOUTUBE_PLAYLIST":
            await queue.addTracks(tracks);
            description = `${tracks.length} song(s) from [${playlist.title}] have been added to the queue`;
            footer = { text: `Url: ${playlist.url}` };
            break;
          case "AUTO":
            await queue.addTrack(song);
            description = `[${song.title}]{${song.url}} has been added to the queue`;
            footer = { text: `Duration: ${song.duration}` };
            break;
          default:
            break;
        }

        embed
          .setDescription(description)
          .setThumbnail(song.thumbnail)
          .setFooter(footer);
        break;
      }
    }
    if (result.tracks.length === 0) {
      return await interaction.editReply("No results");
    }

    if (!queue.playing) await queue.play();

    await interaction.editReply({
      embeds: [embed],
    });
  },
};
