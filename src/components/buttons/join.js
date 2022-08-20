module.exports = {
  data: {
    name: "vs-join",
  },
  async execute(interaction, client) {
    // console.log(interaction.guild.channels.cache);

    for (const channelMap of interaction.guild.channels.cache) {
      const channel = channelMap[1];
      if (channel.name === "versus") {
        interaction.guild.channels
          .fetch(channel.parentId)
          .then((parent) => {
            console.log(JSON.stringify(parent));
            if (parent.name === "DB") {
              channel.send("hola??. Test success. Alfin oof");
              // channel.messages.fetch().then((msgs) => console.log(msgs));
            }
          })
          .catch((err) => {
            console.log(err);
          });
      }
    }
    // interaction.guild.channels
    //   .fetch("1010350040700682299")
    //   .then((channel) => console.log(channel.messages));
    await interaction.reply({
      content: "xddd",
    });
  },
};
