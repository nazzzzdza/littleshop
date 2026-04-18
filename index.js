const { Client, GatewayIntentBits, REST, Routes, Collection } = require("discord.js");
const fs = require("fs");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------
// Web server (Render keep alive)
// ---------------------------
app.get("/", (req, res) => {
  res.send("littleshop is alive");
});

app.listen(PORT, () => {
  console.log("Web server running on port", PORT);
});

// ---------------------------
// Discord client
// ---------------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ---------------------------
// DEBUG (safe)
// ---------------------------
client.on("debug", (info) => console.log("[DEBUG]", info));
client.on("warn", (info) => console.log("[WARN]", info));
client.on("error", (err) => console.log("[ERROR]", err));

// ---------------------------
// Commands loader (safe)
// ---------------------------
client.commands = new Collection();

const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));
const commands = [];

for (const file of commandFiles) {
  try {
    const command = require(`./commands/${file}`);

    if (command?.data?.name) {
      client.commands.set(command.data.name, command);
      commands.push(command.data.toJSON());
      console.log("Loaded:", file);
    } else {
      console.log("Skipped invalid:", file);
    }

  } catch (err) {
    console.log("❌ Failed loading:", file);
    console.error(err);
  }
}

// ---------------------------
// REST
// ---------------------------
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

// ---------------------------
// READY EVENT
// ---------------------------
client.once("ready", async () => {
  console.log("BOT READY TRIGGERED");
  console.log("Logged in as:", client.user.tag);

  client.user.setPresence({
    activities: [{
      name: "processing orders <3",
      type: 1,
      url: "https://www.twitch.tv/discord"
    }],
    status: "online"
  });

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );

    console.log("Slash commands registered.");
  } catch (err) {
    console.error("Command register error:", err);
  }
});

// ---------------------------
// Interaction handler
// ---------------------------
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);

    if (!interaction.replied) {
      await interaction.reply({
        content: "error executing command",
        ephemeral: true
      });
    }
  }
});

// ---------------------------
// Message handler
// ---------------------------
client.on("messageCreate", (message) => {
  for (const command of client.commands.values()) {
    if (typeof command.handleMessage === "function") {
      command.handleMessage(message);
    }
  }
});

// ---------------------------
// LOGIN
// ---------------------------
console.log("Token loaded:", process.env.TOKEN ? "YES" : "NO");

client.login(process.env.TOKEN)
  .then(() => console.log("Discord login successful"))
  .catch(err => console.error("Discord login failed:", err));
