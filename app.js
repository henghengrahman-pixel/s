require('dotenv').config();
const express = require('express');
const session = require('express-session');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

// ================= VIEW =================
app.set('view engine','ejs');
app.set('views', path.join(__dirname,'views'));

// ================= DATA =================
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname,'data');
fs.ensureDirSync(DATA_DIR);

const file = (n)=>path.join(DATA_DIR, n+'.json');

// 🔥 GANTI case → cases
const types = ['staff','cases','akun'];

types.forEach(t=>{
  if(!fs.existsSync(file(t))) fs.writeJsonSync(file(t),[]);
});

// ================= MIDDLEWARE =================
app.use(express.urlencoded({extended:true}));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave:false,
  saveUninitialized:false
}));

// ================= IP FILTER =================
const ALLOWED_IPS = (process.env.ALLOWED_IPS || '')
  .split(',')
  .map(i => i.trim())
  .filter(Boolean);

function getIP(req){
  return (req.headers['x-forwarded-for'] || '')
    .split(',')[0]
    .trim() || req.socket.remoteAddress;
}

function checkIP(req,res,next){
  if(ALLOWED_IPS.length === 0) return next();

  const ip = getIP(req);

  if(!ALLOWED_IPS.includes(ip)){
    return res.send('❌ AKSES DITOLAK (IP TIDAK DIIZINKAN)');
  }

  next();
}

// ================= AUTH =================
function auth(req,res,next){
  if(!req.session.login) return res.redirect('/login');
  next();
}

// ================= LOGIN =================
app.get('/login',(req,res)=>res.render('login'));

app.post('/login',(req,res)=>{
  const {id,password} = req.body;

  if(id===process.env.ADMIN_ID && password===process.env.ADMIN_PASSWORD){
    req.session.login = true;
    return res.redirect('/');
  }

  res.send('❌ LOGIN GAGAL');
});

// ================= DASHBOARD =================
app.get('/', checkIP, auth, async(req,res)=>{
  const staff = await fs.readJson(file('staff'));
  const cases = await fs.readJson(file('cases'));
  const akun = await fs.readJson(file('akun'));

  res.render('dashboard',{
    staff,
    cases, // 🔥 FIX
    akun,
    notif:[]
  });
});

// ================= ADD DATA =================
app.post('/add/:type', checkIP, auth, async(req,res)=>{
  const f = file(req.params.type);

  let data = await fs.readJson(f);
  data.push(req.body);

  await fs.writeJson(f,data);
  res.redirect('/');
});

// ================= UPDATE CASE =================
app.post('/update-case', checkIP, auth, async(req,res)=>{
  let data = await fs.readJson(file('cases'));

  const {index,status,note} = req.body;

  data[index].status = status;
  data[index].note = note;

  await fs.writeJson(file('cases'),data);
  res.redirect('/');
});

// ================= DELETE CASE =================
app.post('/delete-case', checkIP, auth, async(req,res)=>{
  let data = await fs.readJson(file('cases'));

  const {index} = req.body;
  data.splice(index,1);

  await fs.writeJson(file('cases'),data);
  res.redirect('/');
});

// ================= SERVER =================
app.listen(PORT,()=>console.log('RUNNING '+PORT));
