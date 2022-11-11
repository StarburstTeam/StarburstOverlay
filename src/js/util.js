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

const formatNameString = name => name.toLowerCase().split('_').reduce((ret, word) => ret + word[0].toUpperCase() + word.slice(1) + ' ', '');

const openUrl= (url) => shell.openExternal(url);