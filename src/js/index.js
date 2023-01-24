const { remote, shell } = require('electron');
const { Notification, dialog, app } = remote;
const { Tail } = require('tail');
const fs = require('fs');
const AutoGitUpdate = require('auto-git-update/index');

const currentWindow = remote.getCurrentWindow();
const updater = new AutoGitUpdate({ repository: 'https://github.com/IAFEnvoy/StarburstOverlay', tempLocation: './temp/update' });
const config = new Config('./config.json', {
    lang: 'en_us',
    logPath: '',
    apiKey: '',
    lastType: 'bw',
    lastSub: '',
    autoShrink: true,
    notification: true
});
const i18n = new I18n(config.get('lang'));
let players = [], hypixel = null, nowType = null, nowSub = null, inLobby = false, missingPlayer = false, numplayers = 0, hasLog = false;

window.onload = async () => {
    hypixel = new Hypixel(config.get('apiKey'), updateHTML);
    document.getElementById('infotype').value = nowType = config.get('lastType');
    document.getElementById('subGame').value = nowSub = config.get('lastSub');
    document.getElementById('autoShrink').checked = config.get('autoShrink');
    document.getElementById('notification').checked = config.get('notification');
    await readDisplayData();
    changeCategory();
    loadSubGame();
    updateHTML();
    findUpdate();

    //init search page
    let games = await fetch(`json/games_${config.get('lang')}.json`).then(res => res.json());
    modeList.reduce((p, c) => {
        let root = document.createElement('div');
        root.className = 'dataStyle';
        root.id = c;
        root.addEventListener('click', (e) => showDetail(e.path[1].id));
        let name = document.createElement('div');
        name.style.fontSize = '20px';
        name.innerHTML = games.find(it => it.short == c).name;
        let detail = document.createElement('div');
        detail.id = `${c}detail`;
        root.appendChild(name);
        root.appendChild(detail);
        p.appendChild(root);
        return p;
    }, document.getElementById('details'));

    if (config.get('logPath') == '') return;
    hasLog = fs.existsSync(config.get('logPath'));
    const tail = new Tail(config.get('logPath'), { useWatchFile: true, nLines: 1, fsWatchOptions: { interval: 100 } });
    tail.on('line', async (data) => {
        let s = data.indexOf('[CHAT]');
        if (s == -1) return;//not a chat log
        let changed = false;
        let msg = data.substring(s + 7).replace(' [C]', '');
        console.log(msg);
        if (msg.indexOf(i18n.now().chat_online) != -1 && msg.indexOf(',') != -1) {//the result of /who command
            if (inLobby) return;
            resize(true);
            let who = msg.replace(i18n.now().chat_online, '').split(', ');
            players = [];
            for (let i = 0; i < who.length; i++) {
                players.push(who[i]);
                hypixel.download(who[i], updateHTML);
            }
            missingPlayer = players.length < numplayers;
            changed = true;
        } else if (msg.indexOf(i18n.now().chat_player_join) != -1 && msg.indexOf(':') == -1) {
            resize(true);
            inLobby = false;
            let join = msg.split(i18n.now().chat_player_join)[0];
            if (players.find(x => x == join) == null) {
                players.push(join);
                hypixel.download(join, updateHTML);
                changed = true;
            }
            if (msg.indexOf('/') != -1) {
                numplayers = Number(msg.substring(msg.indexOf('(') + 1, msg.indexOf('/')));
                missingPlayer = players.length < numplayers;
            }
        } else if (msg.indexOf(i18n.now().chat_player_quit) != -1 && msg.indexOf(':') == -1) {
            inLobby = false;
            let left = msg.split(i18n.now().chat_player_quit)[0];
            if (players.find(x => x == left) != null) {
                players.remove(left);
                numplayers -= 1;
                if (numplayers < 0) numplayers = 0;
                missingPlayer = players.length < numplayers;
                changed = true;
            }
        } else if (msg.indexOf(i18n.now().chat_sending) != -1 && msg.indexOf(':') == -1) {
            resize(false);
            inLobby = false;
            players = [];
            changed = true;
        } else if (msg.indexOf(i18n.now().chat_join_lobby) != -1 && msg.indexOf(':') == -1) {
            if (inLobby) return;
            resize(false);
            inLobby = true;
            players = [];
            changed = true;
            // for future usage
            // } else if (msg.indexOf('joined the party') !== -1 && msg.indexOf(':') === -1 && inlobby) {
            // } else if (msg.indexOf('You left the party') !== -1 && msg.indexOf(':') === -1 && inlobby) {
            // } else if (msg.indexOf('left the party') !== -1 && msg.indexOf(':') === -1 && inlobby) {
            // } else if (inlobby && (msg.indexOf('Party Leader:') === 0 || msg.indexOf('Party Moderators:') === 0 || msg.indexOf('Party Members:') === 0)) {
        } else if ((msg.indexOf(i18n.now().chat_final_kill) != -1 || msg.indexOf(i18n.now().chat_disconnect) != -1) && msg.indexOf(':') == -1) {
            let left = msg.split(' ')[0];
            if (players.find(x => x == left) != null) {
                players.remove(left);
                changed = true;
            }
        } else if (msg.indexOf(i18n.now().chat_reconnect) != -1 && msg.indexOf(':') == -1) {
            let join = msg.split(' ')[0];
            if (players.find(x => x == join) == null) {
                players.push(join);
                changed = true;
            }
        } else if (msg.indexOf(i18n.now().chat_game_start_1_second) != -1 && msg.indexOf(':') == -1) {
            resize(false);
            if (config.get('notification'))
                new Notification({
                    title: i18n.now().notification_start_title,
                    body: i18n.now().notification_start_body
                }).show();
        } else if (msg.indexOf(i18n.now().chat_game_start_0_second) != -1 && msg.indexOf(':') == -1) resize(false);
        if (changed) {
            console.log(players);
            updateHTML();
        }
    });
    tail.on('error', (err) => console.log(err));
    updateHTML();
}

const findUpdate = async () => {
    try {
        const versions = await updater.compareVersions();
        console.log(versions);
        if (versions.remoteVersion != 'Error' && !versions.upToDate) {
            new Notification({
                title: i18n.now().notification_update_available_title,
                body: i18n.now().notification_update_available_body
            }).show();
            document.getElementById('update').hidden = false;
        }
    }
    catch (err) {
        console.log(err);
    }
}

const changeCategory = () => {
    clearMainPanel();
    config.set('lastType', nowType);
}

let lastPage = 'main';
const switchPage = (page) => {
    if (document.getElementById('main').hidden && lastPage == page) page = 'main';
    lastPage = page;
    document.getElementById('main').style.display = '';
    document.getElementById('main').hidden = true;
    document.getElementById('searchPage').hidden = true;
    document.getElementById('settingPage').hidden = true;
    document.getElementById('infoPage').hidden = true;
    document.getElementById('cpsPage').hidden = true;
    document.getElementById('search').className = 'search';
    document.getElementById('settings').className = 'settings';
    document.getElementById('info').className = 'info';
    document.getElementById('cps').className = 'cps';
    document.getElementById(page).hidden = false;
    if (page == 'main') document.getElementById('main').style.display = 'inline-block';
    if (page == 'searchPage') document.getElementById('search').className = 'search_stay';
    if (page == 'settingPage') document.getElementById('settings').className = 'settings_stay';
    if (page == 'infoPage') document.getElementById('info').className = 'info_stay';
    if (page == 'cpsPage') document.getElementById('cps').className = 'cps_stay';
}

let nowShow = true;
const resize = (show, force) => {
    if (!force && !config.get('autoShrink')) return;
    if (show != null) nowShow = show;
    else nowShow ^= true;
    document.getElementById('show').style.transform = `rotate(${nowShow ? 0 : 90}deg)`;
    currentWindow.setResizable(true);
    currentWindow.setSize(1080, nowShow ? 550 : 40, true);
    currentWindow.setResizable(false);
}

const changeDiv = () => {
    nowType = document.getElementById('infotype').value;
    changeCategory();
    loadSubGame();
    updateHTML();
}

const loadSubGame = () => {
    document.getElementById('subGame').innerHTML = subGame[nowType] != null ? subGame[nowType].reduce((p, c) => p + `<option value="${c.id}">${c.name}</option>`, '') : '';
    setSubGame();
}

const setSubGame = () => {
    nowSub = document.getElementById('subGame').value;
    config.set('lastSub', nowSub);
    updateHTML();
}

const updateHTML = async () => {
    let type = document.getElementById('infotype'), sub = document.getElementById('subGame');
    document.getElementById('current').innerText = `${i18n.now().hud_current_mode}${type.options[type.selectedIndex].childNodes[0].data} - ${sub.options[sub.selectedIndex].childNodes[0].data}`;

    let main = document.getElementById('main');
    main.style.height = `300px`

    if (config.get('logPath') == '' || !hasLog)
        return main.innerHTML = `${formatColor(`&nbsp §c${i18n.now().error_log_not_found}`)}<br>${formatColor(`&nbsp §c${i18n.now().info_set_log_path}`)}`;
    if (config.get('apiKey') == '')
        return main.innerHTML = `${formatColor(`&nbsp §c${i18n.now().error_api_key_not_found}`)}<br>${formatColor(`&nbsp §c${i18n.now().info_api_new}`)}`;
    if (!hypixel.verified && !hypixel.verifying)
        return main.innerHTML = `${formatColor(`&nbsp §c${i18n.now().error_api_key_invalid}`)}<br>${formatColor(`&nbsp §c${i18n.now().info_api_new}`)}`;

    clearMainPanel();

    let rendered = 0;
    let dataList = pickDataAndSort();
    for (let i = 0; i < dataList.length; i++) {
        if (dataList[i].nick == true) {
            main.innerHTML += `<tr><th style="text-align:right">[ ? ]</th><th></th><td>${formatColor('§f' + dataList[i].name)}</td><th>${formatColor('§eNICK')}</th></tr>`;
            rendered++;
            continue;
        }
        main.innerHTML += `<tr><th style="text-align:right;width:70px;display:inline-block">${dataList[i].data[0].format}</th>
        <th><img src="https://crafatar.com/avatars/${await hypixel.getPlayerUuid(dataList[i].name)}?overlay" style="position:relative;width:20px;height:20px;top:4px"></th>
        <td style="word-break:keep-all" onclick="search('${dataList[i].name}')">${dataList[i].data[1].format}</td>
        <th>${formatColor(dataList[i].data[dataList[i].data.length - 1].format)}</th>
        ${Array.from({ length: dataList[i].data.length - 3 }, (_, x) => x + 2).reduce((p, c) => p + `<th>${dataList[i].data[c].format}</th>`, '')}</tr>`;
        rendered++;
    }
    if (missingPlayer) {
        main.innerHTML += `<tr><td></td><td></td><td>${formatColor(`§c${i18n.now().error_player_missing}`)}</td></tr>
        <tr><td></td><td></td><td>${formatColor(`§c${i18n.now().info_who}`)}</td></tr>`;
        rendered += 2;
    }
    main.style.height = `${Math.min(rendered * 29.6 + 31.2, 500)}px`;
    if (column >= 1 && column <= 8)
        document.getElementById(`sort_${column}`).innerHTML += isUp ? '↑' : '↓';
}

let searchPlayerName = null;
const search = async (name) => {
    if (document.getElementById('searchPage').hidden) switchPage('searchPage');
    if (name == null) name = document.getElementById('playername').value;
    else document.getElementById('playername').value = name;
    searchPlayerName = name;
    let i = await hypixel.download(name);
    if (i == null) return document.getElementById('playerName').innerText = hypixel.verified ? i18n.now().error_api_error : i18n.now().error_api_key_invalid;
    if (i == false) return document.getElementById('playerName').innerText = i18n.now().error_player_not_found;

    let data = hypixel.data[name];
    if (data.success == false) return console.log(data);

    document.getElementById('playerName').innerHTML = formatColor(hypixel.formatName(name));
    document.getElementById('skin').src = `https://crafatar.com/renders/body/${await hypixel.getPlayerUuid(name)}?overlay`;
    document.getElementById('networkinfo').innerHTML = getData['ov'](data.player);
    document.getElementById('guild').innerHTML = hypixel.getGuild(name);
    document.getElementById('status').innerHTML = await hypixel.getStatus(name);
    document.getElementById('socialMedia').innerHTML = '';
    socialMediaList.reduce((prev, cur) => {
        let link = getSocialMedia(cur, data.player);
        if (link != null) {
            let icon = document.createElement('img');
            icon.src = 'img/icons/' + cur.toLowerCase() + '.png';
            icon.style = 'width:70px;height:70px;';
            icon.addEventListener('click', () => shell.openExternal(link));
            prev.appendChild(icon);
        }
        return prev;
    }, document.getElementById('socialMedia'));
}

let latestmode = '';
const showDetail = (mode) => {
    if (searchPlayerName == null || mode == 'details') return;
    if (latestmode == mode) {
        document.getElementById(latestmode + 'detail').innerHTML = '';
        latestmode = '';
    } else {
        if (latestmode != '')
            document.getElementById(latestmode + 'detail').innerHTML = '';
        document.getElementById(mode + 'detail').innerHTML = getData[mode](hypixel.data[searchPlayerName].player);
        latestmode = mode;
    }
}

const downloadSkin = async () => {
    if (searchPlayerName == null || searchPlayerName == '') return;
    let a = document.createElement('a');
    a.href = `https://crafatar.com/skins/${await hypixel.getPlayerUuid(searchPlayerName)}`;
    a.download = `${hypixel.getPlayerUuid(searchPlayerName)}.png`;
    a.click();
}

let column = 0, isUp = false;//column: 0 none, 1 lvl, 2 name, 8 tag, 3-7 stats
const setSortContext = (c) => {
    if (c == column) isUp = !isUp;
    else if (c >= 0 && c <= 8) {
        column = c;
        isUp = true;
    } else {
        column = 0;
        isUp = false;
    }
    updateHTML();
}

const pickDataAndSort = () => {
    let dataList = [];
    for (let i = 0; i < players.length; i++) {
        if (hypixel.data[players[i]] == null) continue;
        if (hypixel.data[players[i]].success == false) continue;// wait for download
        if (hypixel.data[players[i]].nick == true) {
            dataList.push({ name: players[i], nick: true });
            continue;
        }
        let d = hypixel.getMiniData(players[i], nowType, document.getElementById('subGame').value);
        d.push(hypixel.getTag(players[i]));
        dataList.push({ name: players[i], nick: false, data: d });
    }
    if (column != 0)
        dataList = dataList.sort((a, b) => {
            if (a.nick) return -1;
            if (b.nick) return 1;
            return (a.data[column - 1].value - b.data[column - 1].value) * (isUp ? -1 : 1)
        });
    return dataList;
}

const selectLogFile = () => {
    let temppath = dialog.showOpenDialogSync(currentWindow, {
        title: i18n.now().hud_select_log_file_title,
        defaultPath: app.getPath('home').split('\\').join('/'),
        buttonLabel: i18n.now().hud_select_log_file_button_label,
        filters: [{
            name: 'Latest log',
            extensions: ['log']
        }]
    });
    if (temppath == null) return;
    config.set('logPath', temppath[0].split('\\').join('/'));
    window.location.href = './index.html';
}

const clearMainPanel = () => {
    let main = document.getElementById('main'), category = hypixel.getTitle(nowType);
    main.innerHTML = `<tr><th id="sort_1" style="width:80px" onclick="setSortContext(1)">${i18n.now().hud_main_level}</th>
    <th style="width:25px"></th>
    <th id="sort_2" style="width:350px" onclick="setSortContext(2)">${i18n.now().hud_main_players}</th>
    <th id="sort_8" style="width:60px" onclick="setSortContext(8)">${i18n.now().hud_main_tag}</th>
    ${category.reduce((p, c, i) => p + `<th id="sort_${i + 3}" style="width:100px" onclick="setSortContext(${i + 3})">${c}</th>`, '')}</tr>`;
}