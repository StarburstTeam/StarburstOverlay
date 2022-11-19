const { remote, shell } = require('electron');
const { Notification, dialog, app } = remote;
const { Tail } = require('tail');

const currentWindow = remote.getCurrentWindow();
let config = new Config('./config.json', {
    logPath: '',
    apiKey: '',
    lastType: 'bw',
    autoShrink: true,
    notification: true
});

let inLobby = true, players = [], hypixel = null, i18n = null, numplayers = 0;
let missingPlayer = false;
let nowType = null;

window.onload = async () => {
    hypixel = new Hypixel(config.get('apiKey'), updateHTML);

    nowType = config.get('lastType');
    document.getElementById('infotype').value = nowType;
    document.getElementById('autoShrink').checked = config.get('autoShrink');
    document.getElementById('notification').checked = config.get('notification');
    changeCategory();
    updateHTML();

    //init search page
    let games = await fetch('json/games.json').then(res => res.json());
    modeList.reduce((p, c) => {
        let root = document.createElement('div');
        root.className = 'dataStyle';
        root.id = c;
        root.addEventListener('click', (e) => { showDetail(e.path[1].id); });
        let name = document.createElement('div');
        name.style.fontSize = '20px';
        name.innerHTML = games.find(it => it.short == c).name;
        let detail = document.createElement('div');
        detail.id = c + 'detail';
        root.appendChild(name);
        root.appendChild(detail);
        p.appendChild(root);
        return p;
    }, document.getElementById('details'));

    if (config.get('logPath') == '') return;
    const tail = new Tail(config.get('logPath'), {useWatchFile: true, nLines: 1, fsWatchOptions: { interval: 100 } });
    tail.on('line', data => {
        let s = data.indexOf('[CHAT]');
        if (s == -1) return;//not a chat log
        let changed = false;
        let msg = data.substring(s + 7).replace(' [C]', '');
        console.log(msg);
        if (msg.indexOf('ONLINE:') != -1 && msg.indexOf(',') != -1) {//the result of /who command
            resize(true);
            if (inLobby) return;
            let who = msg.substring(8).split(', ');
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
        } else if (msg.indexOf('has quit') != -1 && msg.indexOf(':') == -1) {
            inLobby = false;
            let left = msg.split(' ')[0];
            if (players.find(x => x == left) != null) {
                players.remove(left);
                changed = true;
            }
        } else if (msg.indexOf('Sending you') != -1 && msg.indexOf(':') == -1) {
            resize(false);
            inLobby = false;
            players = [];
            changed = true;
        } else if ((msg.indexOf('joined the lobby!') != -1 || msg.indexOf('rewards!') != -1) && msg.indexOf(':') == -1) {
            resize(false);
            inLobby = true;
            players = [];
            changed = true;
            // for future usage
            // } else if (msg.indexOf('joined the party') !== -1 && msg.indexOf(':') === -1 && inlobby) {
            // } else if (msg.indexOf('You left the party') !== -1 && msg.indexOf(':') === -1 && inlobby) {
            // } else if (msg.indexOf('left the party') !== -1 && msg.indexOf(':') === -1 && inlobby) {
            // } else if (inlobby && (msg.indexOf('Party Leader:') === 0 || msg.indexOf('Party Moderators:') === 0 || msg.indexOf('Party Members:') === 0)) {
        } else if ((msg.indexOf('FINAL KILL') != -1 || msg.indexOf('disconnected') != -1) && msg.indexOf(':') == -1) {
            let left = msg.split(' ')[0];
            if (players.find(x => x == left) != null) {
                players.remove(left);
                changed = true;
            }
        } else if ((msg.indexOf('reconnected') != -1) && msg.indexOf(':') == -1) {
            let join = msg.split(' ')[0];
            if (players.find(x => x == join) == null) {
                players.push(join);
                changed = true;
            }
            // don't know how to use
            // } else if (msg.indexOf('Can\'t find a') !== -1 && msg.indexOf('\'!') !== -1 && msg.indexOf(':') === -1) {
            // } else if (msg.indexOf('Can\'t find a') !== -1 && msg.indexOf('\'') !== -1 && msg.indexOf(':') === -1) {
        } else if (msg.indexOf('The game starts in 1 second!') != -1 && msg.indexOf(':') == -1) {
            resize(false);
            new Notification({
                title: 'Game Started!',
                body: 'Your Hypixel game has started!'
            }).show();
        } else if (msg.indexOf('The game starts in 0 second!') != -1 && msg.indexOf(':') == -1)
            resize(false);
        else if (msg.indexOf('new API key') != -1 && msg.indexOf(':') == -1) {
            hypixel.apiKey = msg.substring(msg.indexOf('is ') + 3);
            hypixel.owner = null;
            hypixel.verified = false;
            hypixel.verifyKey();
            config.set('apiKey', hypixel.apiKey);
            config.save();
        }
        if (changed) {
            console.log(players);
            updateHTML();
        }
    });
    tail.on('error', (err) => console.log(err));
}

const updateHTML = () => {
    if (config.get('logPath') == '') {
        document.getElementById('Players').innerHTML = `${formatColor('§cLog Path Not Found')}<br>${formatColor('§cSet Log Path In Settings')}`;
        return;
    }
    if (config.get('apiKey') == '') {
        document.getElementById('Players').innerHTML = `${formatColor('§cAPI Key Not Found')}<br>${formatColor('§cType /api new To Get')}`;
        return;
    }
    if (!hypixel.verified && !hypixel.verifying) {
        document.getElementById('Players').innerHTML = `${formatColor('§cInvalid API Key')}`;
        return;
    }
    let title = hypixel.getTitle(nowType);
    document.getElementById('Levels').innerHTML = '';
    document.getElementById('Avatars').innerHTML = '';
    document.getElementById('Players').innerHTML = '';
    document.getElementById('Tags').innerHTML = '';
    for (let j = 0; j < title.length; j++)
        document.getElementById(title[j]).innerHTML = '';
    for (let i = 0; i < players.length; i++) {
        if (hypixel.data[players[i]] == null) {
            console.log('The data is null!');
            continue;
        }
        if (hypixel.data[players[i]].success == false) continue;// wait for download
        let data = hypixel.getMiniData(players[i], nowType);
        if (hypixel.data[players[i]].nick == true) {
            document.getElementById('Levels').innerHTML += `<div>[ ? ]</div>`;
            document.getElementById('Avatars').innerHTML += `<div></div><br>`;
            document.getElementById('Players').innerHTML += `<div>${data[0]}</div>`;
            document.getElementById('Tags').innerHTML += `<div style="width:${width / 2}px">${formatColor('§eNICK')}</div>`;
            for (let j = 0; j < title.length; j++)
                document.getElementById(title[j]).innerHTML += '<div></div><br>';
            continue;
        }
        document.getElementById('Levels').innerHTML += `<div>${data[0]}</div>`;
        document.getElementById('Avatars').innerHTML += `<img src="https://crafatar.com/avatars/${hypixel.getUuid(players[i])}?overlay" style="width:15px;height:15px"><br>`;
        document.getElementById('Players').innerHTML += `<div onclick="clickPlayerName('${players[i]}')">${data[1]}</div>`
        document.getElementById('Tags').innerHTML += `<div style="width:${width / 2}px">${formatColor(hypixel.getTag(players[i]))}</div>`;
        for (let j = 0; j < title.length; j++)
            document.getElementById(title[j]).innerHTML += `<div>${data[j + 2]}</div>`
    }
    if (missingPlayer)
        document.getElementById('Players').innerHTML += `<div>${formatColor('§cMissing players')}</div><div>${formatColor('§cPlease type /who')}</div>`;
}

const width = 100;
const changeCategory = () => {
    let main = document.getElementById('main'), category = hypixel.getTitle(nowType);
    main.innerHTML = '<ul class="subtitle" style="width:450px">Players</ul>';
    main.innerHTML += '<ul id="Levels" class="data" style="left:0px;text-align:right"></ul>';
    main.innerHTML += '<ul id="Avatars" class="data" style="left:75px"></ul>';
    main.innerHTML += '<ul id="Players" class="data" style="left:100px;text-align:left"></ul>';
    main.innerHTML += '<ul class="subtitle" style="left:450px">Tag</ul>';
    main.innerHTML += '<ul id="Tags" class="data" style="left:450px"></ul>';
    for (let i = 0; i < category.length; i++) {
        main.innerHTML += `<ul class="subtitle" style="left:${500 + width * i}px;width:${width}px">${category[i]}</ul>`;
        main.innerHTML += `<ul id="${category[i]}" class="data" style="left:${500 + width * i}px;width:${width}px"></ul>`;
    }
    config.set('lastType', nowType);
}

const closeWindow = () => currentWindow.close();

const minimize = () => currentWindow.minimize();

const openUrl = (url) => shell.openExternal(url);

const showSearchPage = () => {
    if (document.getElementById('main').hidden) switchPage('main');
    else switchPage('searchPage');
}

let lastPage = 'main';
const switchPage = (page) => {
    if (document.getElementById('main').hidden && lastPage == page) page = 'main';
    lastPage = page;
    document.getElementById('main').hidden = true;
    document.getElementById('searchPage').hidden = true;
    document.getElementById('settingPage').hidden = true;
    document.getElementById('infoPage').hidden = true;
    document.getElementById('search').className = 'search';
    document.getElementById('settings').className = 'settings';
    document.getElementById('info').className = 'info';
    document.getElementById(page).hidden = false;
    if (page == 'searchPage')
        document.getElementById('search').className = 'search_stay';
    if (page == 'settingPage')
        document.getElementById('settings').className = 'settings_stay';
    if (page == 'infoPage')
        document.getElementById('info').className = 'info_stay';
}

let nowShow = true;
const showClick = () => {
    resize(null, true);
}
const resize = (show, force) => {
    if (!force && !config.get('autoShrink')) return;
    if (show != null) nowShow = show;
    else nowShow ^= true;
    document.getElementById('show').style.transform = `rotate(${nowShow ? 0 : 90}deg)`;
    let height = nowShow ? 600 : 40;
    currentWindow.setResizable(true);
    currentWindow.setSize(1090, height, true);
    currentWindow.setResizable(false);
}
const clickPlayerName = (name) => {
    switchPage('searchPage');
    search(name);
}

const changeDiv = () => {
    nowType = document.getElementById('infotype').value;
    changeCategory();
    config.save();
    updateHTML();
}

const test = async (name) => {
    await hypixel.download(name);
    players.push(name);
    updateHTML();
}

let searchPlayerName = null;
const search = async (name) => {
    if (name == null) name = document.getElementById('playername').value;
    searchPlayerName = name;
    let i = await hypixel.download(name);
    console.log(i);
    if (i == null) return alert('API Error');
    if (i == false) return alert('Player Not Found!');

    let data = hypixel.data[name];
    if (data.success == false) return console.log(data);

    document.getElementById('playerName').innerHTML = formatColor(hypixel.formatName(name));
    document.getElementById('skin').src = `https://crafatar.com/renders/body/${hypixel.getUuid(name)}?overlay`;
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
            icon.addEventListener('click', (e) => openUrl(link));
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

const downloadSkin = () => {
    if (searchPlayerName == null || searchPlayerName == '') return;
    let a = document.createElement('a');
    a.href = `https://crafatar.com/skins/${hypixel.getUuid(searchPlayerName)}`;
    a.download = `${hypixel.getUuid(searchPlayerName)}.png`;
    a.click();
}

const selectLogFile = () => {
    let temppath = dialog.showOpenDialogSync(currentWindow, {
        title: 'Select latest.log file',
        defaultPath: app.getPath('home').split('\\').join('/'),
        buttonLabel: 'Select log file',
        filters: [{
            name: 'Latest log',
            extensions: ['log']
        }]
    });
    if (temppath == null) return;
    config.set('logPath', temppath[0].split('\\').join('/'));
    config.save();
    app.relaunch();
    app.exit(0);
    app.quit();
}

const setAutoShrink = () => {
    config.set('autoShrink', document.getElementById('autoShrink').checked);
    config.save();
}

const setNotification = () => {
    config.set('notification', document.getElementById('notification').checked);
    config.save();
}