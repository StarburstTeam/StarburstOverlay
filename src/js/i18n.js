class I18n {
    constructor(current) {
        let files = fs.readdirSync('./src/lang');
        let jsons = files.reduce((p, c) => {
            if (c.endsWith('.json'))
                p.push(c);
            return p;
        }, []);
        this.data = jsons.reduce((p, c) => {
            let d = JSON.parse(fs.readFileSync(`./src/lang/${c}`));
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
        if (e != null) e.innerText = this.data[this.current].page[i];
    });
    getMainModeHTML = () => this.data[this.current].mode.reduce((p, c) => p + `<option value="${c.id}">${c.name}</option>`, '');
}