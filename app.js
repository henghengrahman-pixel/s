require('dotenv').config();
const express = require('express');
const session = require('express-session');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine','ejs');
app.set('views', path.join(__dirname,'views'));

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname,'data');
fs.ensureDirSync(DATA_DIR);

const file = (n)=>path.join(DATA_DIR, n+'.json');
const types = ['staff','cases','akun'];

types.forEach(t=>{
  if(!fs.existsSync(file(t))) fs.writeJsonSync(file(t),[]);
});

app.use(express.urlencoded({extended:true}));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave:false,
  saveUninitialized:false
}));

function auth(req,res,next){
  if(!req.session.login) return res.redirect('/login');
  next();
}

app.get('/login',(req,res)=>res.render('login'));
app.post('/login',(req,res)=>{
  const {id,password} = req.body;
  if(id===process.env.ADMIN_ID && password===process.env.ADMIN_PASSWORD){
    req.session.login = true;
    return res.redirect('/');
  }
  res.send('Login gagal');
});

app.get('/', auth, async(req,res)=>{
  const staff = await fs.readJson(file('staff'));
  const cases = await fs.readJson(file('cases'));
  const akun = await fs.readJson(file('akun'));
  res.render('dashboard',{staff,cases,akun});
});

app.post('/add/:type', auth, async(req,res)=>{
  const f = file(req.params.type);
  let data = await fs.readJson(f);
  data.push(req.body);
  await fs.writeJson(f,data);
  res.redirect('/');
});

app.post('/delete/:type', auth, async(req,res)=>{
  const f = file(req.params.type);
  let data = await fs.readJson(f);
  data.splice(parseInt(req.body.index),1);
  await fs.writeJson(f,data);
  res.redirect('/');
});

app.listen(PORT,()=>console.log('RUNNING '+PORT));
