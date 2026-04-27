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

// ================= DATA =================
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname,'data');
fs.ensureDirSync(DATA_DIR);

const file = (n)=>path.join(DATA_DIR, n+'.json');
const types = ['staff','activity','case'];

types.forEach(t=>{
  if(!fs.existsSync(file(t))) fs.writeJsonSync(file(t),[]);
});

// ================= MIDDLEWARE =================
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(express.static(path.join(__dirname,'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave:false,
  saveUninitialized:false
}));

// ================= BOT SAFE MODE =================
let bot = null;

if (process.env.BOT_TOKEN) {
  try {
    bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
    console.log("✅ Bot Telegram aktif");

    bot.onText(/\/start/, msg => {
      bot.sendMessage(msg.chat.id, "Bot aktif");
    });

    bot.onText(/\/staff/, async msg => {
      let data = await fs.readJson(file('staff'));
      let text = data.length ? data.map(s=>s.nama).join("\n") : "Tidak ada staff";
      bot.sendMessage(msg.chat.id, "STAFF:\n"+text);
    });

    bot.onText(/\/case/, async msg => {
      let data = await fs.readJson(file('case'));
      let text = data.length ? data.map(c=>c.case+" - "+(c.status||'BELUM')).join("\n") : "Tidak ada case";
      bot.sendMessage(msg.chat.id, "CASE:\n"+text);
    });

  } catch (err) {
    console.log("❌ Gagal init bot:", err.message);
    bot = null;
  }
} else {
  console.log("⚠️ BOT OFF (TOKEN KOSONG)");
}

function send(msg){
  if(bot && process.env.CHAT_ID){
    bot.sendMessage(process.env.CHAT_ID, msg).catch(()=>{});
  }
}

// ================= AI MONITORING =================
let lastNotif = {}; // anti spam

setInterval(async ()=>{
  try{
    let staff = await fs.readJson(file('staff'));
    let activity = await fs.readJson(file('activity'));
    let now = Date.now();

    staff.forEach(s=>{
      let last = activity.find(a=>a.nama===s.nama);
      
      if(last){
        let diff = now - last.time;

        // > 1 jam idle
        if(diff > 3600000){
          if(!lastNotif[s.nama] || now - lastNotif[s.nama] > 3600000){
            send("⚠️ "+s.nama+" tidak aktif > 1 jam");
            lastNotif[s.nama] = now;
          }
        }
      }
    });

  } catch(e){
    console.log("Monitor error:", e.message);
  }
}, 60000);

// ================= API =================
app.post('/activity', async(req,res)=>{
  try{
    if(!req.body.nama) return res.status(400).send('nama wajib');

    let data = await fs.readJson(file('activity'));
    data.push({nama:req.body.nama,time:Date.now()});

    await fs.writeJson(file('activity'),data);

    io.emit('update');
    res.send('ok');

  } catch(e){
    res.status(500).send('error');
  }
});

// ================= SERVER =================
server.listen(PORT,()=>console.log('RUNNING '+PORT));
