//this file contains api to hypixel
class Hypixel {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.data = {};
        this.owner = null;//uuid
        this.verified = false;
        this.verifyKey();
    }
    verifyKey = async () => {
        const a = await fetch(`https://api.hypixel.net/key?key=${this.apiKey}`)
            .then(res => res.json())
            .catch(reason => console.log(reason));
        if (a.success == false) {
            this.verified = false;
            return;
        }
        this.owner = a.record.owner;
        this.verified = true;
    }
    getPlayerUuid = async (name) => {//null when the player not found
        try {
            const a = await fetch(`https://api.mojang.com/users/profiles/minecraft/${name}`)
                .then(res => res.json())
                .catch(reason => console.log(reason));
            return a.id;
        } catch (err) {
            console.log(err);
            console.log('This error probably caused by a nicked player.');
            return null;
        }
    }
    getPlayerData = async (uuid) => {
        return await fetch(`https://api.hypixel.net/player?key=${this.apiKey}&uuid=${uuid}`)
            .then(res => res.json())
            .catch(reason => console.log(reason));
    }
    getGuildData = async (uuid) => {
        return await fetch(`https://api.hypixel.net/guild?key=${this.apiKey}&player=${uuid}`)
            .then(res => res.json())
            .catch(reason => console.log(reason));
    }
    download = async (name, callback) => {//true if success, false if player not found, null if api error
        if (this.data[name] != null && this.data[name].success == true && this.data[name].time + 120 * 1000 > new Date().getTime())
            return;
        this.data[name] = { success: false };
        let uuid = await this.getPlayerUuid(name);
        if (uuid == null) {
            let time = new Date().getTime();
            this.data[name] = { success: true, time: time, nick: true };
            return;
        }
        let playerData = await this.getPlayerData(uuid);
        let guildData = await this.getGuildData(uuid);
        if (!playerData.success || !guildData.success) return null;
        let time = new Date().getTime();
        this.data[name] = { success: true, time: time, nick: false, player: playerData.player, guild: guildData.guild };
        if (callback != null) callback();
    }
    getRank = (name) => {
        if (this.data[name] == null || this.data[name].player == null) {
            console.log('data is null');
            return '§7';
        }
        let playerDataJson = this.data[name].player;
        let rank = playerDataJson.newPackageRank;
        let plus = playerDataJson.rankPlusColor;
        if (plus != undefined)
            plus = formatColorFromString(plus);
        else plus = '§c';
        if (playerDataJson.rank != undefined)
            if (playerDataJson.rank == 'YOUTUBER') return `§c[§fYT§c]`;
            else if (playerDataJson.rank == 'ADMIN') return `§4[ADMIN]`;
            else if (playerDataJson.rank == 'MODERATOR') return `§2[MOD]`;
            else if (playerDataJson.rank == 'HELPER') return `§9[HELP]`;
        if (rank == 'MVP_PLUS') {
            if (playerDataJson.monthlyPackageRank == 'NONE' || !playerDataJson.hasOwnProperty('monthlyPackageRank')) return `§b[MVP${plus}+§b]`;
            else return `§6[MVP${plus}++§6]`;
        } else if (rank == 'MVP') return `§b[MVP]`;
        else if (rank == 'VIP_PLUS') return `§a[VIP§6+§a]`;
        else if (rank == 'VIP') return `§a[VIP]`;
        else return `§7`;
    }
    getGuildTag = (name) => {
        if (this.data[name] == null || this.data[name].guild == null) {
            console.log('data is null');
            return ``;
        }
        let guildJson = this.data[name].guild.guild;
        if (guildJson != null && guildJson.tag != null && guildJson.tagColor != null)
            return `${formatColorFromString(guildJson.tagColor)}[${guildJson.tag}]`;
        return ``;
    }
    formatName = (name) => {
        return `${this.getRank(name)}${name}§f`;
    }
    getLevel = (exp) => exp < 0 ? 1 : (1 - 3.5 + Math.sqrt(12.25 + 0.0008 * (exp ?? 0))).toFixed(0);
    getTitle = (type) => {
        if (type == 'bw')
            return ['WS', 'FKDR', 'WLR', 'Finals', 'Wins'];
        if (type == 'mm')// mc=murderer_chance dc=detective_chance ac=alpha_chance
            return ['WinRate', 'Kills', 'MC', 'DC', 'AC'];
    }
    getData = (name, type) => {
        let api = this.data[name].player;
        if (this.data[name].nick) return [name, 'NICK'];
        let basic = {
            name: this.formatName(name),
            lvl: this.getLevel(api?.networkExp ?? 0),
            nick: false
        };
        if (type == 'bw')
            return [`[${basic.lvl}] [${api.achievements?.bedwars_level ?? 1}✪] ${formatColor(basic.name)}`,
            api.stats?.Bedwars?.winstreak ?? 0,
            ((api.stats?.Bedwars?.final_kills_bedwars ?? 0) / (api.stats?.Bedwars?.final_deaths_bedwars ?? 0)).toFixed(2),
            ((api.stats?.Bedwars?.wins_bedwars ?? 0) / (api.stats?.Bedwars?.losses_bedwars ?? 0)).toFixed(2),
            api.stats?.Bedwars?.final_kills_bedwars ?? 0,
            api.stats?.Bedwars?.wins_bedwars ?? 0];
        if (type == 'mm')
            return [`[${basic.lvl}] ${formatColor(basic.name)}`,
            (100 * (api.stats?.MurderMystery?.wins ?? 0) / (api.stats?.MurderMystery?.games ?? 0)).toFixed(1) + '%',
            api.stats?.MurderMystery?.kills ?? 0,
            (api.stats?.MurderMystery?.murderer_chance ?? 0) + '%',
            (api.stats?.MurderMystery?.detective_chance ?? 0) + '%',
            (api.stats?.MurderMystery?.alpha_chance ?? 0) + '%'];

    }
}

const colorMap = Object.fromEntries([
    'black', 'dark_blue', 'dark_green', 'dark_aqua', 'dark_red', 'dark_purple', 'gold', 'gray',
    'dark_gray', 'blue', 'green', 'aqua', 'red', 'light_purple', 'yellow', 'white'
].map((c, i) => [c, "§" + i.toString(16)]))
const formatColorFromString = name => colorMap[name.toLowerCase()];