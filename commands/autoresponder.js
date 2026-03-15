const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../data/autoresponses.json");

function loadResponses() {
  try {

    if (!fs.existsSync("responses.json")) {
      fs.writeFileSync("responses.json", "{}");
      return {};
    }

    const data = fs.readFileSync("responses.json", "utf8");

    if (!data.trim()) {
      return {};
    }

    return JSON.parse(data);

  } catch (err) {
    console.error("Error loading responses:", err);
    return {};
  }
}

function saveResponses(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("autoresponder")
    .setDescription("manage autoresponders")

    .addSubcommand(sub =>
      sub
        .setName("add")
        .setDescription("add an autoresponder")
        .addStringOption(option =>
          option
            .setName("trigger")
            .setDescription("trigger")
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName("reply")
            .setDescription("bots reply")
            .setRequired(true)
        )
    ),

  async execute(interaction) {

    if (interaction.options.getSubcommand() === "add") {

      const trigger = interaction.options.getString("trigger").trim();
      const reply = interaction.options.getString("reply");

      const responses = loadResponses();

      responses[trigger] = reply;

      saveResponses(responses);

      await interaction.reply({
        content: `autoresponder created for \`${trigger}\` ♡`,
        ephemeral: true
      });

    }

  },

  async handleMessage(message) {

    if (message.author.bot) return;

    const responses = loadResponses();
    const content = message.content.trim();

    if (responses[content]) {
      message.channel.send(responses[content].replace(/\\n/g, "\n"));
    }

  }
};
