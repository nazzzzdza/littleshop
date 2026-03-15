const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const dataFolder = path.join(__dirname, "../data");
const filePath = path.join(dataFolder, "autoresponses.json");

// -----------------------------
// Ensure folder and file exist
// -----------------------------
if (!fs.existsSync(dataFolder)) {
  fs.mkdirSync(dataFolder);
}

if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, "{}");
}

// -----------------------------
// Load responses
// -----------------------------
function loadResponses() {
  try {
    const data = fs.readFileSync(filePath, "utf8");

    if (!data.trim()) return {};

    return JSON.parse(data);

  } catch (err) {
    console.error("Error loading responses:", err);
    return {};
  }
}

// -----------------------------
// Save responses
// -----------------------------
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
            .setDescription("trigger word (example: .buy)")
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName("reply")
            .setDescription("bot reply")
            .setRequired(true)
        )
    ),

  // -----------------------------
  // Slash command execution
  // -----------------------------
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

  // -----------------------------
  // Message listener
  // -----------------------------
  async handleMessage(message) {

    if (message.author.bot) return;

    const responses = loadResponses();
    const content = message.content.trim();

    if (responses[content]) {
      message.channel.send(
        responses[content].replace(/\\n/g, "\n")
      );
    }
  }
};
