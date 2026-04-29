const {
  logDailyJapaneseVocabState,
  scheduleDailyJapaneseVocab,
} = require("../../services/dailyJapaneseVocab");

module.exports = {
  name: "clientReady",
  once: true,
  async execute(client) {
    console.log(`Ready ${client.user.tag} is online.`);
    logDailyJapaneseVocabState();
    scheduleDailyJapaneseVocab(client);
  },
};
