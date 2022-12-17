//this file contains api to hypixel
class Hypixel {
    constructor(apiKey, callback) {
        this.apiKey = apiKey;
        this.data = {};
        this.verifying = true;
        this.verifyKey(callback);
        this.uuids = [];
    }
    verifyKey = async (callback) => {
        try {
            this.verified = false;
            this.owner = null;//uuid
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
        if (callback != null) callback();
    }
    getPlayerUuid = async (name) => {//null when the player not found
        try {
            let a = await fetch(`https://api.mojang.com/users/profiles/minecraft/${name}`)
                .catch(err => { throw err })
                .then(res => res.json());
            return this.uuids[name] = a.id;
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
            return true;
        this.data[name] = { success: false };
        let uuid = await this.getPlayerUuid(name);
        if (uuid == null) {
            this.data[name] = { success: true, time: new Date().getTime(), nick: true };
            return false;
        }
        let playerData = await this.getPlayerData(uuid);
        let guildData = await this.getGuildData(uuid);
        if (!playerData.success || !guildData.success) return null;
        if (playerData.player == null) {
            this.data[name] = { success: true, time: new Date().getTime(), nick: true };
            return false;
        }
        this.data[name] = { success: true, time: new Date().getTime(), nick: false, player: playerData.player, guild: guildData.guild };
        if (callback != null) callback();
        return true;
    }
    getRank = (name) => {
        if (this.data[name] == null || this.data[name].player == null) return '§7';
        let playerDataJson = this.data[name].player;
        let rank = playerDataJson.newPackageRank;
        let plus = playerDataJson.rankPlusColor;
        if (plus != null) plus = formatColorFromString(plus);
        else plus = '§c';
        if (playerDataJson.rank != null)
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
        if (this.data[name] == null || this.data[name].guild == null) return ``;
        let guildJson = this.data[name].guild;
        if (guildJson.tag != null && guildJson.tagColor != null)
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
        if (type == 'uhc')
            return ['Score', 'KDR', 'WLR', 'Kills', 'Wins'];
        if (type == 'mw')
            return ['FKDR', 'WLR', 'Finals', 'Wins', 'WDamage'];
        if (type == 'ww')
            return ['KDR', 'WR', 'Kills', 'Wins', 'WPlaced'];
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
    getMiniData = (name, type) => {
        let api = this.data[name].player;
        if (this.data[name].nick) return [name, 'NICK'];
        let basic = {
            name: formatColor(this.formatName(name)),
            lvl: buildSpan(lvlList.lvl, this.getLevel(api?.networkExp ?? 0), '[', ']'),
            nick: false
        };
        if (type == 'bw')
            return [`${basic.lvl}`, `${formatBwLevel(api.achievements?.bedwars_level ?? 1)} ${basic.name}`,
            buildSpan(wsColorList.bw, api.stats?.Bedwars?.winstreak ?? 0),
            buildSpan(kdrColorList.bw, ((api.stats?.Bedwars?.final_kills_bedwars ?? 0) / (api.stats?.Bedwars?.final_deaths_bedwars ?? 0)).toFixed(2)),
            buildSpan(wlrColorList.bw, ((api.stats?.Bedwars?.wins_bedwars ?? 0) / (api.stats?.Bedwars?.losses_bedwars ?? 0)).toFixed(2)),
            buildSpan(finalsColorList.bw, api.stats?.Bedwars?.final_kills_bedwars ?? 0),
            buildSpan(winsColorList.bw, api.stats?.Bedwars?.wins_bedwars ?? 0)];
        if (type == 'sw') {
            let level = api.stats?.SkyWars?.levelFormatted ?? '§71⋆';
            return [`${basic.lvl}`, `${formatColor(`${level.substring(0, 2)}[${level.substring(2)}]`)} ${basic.name}`,
            buildSpan(wsColorList.sw, api.stats?.SkyWars?.win_streak ?? 0),
            buildSpan(kdrColorList.sw, ((api.stats?.SkyWars?.kills ?? 0) / (api.stats?.SkyWars?.deaths ?? 0)).toFixed(2)),
            buildSpan(wlrColorList.sw, ((api.stats?.SkyWars?.wins ?? 0) / (api.stats?.SkyWars?.losses ?? 0)).toFixed(2)),
            buildSpan(finalsColorList.sw, api.stats?.SkyWars?.kills ?? 0),
            buildSpan(winsColorList.sw, api.stats?.SkyWars?.wins ?? 0)];
        }
        if (type == 'duel')
            return [`${basic.lvl}`, `${pickDuelLvl(api.stats?.Duels?.wins ?? 0)} ${basic.name}`,
            buildSpan(wsColorList.duel, api.stats?.Duels?.current_winstreak ?? 0),
            buildSpan(kdrColorList.duel, ((api.stats?.Duels?.kills ?? 0) / (api.stats?.Duels?.deaths ?? 0)).toFixed(2)),
            buildSpan(wlrColorList.duel, ((api.stats?.Duels?.wins ?? 0) / (api.stats?.Duels?.losses ?? 0)).toFixed(2)),
            buildSpan(finalsColorList.duel, api.stats?.Duels?.kills ?? 0),
            buildSpan(winsColorList.duel, api.stats?.Duels?.wins ?? 0)];
        if (type == 'mm')
            return [`${basic.lvl}`, `${basic.name}`,
            buildSpan(wlrColorList.mm, (100 * (api.stats?.MurderMystery?.wins ?? 0) / (api.stats?.MurderMystery?.games ?? 0)).toFixed(1), '', '%'),
            buildSpan(finalsColorList.mm, api.stats?.MurderMystery?.kills ?? 0),
            buildSpan(probabilityList.murderer_chance, (api.stats?.MurderMystery?.murderer_chance ?? 0), '', '%'),
            buildSpan(probabilityList.detective_chance, (api.stats?.MurderMystery?.detective_chance ?? 0), '', '%'),
            buildSpan(probabilityList.alpha_chance, (api.stats?.MurderMystery?.alpha_chance ?? 0), '', '%')];
        if (type == 'mw')
            return [`${basic.lvl}`, `${basic.name}`,
            buildSpan(kdrColorList.mw, ((api.stats?.Walls3?.final_kills ?? 0) / (api.stats?.Walls3?.final_deaths ?? 0)).toFixed(2)),
            buildSpan(wlrColorList.mw, ((api.stats?.Walls3?.wins ?? 0) / (api.stats?.Walls3?.losses ?? 0)).toFixed(2)),
            buildSpan(finalsColorList.mw, api.stats?.Walls3?.final_kills ?? 0),
            buildSpan(winsColorList.mw, api.stats?.Walls3?.wins ?? 0),
            buildSpan(specialList.mw_wither_damage, api.stats?.Walls3?.wither_damage ?? 0)];
        if (type == 'ww')
            return [`${basic.lvl}`, `${basic.name}`,
            buildSpan(kdrColorList.ww, ((api.stats?.WoolGames?.wool_wars?.stats?.kills ?? 0) / (api.stats?.WoolGames?.wool_wars?.stats?.deaths ?? 0)).toFixed(2)),
            buildSpan(wlrColorList.ww, ((api.stats?.WoolGames?.wool_wars?.stats?.wins ?? 0) / (api.stats?.WoolGames?.wool_wars?.stats?.games_played ?? 0)).toFixed(2)),
            buildSpan(finalsColorList.ww, api.stats?.WoolGames?.wool_wars?.stats?.kills ?? 0),
            buildSpan(winsColorList.ww, api.stats?.WoolGames?.wool_wars?.stats?.wins ?? 0),
            buildSpan(specialList.ww_wool_placed, api.stats?.WoolGames?.wool_wars?.stats?.wool_placed ?? 0)];
    }
    getColorLists = (type) => {
        if (type == 'bw') return [wsColorList.bw, kdrColorList.bw, wlrColorList.bw, finalsColorList.bw, winsColorList.bw];
        if (type == 'sw') return [wsColorList.sw, kdrColorList.sw, wlrColorList.sw, finalsColorList.sw, winsColorList.sw];
    }
    getGuildLevel = (exp) => {
        let guildLevelTables = [100000, 150000, 250000, 500000, 750000, 1000000, 1250000, 1500000, 2000000, 2500000, 2500000, 2500000, 2500000, 2500000, 3000000];
        let level = 0;
        for (let i = 0; ; i++) {
            let need = i >= guildLevelTables.length ? guildLevelTables[guildLevelTables.length - 1] : guildLevelTables[i];
            exp -= need;
            if (exp < 0) return level + 1 + exp / need;
            else level++;
        }
    }
    getGuild = (name) => {
        let guildJson = this.data[name].guild;
        if (guildJson == null) return 'Guild : No Guild';
        let data = `Guild : ${guildJson.name}<br>
        Level : ${this.getGuildLevel(guildJson.exp).toFixed(2)}<br>
        Members : ${guildJson.members.length}<br>`
        let playerGuildJson = guildJson.members.find(member => member.uuid == this.uuids[name]);
        let rankJson = guildJson.ranks.find(rank => rank.name == playerGuildJson.rank);
        if (playerGuildJson == null || rankJson == null) return data;
        return data + `Join Time : ${formatDateTime(playerGuildJson.joined)}<br>
        Rank : ${playerGuildJson.rank} (${formatColor(formatColorFromString(guildJson.tagColor) + '[' + rankJson.tag + ']')})`;
    }
    getStatus = async (name) => {
        const b = await fetch(`https://api.hypixel.net/status?key=${this.apiKey}&uuid=${this.getUuid(name)}`)
            .catch(reason => console.log(reason))
            .then(res => res.json());
        if (!b.success)
            return document.getElementById('status').innerHTML = b.cause;
        let statusJson = b.session;
        if (statusJson.online)
            if (statusJson.map != null)
                return `Status : Online<br>Game Type : ${formatNameString(statusJson.gameType)}<br>Mode : ${formatNameString(statusJson.mode)}<br>Map : ${statusJson.map}`;
            else
                return `Status : Online<br>Game Type : ${formatNameString(statusJson.gameType)}<br>Mode : ${formatNameString(statusJson.mode)}`;
        else return `Status : Offline`;
    }
}

const colorList = ['7', 'f', 'a', 'b', 'c', '6'];
const lvlList = {
    lvl: [50, 100, 150, 200, 250]
}, wsColorList = {
    bw: [4, 10, 25, 50, 100],
    sw: [50, 100, 150, 200, 250],
    duel: [4, 10, 25, 50, 100]
}, kdrColorList = {
    bw: [1, 3, 5, 10, 25],
    sw: [1, 2, 3, 4, 5],
    duel: [1, 2, 3, 5, 7.5],
    mw: [1, 2, 3, 5, 7.5],
    ww: [1, 2, 3, 5, 7.5]
}, wlrColorList = {
    bw: [1, 2, 5, 7, 10],
    sw: [0.1, 0.25, 0.5, 0.75, 1],
    mm: [70, 80, 85, 90, 95, 100],
    duel: [1, 2, 3, 5, 7.5],
    mw: [1, 2, 3, 5, 7.5],
    ww: [1, 2, 3, 5, 7.5]
}, bblrColorList = {
    bw: [1, 2, 3, 5, 7.5]
}, finalsColorList = {
    bw: [1000, 5000, 10000, 20000, 30000],
    sw: [1000, 5000, 15000, 30000, 75000],
    mm: [500, 1000, 4000, 10000, 20000],
    duel: [500, 1500, 4000, 10000, 17500],
    mw: [100, 200, 400, 800, 1600],
    ww: [100, 200, 400, 800, 1600]
}, winsColorList = {
    bw: [500, 1000, 3000, 5000, 10000],
    sw: [100, 750, 4000, 10000, 25000],
    duel: [500, 1500, 4000, 10000, 17500],
    mw: [100, 200, 400, 800, 1600],
    ww: [100, 200, 400, 800, 1600]
}, probabilityList = {
    murderer_chance: [1, 3, 5, 10, 15],
    detective_chance: [1, 3, 5, 10, 15],
    alpha_chance: [1, 3, 5, 10, 15],
}, specialList = {
    ww_wool_placed: [100, 200, 400, 800, 1600],
    mw_wither_damage: [1000, 2000, 4000, 8000, 16000]
}
const pickColor = (list, value) => colorList[toDefault(list.indexOf(list.find(v => v >= value)), -1, 5)];
const buildSpan = (list, value, prefix, suffix) => formatColor((list == null || value == NaN) ? `${prefix ?? ''}§7${value}${suffix ?? ''}` : `§${pickColor(list, value)}${prefix ?? ''}${value}${suffix ?? ''}`);

const duelLvlList = [
    { lvl: 100, txt: '' },
    { lvl: 120, txt: '§7[I]' }, { lvl: 140, txt: '§7[II]' }, { lvl: 160, txt: '§7[III]' }, { lvl: 180, txt: '§7[IV]' }, { lvl: 200, txt: '§7[V]' },
    { lvl: 260, txt: '§f[I]' }, { lvl: 320, txt: '§f[II]' }, { lvl: 380, txt: '§f[III]' }, { lvl: 440, txt: '§f[IV]' }, { lvl: 500, txt: '§f[V]' },
    { lvl: 600, txt: '§6[I]' }, { lvl: 700, txt: '§6[II]' }, { lvl: 800, txt: '§6[III]' }, { lvl: 900, txt: '§6[IV]' }, { lvl: 1000, txt: '§6[V]' },
    { lvl: 1200, txt: '§3[I]' }, { lvl: 1400, txt: '§3[II]' }, { lvl: 1600, txt: '§3[III]' }, { lvl: 1800, txt: '§3[IV]' }, { lvl: 2000, txt: '§3[V]' },
    { lvl: 2400, txt: '§2[I]' }, { lvl: 2800, txt: '§2[II]' }, { lvl: 3200, txt: '§2[III]' }, { lvl: 3600, txt: '§2[IV]' }, { lvl: 4000, txt: '§2[V]' },
    { lvl: 5200, txt: '§4[I]' }, { lvl: 6400, txt: '§4[II]' }, { lvl: 7600, txt: '§4[III]' }, { lvl: 8800, txt: '§4[IV]' }, { lvl: 10000, txt: '§4[V]' },
    { lvl: 12000, txt: '§e[I]' }, { lvl: 14000, txt: '§e[II]' }, { lvl: 16000, txt: '§e[III]' }, { lvl: 18000, txt: '§e[IV]' }, { lvl: 20000, txt: '§e[V]' },
    { lvl: 24000, txt: '§5[I]' }, { lvl: 28000, txt: '§5[II]' }, { lvl: 32000, txt: '§5[III]' }, { lvl: 36000, txt: '§5[IV]' }, { lvl: 40000, txt: '§5[V]' },
    { lvl: 44000, txt: '§5[VI]' }, { lvl: 48000, txt: '§5[VII]' }, { lvl: 52000, txt: '§5[VII]' }, { lvl: 56000, txt: '§5[IX]' }, { lvl: Infinity, txt: '§5[X]' },
], pickDuelLvl = (wins) => formatColor(duelLvlList.find(x => x.lvl >= wins).txt);

const bwLvlProvider = [
    (lvl) => `§7[${lvl}✪]`,
    (lvl) => `§f[${lvl}✪]`,
    (lvl) => `§6[${lvl}✪]`,
    (lvl) => `§b[${lvl}✪]`,
    (lvl) => `§2[${lvl}✪]`,
    (lvl) => `§3[${lvl}✪]`,
    (lvl) => `§4[${lvl}✪]`,
    (lvl) => `§d[${lvl}✪]`,
    (lvl) => `§9[${lvl}✪]`,
    (lvl) => `§5[${lvl}✪]`,
    (lvl) => `§c[§61§e${Math.floor((lvl % 1000) / 100)}§a${Math.floor((lvl % 100) / 10)}§b${lvl % 10}§d✫§5]`,
    (lvl) => `§7[§f${lvl}§7✪§7]`,
    (lvl) => `§7[§e${lvl}§6✪§7]`,
    (lvl) => `§7[§e${lvl}§6✪§7]`,
    (lvl) => `§7[§b${lvl}§3✪§7]`,
    (lvl) => `§7[§a${lvl}§2✪§7]`,
    (lvl) => `§7[§3${lvl}§9✪§7]`,
    (lvl) => `§7[§c${lvl}§4✪§7]`,
    (lvl) => `§7[§d${lvl}§5✪§7]`,
    (lvl) => `§7[§9${lvl}§1✪§7]`,
    (lvl) => `§7[§5${lvl}§8✪§7]`,
    (lvl) => `§8[§72§f${Math.floor(lvl / 10 % 100)}§7${lvl % 10}✪§8]`,
    (lvl) => `§f[2§e${Math.floor(lvl / 10 % 100)}§6${lvl % 10}⚝]`,
    (lvl) => `§6[2§f${Math.floor(lvl / 10 % 100)}§b${lvl % 10}§3⚝]`,
    (lvl) => `§5[2§d${Math.floor(lvl / 10 % 100)}§6${lvl % 10}§e⚝]`,
    (lvl) => `§b[2§f${Math.floor(lvl / 10 % 100)}§7${lvl % 10}⚝§8]`,
    (lvl) => `§f[2§a${Math.floor(lvl / 10 % 100)}§2${lvl % 10}⚝]`,
    (lvl) => `§4[2§c${Math.floor(lvl / 10 % 100)}§d${lvl % 10}⚝§5]`,
    (lvl) => `§e[2§f${Math.floor(lvl / 10 % 100)}§8${lvl % 10}⚝]`,
    (lvl) => `§a[${Math.floor(lvl / 1000)}§2${Math.floor(lvl / 100 % 10)}${Math.floor(lvl / 10 % 10)}§6${lvl % 10}⚝§c]`,
    (lvl) => `§b[${Math.floor(lvl / 1000)}§3${Math.floor(lvl / 100 % 10)}${Math.floor(lvl / 10 % 10)}§9${lvl % 10}⚝§1]`
], bwLvlProviderMax = (lvl) => `§e[3§6${Math.floor(lvl / 10 % 100)}§c${lvl % 10}⚝§4]`;
const formatBwLevel = (lvl) => {
    let i = Math.floor((lvl - 1) / 100);
    let ret = bwLvlProvider[i];
    if (ret == null) ret = bwLvlProviderMax;
    return formatColor(ret(lvl));
}

//searcher
const modeList = ['bw', 'sw', 'mm', 'duel', 'uhc', 'mw', 'bb', 'pit', 'bsg', 'arcade'];
const getData = {
    "ov": (api) => {
        achievements = api.achievements ?? {};
        return `Level : ${(api.networkExp ?? 0) < 0 ? 1 : (1 - 3.5 + Math.sqrt(12.25 + 0.0008 * (api.networkExp ?? 0))).toFixed(2)}<br>
      Karma : ${api.karma ?? 0}<br>
      Achievement Point :  ${api.achievementPoints ?? 0}<br>
      Complete Quest : ${achievements.general_quest_master ?? 0}<br>
      Complete Challenge : ${achievements.general_challenger ?? 0}<br>
      Language : ${formatNameString(api.userLanguage ?? 'ENGLISH')}<br>
      First Login : ${formatDateTime(api.firstLogin)}<br>
      Last Login : ${formatDateTime(api.lastLogin)}<br>
      Last Logout : ${formatDateTime(api.lastLogout)}`;
    },
    "bw": (api) => {
        achievements = api.achievements ?? {};
        bedwar = api.stats?.Bedwars ?? {};
        return `Level : ${achievements.bedwars_level ?? 0} | Coins : ${bedwar.coins ?? 0}<br>
      Winstreak : ${bedwar.winstreak ?? 0}<br>
      Bed Destroy : ${bedwar.beds_broken_bedwars ?? 0} | Bed Lost : ${bedwar.beds_lost_bedwars ?? 0}<br>
      Win : ${bedwar.wins_bedwars ?? 0} | Loss : ${bedwar.losses_bedwars ?? 0} | W/L : ${((bedwar.wins_bedwars ?? 0) / (bedwar.losses_bedwars ?? 0)).toFixed(2)}<br>
      Kill : ${bedwar.kills_bedwars ?? 0} | Death : ${bedwar.deaths_bedwars ?? 0} | K/D : ${((bedwar.kills_bedwars ?? 0) / (bedwar.deaths_bedwars ?? 0)).toFixed(2)}<br>
      Final Kill : ${bedwar.final_kills_bedwars ?? 0} | Final Death : ${bedwar.final_deaths_bedwars ?? 0} | FKDR : ${((bedwar.final_kills_bedwars ?? 0) / (bedwar.final_deaths_bedwars ?? 0)).toFixed(2)}<br>
      Iron : ${bedwar.iron_resources_collected_bedwars ?? 0} | Gold : ${bedwar.gold_resources_collected_bedwars ?? 0}<br>
      Diamond : ${bedwar.diamond_resources_collected_bedwars ?? 0} | Emerald : ${bedwar.emerald_resources_collected_bedwars ?? 0}`;
    },
    "sw": (api) => {
        skywar = api.stats?.SkyWars ?? {};
        return `Level : ${formatColor(skywar.levelFormatted)} | Soul : ${skywar.souls ?? 0}<br>
      Coins : ${skywar.coins ?? 0} | Assists : ${skywar.assists ?? 0}<br>
      Kills : ${skywar.kills ?? 0} | Deaths : ${skywar.deaths ?? 0} | K/D : ${((skywar.kills ?? 0) / (skywar.deaths ?? 0)).toFixed(2)}<br>
      Wins : ${skywar.wins ?? 0} | Losses : ${skywar.losses ?? 0} | W/L : ${((skywar.wins ?? 0) / (skywar.losses ?? 0)).toFixed(2)}`;
    },
    "mm": (api) => {
        mm = api.stats?.MurderMystery ?? {};
        return `Coins : ${mm.coins ?? 0} | Gold Collected : ${mm.coins_pickedup ?? 0}<br>
      Murder Chance : ${mm.murderer_chance ?? 0}% | Detective Chance : ${mm.detective_chance ?? 0}%<br>
      Wins : ${mm.wins ?? 0} | Win Rate : ${(100 * (mm.wins ?? 0) / (mm.games ?? 0)).toFixed(2)}%<br>
      Kills : ${mm.kills ?? 0} | Deaths : ${mm.deaths ?? 0}<br>
      Knife Kills : ${mm.knife_kills ?? 0} | Bow Kills : ${mm.bow_kills ?? 0}<br>
      Kills As Murderer : ${mm.kills_as_murderer ?? 0} | Heroes : ${mm.was_hero ?? 0}<br>
      Kills As Infected : ${mm.kills_as_infected ?? 0} | Kills As Survivor : ${mm.kills_as_survivor ?? 0}<br>
      Longest Time Survive : ${mm.longest_time_as_survivor_seconds ?? 0}s<br>
      Alpha Chance : ${mm.alpha_chance ?? 0}%`
    },
    "duel": (api) => {
        duel = api.stats?.Duels ?? {};
        return `Coins : ${duel.coins ?? 0} | Ping Preference : ${duel.pingPreference ?? 0}ms<br>
      Wins : ${duel.wins ?? 0} | Losses : ${duel.losses} | W/L : ${((duel.wins ?? 0) / (duel.losses ?? 0)).toFixed(2)}<br>
      Best Winstreak : ${duel.best_all_modes_winstreak ?? '?'} | Current Winstreak : ${duel.current_winstreak ?? '?'}<br>
      Kills : ${duel.kills ?? 0} | Deaths : ${duel.deaths ?? 0} | K/D : ${((duel.kills ?? 0) / (duel.deaths ?? 0)).toFixed(2)}<br>`
    },
    "uhc": (api) => {
        uhc = api.stats?.UHC ?? {};
        return `Score : ${uhc.score ?? 0} | Coins : ${uhc.coins ?? 0} | Wins : ${uhc.wins ?? 0}<br>
      Kills : ${uhc.kills ?? 0} | Deaths : ${uhc.deaths ?? 0} | K/D : ${((uhc.kills ?? 0) / (uhc.deaths ?? 0)).toFixed(2)}<br>`
    },
    "mw": (api) => {
        mw = api.stats?.Walls3 ?? {};
        return `Coins : ${mw.coins ?? 0} | Wither Damage : ${mw.wither_damage ?? 0}<br>
      Chosen Class : ${formatNameString(mw.chosen_class ?? 'None')}<br>
      Wins : ${mw.wins ?? 0} | Losses : ${mw.losses ?? 0} | W/L : ${((mw.wins ?? 0) / (mw.losses ?? 0)).toFixed(2)}<br>
      Kills : ${mw.kills ?? 0} | Deaths : ${mw.deaths ?? 0}<br>
      K/D : ${((mw.kills ?? 0) / (mw.deaths ?? 0)).toFixed(2)} | Assists : ${mw.assists ?? 0}<br>
      Final kills : ${mw.final_kills ?? 0} | Final deaths : ${mw.final_deaths ?? 0}<br>
      FKDR : ${((mw.final_kills ?? 0) / (mw.final_deaths ?? 0)).toFixed(2)} | Final Assists : ${mw.final_assists ?? 0}<br>`
    },
    "bb": (api) => {
        bb = api.stats?.BuildBattle ?? {};
        return `Game played : ${bb.games_played ?? 0} | Score : ${bb.score ?? 0} | Wins : ${bb.wins ?? 0}<br>
      Solo-Normal wins : ${(bb.wins_solo_normal ?? 0) + (bb.wins_solo_normal_latest ?? 0)} | Team-Normal wins : ${bb.wins_teams_normal ?? 0}<br>
      Solo-Pro wins : ${bb.wins_solo_pro ?? 0} | Guess the build wins : ${bb.wins_guess_the_build ?? 0}<br>`
    },
    "pit": (api) => {
        profile = api.stats?.Pit?.profile ?? {};
        pit_stats_ptl = api.stats?.Pit?.pit_stats_ptl ?? {};
        return `Level : ${getThePitLevel(profile) ?? 0} | Prestiges : ${profile.prestiges ?? ['None']}<br>
      Kills : ${pit_stats_ptl.kills ?? 0} | Deaths : ${pit_stats_ptl.deaths ?? 0}<br>
      Assists : ${pit_stats_ptl.assists ?? 0} | Max Kill Streak : ${pit_stats_ptl.max_streak ?? 0}<br>
      K/D : ${((pit_stats_ptl.kills ?? 0) / (pit_stats_ptl.deaths ?? 0)).toFixed(2)} | 
      K+A/D : ${(((pit_stats_ptl.kills ?? 0) + (pit_stats_ptl.assists ?? 0)) / (pit_stats_ptl.deaths ?? 0)).toFixed(2)}<br>`
    },
    "bsg": (api) => {
        bsg = api.stats?.Blitz ?? {};
        return `Coins : ${bsg.coins ?? 0} | Chests Opened : ${bsg.chests_opened ?? 0}<br>
      Games Played : ${bsg.games_played ?? 0} | Wins : ${bsg.wins ?? 0}<br>
      Kills : ${bsg.kills ?? 0} | Deaths : ${bsg.deaths ?? 0} | K/D : ${((bsg.kills ?? 0) / (bsg.deaths ?? 0)).toFixed(2)}<br>`
    },
    "arcade": (api) => {
        arcade = api.stats?.Arcade ?? {};
        return `Coins : ${arcade.coins ?? 0}<br>
      Zombie : <br>
      Total Rounds Survived : ${arcade.total_rounds_survived_zombies ?? 0} | Wins : ${arcade.wins_zombies ?? 0}<br>
      Hit Rate : ${(100 * (arcade.bullets_hit_zombies ?? 0) / (arcade.bullets_shot_zombies ?? 0)).toFixed(2)}% | 
      Head Shot Rate : ${(100 * (arcade.headshots_zombies ?? 0) / (arcade.bullets_hit_zombies ?? 0)).toFixed(2)}%<br>
      Wins or Best Round : (Map : Normal/Hard/RIP)<br>
      Dead End : ${getRoundValue(arcade, 'deadend', 'normal')} / ${getRoundValue(arcade, 'deadend', 'hard')} / ${getRoundValue(arcade, 'deadend', 'rip')}<br>
      Bad Blood : ${getRoundValue(arcade, 'badblood', 'normal')} / ${getRoundValue(arcade, 'badblood', 'hard')} / ${getRoundValue(arcade, 'badblood', 'rip')}<br>
      Alien Arcadium : ${getRoundValue(arcade, 'alienarcadium', 'normal')}<br>`
    }
};

const getRoundValue = (arcade, map, difficulty) => {
    if (arcade[`wins_zombies_${map}_${difficulty}`] ?? 0 > 0) return `${arcade[`wins_zombies_${map}_${difficulty}`]} Wins`;
    return `${arcade[`total_rounds_survived_zombies_${map}_${difficulty}`] ?? 0} Rounds`;
}

// 在等级 10 * k 至 10 * (k + 1) 时, 升一级所需经验
const expReqPhased = [15, 30, 50, 75, 125, 300, 600, 800, 900, 1000, 1200, 1500];
// 在精通 k 时, 升一级所需经验需要乘以的倍数
const presMultipl = [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.75, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 45, 50, 75, 100, 101, 101, 101, 101, 101];
const getThePitLevel = (pitProfile) => {
    level = 0;
    let xp = pitProfile.xp ?? 0;
    for (let i = 0; i < presMultipl.length; i++)
        for (let j = 0; j < expReqPhased.length; j++)
            for (let k = 0; k < 10; k++) {
                if (xp < expReqPhased[j] * presMultipl[i]) return level % 120;
                xp -= expReqPhased[j] * presMultipl[i];
                level++;
            }
}

const socialMediaList = ['DISCORD', 'HYPIXEL', 'TWITCH', 'TWITTER', 'YOUTUBE'];
const getSocialMedia = (platform, api) => api?.socialMedia?.links[platform] ?? null;