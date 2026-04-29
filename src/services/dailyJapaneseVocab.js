const fs = require("fs");
const path = require("path");
const https = require("https");

const STATE_FILE = path.join(process.cwd(), ".daily-japanese-vocab.json");
const DEFAULT_POST_TIME = process.env.DAILY_JP_VOCAB_TIME || "05:13";
const DEFAULT_TIMEZONE =
  process.env.DAILY_JP_VOCAB_TIMEZONE || "America/Los_Angeles";
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";
const HISTORY_LIMIT = 1000;

function parseJsonResponse(data, errorMessage) {
  try {
    return JSON.parse(data);
  } catch (error) {
    throw new Error(errorMessage);
  }
}

function extractResponseText(payload) {
  if (!Array.isArray(payload?.output)) {
    return "";
  }

  const parts = [];

  for (const item of payload.output) {
    if (!Array.isArray(item?.content)) {
      continue;
    }

    for (const contentItem of item.content) {
      if (contentItem?.type === "output_text" && contentItem?.text) {
        parts.push(contentItem.text);
      }
    }
  }

  return parts.join("\n").trim();
}

function readState() {
  try {
    const raw = fs.readFileSync(STATE_FILE, "utf8");
    const parsed = JSON.parse(raw);

    return {
      lastSentDate: parsed.lastSentDate || null,
      recentWords: Array.isArray(parsed.recentWords) ? parsed.recentWords : [],
    };
  } catch (error) {
    return {
      lastSentDate: null,
      recentWords: [],
    };
  }
}

function writeState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function getTimeParts(timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date());
  const get = (type) => parts.find((part) => part.type === type)?.value;

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

function getDateKey(timeZone) {
  const parts = getTimeParts(timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function isScheduledMinute(timeZone, targetTime) {
  const match = /^(\d{2}):(\d{2})$/.exec(targetTime);

  if (!match) {
    throw new Error(
      `Invalid DAILY_JP_VOCAB_TIME value: ${targetTime}. Expected HH:MM.`
    );
  }

  const parts = getTimeParts(timeZone);
  return parts.hour === match[1] && parts.minute === match[2];
}

function createDailyVocabPost(recentWords) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable.");
  }

  const avoidLine = recentWords.length
    ? `Avoid repeating these recent vocabulary items: ${recentWords.join(
        ", "
      )}.`
    : "";

  const body = JSON.stringify({
    model: DEFAULT_MODEL,
    store: false,
    max_output_tokens: 320,
    instructions: `
    You create one useful Japanese vocabulary of the day for a Discord community.

    - Do not add or delete anything.
    - Insert your content appropriately by replacing the <> placeholders:
    - Let the first line be "📘【今日の単語】Word of the Day"
    - Make sure you're not generating 今日の単語 twice

    ✨ **<Japanese word>**（<reading>）✨
    → <English meaning>
    
    📝 【使い方】Usage
    <Japanese sentence 1>
    （<sentence 1 reading>）
    → <English translation 1>
    
    <Japanese sentence 2>
    （<sentence 2 reading>）
    → <English translation 2>
    `,
    input: `Generate a new useful Japanese vocabulary item for today. ${avoidLine}`,
  });

  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        hostname: "api.openai.com",
        path: "/v1/responses",
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          const payload = parseJsonResponse(
            data,
            "OpenAI returned invalid JSON for daily vocabulary."
          );

          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(
              new Error(
                payload?.error?.message ||
                  `Daily vocabulary request failed with status ${response.statusCode}.`
              )
            );
            return;
          }

          const text = extractResponseText(payload);

          if (!text) {
            reject(
              new Error("OpenAI returned an empty daily vocabulary response.")
            );
            return;
          }

          resolve(text);
        });
      }
    );

    request.on("error", reject);
    request.write(body);
    request.end();
  });
}

function extractWordFromPost(content) {
  const wordOfDayMatch = /^\s*✨\s*\*\*(.+?)\*\*（.+?）\s*✨\s*$/im.exec(
    content
  );

  if (wordOfDayMatch?.[1]) {
    return wordOfDayMatch[1].trim();
  }

  const legacyMatch = /^Japanese:\s*(.+)$/im.exec(content);
  return legacyMatch?.[1]?.trim() || null;
}

async function postDailyVocabulary(client, channelId, timeZone) {
  const state = readState();
  const dateKey = getDateKey(timeZone);

  if (state.lastSentDate === dateKey) {
    return;
  }

  const channel = await client.channels.fetch(channelId).catch(() => null);

  if (!channel?.isTextBased()) {
    console.error(
      `[daily-vocab] Channel ${channelId} is not available or not text-based.`
    );
    return;
  }

  console.log(`[daily-vocab] Generating post for ${dateKey}.`);
  const content = await createDailyVocabPost(state.recentWords);
  const word = extractWordFromPost(content);

  await channel.send(`${content}`);

  state.lastSentDate = dateKey;
  console.log(word, state);
  if (word) {
    state.recentWords = [word, ...state.recentWords].slice(0, HISTORY_LIMIT);
  }
  writeState(state);

  console.log(
    `[daily-vocab] Posted ${word || "vocabulary item"} to channel ${channelId}.`
  );
}

function scheduleDailyJapaneseVocab(client) {
  const channelId = process.env.DAILY_JP_VOCAB_CHANNEL_ID;

  if (!channelId) {
    console.log(
      "[daily-vocab] Disabled. DAILY_JP_VOCAB_CHANNEL_ID is not set."
    );
    return;
  }

  let tickInFlight = false;

  const tick = async () => {
    if (tickInFlight) {
      return;
    }

    tickInFlight = true;

    try {
      if (isScheduledMinute(DEFAULT_TIMEZONE, DEFAULT_POST_TIME)) {
        await postDailyVocabulary(client, channelId, DEFAULT_TIMEZONE);
      }
    } catch (error) {
      console.error("[daily-vocab] Tick failed:", error);
    } finally {
      tickInFlight = false;
    }
  };

  console.log(
    `[daily-vocab] Scheduled for ${DEFAULT_POST_TIME} ${DEFAULT_TIMEZONE} in channel ${channelId}.`
  );

  tick().catch((error) => {
    console.error("[daily-vocab] Initial tick failed:", error);
  });

  setInterval(() => {
    tick().catch((error) => {
      console.error("[daily-vocab] Interval tick failed:", error);
    });
  }, 60_000);
}

module.exports = {
  scheduleDailyJapaneseVocab,
};
