module.exports = async (req, res) => {
const BOT_TOKEN = process.env.BOT_TOKEN;
const REPO_RAW = process.env.REPO_RAW;
if (!BOT_TOKEN || !REPO_RAW) {
res.status(500).send('Set BOT_TOKEN and REPO_RAW in environment');
return;
}
const API_BASE = https://api.telegram.org/bot${BOT_TOKEN};

const post = (method, payload) => {
return fetch(${API_BASE}/${method}, {
method: 'POST',
headers: {'Content-Type': 'application/json'},
body: JSON.stringify(payload)
});
};

try {
const update = req.body || {};
if (!update.message) {
res.status(200).send('ok');
return;
}
const chat_id = update.message.chat.id;
const text = (update.message.text || '').trim();

const libResp = await fetch(REPO_RAW.replace(/\/$/,'') + '/library.json');
const lib = await libResp.json();

if (text === '/start') {
  await post('sendMessage', {chat_id, text: 'Welcome to AstuBooks. Type Browse to list subjects.'});
  res.status(200).send('ok');
  return;
}

if (text.toLowerCase() === 'browse') {
  const subjects = Object.keys(lib || {});
  const keyboard = subjects.map(s => [s]);
  await post('sendMessage', {chat_id, text: 'Choose a subject', reply_markup: {keyboard, one_time_keyboard: true, resize_keyboard: true}});
  res.status(200).send('ok');
  return;
}

if (lib && lib[text]) {
  const books = lib[text];
  const keyboard = books.map(b => [b.title]);
  await post('sendMessage', {chat_id, text: 'Choose a book', reply_markup: {keyboard, one_time_keyboard: true, resize_keyboard: true}});
  res.status(200).send('ok');
  return;
}

for (const subject of Object.keys(lib || {})) {
  for (const b of lib[subject]) {
    if (b.title === text) {
      const pathVal = b.path || '';
      const fileUrl = pathVal.startsWith('http') ? pathVal : REPO_RAW.replace(/\/$/,'') + '/' + pathVal;
      if (fileUrl.includes('drive.google.com')) {
        await post('sendMessage', {chat_id, text: `Book: ${b.title}\nDownload link: ${fileUrl}`});
        res.status(200).send('ok');
        return;
      } else {
        await post('sendDocument', {chat_id, document: fileUrl, caption: b.title});
        res.status(200).send('ok');
        return;
      }
    }
  }
}

await post('sendMessage', {chat_id, text: 'Unknown command. Type Browse to list subjects.'});
res.status(200).send('ok');


} catch (e) {
console.error(e);
res.status(500).send('error');
}
};
