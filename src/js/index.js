const { remote, shell, ipcRenderer } = require('electron');
const { Notification, dialog, app } = remote;
const { Tail } = require('tail');
const fs = require('fs');

const currentWindow = remote.getCurrentWindow();
const config = new Config(`${app.getPath('userData')}/config.json`, {
    lang: 'en_us',
    logPath: '',
    apiKey: '',
    lastType: 'bw',
    lastSub: '',
    autoShrink: true,
    notification: true,
    width: 1080,
    height: 550,
    x: 40,
    y: 20
});
const i18n = new I18n(config.get('lang'));
let players = [], hypixel = null, nowType = null, nowSub = null, inLobby = false, missingPlayer = false, numplayers = 0, hasLog = false;

window.onload = async () => {
    currentWindow.setPosition(config.get('x'), config.get('y'));
    currentWindow.setSize(config.get('width'), config.get('height'));
    i18n.initPage();

    hypixel = new Hypixel(config.get('apiKey'), updateHTML);
    nowType = config.get('lastType');
    nowSub = config.get('lastSub');
    document.getElementById('autoShrink').checked = config.get('autoShrink');
    document.getElementById('notification').checked = config.get('notification');
    document.getElementById('lang').value = config.get('lang');
    document.getElementById('infotype').innerHTML = i18n.getMainModeHTML();
    pushError();
    await readDisplayData();
    changeCategory();
    loadSubGame(nowSub);
    findUpdate();
    document.getElementById('infotype').value = nowType;
    document.getElementById('subGame').value = nowSub;

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
        else if (msg.indexOf('https://rewards.hypixel.net/claim-reward/') != -1) {
            let url = `https://rewards.hypixel.net/claim-reward/${msg.split('https://rewards.hypixel.net/claim-reward/')[1].split('\\n')[0]}`;
            console.log(url);
            window.open(url, 'Claim Rewards', 'width=800,height=600,frame=true,transparent=false,alwaysOnTop=true');
        }
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
        let remote = await fetch('https://raw.githubusercontent.com/IAFEnvoy/StarburstOverlay/master/package.json').then(res => res.json()).catch(err => console.log(err));
        let local = require('../package.json');
        console.log(remote, local);
        if (remote == null) return;
        if (compairVersion(remote.version, local.version) == -1) {
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
    document.getElementById('settingPage').hidden = true;
    document.getElementById('infoPage').hidden = true;
    document.getElementById('cpsPage').hidden = true;
    document.getElementById('settings').className = 'settings';
    document.getElementById('info').className = 'info';
    document.getElementById('cps').className = 'cps';
    document.getElementById(page).hidden = false;
    if (page == 'main') document.getElementById('main').style.display = 'inline-block';
    if (page == 'settingPage') document.getElementById('settings').className = 'settings_stay';
    if (page == 'infoPage') document.getElementById('info').className = 'info_stay';
    if (page == 'cpsPage') document.getElementById('cps').className = 'cps_stay';
}

const openSearchPage = () => {
    ipcRenderer.send('open-search-page');
}

let nowShow = true;
const resize = (show, force) => {
    if (!force && !config.get('autoShrink')) return;
    if (show != null) nowShow = show;
    else nowShow ^= true;
    document.getElementById('show').style.transform = `rotate(${nowShow ? 0 : 90}deg)`;
    currentWindow.setSize(config.get('width'), nowShow ? config.get('height') : 40, true);
}

const changeDiv = () => {
    nowType = document.getElementById('infotype').value;
    changeCategory();
    loadSubGame();
    updateHTML();
}

const loadSubGame = (val) => {
    document.getElementById('subGame').innerHTML = subGame[nowType] != null ? subGame[nowType].reduce((p, c) => p + `<option value="${c.id}">${c.name}</option>`, '') : '';
    setSubGame(val);
}

const setSubGame = (val) => {
    if (val == null)
        nowSub = document.getElementById('subGame').value;
    config.set('lastSub', nowSub);
    updateHTML();
}

const updateHTML = async () => {
    let type = document.getElementById('infotype'), sub = document.getElementById('subGame');
    document.getElementById('current').innerHTML = `&nbsp${type.options[type.selectedIndex].childNodes[0].data} - ${sub.options[sub.selectedIndex].childNodes[0].data}`;
    document.getElementById('ping').innerText = `Mojang ${hypixel.mojang_ping}ms Hypixel ${hypixel.hypixel_ping}ms`;

    let main = document.getElementById('main');
    resetError(false);

    if (config.get('logPath') == '' || !hasLog)
        return pushError(`${i18n.now().error_log_not_found}<br>${i18n.now().info_set_log_path}`, false);
    if (config.get('apiKey') == '')
        return pushError(`${i18n.now().error_api_key_not_found}<br>${i18n.now().info_api_new}`, false);
    if (!hypixel.verified && !hypixel.verifying)
        return pushError(`${i18n.now().error_api_key_invalid}<br>${i18n.now().info_api_new}`, false);

    clearMainPanel();

    let dataList = pickDataAndSort();
    for (let i = 0; i < dataList.length; i++) {
        if (dataList[i].nick == true) {
            main.innerHTML += `<tr><th>${formatColor('§eN')}</th>
            <th style="text-align:right">[ ? ]</th>
            <td>&nbsp ${formatColor('§f' + dataList[i].name)}</td>
            <th>?</th>
            <th>?</th>
            <th>?</th>
            <th>?</th>
            <th>?</th>
            </tr>`;
            continue;
        }
        let tooltip = await hypixel.getToolTipData(dataList[i].name);
        main.innerHTML += `<tr><th>${dataList[i].data[dataList[i].data.length - 1].data.reduce((p, c) => { p.push(`<span style="color:${c.color}">${c.text}</span>`); return p; }, []).join('&nbsp')}</th>
        <th style="text-align:right;width:80px;height:12px">${dataList[i].data[0].format}</th>
        <td style="word-break:keep-all;height:12px" class="tooltip">
            <img src="https://crafatar.com/avatars/${await hypixel.getPlayerUuid(dataList[i].name)}?overlay" style="position:relative;width:15px;height:15px;top:2px">
            ${dataList[i].data[1].format}
            <span class="tooltiptext">${i18n.now().language}${tooltip[0]}<br>${i18n.now().guild}${tooltip[1]}</span>
        </td>
        ${Array.from({ length: dataList[i].data.length - 3 }, (_, x) => x + 2).reduce((p, c) => p + `<th>${dataList[i].data[c].format}</th>`, '')}</tr>`;
    }
    if (missingPlayer)
        pushError(`${i18n.now().error_player_missing}<br>${i18n.now().info_who}`, false);
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
    document.getElementById('networkinfo').innerHTML = getData[config.get('lang')]['ov'](data.player);
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
        document.getElementById(mode + 'detail').innerHTML = getData[config.get('lang')][mode](hypixel.data[searchPlayerName].player);
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
    if (c == column) isUp ^= true;
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
    main.innerHTML = `<tr><th id="sort_8" style="width:60px" onclick="setSortContext(8)">${i18n.now().hud_main_tag}</th>
    <th id="sort_1" style="width:60px" onclick="setSortContext(1)">${i18n.now().hud_main_level}</th>
    <th id="sort_2" style="width:400px" onclick="setSortContext(2)">${i18n.now().hud_main_players}</th>
    ${category.reduce((p, c, i) => p + `<th id="sort_${i + 3}" style="width:100px" onclick="setSortContext(${i + 3})">${c}</th>`, '')}</tr>`;
}

window.onresize = () => {
    if (nowShow) {
        config.set('width', currentWindow.getSize()[0]);
        config.set('height', currentWindow.getSize()[1]);
    }
}

const onClose = () => {
    config.set('x', currentWindow.getPosition()[0]);
    config.set('y', currentWindow.getPosition()[1]);
}

let stable_message = false;
const pushNetworkError = (code) => {
    if(code==403) pushError(`${i18n.now().error_api_key_invalid}<br>${i18n.now().info_api_new}`, true);
    else if(code==429) pushError(`${i18n.now().error_api_limit_exceeded}`, true);
}
const pushError = (error, stable) => {
    stable_message = stable;
    if (error == '' || error == null)
        return document.getElementById('message').style.opacity = 0;
    document.getElementById('message').style.opacity = 1;
    document.getElementById('message').innerHTML = error;
}

const resetError = (force) => {
    if (force || !stable_message) return document.getElementById('message').style.opacity = 0;
}