const getData = {
    "ov": (api) => {
        achievements = api.achievements ?? {};
        return `等级：${(api.networkExp ?? 0) < 0 ? 1 : (1 - 3.5 + Math.sqrt(12.25 + 0.0008 * (api.networkExp ?? 0))).toFixed(2)} | 人品：${api.karma ?? 0}<br>
        成就点数：${api.achievementPoints ?? 0}<br>
        完成任务：${achievements.general_quest_master ?? 0} | 完成挑战：${achievements.general_challenger ?? 0}<br>
        语言：${formatNameString(api.userLanguage ?? 'ENGLISH')} | Rank赠送：${api?.giftingMeta?.ranksGiven ?? 0}<br>
        首次登入：${formatDateTime(api.firstLogin)}<br>
        上次登入：${formatDateTime(api.lastLogin)}<br>
        上次登出：${formatDateTime(api.lastLogout)}`;
    },
    "bw": (api) => {
        achievements = api.achievements ?? {};
        bedwar = api.stats?.Bedwars ?? {};
        return `等级：${achievements.bedwars_level ?? 0} | 硬币：${bedwar.coins ?? 0}<br>
        连胜：${bedwar.winstreak ?? 0}<br>
        破坏床数：${bedwar.beds_broken_bedwars ?? 0} | 被破坏床数：${bedwar.beds_lost_bedwars ?? 0}<br>
        胜场：${bedwar.wins_bedwars ?? 0} | 败场：${bedwar.losses_bedwars ?? 0} | W/L：${((bedwar.wins_bedwars ?? 0) / (bedwar.losses_bedwars ?? 0)).toFixed(2)}<br>
        击杀：${bedwar.kills_bedwars ?? 0} | 死亡：${bedwar.deaths_bedwars ?? 0} | K/D：${((bedwar.kills_bedwars ?? 0) / (bedwar.deaths_bedwars ?? 0)).toFixed(2)}<br>
        最终击杀：${bedwar.final_kills_bedwars ?? 0} | 最终死亡：${bedwar.final_deaths_bedwars ?? 0} | FKDR：${((bedwar.final_kills_bedwars ?? 0) / (bedwar.final_deaths_bedwars ?? 0)).toFixed(2)}<br>
        铁锭收集：${bedwar.iron_resources_collected_bedwars ?? 0} | 金锭收集：${bedwar.gold_resources_collected_bedwars ?? 0}<br>
        钻石收集：${bedwar.diamond_resources_collected_bedwars ?? 0} | 绿宝石收集：${bedwar.emerald_resources_collected_bedwars ?? 0}<br>`;
    },
    "sw": (api) => {
        skywar = api.stats?.SkyWars ?? {};
        return `等级：${formatColor(skywar.levelFormatted)} | 灵魂：${skywar.souls ?? 0}<br>
        硬币：${skywar.coins ?? 0} | 助攻：${skywar.assists ?? 0}<br>
        击杀：${skywar.kills ?? 0} | 死亡：${skywar.deaths ?? 0} | K/D：${((skywar.kills ?? 0) / (skywar.deaths ?? 0)).toFixed(2)}<br>
        胜场：${skywar.wins ?? 0} | 败场：${skywar.losses ?? 0} | W/L：${((skywar.wins ?? 0) / (skywar.losses ?? 0)).toFixed(2)}`;
    },
    "mm": (api) => {
        mm = api.stats?.MurderMystery ?? {};
        return `硬币：${mm.coins ?? 0} | 金锭收集：${mm.coins_pickedup ?? 0}<br>
        杀手概率：${mm.murderer_chance ?? 0}% | 侦探概率：${mm.detective_chance ?? 0}%<br>
        胜场：${mm.wins ?? 0} | 胜率：${(100 * (mm.wins ?? 0) / (mm.games ?? 0)).toFixed(2)}%<br>
        击杀：${mm.kills ?? 0} | 死亡：${mm.deaths ?? 0}<br>
        飞刀击杀：${mm.knife_kills ?? 0} | 弓箭击杀：${mm.bow_kills ?? 0}<br>
        作为杀手击杀：${mm.kills_as_murderer ?? 0} | 英雄：${mm.was_hero ?? 0}<br>
        作为感染者击杀：${mm.kills_as_infected ?? 0} | 作为幸存者击杀：${mm.kills_as_survivor ?? 0}<br>
        最长存活时间：${mm.longest_time_as_survivor_seconds ?? 0}s | 母体概率：${mm.alpha_chance ?? 0}%`
    },
    "duel": (api) => {
        duel = api.stats?.Duels ?? {};
        return `硬币：${duel.coins ?? 0} | Ping偏好：${duel.pingPreference ?? 200}ms<br>
        胜场：${duel.wins ?? 0} | 败场：${duel.losses} | W/L：${((duel.wins ?? 0) / (duel.losses ?? 0)).toFixed(2)}<br>
        最佳连胜：${duel.best_all_modes_winstreak ?? '?'} | 目前连胜：${duel.current_winstreak ?? '?'}<br>
        击杀：${duel.kills ?? 0} | 死亡：${duel.deaths ?? 0} | K/D：${((duel.kills ?? 0) / (duel.deaths ?? 0)).toFixed(2)}`
    },
    "uhc": (api) => {
        uhc = api.stats?.UHC ?? {};
        return `分数：${uhc.score ?? 0} | 硬币：${uhc.coins ?? 0} | 胜场：${uhc.wins ?? 0}<br>
        击杀：${uhc.kills ?? 0} | 死亡：${uhc.deaths ?? 0} | K/D：${((uhc.kills ?? 0) / (uhc.deaths ?? 0)).toFixed(2)}`
    },
    "mw": (api) => {
        mw = api.stats?.Walls3 ?? {};
        return `硬币：${mw.coins ?? 0} | 凋零伤害${mw.wither_damage ?? 0}<br>
        职业：${formatNameString(mw.chosen_class ?? 'None')}<br>
        胜场：${mw.wins ?? 0} | 败场：${mw.losses ?? 0} | W/L：${((mw.wins ?? 0) / (mw.losses ?? 0)).toFixed(2)}<br>
        击杀：${mw.kills ?? 0} | 死亡：${mw.deaths ?? 0}<br>
        K/D：${((mw.kills ?? 0) / (mw.deaths ?? 0)).toFixed(2)} | 助攻：${mw.assists ?? 0}<br>
        最终击杀：${mw.final_kills ?? 0} | 最终死亡：${mw.final_deaths ?? 0}<br>
        FKDR：${((mw.final_kills ?? 0) / (mw.final_deaths ?? 0)).toFixed(2)} | 最终助攻：${mw.final_assists ?? 0}`
    },
    "bb": (api) => {
        bb = api.stats?.BuildBattle ?? {};
        return `游玩次数：${bb.games_played ?? 0} | 分数：${bb.score ?? 0} | 胜场：${bb.wins ?? 0}<br>
        单人模式胜场：${(bb.wins_solo_normal ?? 0) + (bb.wins_solo_normal_latest ?? 0)} | 团队模式胜场：${bb.wins_teams_normal ?? 0}<br>
        高手模式胜场：${bb.wins_solo_pro ?? 0} | 建筑猜猜乐胜场：${bb.wins_guess_the_build ?? 0}`
    },
    "pit": (api) => {
        profile = api.stats?.Pit?.profile ?? {};
        pit_stats_ptl = api.stats?.Pit?.pit_stats_ptl ?? {};
        return `等级：${getThePitLevel(profile) ?? 0} | 精通：${profile.prestiges ?? ['None']}<br>
        击杀：${pit_stats_ptl.kills ?? 0} | 死亡：${pit_stats_ptl.deaths ?? 0}<br>
        助攻：${pit_stats_ptl.assists ?? 0} | 最大连续击杀：${pit_stats_ptl.max_streak ?? 0}<br>
        K/D：${((pit_stats_ptl.kills ?? 0) / (pit_stats_ptl.deaths ?? 0)).toFixed(2)} | 
        K+A/D：${(((pit_stats_ptl.kills ?? 0) + (pit_stats_ptl.assists ?? 0)) / (pit_stats_ptl.deaths ?? 0)).toFixed(2)}`
    },
    "bsg": (api) => {
        bsg = api.stats?.Blitz ?? {};
        return `硬币：${bsg.coins ?? 0} | 打开箱子数：${bsg.chests_opened ?? 0}<br>
        游玩次数：${bsg.games_played ?? 0} | 胜场：${bsg.wins ?? 0}<br>
        击杀：${bsg.kills ?? 0} | 死亡：${bsg.deaths ?? 0} | K/D：${((bsg.kills ?? 0) / (bsg.deaths ?? 0)).toFixed(2)}`
    },
    "arcade": (api) => {
        arcade = api.stats?.Arcade ?? {};
        return `硬币：${arcade.coins ?? 0}<br>
        僵尸末日：<br>
        总存活轮数：${arcade.total_rounds_survived_zombies ?? 0} | 总胜场：${arcade.wins_zombies ?? 0}<br>
        命中率：${(100 * (arcade.bullets_hit_zombies ?? 0) / (arcade.bullets_shot_zombies ?? 0)).toFixed(2)}% | 
        爆头率：${(100 * (arcade.headshots_zombies ?? 0) / (arcade.bullets_hit_zombies ?? 0)).toFixed(2)}%<br>
        胜场或最佳轮数：（地图：普通 / 困难 / 安息）<br>
        穷途末路：${getRoundValue(arcade, 'deadend', 'normal')} / ${getRoundValue(arcade, 'deadend', 'hard')} / ${getRoundValue(arcade, 'deadend', 'rip')}<br>
        坏血之宫：${getRoundValue(arcade, 'badblood', 'normal')} / ${getRoundValue(arcade, 'badblood', 'hard')} / ${getRoundValue(arcade, 'badblood', 'rip')}<br>
        外星游乐园：${getRoundValue(arcade, 'alienarcadium', 'normal')}<br>`
    }
};

const getRoundValue = (arcade, map, difficulty) => {
    if (arcade[`wins_zombies_${map}_${difficulty}`] ?? 0 > 0) return `${arcade[`wins_zombies_${map}_${difficulty}`]}胜场`;
    return `${arcade[`total_rounds_survived_zombies_${map}_${difficulty}`] ?? 0}轮`;
}

const getGuild = (guildJson, uuid) => {
    if (guildJson == null) return '公会 : 无';
    let data = `公会：${guildJson.name}<br>
    等级：${getGuildLevel(guildJson.exp).toFixed(2)}<br>
    玩家数：${guildJson.members.length}<br>`
    let playerGuildJson = guildJson.members.find(member => member.uuid == uuid);
    let rankJson = guildJson.ranks.find(rank => rank.name == playerGuildJson.rank);
    if (playerGuildJson == null || rankJson == null) return data;
    return data + `加入时间：${formatDateTime(playerGuildJson.joined)}<br>
    地位：${playerGuildJson.rank} (${formatColor(formatColorFromString(guildJson.tagColor ?? '§7') + '[' + rankJson.tag + ']')})`;
}
const getStatus = (statusJson) => {
    if (statusJson.online)
        if (statusJson.map != null)
            return `状态：在线<br>游戏类型：${formatNameString(statusJson.gameType)}<br>模式：${formatNameString(statusJson.mode)}<br>地图：${statusJson.map}`;
        else
            return `状态：在线<br>游戏类型 ：${formatNameString(statusJson.gameType)}<br>模式：${formatNameString(statusJson.mode)}`;
    else
        return `状态：离线`;
}

const gameTitle = {
    'bw': ['连胜', 'FKDR', 'WLR', '最终击杀', '胜场'],
    'sw': ['连胜', 'KDR', 'WLR', '击杀', '胜场'],
    'mm': ['胜率', '击杀', '杀手概率', '侦探概率', '母体概率'],
    'duel': ['连胜', 'KDR', 'WLR', '击杀', '胜场'],
    'uhc': ['分数', 'KDR', 'WLR', '击杀', '胜场'],
    'mw': ['FKDR', 'WLR', '最终击杀', '胜场', '凋零伤害'],
    'ww': ['KDR', '胜率', '击杀', '胜场', '羊毛放置'],
}

const subGame = {
    'bw': [{ id: '', name: '全局' }, { id: 'eight_one_', name: '单挑' }, { id: 'eight_two_', name: '双人' }, { id: 'four_three_', name: '3v3v3v3' }, { id: 'four_four_', name: '4v4v4v4' }, { id: 'two_four_', name: '4v4' }],
    'sw': [{ id: '', name: '全局' }, { id: '_solo', name: '单人' }, { id: '_solo_normal', name: '单人普通' }, { id: '_solo_insane', name: '单人疯狂' }, { id: '_team', name: '团队' }, { id: '_team_normal', name: '团队普通' }, { id: '_team_insane', name: '团队疯狂' }, { id: '_lab', name: '实验室' }],
    'mm': [{ id: '', name: '全局' }, { id: '_MURDER_CLASSIC', name: '经典' }, { id: '_MURDER_DOUBLE_UP', name: '双倍' }, { id: '_MURDER_ASSASSINS', name: '刺客' }, { id: '_MURDER_INFECTION', name: '感染' }],
    'duel': [{ id: '', name: '全局' }],
    'uhc': [{ id: '', name: '全局' }, { id: '_solo_brawl', name: '单挑' }, { id: '_duo_brawl', name: '团队' }, { id: '_red_vs_blue', name: '决斗' }],
    'mw': [{ id: '', name: '全局' }],
    'ww': [{ id: '', name: '全局' }]
}