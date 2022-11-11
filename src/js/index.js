const remote = require('electron').remote;
const { Notification } = remote;
const { Tail } = require('tail');
const fs = require('fs');

const configPath = './config.json';
const currentWindow = remote.getCurrentWindow();
let config = {
    logPath: '',
    apiKey: ''
};

let inLobby = true, players = [], hypixel = null;

window.onload = e => {
    if (!fs.existsSync(configPath))
        fs.writeFileSync(configPath, JSON.stringify(config));
    config = JSON.parse(fs.readFileSync(configPath));

    hypixel = new Hypixel(config.apiKey);
    const tail = new Tail(config.logPath, {/*logger: con, */useWatchFile: true, nLines: 1, fsWatchOptions: { interval: 100 } });
    tail.on('line', data => {
        let s = data.indexOf('[CHAT]');
        if (s == -1) return;//not a chat log
        let changed = false;
        let msg = data.substring(s + 7).replace(' [C]', '');
        console.log(msg);
        if (msg.indexOf('ONLINE:') != -1 && msg.indexOf(',') != -1) {//the result of /who command
            if (inLobby) return;
            let who = msg.substring(8).split(', ');
            players = [];
            for (let i = 0; i < who.length; i++) {
                //save for future expand
                players.push(who[i]);
                hypixel.download(who[i], updateHTML);
            }
            changed = true;
        } else if (msg.indexOf('has joined') != -1 && msg.indexOf(':') == -1) {
            inLobby = false;
            let join = msg.split(' ')[0];
            if (players.find(x => x == join) == null) {
                players.push(join);
                hypixel.download(join, updateHTML);
                changed = true;
            }
            if (msg.indexOf('/') != -1) {
                numplayers = Number(msg.substring(msg.indexOf('(') + 1, msg.indexOf('/')));
                if (players.length < numplayers)
                    console.log('Missing player, please type /who');
            }
        } else if (msg.indexOf('has quit') != -1 && msg.indexOf(':') == -1) {
            inLobby = false;
            let left = msg.split(' ')[0];
            if (players.find(x => x == left) != null) {
                players.remove(left);
                changed = true;
            }
        } else if (msg.indexOf('Sending you') != -1 && msg.indexOf(':') == -1) {
            inLobby = false;
            players = [];
            changed = true;
        } else if ((msg.indexOf('joined the lobby!') != -1 || msg.indexOf('rewards!') != -1) && msg.indexOf(':') == -1) {
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
            new Notification({
                title: 'Game Started!',
                body: 'Your Hypixel game has started!'
                // icon: path.join(__dirname, '../assets/logo.ico')
            }).show();
        } else if (msg.indexOf('new API key') != -1 && msg.indexOf(':') == -1) {
            hypixel.apiKey = msg.substring(msg.indexOf('is ') + 3);
            hypixel.owner = null;
            hypixel.verified = false;
            hypixel.verifyKey();
            fs.writeFileSync(configPath, JSON.stringify(config));
        }
        if (changed) {
            console.log(players);
            updateHTML();
        }
    });
    tail.on('error', (err) => console.log(err));
}

let nowType = 'mm';
const updateHTML = () => {
    let title = hypixel.getTitle(nowType);
    for (let i = 0; i < players.length; i++) {
        if (hypixel.data[players[i]] == null) throw 'The data is null!';
        if (hypixel.data[players[i]].success == false) continue;// wait for download
        let data = hypixel.getData(players[i], nowType);
        document.getElementById('Players').innerHTML += data[0] + '<br>';
        for (let j = 1; j < data.length; j++)
            document.getElementById(title[j - 1]).innerHTML += data[j] + '<br>';
    }
}

const width = 100;
const changeCategory = (type) => {
    let main = document.getElementById('main'), category = hypixel.getTitle(type);
    main.innerHTML = '<ul id="Players" class="data" style="width:300px">Players<br></ul>';
    for (let i = 0; i < category.length; i++)
        main.innerHTML += `<ul id="${category[i]}" class="data" style="left:${300 + width * i}px;width:${width}px">${category[i]}<br></ul>`
}

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

const closeWindow = () => currentWindow.close();

const minimize = () => currentWindow.minimize();

let nowShow = true;
const showClick = () => {
    resize(null);
}
const resize = (show) => {
    if (show != null) nowShow = show;
    else nowShow ^= true;
    document.getElementById('show').style.transform = `rotate(${nowShow ? 0 : 90}deg)`;
    let height = nowShow ? 600 : 40;
    currentWindow.setResizable(true);
    currentWindow.setSize(900, height, true);
    currentWindow.setResizable(false);
}