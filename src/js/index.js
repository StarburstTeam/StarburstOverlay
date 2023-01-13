const { remote, shell } = require('electron');
const { Tail } = require('tail');
const fs = require('fs');
const AutoGitUpdate = require('auto-git-update/index');

const currentWindow = remote.getCurrentWindow();
const updater = new AutoGitUpdate({ repository: 'https://github.com/IAFEnvoy/StarburstOverlay', tempLocation: './temp/update' });
let config = new Config('./config.json', {
    lang: 'en_us',
    logPath: '',
    apiKey: '',
    lastType: 'bw',
    autoShrink: true,
    notification: true
});
let players = [], hypixel = null, nowType = null, inLobby = false, missingPlayer = false, numplayers = 0, hasLog = false;

window.onload = async () => {
    hypixel = new Hypixel(config.get('apiKey'), updateHTML);
    document.getElementById('infotype').value = nowType = config.get('lastType');
    document.getElementById('autoShrink').checked = config.get('autoShrink');
    document.getElementById('notification').checked = config.get('notification');
    changeCategory();
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
    tail.on('line', data => {
        let s = data.indexOf('[CHAT]');
        if (s == -1) return;//not a chat log
        let changed = false;
        let msg = data.substring(s + 7).replace(' [C]', '');
        console.log(msg);
        if (msg.indexOf('ONLINE:') != -1 && msg.indexOf(',') != -1) {//the result of /who command
            if (inLobby) return;
            resize(true);
            let who = msg.substring(8).split(', ');
            players = [];
            for (let i = 0; i < who.length; i++) {
                players.push(who[i]);
                hypixel.download(who[i], updateHTML);
            }
            missingPlayer = players.length < numplayers;
            changed = true;
        } else if (msg.indexOf('在线：  ') != -1 && msg.indexOf(', ') != -1) {//the result of /who command for zh_cn
            if (inLobby) return;
            resize(true);
            let who = msg.replace('在线：  ', '').split(', ')
            players = [];
            for (let i = 0; i < who.length; i++) {
                players.push(who[i]);
                hypixel.download(who[i], updateHTML);
            }
            missingPlayer = players.length < numplayers;
            changed = true;
        } else if (msg.indexOf('has joined') != -1 && msg.indexOf(':') == -1) {
            resize(true);
            inLobby = false;
            let join = msg.split(' ')[0];
            if (players.find(x => x == join) == null) {
                players.push(join);
                hypixel.download(join, updateHTML);
                changed = true;
            }
            if (msg.indexOf('/') != -1) {
                numplayers = Number(msg.substring(msg.indexOf('(') + 1, msg.indexOf('/')));
                missingPlayer = players.length < numplayers;
            }
        } else if (msg.indexOf('加入了游戏') != -1 && msg.indexOf(':') == -1) {
            resize(true);
            inLobby = false;
            let join = msg.split('加入了游戏')[0];
            if (players.find(x => x == join) == null) {
                players.push(join);
                hypixel.download(join, updateHTML);
                changed = true;
            }
            if (msg.indexOf('/') != -1) {
                numplayers = Number(msg.substring(msg.indexOf('（') + 1, msg.indexOf('/')));
                missingPlayer = players.length < numplayers;
            }
        } else if (msg.indexOf('has quit') != -1 && msg.indexOf(':') == -1) {
            inLobby = false;
            let left = msg.split(' ')[0];
            if (players.find(x => x == left) != null) {
                players.remove(left);
                numplayers -= 1;
                if (numplayers < 0) numplayers = 0;
                changed = true;
            }
        } else if (msg.indexOf('已退出') != -1 && msg.indexOf(':') == -1) {
            inLobby = false;
            let left = msg.split('已退出')[0];
            if (players.find(x => x == left) != null) {
                players.remove(left);
                changed = true;
            }
        } else if ((msg.indexOf('Sending you') != -1 || msg.indexOf('正在前往') != -1) && msg.indexOf(':') == -1) {
            resize(false);
            inLobby = false;
            players = [];
            changed = true;
        } else if ((msg.indexOf('joined the lobby!') != -1 || msg.indexOf('into the lobby!') != -1 || msg.indexOf('入了大厅') != -1) && msg.indexOf(':') == -1) {
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
        } else if ((msg.indexOf('FINAL KILL') != -1 || msg.indexOf('disconnected') != -1 || msg.indexOf('最终击杀') != -1 || msg.indexOf('断开连接') != -1) && msg.indexOf(':') == -1) {
            let left = msg.split(' ')[0];
            if (players.find(x => x == left) != null) {
                players.remove(left);
                changed = true;
            }
        } else if ((msg.indexOf('reconnected') != -1 || msg.indexOf('重新连接') != -1) && msg.indexOf(':') == -1) {
            let join = msg.split(' ')[0];
            if (players.find(x => x == join) == null) {
                players.push(join);
                changed = true;
            }
        } else if ((msg.indexOf('The game starts in 1 second!') != -1 || msg.indexOf('游戏将在1秒后开始') != -1) && msg.indexOf(':') == -1) {
            resize(false);
            if (config.get('notification'))
                showNotification();
        } else if ((msg.indexOf('The game starts in 0 second!') != -1 || msg.indexOf('游戏将在0秒后开始') != -1) && msg.indexOf(':') == -1) resize(false);
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
            showUpdateMessage();
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
    document.getElementById('search').className = 'search';
    document.getElementById('settings').className = 'settings';
    document.getElementById('info').className = 'info';
    document.getElementById(page).hidden = false;
    if (page == 'main') document.getElementById('main').style.display = 'inline-block';
    if (page == 'searchPage') document.getElementById('search').className = 'search_stay';
    if (page == 'settingPage') document.getElementById('settings').className = 'settings_stay';
    if (page == 'infoPage') document.getElementById('info').className = 'info_stay';
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
    updateHTML();
}

let searchPlayerName = null;
const search = async (name) => {
    if (document.getElementById('searchPage').hidden) switchPage('searchPage');
    if (name == null) name = document.getElementById('playername').value;
    else document.getElementById('playername').value = name;
    searchPlayerName = name;
    let i = await hypixel.download(name);
    if (i == null) return document.getElementById('playerName').innerText = 'API Error';
    if (i == false) return document.getElementById('playerName').innerText = 'Player Not Found!';

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
        let d = hypixel.getMiniData(players[i], nowType);
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