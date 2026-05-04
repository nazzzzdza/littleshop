const { Client, GatewayIntentBits, REST, Routes, Collection } = require("discord.js");
const fs = require("fs");
const express = require("express");
const ws = require("ws");

// ✅ SUPABASE (ADDED)
const { createClient } = require("@supabase/supabase-js");
const ws = require("ws");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    realtime: {
      transport: ws
    }
  }
);

// export so commands can use it
module.exports.supabase = supabase;

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------
// Web server (Render keep alive)
// ---------------------------
app.get("/", (req, res) => {
  res.send("polka's helper is alive, checking your orders!");
});

app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
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

client.commands = new Collection();

// ---------------------------
// Load commands
// ---------------------------
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const commands = [];

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  if (command.data) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  }
}

// ---------------------------
// Register slash commands
// ---------------------------
const token = String(process.env.TOKEN || "").trim();

const rest = new REST({ version: "10" }).setToken(token);

// ---------------------------
// READY EVENT
// ---------------------------
client.once("ready", async () => {
  console.log(`polka's helper is online as ${client.user.tag}`);

  const latency = Date.now() - client.readyTimestamp;
  console.log(`latency: ${latency}ms`);

  client.user.setPresence({
    activities: [{
      name: "processing your orders <3",
      type: 1,
      url: "https://www.twitch.tv/discord"
    }],
    status: "streaming"
  });

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log("Slash commands registered.");
  } catch (error) {
    console.error(error);
  }
});

// ---------------------------
// Handle interactions
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
          content: "there was an error executing that command.",
          ephemeral: true
        });
      }
    }
  }

  else {
    for (const command of client.commands.values()) {
      if (typeof command.handleInteraction === "function") {
        try {
          await command.handleInteraction(interaction);
        } catch (error) {
          console.error(error);
        }
      }
    }
  }
});

// ---------------------------
// Login
// ---------------------------
console.log("Token loaded:", token ? "YES" : "NO");

client.login(token)
  .then(() => {
    console.log("Discord login successful");
  })
  .catch((err) => {
    console.error("Discord login failed:", err);
  });
