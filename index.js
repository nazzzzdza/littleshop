// Littleshop Discord Bot
const { Client, GatewayIntentBits, REST, Routes, Collection } = require("discord.js");
const fs = require("fs");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------
// Web server (Render keep alive)
// ---------------------------
app.get("/", (req, res) => {
  res.send("polka's helper is alive, checking your orders!");
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
// DEBUG LOGS (IMPORTANT)
// ---------------------------
client.on("debug", (info) => {
  console.log("[DEBUG]", info);
});

client.on("warn", (info) => {
  console.log("[WARN]", info);
});

client.on("error", (error) => {
  console.log("[ERROR]", error);
});

// ---------------------------
// Commands setup
// ---------------------------
client.commands = new Collection();

const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
const commands = [];

for (const file of commandFiles) {
  try {
    const command = require(`./commands/${file}`);

    if (command?.data?.name) {
      client.commands.set(command.data.name, command);
      commands.push(command.data.toJSON());
      console.log("Loaded command:", file);
    } else {
      console.log("Skipped invalid command:", file);
    }
  } catch (err) {
    console.log("❌ Failed loading command:", file);
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
  console.log("READY EVENT TRIGGERED");
  console.log("Logged in as:", client.user.tag);

  client.user.setPresence({
    activities: [{
      name: "processing your orders <3",
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
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);

      if (!interaction.replied) {
        await interaction.reply({
          content: "there was an error executing that command, dm naz to inform.",
          ephemeral: true
        });
      }
    }
  } else {
    for (const command of client.commands.values()) {
      if (typeof command.handleInteraction === "function") {
        try {
          await command.handleInteraction(interaction);
        } catch (err) {
          console.error(err);
        }
      }
    }
  }
});

// ---------------------------
// Message handler
// ---------------------------
client.on("messageCreate", async (message) => {
  for (const command of client.commands.values()) {
    if (typeof command.handleMessage === "function") {
      try {
        command.handleMessage(message);
      } catch (err) {
        console.error(err);
      }
    }
  }
});

// ---------------------------
// LOGIN
// ---------------------------
console.log("Token loaded:", process.env.TOKEN ? "YES" : "NO");

client.login(process.env.TOKEN)
  .then(() => {
    console.log("Discord login successful");
  })
  .catch((err) => {
    console.error("Discord login failed:", err);
  });
