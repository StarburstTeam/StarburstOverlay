//this file contains api to hypixel
class Hypixel {
    constructor(apiKey, callback) {
        this.apiKey = apiKey;
        this.data = {};
        this.owner = null;//uuid
        this.verified = false;
        this.verifying = true;
        this.verifyKey(callback);
        this.uuids = [];
    }
    verifyKey = async (callback) => {
        try {
            let a = await fetch(`https://api.hypixel.net/key?key=${this.apiKey}`)
                .catch(err => { throw err })
                .then(res => res.json());
            if (a.success == false) throw null;
            this.owner = a.record.owner;
            this.verified = true;
            this.verifying = false;
        } catch (err) {
            this.verified = false;
            this.verifying = false;
        }
        callback();
    }
    getPlayerUuid = async (name) => {//null when the player not found
        try {
            let a = await fetch(`https://api.mojang.com/users/profiles/minecraft/${name}`)
                .catch(err => { throw err })
                .then(res => res.json());
            this.uuids[name] = a.id;
            return a.id;
        } catch (err) {
            console.log(err);
            console.log('This error probably caused by a nicked player.');
            return null;
        }
    }
    getPlayerData = async (uuid) => {
        return await fetch(`https://api.hypixel.net/player?key=${this.apiKey}&uuid=${uuid}`)
            .catch(err => { throw err })
            .then(res => res.json());
    }
    getGuildData = async (uuid) => {
        return await fetch(`https://api.hypixel.net/guild?key=${this.apiKey}&player=${uuid}`)
            .catch(err => { throw err })
            .then(res => res.json());
    }
    getUuid = (name) => this.uuids[name];
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
        let guildJson = this.data[name].guild;
        if (guildJson != null && guildJson.tag != null && guildJson.tagColor != null)
            return `${formatColorFromString(guildJson.tagColor)}[${guildJson.tag}]`;
        return ``;
    }
    formatName = (name) => `${this.getRank(name)}${this.data[name].player.displayname}${this.getGuildTag(name)}`;
    getLevel = (exp) => exp < 0 ? 1 : (1 - 3.5 + Math.sqrt(12.25 + 0.0008 * (exp ?? 0))).toFixed(1);
    getTitle = (type) => {
        if (type == 'bw')
            return ['WS', 'FKDR', 'WLR', 'Finals', 'Wins'];
        if (type == 'sw')
            return ['WS', 'KDR', 'WLR', 'Kills', 'Wins'];
        if (type == 'duel')
            return ['WS', 'KDR', 'WLR', 'Kills', 'Wins'];
        if (type == 'mm')// mc=murderer_chance dc=detective_chance ac=alpha_chance
            return ['WR', 'Kills', 'MC', 'DC', 'AC'];
    }
    getTag = (name) => {
        let api = this.data[name].player;
        if (name == 'IAFEnvoy') return '§6DEV';
        else if ((api.achievements.bedwars_level < 15 && api.stats.Bedwars.final_kills_bedwars / api.stats.Bedwars.final_deaths_bedwars > 5) || (api.achievements.bedwars_level > 15 && api.achievements.bedwars_level < 100 && api.achievements.bedwars_level / (api.stats.Bedwars.final_kills_bedwars / api.stats.Bedwars.final_deaths_bedwars) <= 5))
            return '§cALT';
        else if (api.achievements.bedwars_level < 150 && api.stats.Bedwars.final_deaths_bedwars / api.stats.Bedwars.losses_bedwars < 0.75 && api.stats.Bedwars.final_kills_bedwars / api.stats.Bedwars.final_deaths_bedwars < 1.5)
            return '§aSNPR';
        else if (api.channel == 'PARTY') return '§9PRTY';
        return '§7-'
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
            return [`${basic.lvl}`,
            `[${api.achievements?.bedwars_level ?? 1}✪] ${formatColor(basic.name)}`,
            buildSpan(wsColorList.bw, api.stats?.Bedwars?.winstreak ?? 0),
            buildSpan(kdrColorList.bw, ((api.stats?.Bedwars?.final_kills_bedwars ?? 0) / (api.stats?.Bedwars?.final_deaths_bedwars ?? 0)).toFixed(2)),
            buildSpan(wlrColorList.bw, ((api.stats?.Bedwars?.wins_bedwars ?? 0) / (api.stats?.Bedwars?.losses_bedwars ?? 0)).toFixed(2)),
            buildSpan(finalsColorList.bw, api.stats?.Bedwars?.final_kills_bedwars ?? 0),
            buildSpan(winsColorList.bw, api.stats?.Bedwars?.wins_bedwars ?? 0)];
        if (type == 'sw')
            return [`${basic.lvl}`,
            `[${formatColor(api.stats?.SkyWars?.levelFormatted ?? '§71⋆')}] ${formatColor(basic.name)}`,
            buildSpan(wsColorList.sw, api.stats?.SkyWars?.win_streak ?? 0),
            buildSpan(kdrColorList.sw, ((api.stats?.SkyWars?.kills ?? 0) / (api.stats?.SkyWars?.deaths ?? 0)).toFixed(2)),
            buildSpan(wlrColorList.sw, ((api.stats?.SkyWars?.wins ?? 0) / (api.stats?.SkyWars?.losses ?? 0)).toFixed(2)),
            buildSpan(finalsColorList.sw, api.stats?.SkyWars?.kills ?? 0),
            buildSpan(winsColorList.sw, api.stats?.SkyWars?.wins ?? 0)];
        if (type == 'duel')
            return [`${basic.lvl}`,
            `${formatColor(basic.name)}`,
            buildSpan(wsColorList.duel, api.stats?.Duels?.current_winstreak ?? 0),
            buildSpan(kdrColorList.duel, ((api.stats?.Duels?.kills ?? 0) / (api.stats?.Duels?.deaths ?? 0)).toFixed(2)),
            buildSpan(wlrColorList.duel, ((api.stats?.Duels?.wins ?? 0) / (api.stats?.Duels?.losses ?? 0)).toFixed(2)),
            buildSpan(finalsColorList.duel, api.stats?.Duels?.kills ?? 0),
            buildSpan(winsColorList.duel, api.stats?.Duels?.wins ?? 0)];
        if (type == 'mm')
            return [`${basic.lvl}`,
            `${formatColor(basic.name)}`,
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
//color parser
const colors = [
    '#000000', '#0000AA', '#00AA00', '#00AAAA', '#AA0000', '#AA00AA', '#FFAA00', '#AAAAAA',
    '#555555', '#5555FF', '#55FF55', '#55FFFF', '#FF5555', '#FF55FF', '#FFFF55', '#FFFFFF'
];
const formatColor = (data) => {
    if (data == null) return 'Fail to get';
    return data.split('').reduce((ret, char, index, arr) =>
        ret += char == '§' ? '</span>' : arr[index - 1] == '§' ? '<span style="color:' + colors[parseInt(char, 16)] + '">' : char,
        '<span style="color:' + colors[0] + '">') + '</span>';
}

const colorList = ['#AAAAAA', '#FFFFFF', '#FFAA00', '#00AAAA', '#AA0000', '#AA00AA'];
const wsColorList = {
    bw: [4, 10, 25, 50, 100, Infinity],
    sw: [50, 100, 150, 200, 250, Infinity],
    duel: [4, 10, 25, 50, 100, Infinity]
}, kdrColorList = {
    bw: [1, 3, 5, 10, 25, Infinity],
    sw: [1, 2, 3, 4, 5, Infinity],
    duel: [1, 2, 3, 5, 7.5, Infinity]
}, wlrColorList = {
    bw: [1, 2, 5, 7, 10, Infinity],
    sw: [0.1, 0.25, 0.5, 0.75, 1, Infinity],
    duel: [1, 2, 3, 5, 7.5, Infinity]
}, bblrColorList = {
    bw: [1, 2, 3, 5, 7.5, Infinity]
}, finalsColorList = {
    bw: [1000, 5000, 10000, 20000, 30000, Infinity],
    sw: [1000, 5000, 15000, 30000, 75000, Infinity],
    duel: [500, 1500, 4000, 10000, 17500, Infinity]
}, winsColorList = {
    bw: [500, 1000, 3000, 5000, 10000, Infinity],
    sw: [100, 750, 4000, 10000, 25000, Infinity],
    duel: [500, 1500, 4000, 10000, 17500, Infinity]
}

const pickColor = (list, value) => colorList[list.indexOf(list.find(v => v >= value))];
const buildSpan = (list, value) => `<span style="color:${pickColor(list, value)}">${value}</span>`