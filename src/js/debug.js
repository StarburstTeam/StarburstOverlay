const test = async (name) => {
    await hypixel.download(name);
    players.push(name);
    updateHTML();
}