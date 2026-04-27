
<!DOCTYPE html>
<html>
<head>
<title>PRO DASHBOARD</title>
<script src="/socket.io/socket.io.js"></script>
<script>
const socket = io();
socket.on('update',()=>location.reload());
</script>
<style>
body{background:#0f172a;color:#fff;font-family:sans-serif;padding:20px}
.card{background:#1e293b;padding:15px;margin:10px 0;border-radius:12px}
h2{margin-top:0}
input,select,button{margin:5px;padding:8px;border-radius:6px;border:none}
button{background:#22c55e}
</style>
</head>
<body>

<h1>🔥 DASHBOARD KANTOR PRO</h1>

<div class="card">
<h2>NOTIFIKASI CUTI</h2>
<% notif.forEach(n=>{ %>
<div>⚠️ <%= n.nama %> CUTI / BALIK HARI INI</div>
<% }) %>
</div>

<div class="card">
<h2>TAMBAH STAFF</h2>
<form method="POST" action="/add/staff">
<input name="nama" placeholder="Nama">
<select name="shift"><option>PAGI</option><option>SIANG</option></select>
<select name="jobdesk">
<option>DP</option>
<option>WD</option>
<option>LIVECHAT</option>
</select>
<button>Tambah</button>
</form>
</div>

<div class="card">
<h2>DATA STAFF</h2>
<% staff.forEach(s=>{ %>
<div><%= s.nama %> | <%= s.shift %> | <%= s.jobdesk %></div>
<% }) %>
</div>

<div class="card">
<h2>DATA AKUN (ID & PSW)</h2>
<form method="POST" action="/add/akun">
<input name="id" placeholder="ID">
<input name="psw" placeholder="Password">
<button>Tambah</button>
</form>
<% akun.forEach(a=>{ %>
<div><%= a.id %> - <%= a.psw %></div>
<% }) %>
</div>

<div class="card">
<h2>CASE MASALAH</h2>
<form method="POST" action="/add/case">
<input name="case" placeholder="Masalah">
<button>Tambah</button>
</form>

<% case.forEach((c,i)=>{ %>
<div>
<b><%= c.case %></b> | <%= c.status || 'BELUM' %> | <%= c.note || '-' %>
<form method="POST" action="/update-case">
<input type="hidden" name="index" value="<%= i %>">
<select name="status">
<option>SELESAI</option>
<option>BELUM</option>
</select>
<input name="note" placeholder="Note">
<button>Update</button>
</form>
</div>
<% }) %>
</div>

</body>
</html>
