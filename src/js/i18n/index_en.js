const showNotification = () => new Notification({
    title: 'Game Started!',
    body: 'Your Hypixel game has started!'
}).show();

const showUpdateMessage = () =>
    new Notification({
        title: 'Update Available!',
        body: 'Click the update button to get.'
    }).show();


const updateHTML = async() => {
    let main = document.getElementById('main');
    main.style.height = `300px`

    if (config.get('logPath') == '')
        return main.innerHTML = `${formatColor(' §cLog Path Not Found')}<br>${formatColor(' §cSet Log Path In Settings')}`;
    if (config.get('apiKey') == '')
        return main.innerHTML = `${formatColor(' §cAPI Key Not Found')}<br>${formatColor(' §cType /api new To Get')}`;
    if (!hypixel.verified && !hypixel.verifying)
        return main.innerHTML = `${formatColor(' §cInvalid API Key')}<br>${formatColor(' §cType /api new To Get')}`;

    clearMainPanel();

    let rendered = 0;
    let dataList = pickDataAndSort();
    for (let i = 0; i < dataList.length; i++) {
        if (dataList[i].nick == true) {
            main.innerHTML += `<tr><th style="text-align:right">[ ? ]</th><th></th><td>${formatColor('§f' + dataList[i].name)}</td><th>${formatColor('§eNICK')}</th></tr>`;
            rendered++;
            continue;
        }
        main.innerHTML += `<tr><th style="text-align:right;width:70px">${dataList[i].data[0].format}</th>
        <th><img src="https://crafatar.com/avatars/${await hypixel.getPlayerUuid(dataList[i].data[1].value)}?overlay" style="position:relative;width:20px;height:20px;top:4px"></th>
        <td onclick="search('${dataList[i].data[1].value}')">${dataList[i].data[1].format}</td>
        <th>${formatColor(dataList[i].data[dataList[i].data.length - 1].format)}</th>
        ${Array.from({ length: dataList[i].data.length - 3 }, (_, x) => x + 2).reduce((p, c) => p + `<th>${dataList[i].data[c].format}</th>`, '')}</tr>`;
        rendered++;
    }
    if (missingPlayer) {
        main.innerHTML += `<tr><td></td><td></td><td>${formatColor('§cMissing players')}</td></tr>
        <tr><td></td><td></td><td>${formatColor('§cPlease type /who')}</td></tr>`;
        rendered += 2;
    }
    main.style.height = `${Math.min(rendered * 29.6 + 31.2, 500)}px`;
    if (column >= 1 && column <= 8)
        document.getElementById(`sort_${column}`).innerHTML += isUp ? '↑' : '↓';
}

const clearMainPanel = () => {
    let main = document.getElementById('main'), category = hypixel.getTitle(nowType);
    main.innerHTML = `<tr><th id="sort_1" style="width:80px" onclick="setSortContext(1)">Lvl</th>
    <th style="width:25px"></th>
    <th id="sort_2" style="width:350px" onclick="setSortContext(2)">Players</th>
    <th id="sort_8" style="width:60px" onclick="setSortContext(8)">Tag</th>
    ${category.reduce((p, c, i) => p + `<th id="sort_${i + 3}" style="width:100px" onclick="setSortContext(${i + 3})">${c}</th>`, '')}</tr>`;
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