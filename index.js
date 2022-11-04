const {REST, Routes, Collection, SlashCommandBuilder, EmbedBuilder, ChannelType} = require('discord.js')
const axios = require('axios')
const fs = require("fs")

const COMMANDS_NAME = {
    METAR: "metar",
    SET_CHANNEL_PUBLISHER: "setpublisher",
    SET_CHANNEL_METAR: "setmetar"
}

const config = require('./config.json')
const reg = /AIRAC ([0-6]{4}) ([^(]+) \(([0-9]{4}-[0-9]{2}-[0-9]{2})\)/
let lastversion = fs.readFileSync('./lastversion.txt').toString()
let jsonGuilds = require('./guilds.json')

const commands = [
    (new SlashCommandBuilder())
        .setName(COMMANDS_NAME.METAR)
        .setDescription('Retrieve a metar for a given airport ICAO/OACI')
        .addStringOption(option =>
            option.setName('icao')
                .setDescription('Airport ICAO/OACI code')
                .setRequired(true)
                .setMaxLength(4)
                .setMinLength(4)
        ).toJSON(),
    (new SlashCommandBuilder())
        .setName(COMMANDS_NAME.SET_CHANNEL_PUBLISHER)
        .setDefaultMemberPermissions(0)
        .setDescription('Set the channel to publish new airac cycle in')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to publish new airac cycle in')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        ).toJSON(),
    (new SlashCommandBuilder())
        .setName(COMMANDS_NAME.SET_CHANNEL_METAR)
        .setDefaultMemberPermissions(0)
        .setDescription('Set the channel to use metar command')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to use metar command')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        ).toJSON()
]

const rest = new REST({version: '10'}).setToken(config.TOKEN);

const {Client, GatewayIntentBits} = require('discord.js')
const client = new Client({intents: [GatewayIntentBits.Guilds]})

let guilds = new Collection
let channels = new Collection

for (const guild in jsonGuilds) {
    channels.set(guild, jsonGuilds[guild])
}

function checkAiracCycle(channel = null) {
    axios.get(config.NAVIGRAPH_URL)
        .then(res => {
            let m;
            if ((m = reg.exec(res.data)) !== null) {
                if (m[3] !== lastversion || channel) {
                    fs.writeFile("lastversion.txt", m[3], () => {
                        lastversion = m[3]
                    })

                    const title = `New airac cycle ${m[1]} ${m[2]} is out !`
                    const embed = (new EmbedBuilder())
                        .setTitle(title)
                        .setDescription("Don't forget to update your airac cycle with Navdata center (or FMS Data Manager)")
                        .setAuthor({
                            name: "Navigraph",
                            iconURL: config.NAVIGRAPH_LOGO
                        })
                        .addFields(
                            {name: 'Cycle', value: m[1], inline: true},
                            {name: 'Revision', value: m[2], inline: true},
                            {name: 'Date', value: m[3], inline: true}
                        )
                        .setColor(config.NAVIGRAPH_COLOR)
                        .setURL(config.NAVIGRAPH_URL)
                        .setThumbnail(config.NAVIGRAPH_LOGO)
                        .setTimestamp()

                    if (channel) {
                        channel.send({embeds: [embed]})
                    } else {
                        guilds.each(async g => {
                            const c = channels.get(g.id).publisher
                            try {
                                const guild = await client.guilds.fetch(g.id)
                                await (guild.channels.fetch(c)).send({embeds: [embed]})
                            } catch (e) {
                                console.error(e.message)
                            }
                        })
                    }
                }
            }
        })
    if (!channel) {
        setTimeout(checkAiracCycle, config.INTERVAL * 1000)
    }
}

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`)

    client.user.setActivity('🛫 Flying to the moon 🌖')
    client.user.setStatus('online')

    guilds = await client.guilds.fetch()
    await rest.put(Routes.applicationCommands(config.CLIENT_ID), {body: commands})
    checkAiracCycle()
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return

    if (interaction.commandName === COMMANDS_NAME.METAR) {

        if (interaction.channelId !== channels.get(interaction.guildId).metar) {
            interaction.reply({content: "You cannot use this command here.", ephemeral: true})
            return
        }

        const icao = interaction.options.get('icao').value.toUpperCase()
        axios.get(`https://tgftp.nws.noaa.gov/data/observations/metar/stations/${icao}.TXT`)
            .then(async res => {
                interaction.reply(res.data.split('\n')[1])
            })
            .catch(async err => {
                if (err.response.status === 404) {
                    interaction.reply(`Cannot find airport with ${icao} ICAO/OACI.`)
                } else {
                    interaction.reply(`API did not respond, please try again later.`)
                }
            })
    }

    if (interaction.commandName === COMMANDS_NAME.SET_CHANNEL_PUBLISHER) {
        const input = interaction.options.get('channel')
        const guildChannel = channels.get(input.channel.guild.id).publisher

        if (guildChannel !== input.channel.id) {
            const guild = channels.get(input.channel.guild.id)
            channels.set(input.channel.guild.id, {...guild, ...{publisher: input.channel.id}})
            jsonGuilds[input.channel.guild.id] = {...jsonGuilds[input.channel.guild.id], ...{publisher: input.channel.id}}

            fs.writeFile('guilds.json', JSON.stringify(jsonGuilds), () => {
                checkAiracCycle(input.channel)
                interaction.reply({
                    content: `The channel ${input.channel.name} was set as your publish channel.`,
                    ephemeral: true
                })
            })
        } else {
            interaction.reply({content: `The channel ${input.channel.name} is already set as the publish channel.`, ephemeral: true})
        }
    }

    if (interaction.commandName === COMMANDS_NAME.SET_CHANNEL_METAR) {
        const input = interaction.options.get('channel')
        const guildChannel = channels.get(input.channel.guild.id).metar

        if (guildChannel !== input.channel.id) {
            const guild = channels.get(input.channel.guild.id)
            channels.set(input.channel.guild.id, {...guild, ...{metar: input.channel.id}})
            jsonGuilds[input.channel.guild.id] = {...jsonGuilds[input.channel.guild.id], ...{metar: input.channel.id}}

            fs.writeFile('guilds.json', JSON.stringify(jsonGuilds), () => {
                interaction.reply({
                    content: `The channel ${input.channel.name} was set to metar command channel.`,
                    ephemeral: true
                })
            })
        } else {
            interaction.reply({content: `The channel ${input.channel.name} is already set as metar channel.`, ephemeral: true})
        }
    }
});

client.on('guildCreate', async guild => {
    guilds.set(guild.id, guild)
    await rest.put(Routes.applicationCommands(config.CLIENT_ID), {body: commands})
})

client.on('guildDelete', async guild => {
    channels.delete(guild.id)
    guilds.delete(guild.id)

    jsonGuilds[guild.id] = undefined
    fs.writeFile('guilds.json', JSON.stringify(jsonGuilds), () => {})
})

client.login(config.TOKEN)
