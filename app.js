
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const fs = require('fs-extra');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
app.set('trust proxy', 1);

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname,'data');
fs.ensureDirSync(DATA_DIR);

const file = (n)=>path.join(DATA_DIR, n+'.json');
const types = ['staff','activity','case'];

types.forEach(t=>{
  if(!fs.existsSync(file(t))) fs.writeJsonSync(file(t),[]);
});

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(express.static(path.join(__dirname,'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave:false,
  saveUninitialized:false
}));

// BOT
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const CHAT_ID = process.env.CHAT_ID;

function send(msg){
  if(process.env.BOT_TOKEN && CHAT_ID){
    bot.sendMessage(CHAT_ID,msg);
  }
}

// BOT COMMAND
bot.onText(/\/start/, msg => {
  bot.sendMessage(msg.chat.id, "Bot aktif");
});

bot.onText(/\/staff/, async msg => {
  let data = await fs.readJson(file('staff'));
  let text = data.map(s=>s.nama).join("\n");
  bot.sendMessage(msg.chat.id, "STAFF:\n"+text);
});

bot.onText(/\/case/, async msg => {
  let data = await fs.readJson(file('case'));
  let text = data.map(c=>c.case+" - "+c.status).join("\n");
  bot.sendMessage(msg.chat.id, "CASE:\n"+text);
});

// AI MONITORING
setInterval(async ()=>{
  let staff = await fs.readJson(file('staff'));
  let activity = await fs.readJson(file('activity'));
  let now = Date.now();

  staff.forEach(s=>{
    let last = activity.find(a=>a.nama===s.nama);
    if(last && now - last.time > 3600000){ // 1 jam tidak aktif
      send("⚠️ "+s.nama+" tidak aktif > 1 jam");
    }
  });
}, 60000);

// API
app.post('/activity', async(req,res)=>{
  let data = await fs.readJson(file('activity'));
  data.push({nama:req.body.nama,time:Date.now()});
  await fs.writeJson(file('activity'),data);
  res.send('ok');
});

server.listen(PORT,()=>console.log('RUNNING '+PORT));
