const { Client, GatewayIntentBits, REST, Routes, Collection, ActivityType } = require("discord.js");
const fs = require("fs");
const express = require("express");

// -------------------
// EXPRESS SERVER
// -------------------
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("bot alive");
});

app.listen(PORT, () => {
  console.log("Web server running on port", PORT);
});

// -------------------
// DISCORD CLIENT
// -------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

// -------------------
// COMMAND LOADER (SAFE)
// -------------------
const commands = [];

if (fs.existsSync("./commands")) {
  const files = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));

  for (const file of files) {
    try {
      const cmd = require(`./commands/${file}`);

      if (!cmd?.data?.name || !cmd?.execute) continue;

      client.commands.set(cmd.data.name, cmd);
      commands.push(cmd.data.toJSON());

      console.log("Loaded:", file);

    } catch (err) {
      console.error("Failed loading:", file, err);
    }
  }
}

// -------------------
// TOKEN (IMPORTANT FIX)
// -------------------
const token = String(process.env.TOKEN || "").trim();

if (!token) {
  console.error("❌ TOKEN MISSING IN ENV");
  process.exit(1);
}

console.log("TOKEN LENGTH:", token.length);

// -------------------
// REST
// -------------------
const rest = new (require("@discordjs/rest").REST)({ version: "10" }).setToken(token);

// -------------------
// READY EVENT
// -------------------
client.once("ready", async () => {
  console.log("LOGIN SUCCESS");
  console.log("BOT ONLINE:", client.user.tag);

  client.user.setPresence({
    activities: [{
      name: "stable system running",
      type: ActivityType.Playing
    }],
    status: "online"
  });

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );

    console.log("Slash commands registered");
  } catch (err) {
    console.error("Command register error:", err);
  }
});

// -------------------
// INTERACTIONS
// -------------------
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
      }).catch(() => {});
    }
  }
});

// -------------------
// LOGIN (STABLE SAFE)
// -------------------
console.log("Attempting login...");

client.login(token)
  .then(() => {
    console.log("LOGIN SUCCESS TRIGGERED");
  })
  .catch((err) => {
    console.error("LOGIN FAILED:", err);
  });

// -------------------
// SAFETY HANDLERS
// -------------------
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
