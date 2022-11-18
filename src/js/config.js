class Config {
    constructor(path, defaultValue) {
        this.path = path;
        this.defaultValue = defaultValue;
        this.fs = require('fs');
        if (!this.fs.existsSync(path))
            this.fs.writeFileSync(path, JSON.stringify(defaultValue));
        this.config = JSON.parse(this.fs.readFileSync(path));
    }
    get = (name) => {
        if (this.config[name] == null) {
            if (this.defaultValue[name] != null) {
                this.config[name] = this.defaultValue[name];
                return this.config[name];
            } else return null;
        } else return this.config[name];
    }
    set = (name, val) => this.config[name] = val;
    save = () => this.fs.writeFileSync(this.path, JSON.stringify(this.config));
}