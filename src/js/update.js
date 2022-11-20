const AutoGitUpdate = require('auto-git-update/index');

let updater = new AutoGitUpdate({ repository: 'https://github.com/IAFEnvoy/StarburstOverlay', tempLocation: './temp/update' });
const findUpdate = async () => {
    try {
        const versions = await updater.compareVersions();
        return !versions.upToDate;
    }
    catch {
        return false;
    }
}