const { shell } = require('electron');

const formatDateTime = (date) => {
  if (date == null) return 'Fail to get';
  date = new Date(date);
  let y = date.getFullYear();
  let m = date.getMonth() + 1; //注意这个“+1”
  m = m < 10 ? ('0' + m) : m;
  let d = date.getDate();
  d = d < 10 ? ('0' + d) : d;
  let h = date.getHours();
  h = h < 10 ? ('0' + h) : h;
  let minute = date.getMinutes();
  minute = minute < 10 ? ('0' + minute) : minute;
  let second = date.getSeconds();
  second = second < 10 ? ('0' + second) : second;
  return y + '-' + m + '-' + d + '   ' + h + ' : ' + minute + ' : ' + second;
};

const colors = [
  '#000000', '#0000AA', '#00AA00', '#00AAAA', '#AA0000', '#AA00AA', '#FFAA00', '#AAAAAA',
  '#555555', '#5555FF', '#55FF55', '#55FFFF', '#FF5555', '#FF55FF', '#FFFF55', '#FFFFFF'
];
const formatColor = (data) => {
  if (data == null) return 'Fail to get';
  return data.split('').reduce((ret, char, index, arr) =>
    ret += char == '§' ? '</span>' : arr[index - 1] == '§' ? '<span style="color:' + colors[parseInt(char, 16)] + '">' : char,
    '<span style="color:' + colors[0] + '">') + '</span>';
}

const colorMap = Object.fromEntries([
  'black', 'dark_blue', 'dark_green', 'dark_aqua', 'dark_red', 'dark_purple', 'gold', 'gray',
  'dark_gray', 'blue', 'green', 'aqua', 'red', 'light_purple', 'yellow', 'white'
].map((c, i) => [c, "§" + i.toString(16)]))
const formatColorFromString = name => colorMap[name.toLowerCase()];

const formatNameString = name => name.toLowerCase().split('_').reduce((ret, word) => ret + word[0].toUpperCase() + word.slice(1) + ' ', '');

const openUrl= (url) => shell.openExternal(url);