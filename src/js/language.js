const fs = require('fs');

class Language {
    constructor(folder) {
        this.folder = folder;
        this.langs = [];
    }
    load = () => {
        let files = fs.readdirSync(this.folder, 'utf-8');
        let langFiles = files.reduce((p, c) => {
            if (c.endsWith('.json'))
                p.push(c);
            return p;
        }, []);
        langFiles.forEach(path => {
            try {
                let text = fs.readFileSync('./lang/' + path);
                let json = JSON.parse(text);
                this.langs[json.name] = { display: json.display, value: json.value };
            } catch (err) {
                console.log(err);
            }
        });
    }
}