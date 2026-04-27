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

// VIEW ENGINE
app.set('view engine','ejs');
app.set('views', path.join(__dirname,'views'));

// DATA
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname,'data');
fs.ensureDirSync(DATA_DIR);

const file = (n)=>path.join(DATA_DIR, n+'.json');
const types = ['staff','activity','case','akun'];

types.forEach(t=>{
  if(!fs.existsSync(file(t))) fs.writeJsonSync(file(t),[]);
});

// MIDDLEWARE
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(express.static(path.join(__dirname,'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave:false,
  saveUninitialized:false
}));

// AUTH SIMPLE
function auth(req,res,next){
  if(!req.session.login) return res.redirect('/login');
  next();
}

// LOGIN
app.get('/login',(req,res)=>res.render('login'));
app.post('/login',(req,res)=>{
  const {id,password} = req.body;
  if(id===process.env.ADMIN_ID && password===process.env.ADMIN_PASSWORD){
    req.session.login = true;
    return res.redirect('/');
  }
  res.send('Login gagal');
});

// DASHBOARD
app.get('/', auth, async(req,res)=>{
  const staff = await fs.readJson(file('staff'));
  const activity = await fs.readJson(file('activity'));
  const caseData = await fs.readJson(file('case'));
  const akun = await fs.readJson(file('akun'));

  res.render('dashboard',{
    staff,
    case: caseData,
    akun,
    notif:[]
  });
});

// ADD DATA
app.post('/add/:type', auth, async(req,res)=>{
  const f = file(req.params.type);
  let data = await fs.readJson(f);
  data.push(req.body);
  await fs.writeJson(f,data);
  io.emit('update');
  res.redirect('/');
});

// UPDATE CASE
app.post('/update-case', auth, async(req,res)=>{
  let data = await fs.readJson(file('case'));
  const {index,status,note} = req.body;
  data[index].status = status;
  data[index].note = note;
  await fs.writeJson(file('case'),data);
  io.emit('update');
  res.redirect('/');
});

// BOT OPTIONAL
let bot = null;
if(process.env.BOT_TOKEN){
  bot = new TelegramBot(process.env.BOT_TOKEN,{polling:true});
  console.log("BOT AKTIF");
}else{
  console.log("BOT OFF");
}

server.listen(PORT,()=>console.log('RUNNING '+PORT));
