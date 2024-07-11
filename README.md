# copilot

1. Invite me to your discord guild by clicking [here](https://discord.com/api/oauth2/authorize?client_id=1037358699662024784&permissions=2048&scope=bot)
2. Use `/setpublisher` to set the channel where you want me to post Navigraph airac news
3. Use `/setmetar` to set the channel where you want to let people use /metar command
4. Use `/metar ICAO` and enjoy

# Install

1. `git clone https://github.com/Floruzus/copilot.git`
2. `cd copilot`
3. `npm i`
4. `touch lastversion.txt`
5. `echo "{}" > guilds.json`
6. `touch config.json`
7. Edit config.json like this
```
{
  "NAVIGRAPH_URL": "https://forum.navigraph.com/t/release-notes-msfs-airac-cycle/1755",
  "NAVIGRAPH_LOGO": "https://yt3.googleusercontent.com/d17-7FRwHshkQuVtjJqbYbG6UaAV-Xz8NFYY1FTiAu7EmrsGSyvnKlNtPfRDOvmBKNVqJX8NlQ=s900-c-k-c0x00ffffff-no-rj",
  "INTERVAL": 300,
  "METARTAF_URL": "https://fr.allmetsat.com/metar-taf/france.php?icao=<ICAO>",
  "CLIENT_ID": "<DISCORD APPLICATION ID>",
  "TOKEN": "<DISCORD BOT TOKEN>",
  "NAVIGRAPH_COLOR": "#da2f2b"
}
```

|Conf|Description|
|NAVIGRAPH_URL|URL to fetch new releases of airacs|
|NAVIGRAPH_LOGO|Logo for the icon of the embed message|
|INTERVAL|Interval in seconds to fetch new airacs releases|
|METARTAF_URL|URL to get METAR/TAF information (<ICAO> is automatically by ICAO of commands)|
|CLIENT_ID|Discord application id|
|TOKEN|Discord Bot Token|
|NAVIGRAPH_COLOR|Color of the embed message|
