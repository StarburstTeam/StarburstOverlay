const showNotification = () => new Notification({
    title: '游戏开始',
    body: ''
}).show();

const showUpdateMessage = () => new Notification({
    title: '有可用更新',
    body: '点击更新按钮打开下载界面'
}).show();

const updateHTML = () => {
    let main = document.getElementById('main');

    if (config.get('logPath') == '')
        return main.innerHTML = `${formatColor(' §c未找到log路径')}<br>${formatColor(' §c请在设置中设置log路径')}`;
    if (config.get('apiKey') == '')
        return main.innerHTML = `${formatColor(' §cAPI Key未找到')}<br>${formatColor(' §c使用/api new来获取')}`;
    if (!hypixel.verified && !hypixel.verifying)
        return main.innerHTML = `${formatColor(' §c无效的API Key')}<br>${formatColor(' §c使用/api new来获取')}`;

    clearMainPanel();

    let rendered = 0;
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
        rendered++;
    }
    if (missingPlayer)
        main.innerHTML += `<tr><td></td><td></td><td>${formatColor('§c缺少玩家')}</td></tr>
        <tr><td></td><td></td><td>${formatColor('§c请在游戏内输入/who')}</td></tr>`;
    main.style.height = `${Math.min(rendered * 29.6 + 31.2, 500)}px`
}

const clearMainPanel = () => {
    let main = document.getElementById('main'), category = hypixel.getTitle(nowType);
    main.innerHTML = `<tr><th style="width:80px">等级</th>
    <th style="width:20px"></th>
    <th style="width:400px">玩家</th>
    <th style="width:60px">标签</th>
    ${category.reduce((p, c) => p + `<th style="width:85px">${c}</th>`, '')}</tr>`;
}

const selectLogFile = () => {
    let temppath = dialog.showOpenDialogSync(currentWindow, {
        title: '选择latest.log文件',
        defaultPath: app.getPath('home').split('\\').join('/'),
        buttonLabel: '选择log文件',
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