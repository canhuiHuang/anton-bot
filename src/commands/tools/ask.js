const https = require("https");
const ffmpegPath = require("ffmpeg-static");
const { Readable } = require("stream");
const { spawn } = require("child_process");
const { AudioPlayerStatus, StreamType, createAudioResource } = require("@discordjs/voice");
const { SlashCommandBuilder } = require("discord.js");

const DISCORD_MESSAGE_LIMIT = 2000;
const SAMPLE_RATE = 48000;
const CHANNELS = 2;
const TTS_SAMPLE_RATE = 24000;
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";
const DEFAULT_TTS_MODEL = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";
const DEFAULT_TTS_VOICE = process.env.OPENAI_TTS_VOICE || "coral";
const DEFAULT_TTS_INSTRUCTIONS =
  process.env.OPENAI_TTS_INSTRUCTIONS ||
  "Speak naturally, warm, and concise. You are Anton, an AI voice assistant in a Discord call.";
const DEFAULT_ANSWER_INSTRUCTIONS =
  process.env.OPENAI_ANSWER_INSTRUCTIONS ||
  "You are Anton, a helpful Discord assistant. Answer briefly and conversationally. Keep responses compact enough to read in chat and speak aloud. Match the user's language when obvious.";

function parseJsonResponse(data, errorMessage) {
  try {
    return JSON.parse(data);
  } catch (error) {
    throw new Error(errorMessage);
  }
}

function extractText(payload) {
  if (!Array.isArray(payload?.output)) {
    return "";
  }

  const text = [];

  for (const item of payload.output) {
    if (!Array.isArray(item?.content)) {
      continue;
    }

    for (const contentItem of item.content) {
      if (contentItem?.type === "output_text" && contentItem?.text) {
        text.push(contentItem.text);
      }
    }
  }

  return text.join("\n").trim();
}

function createOpenAIResponse(question, speakerName) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable.");
  }

  const body = JSON.stringify({
    model: DEFAULT_MODEL,
    instructions: DEFAULT_ANSWER_INSTRUCTIONS,
    input: `${speakerName} asked: ${question}`,
    store: false,
    max_output_tokens: 300,
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
            "OpenAI returned invalid JSON for assistant response."
          );

          if (response.statusCode < 200 || response.statusCode >= 300) {
            const apiMessage =
              payload?.error?.message ||
              `OpenAI request failed with status ${response.statusCode}.`;
            reject(new Error(apiMessage));
            return;
          }

          const text = extractText(payload);

          if (!text) {
            reject(new Error("OpenAI returned an empty response."));
            return;
          }

          resolve(text);
        });
      }
    );

    request.on("error", (error) => reject(error));
    request.write(body);
    request.end();
  });
}

function createSpeechAudio(text) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable.");
  }

  const body = JSON.stringify({
    model: DEFAULT_TTS_MODEL,
    voice: DEFAULT_TTS_VOICE,
    input: text,
    instructions: DEFAULT_TTS_INSTRUCTIONS,
    response_format: "pcm",
  });

  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        hostname: "api.openai.com",
        path: "/v1/audio/speech",
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (response) => {
        const chunks = [];

        response.on("data", (chunk) => {
          chunks.push(chunk);
        });

        response.on("end", () => {
          const buffer = Buffer.concat(chunks);

          if (response.statusCode < 200 || response.statusCode >= 300) {
            const payload = parseJsonResponse(
              buffer.toString("utf8"),
              "OpenAI returned invalid JSON for speech generation."
            );
            reject(
              new Error(
                payload?.error?.message ||
                  `Speech generation failed with status ${response.statusCode}.`
              )
            );
            return;
          }

          if (buffer.length === 0) {
            reject(new Error("OpenAI returned empty speech audio."));
            return;
          }

          resolve(buffer);
        });
      }
    );

    request.on("error", reject);
    request.write(body);
    request.end();
  });
}

function speakAnswer(player, audioBuffer) {
  return new Promise((resolve, reject) => {
    const audioStream = Readable.from(audioBuffer);
    const ffmpeg = spawn(ffmpegPath, [
      "-f",
      "s16le",
      "-ar",
      `${TTS_SAMPLE_RATE}`,
      "-ac",
      "1",
      "-i",
      "pipe:0",
      "-f",
      "s16le",
      "-ar",
      `${SAMPLE_RATE}`,
      "-ac",
      `${CHANNELS}`,
      "pipe:1",
    ]);

    const cleanup = () => {
      player.off("error", onError);
      player.off(AudioPlayerStatus.Idle, onIdle);
      ffmpeg.stdout.off("error", onError);
      ffmpeg.stdin.off("error", onError);
    };

    const onError = (error) => {
      cleanup();
      ffmpeg.kill("SIGKILL");
      reject(error);
    };

    const onIdle = () => {
      cleanup();
      resolve();
    };

    ffmpeg.on("error", onError);
    ffmpeg.stdin.on("error", onError);
    ffmpeg.stdout.on("error", onError);
    ffmpeg.stderr.on("data", () => {});
    player.once("error", onError);
    player.once(AudioPlayerStatus.Idle, onIdle);

    const resource = createAudioResource(ffmpeg.stdout, {
      inputType: StreamType.Raw,
    });

    player.play(resource);
    audioStream.pipe(ffmpeg.stdin);
  });
}

function truncateForDiscord(text) {
  if (text.length <= DISCORD_MESSAGE_LIMIT) {
    return text;
  }

  return `${text.slice(0, DISCORD_MESSAGE_LIMIT - 14).trimEnd()}\n\n[truncated]`;
}

function escapeForDiscord(text) {
  return text.replace(/@everyone/g, "everyone").replace(/@here/g, "here");
}

async function maybeSpeakAnswer(client, guildId, answer) {
  const session = client.voiceAssistantSessions?.get(guildId);

  if (!session?.active || !session.player) {
    return false;
  }

  session.pendingJobs = session.pendingJobs
    .then(async () => {
      if (!session.active) {
        return;
      }

      session.isResponding = true;
      session.metrics.speechRequests += 1;
      console.log(
        `[assistant] text speech request #${session.metrics.speechRequests} guild=${guildId} chars=${answer.length}`
      );

      try {
        const audio = await createSpeechAudio(answer);
        if (!session.active) {
          return;
        }
        await speakAnswer(session.player, audio);
        session.metrics.speechSuccesses += 1;
      } catch (error) {
        session.metrics.speechFailures += 1;
        console.error(
          `[assistant] text speech failure #${session.metrics.speechRequests} guild=${guildId}: ${error.message}`
        );
      } finally {
        session.isResponding = false;
      }
    })
    .catch((error) => {
      console.error("[assistant] queued text speech failed:", error);
    });

  return true;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Ask the AI a question.")
    .addStringOption((option) =>
      option
        .setName("question")
        .setDescription("What do you want to ask?")
        .setRequired(true)
    ),
  async execute(interaction, client) {
    const question = interaction.options.getString("question", true).trim();
    const speakerName = interaction.member?.displayName || interaction.user.username;

    await interaction.deferReply();

    try {
      const answer = await createOpenAIResponse(question, speakerName);
      const safeQuestion = escapeForDiscord(question);
      const safeAnswer = escapeForDiscord(answer);
      const content = truncateForDiscord(
        `${interaction.user} asked: ${safeQuestion}\nAnton: ${safeAnswer}`
      );

      await interaction.editReply({
        content,
      });

      const spokeInVoice = interaction.guildId
        ? await maybeSpeakAnswer(client, interaction.guildId, answer)
        : false;

      if (spokeInVoice) {
        console.log(
          `[assistant] text ask spoken guild=${interaction.guildId} user=${interaction.user.id}`
        );
      }
    } catch (error) {
      console.error("Ask command failed:", error);
      await interaction.editReply({
        content:
          "I couldn't get an AI response. Check OPENAI_API_KEY and try again.",
      });
    }
  },
};
