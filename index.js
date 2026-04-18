const { Client, GatewayIntentBits, REST, Routes, Collection } = require("discord.js");
const fs = require("fs");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// -------------------
// Express server
// -------------------
app.get("/", (req, res) => {
  res.send("littleshop is alive");
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
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

// -------------------
// SAFE COMMAND LOADER (THIS IS THE FIX)
// -------------------
const commands = [];

const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));

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
    console.log("❌ Error loading:", file);
    console.error(err);
  }
}

// -------------------
// REST
// -------------------
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

// -------------------
// READY EVENT
// -------------------
client.once("ready", async () => {
  console.log("BOT ONLINE:", client.user.tag);

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
      });
    }
  }
});

// -------------------
// LOGIN
// -------------------
console.log("TOKEN LOADED:", process.env.TOKEN ? "YES" : "NO");

client.login(process.env.TOKEN)
  .then(() => console.log("Discord login successful"))
  .catch(err => console.error("Discord login failed:", err));
