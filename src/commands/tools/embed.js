const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Probando embeds"),
  async execute(interaction, client) {
    const embed = new EmbedBuilder({
      title: "Jojo title",
      description: "Descriocoion askdjhakds",
      color: client.color,
      // image: client.user.displayAvatarURL(),
      // thumbnail: client.user.displayAvatarURL(),
      timestamp: Date.now(),
      fields: [
        {
          name: "Team 1",
          value: "user1\nuser2\nuser3\n",
          inline: true,
        },
        {
          name: "Team 2",
          value: "user1\nuser2\nuser3\n",
          inline: true,
        },
      ],
      author: {
        url: "https://youtube.com",
        iconURL: interaction.user.displayAvatarURL(),
        name: interaction.user.tag,
      },
      footer: {
        iconURL: client.user.displayAvatarURL(),
        text: `${client.user.tag} pie pie pie`,
      },
      url: "https://google.com.al",
    });

    await interaction.reply({
      embeds: [embed],
    });
  },
};
