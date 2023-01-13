const { remote } = require('electron');
const { dialog, app } = remote;
const currentWindow = remote.getCurrentWindow();
const config = new Config('./config.json');
const homedir = app.getPath('home').split('\\').join('/');
const clientLogPath = {
    'badlion': `${homedir}/AppData/Roaming/.minecraft/logs/blclient/minecraft/latest.log`,
    'feather': `${homedir}/AppData/Roaming/.minecraft/logs/latest.log`,
    'pvplounge': `${homedir}/AppData/Roaming/.pvplounge/logs/latest.log`,
    'labymod': `${homedir}/AppData/Roaming/.minecraft/logs/fml-client-latest.log`,
    'lunar': `${homedir}/.lunarclient/offline/multiver/logs/latest.log`,
    'vanilla': `${homedir}/AppData/Roaming/.minecraft/logs/latest.log`
}
const setPathFromClient = (client) => {
    config.set('logPath', clientLogPath[client]);
    document.getElementById('logpath').value = clientLogPath[client];
}