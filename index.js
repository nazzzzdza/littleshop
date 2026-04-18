const { Client, GatewayIntentBits, REST, Routes, Collection, ActivityType } = require("discord.js");
const fs = require("fs");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// Load token from environment or config.js
const token = process.env.DISCORD_TOKEN;

// -------------------
// Express server
// -------------------
app.get("/", (req, res) => {
  const status = client.isReady() ? "online" : "starting";
  res.send(`littleshop is alive (${status})`);
});

app.get("/health", (req, res) => {
  const ready = client.isReady();

  res.status(ready ? 200 : 503).json({
    ok: ready,
    botReady: ready
  });
});

app.listen(PORT, () => {
  console.log("Web server running on port", PORT);
});

// -------------------
// Discord client
// -------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildPresences
  ]
});

client.commands = new Collection();

// -------------------
// CONNECTION EVENTS
// -------------------
client.on("shardConnect", (id) => {
  console.log(`Shard ${id} connected.`);
});

// -------------------
// SAFE COMMAND LOADER
// -------------------
const commands = [];

const commandFiles = fs.existsSync("./commands")
  ? fs.readdirSync("./commands").filter((f) => f.endsWith(".js"))
  : [];

for (const file of commandFiles) {
  try {
    const command = require(`./commands/${file}`);

    if (!command?.data?.name || !command?.execute) {
      console.log("Skipped invalid command:", file);
      continue;
    }

    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());

    console.log("Loaded command:", file);
  } catch (err) {
    console.log("Error loading command:", file);
    console.error(err);
  }
}

// -------------------
// REST
// -------------------
if (!token) {
  console.error("No Discord token found. Set TOKEN or DISCORD_TOKEN env var, or create config.js with your token.");
  process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(token);

// -------------------
// READY EVENT
// -------------------
console.error("No DISCORD_TOKEN found in Render environment variables.");
  console.log("BOT ONLINE:", client.user.tag);

  try {
    await client.user.setPresence({
      activities: [
        {
          name: "processing orders <3",
          type: ActivityType.Streaming,
          url: "https://www.twitch.tv/discord"
        }
      ],
      status: "online"
    });
  } catch (err) {
    console.error("Presence error:", err);
  }

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

// -------------------
// DEBUG / CONNECTION LOGS
// -------------------
client.on("error", (err) => {
  console.error("Discord client error:", err);
});

client.on("warn", (info) => {
  console.warn("Discord client warning:", info);
});

client.on("shardDisconnect", (event, id) => {
  console.error(`Shard ${id} disconnected:`, event?.code, event?.reason || "no reason");
});

client.on("shardReconnecting", (id) => {
console.warn(`Shard ${id} reconnecting...`);
});

client.on("shardReady", (id) => {
  console.log(`Shard ${id} ready.`);
});

client.on("invalidated", () => {
  console.error("Discord session invalidated. Your token may have been reset.");
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

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "error executing command",
        ephemeral: true
      }).catch(() => {});
    } else {
      await interaction.reply({
        content: "error executing command",
        ephemeral: true
      }).catch(() => {});
    }
  }
});

// -------------------
// LOGIN
// -------------------
console.log("TOKEN LOADED:", token ? "YES" : "NO");
if (token) {
  console.log("Token length:", token.length);
  console.log("Token preview:", token.substring(0, 10) + "...");
}

// Timeout handler for stuck connections
setTimeout(() => {
  if (!client.isReady()) {
    console.error("TIMEOUT: Bot failed to connect to Discord within 30 seconds");
    process.exit(1);
  }
}, 30000);

client.login(token)
  .then(() => console.log("Discord login successful"))
  .catch((err) => {
    console.error("Discord login failed:", err);
    process.exit(1);
  });
