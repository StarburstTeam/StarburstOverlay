class I18n {
    constructor(current) {
        this.fs = require('fs');
        let path = app.isPackaged ? './resources/app.asar.unpacked/src/lang/' : './src/lang/'
        let files = this.fs.readdirSync(path);
        let jsons = files.reduce((p, c) => {
            if (c.endsWith('.json'))
                p.push(c);
            return p;
        }, []);
        this.data = jsons.reduce((p, c) => {
            let d = JSON.parse(this.fs.readFileSync(`${path}${c}`));
            p[d.id] = { name: d.name, values: d.values, page: d.page, mode: d.mode };
            return p;
        }, {});
        this.current = current;
    }
    now = () => this.data[this.current].values;
    getAll = () => Object.keys(this.data).reduce((p, c) => {
        p.push({ id: c, name: this.data[c].name });
    }, []);
    set = (id) => this.current = id;
    initPage = () => Object.keys(this.data[this.current].page).forEach((i) => {
        let e = document.getElementById(i);
        if (e != null) e.innerHTML = this.data[this.current].page[i];
    });
    getMainModeHTML = () => this.data[this.current].mode.reduce((p, c) => p + `<option value="${c.id}">${c.name}</option>`, '');
}