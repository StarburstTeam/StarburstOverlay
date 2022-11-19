class I18n {
    constructor(folder) {
        this.folder = folder;
        this.langs = {};
        this.current = 'en';
        this.fs = require('fs');
        this.load();
    }
    load = () => {
        let files = this.fs.readdirSync(this.folder, 'utf-8');
        files.reduce((p, c) => {
            if (c.endsWith('.json'))
                p.push(c);
            return p;
        }, []).forEach(path => {
            try {
                let text = this.fs.readFileSync('./lang/' + path);
                let json = JSON.parse(text);
                this.langs[json.id] = { id: json.id, display: json.display, value: json.value };
            } catch (err) {
                console.log(err);
            }
        });
    }
    translate = (text) => {
        if (this.current == 'en') return text;
        let res = this.langs[this.current]?.value[text] ?? undefined;
        if (res == null || res == '') {
            res = this.langs['en']?.value[text] ?? undefined;
            if (res == null || res == '') res = text;
        }
        return res;
    }
}