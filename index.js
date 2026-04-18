const { Client, GatewayIntentBits, REST, Routes, Collection } = require("discord.js");
const fs = require("fs");
const express = require("express");

// --------------------
// EXPRESS KEEP ALIVE
// --------------------
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("bot alive");
});

app.listen(PORT, () => {
  console.log("Web server running on port", PORT);
});

// --------------------
// DISCORD CLIENT
// --------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  rest: { timeout: 15000 }
});

client.commands = new Collection();

// --------------------
// HEARTBEAT (important for Render visibility)
// --------------------
setInterval(() => {
  console.log(`[HEARTBEAT] Bot running - ${new Date().toISOString()}`);
}, 30000);

// --------------------
// COMMAND LOADER (SAFE)
// --------------------
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
    } catch (e) {
      console.log("Failed loading:", file);
      console.error(e);
    }
  }
}

// --------------------
// REST
// --------------------
const token = process.env.TOKEN;
if (!token) {
  console.error("Missing TOKEN in environment variables");
  process.exit(1);
}

const rest = new (require("@discordjs/rest").REST)({ version: "10" }).setToken(token);

// --------------------
// READY EVENT
// --------------------
client.once("ready", async () => {
  console.log("✅ BOT ONLINE:", client.user.tag);

  client.user.setPresence({
    activities: [{ name: "stable system active", type: 0 }],
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

// --------------------
// AUTO RECONNECT LOGIC
// --------------------
client.on("disconnect", () => {
  console.log("⚠️ Bot disconnected, attempting reconnect...");
});

client.on("shardDisconnect", () => {
  console.log("⚠️ Shard disconnected");
});

client.on("shardReconnecting", () => {
  console.log("🔄 Shard reconnecting...");
});

client.on("error", (err) => {
  console.error("❌ Client error:", err);
});

// --------------------
// INTERACTIONS
// --------------------
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return;

  try {
    await cmd.execute(interaction);
  } catch (err) {
    console.error(err);

    if (!interaction.replied) {
      await interaction.reply({
        content: "command error",
        ephemeral: true
      }).catch(() => {});
    }
  }
});

// --------------------
// SAFE LOGIN LOOP (CRASH RECOVERY)
// --------------------
async function startBot() {
  try {
    console.log("Attempting login...");

    await client.login(token);

    console.log("LOGIN SUCCESS");
  } catch (err) {
    console.error("LOGIN FAILED:", err);

    console.log("Retrying in 10 seconds...");
    setTimeout(startBot, 10000);
  }
}

startBot();

// --------------------
// PROCESS SAFETY (prevents Render death loops)
// --------------------
process.on("unhandledRejection", (err) => {
  console.error("Unhandled promise rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});
