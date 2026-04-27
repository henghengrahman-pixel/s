require('dotenv').config();
const express = require('express');
const session = require('express-session');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
fs.ensureDirSync(DATA_DIR);

const FILE = (name) => path.join(DATA_DIR, name + '.json');
const ensure = (f) => { if (!fs.existsSync(f)) fs.writeJsonSync(f, []); };

const files = ['staff','cuti','rekening','rekening_off','case','livechat'];
files.forEach(f => ensure(FILE(f)));

app.set('view engine','ejs');
app.set('views', path.join(__dirname,'views'));

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(express.static(path.join(__dirname,'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave:false,
  saveUninitialized:false
}));

const ALLOWED_IPS = (process.env.ALLOWED_IPS||'').split(',').map(i=>i.trim());

const getIP = (req)=> (req.headers['x-forwarded-for']||'').split(',')[0].trim() || req.socket.remoteAddress;

const checkIP = (req,res,next)=>{
  if(!ALLOWED_IPS.includes(getIP(req))) return res.send('IP DITOLAK');
  next();
};

const auth = (req,res,next)=>{
  if(!req.session.login) return res.redirect('/login');
  next();
};

app.get('/login',(req,res)=>res.render('login'));
app.post('/login',(req,res)=>{
  const {id,password} = req.body;
  if(id===process.env.ADMIN_ID && password===process.env.ADMIN_PASSWORD){
    req.session.login=true;
    return res.redirect('/');
  }
  res.send('Login gagal');
});

app.get('/',checkIP,auth,async(req,res)=>{
  const data = {};
  for(let f of files){
    data[f] = await fs.readJson(FILE(f));
  }
  const today = new Date().toISOString().slice(0,10);
  const notif = data.cuti.filter(c=>c.mulai===today || c.selesai===today);
  res.render('dashboard',{...data,notif});
});

app.post('/add/:type',checkIP,auth,async(req,res)=>{
  const f = FILE(req.params.type);
  let data = await fs.readJson(f);
  data.push(req.body);
  await fs.writeJson(f,data);
  res.redirect('/');
});

app.listen(PORT,()=>console.log('RUNNING '+PORT));
