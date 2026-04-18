const { Client, GatewayIntentBits, REST, Routes, Collection, ActivityType } = require("discord.js");
const fs = require("fs");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// -------------------
// Discord client
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
// Express server
// -------------------
app.get("/", (req, res) => {
  res.send(`littleshop is alive (${client.isReady() ? "online" : "starting"})`);
});

app.listen(PORT, () => {
  console.log("Web server running on port", PORT);
});

// -------------------
// LOAD COMMANDS
// -------------------
const commands = [];

const commandFiles = fs.existsSync("./commands")
  ? fs.readdirSync("./commands").filter(f => f.endsWith(".js"))
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
const token = process.env.TOKEN;

if (!token) {
  console.error("NO TOKEN FOUND IN ENV (TOKEN)");
  process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(token);

// -------------------
// READY EVENT (FIXED)
// -------------------
client.once("ready", async () => {
  console.log("BOT ONLINE:", client.user.tag);

  client.user.setPresence({
    activities: [
      {
        name: "processing orders <3",
        type: ActivityType.Streaming,
        url: "https://www.twitch.tv/discord"
      }
    ],
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
// LOGIN
// -------------------
console.log("TOKEN LOADED:", token ? "YES" : "NO");

client.login(token)
  .then(() => console.log("Discord login successful"))
  .catch(err => {
    console.error("Discord login failed:", err);
    process.exit(1);
  });
