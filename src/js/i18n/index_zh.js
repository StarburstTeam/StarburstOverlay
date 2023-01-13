const { Notification, dialog, app } = remote;

const showNotification = () => new Notification({
    title: '游戏开始',
    body: ''
}).show();

const showUpdateMessage = () => new Notification({
    title: '有可用更新',
    body: '点击更新按钮打开下载界面'
}).show();

const updateHTML = async () => {
    let main = document.getElementById('main');
    main.style.height = `300px`

    if (config.get('logPath') == '')
        return main.innerHTML = `${formatColor('&nbsp §c未找到log路径')}<br>${formatColor('&nbsp §c请在设置中设置log路径')}`;
    if (!hasLog)
        return main.innerHTML = `${formatColor('&nbsp §clog文件未找到')}<br>${formatColor('&nbsp §c请在设置中设置log路径')}`;
    if (config.get('apiKey') == '')
        return main.innerHTML = `${formatColor('&nbsp §cAPI Key未找到')}<br>${formatColor('&nbsp §c使用/api new来获取')}`;
    if (!hypixel.verified && !hypixel.verifying)
        return main.innerHTML = `${formatColor('&nbsp §c无效的API Key')}<br>${formatColor('&nbsp §c使用/api new来获取')}`;

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
        <th><img src="https://crafatar.com/avatars/${await hypixel.getPlayerUuid(dataList[i].name)}?overlay" style="position:relative;width:20px;height:20px;top:4px"></th>
        <td style="word-break:keep-all" onclick="search('${dataList[i].name}')">${dataList[i].data[1].format}</td>
        <th>${formatColor(dataList[i].data[dataList[i].data.length - 1].format)}</th>
        ${Array.from({ length: dataList[i].data.length - 3 }, (_, x) => x + 2).reduce((p, c) => p + `<th>${dataList[i].data[c].format}</th>`, '')}</tr>`;
        rendered++;
    }
    if (missingPlayer) {
        main.innerHTML += `<tr><td></td><td></td><td>${formatColor('§c缺少玩家')}</td></tr>
        <tr><td></td><td></td><td>${formatColor('§c请在游戏内输入/who')}</td></tr>`;
        rendered += 2;
    }
    main.style.height = `${Math.min(rendered * 29.6 + 31.2, 500)}px`;
    if (column >= 1 && column <= 8)
        document.getElementById(`sort_${column}`).innerHTML += isUp ? '↑' : '↓';
}

const clearMainPanel = () => {
    let main = document.getElementById('main'), category = hypixel.getTitle(nowType);
    main.innerHTML = `<tr><th id="sort_1" style="width:90px" onclick="setSortContext(1)">等级</th>
    <th style="width:25px"></th>
    <th id="sort_2" style="width:340px" onclick="setSortContext(2)">玩家</th>
    <th id="sort_8" style="width:60px" onclick="setSortContext(8)">标签</th>
    ${category.reduce((p, c, i) => p + `<th id="sort_${i + 3}" style="width:100px" onclick="setSortContext(${i + 3})">${c}</th>`, '')}</tr>`;
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
    window.location.href = './index.html';
}