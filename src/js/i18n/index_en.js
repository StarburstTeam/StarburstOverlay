const showNotification = () => new Notification({
    title: 'Game Started!',
    body: 'Your Hypixel game has started!'
}).show();

const showUpdateMessage = () =>
    new Notification({
        title: 'Update Available!',
        body: 'Click the update button to get.'
    }).show();


const updateHTML = () => {
    let main = document.getElementById('main');

    if (config.get('logPath') == '')
        return main.innerHTML = `${formatColor(' §cLog Path Not Found')}<br>${formatColor(' §cSet Log Path In Settings')}`;
    if (config.get('apiKey') == '')
        return main.innerHTML = `${formatColor(' §cAPI Key Not Found')}<br>${formatColor(' §cType /api new To Get')}`;
    if (!hypixel.verified && !hypixel.verifying)
        return main.innerHTML = `${formatColor(' §cInvalid API Key')}<br>${formatColor(' §cType /api new To Get')}`;

    clearMainPanel();

    for (let i = 0; i < players.length; i++) {
        if (hypixel.data[players[i]] == null) continue;
        if (hypixel.data[players[i]].success == false) continue;// wait for download
        let data = hypixel.getMiniData(players[i], nowType);
        if (hypixel.data[players[i]].nick == true) {
            main.innerHTML += `<tr><th style="text-align:right">[ ? ]</th><th></th><td>${data[0]}</td><th>${formatColor('§eNICK')}</th></tr>`;
            continue;
        }

        main.innerHTML += `<tr><th style="text-align:right">${data[0]}</th>
        <th><img src="https://crafatar.com/avatars/${hypixel.getUuid(players[i])}?overlay" style="position:relative;width:20px;height:20px;top:4px"></th>
        <td onclick="search('${players[i]}')">${data[1]}</td>
        <th>${formatColor(hypixel.getTag(players[i]))}</th>
        ${Array.from({ length: data.length - 2 }, (_, x) => x + 2).reduce((p, c) => p + `<th>${data[c]}</th>`, '')}</tr>`;
    }
    if (missingPlayer)
        main.innerHTML += `<tr><td></td><td></td><td>${formatColor('§cMissing players')}</td></tr>
        <tr><td></td><td></td><td>${formatColor('§cPlease type /who')}</td></tr>`;
}

const clearMainPanel = () => {
    let main = document.getElementById('main'), category = hypixel.getTitle(nowType);
    main.innerHTML = `<tr><th style="width:8%">Lvl</th>
    <th style="width:3%"></th>
    <th style="width:35%">Players</th>
    <th style="width:5%">Tag</th>
    ${category.reduce((p, c) => p + `<th style="width:9%">${c}</th>`, '')}</tr>`;
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
    app.relaunch();
    app.exit(0);
    app.quit();
}