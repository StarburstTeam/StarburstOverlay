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
            p[d.id] = { name: d.name, data: d.values };
            return p;
        }, {});
        this.current = current;
    }
    now = () => this.data[this.current].data;
    getAll = () => Object.keys(this.data).reduce((p, c) => {
        p.push({ id: c, name: this.data[c].name });
    }, []);
    set = (id) => this.current = id;
}