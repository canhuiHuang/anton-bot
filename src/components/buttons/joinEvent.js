const { getChannel } = require("../../utils/crud.js");
// Deprecated
// Se Usará Collectors para manejar botones
module.exports = {
  data: {
    name: "join-event",
  },
  async execute(interaction, client) {
    if (false) {
      channel.send("hola??. Test success. Alfin oof");

      // channel.messages.fetch().then((msgs) => console.log(msgs));

      // Get players from versus

      // Update players

      // Display Embed
    }

    // interaction.guild.channels
    //   .fetch("1010350040700682299")
    //   .then((channel) => console.log(channel.messages));
    await interaction.reply({
      content: "xddd",
    });
  },
};
