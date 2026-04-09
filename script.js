var entries = [];
var budgets = {'🍔 Food':5000,'🚗 Transport':3000,'🏥 Health':2000,'🎮 Entertainment':2000,'🛍️ Shopping':3000,'💡 Utilities':1500,'📚 Education':4000,'✈️ Travel':5000};
var curType = 'expense';
var editId = null;
var showAll = false;
 
var CATS = ['🍔 Food','🚗 Transport','🏥 Health','🎮 Entertainment','🛍️ Shopping','💡 Utilities','📚 Education','✈️ Travel','💼 Salary','💹 Investment','🎁 Gift','📦 Other'];
var COLS = ['#ff5e7d','#6c63ff','#00d4aa','#ffb547','#4fc3f7','#c084fc','#fb923c','#34d399','#a78bfa','#22d3ee','#f472b6','#94a3b8'];
 
try { entries = JSON.parse(localStorage.getItem('spendly_v2') || '[]'); } catch(e){}
try { var sb = JSON.parse(localStorage.getItem('spendly_budgets') || 'null'); if(sb) budgets = sb; } catch(e){}
 
function fmt(n){ return '₹' + Math.abs(Math.round(n)).toLocaleString('en-IN'); }
 
function getFiltered(){
  var m = document.getElementById('monthFilter').value;
  if(m === 'all') return entries;
  return entries.filter(function(e){ return new Date(e.date).getMonth() === parseInt(m); });
}
 
function render(){
  var data = getFiltered();
  var exp = data.filter(function(e){ return e.type === 'expense'; });
  var inc = data.filter(function(e){ return e.type === 'income'; });
  var tExp = exp.reduce(function(s,e){ return s+e.amount; }, 0);
  var tInc = inc.reduce(function(s,e){ return s+e.amount; }, 0);
  var bal = tInc - tExp;
  var sav = tInc > 0 ? Math.round((bal/tInc)*100) : 0;
 
  document.getElementById('cBal').textContent = (bal < 0 ? '-' : '') + fmt(bal);
  document.getElementById('cBal').style.color = bal >= 0 ? 'var(--g)' : 'var(--r)';
  document.getElementById('cExp').textContent = fmt(tExp);
  document.getElementById('cInc').textContent = fmt(tInc);
  document.getElementById('cSav').textContent = sav + '%';
  document.getElementById('cExpN').textContent = exp.length + ' entries';
  document.getElementById('cIncN').textContent = inc.length + ' entries';
  document.getElementById('navBadge').textContent = entries.length;
 
  renderDonut(exp);
  renderBars();
  renderTopCats(exp);
  renderTx(data);
  renderBudget(exp);
}
 
function catColor(cat){
  var i = CATS.indexOf(cat);
  return COLS[i >= 0 ? i % COLS.length : COLS.length-1];
}
 
function renderDonut(exp){
  var svg = document.getElementById('donutSvg');
  var leg = document.getElementById('donutLeg');
  var total = exp.reduce(function(s,e){ return s+e.amount; }, 0);
  if(!total){
    svg.innerHTML = '<text x="70" y="74" text-anchor="middle" fill="#4a4a75" font-size="11" font-family="Plus Jakarta Sans">No expenses</text>';
    leg.innerHTML = '<div class="empty" style="padding:0"><div class="empty-ico" style="font-size:20px">🍩</div><div style="font-size:12px">Add expenses to see breakdown</div></div>';
    return;
  }
  var cats = {};
  exp.forEach(function(e){ cats[e.cat] = (cats[e.cat]||0) + e.amount; });
  var sorted = Object.keys(cats).map(function(k){ return [k, cats[k]]; }).sort(function(a,b){ return b[1]-a[1]; }).slice(0,5);
  var cx=70, cy=70, r=48, sw=20;
  var circ = 2*Math.PI*r;
  var offset = 0;
  var paths = '<circle cx="70" cy="70" r="48" fill="none" stroke="#21213a" stroke-width="20"/>';
  var legHtml = '';
  sorted.forEach(function(item){
    var cat = item[0], amt = item[1];
    var frac = amt/total;
    var dash = frac*circ;
    var col = catColor(cat);
    var pct = Math.round(frac*100);
    var off = -(offset*circ);
    paths += '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+col+'" stroke-width="'+sw+'" stroke-dasharray="'+dash.toFixed(2)+' '+circ.toFixed(2)+'" stroke-dashoffset="'+off.toFixed(2)+'" transform="rotate(-90 '+cx+' '+cy+')" style="cursor:pointer"/>';
    offset += frac;
    legHtml += '<div class="leg-row"><div class="leg-dot" style="background:'+col+'"></div><span class="leg-name">'+cat+'</span><span class="leg-val">'+fmt(amt)+'</span><span class="leg-pct">'+pct+'%</span></div>';
  });
  paths += '<text x="70" y="66" text-anchor="middle" fill="#7070a0" font-size="10" font-family="Plus Jakarta Sans">Total</text>';
  paths += '<text x="70" y="80" text-anchor="middle" fill="#e8e6ff" font-size="12" font-weight="700" font-family="Plus Jakarta Sans">'+fmt(total)+'</text>';
  svg.innerHTML = paths;
  leg.innerHTML = legHtml;
}
 
function renderBars(){
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var now = new Date();
  var mn = now.getMonth();
  var show = [];
  for(var i=5; i>=0; i--) show.push((mn-i+12)%12);
  var peak = 1;
  show.forEach(function(m){
    var e = entries.filter(function(x){ return x.type==='expense' && new Date(x.date).getMonth()===m; }).reduce(function(s,x){ return s+x.amount; },0);
    var ic = entries.filter(function(x){ return x.type==='income' && new Date(x.date).getMonth()===m; }).reduce(function(s,x){ return s+x.amount; },0);
    if(e>peak) peak=e; if(ic>peak) peak=ic;
  });
  var html = '';
  show.forEach(function(m){
    var e = entries.filter(function(x){ return x.type==='expense' && new Date(x.date).getMonth()===m; }).reduce(function(s,x){ return s+x.amount; },0);
    var ic = entries.filter(function(x){ return x.type==='income' && new Date(x.date).getMonth()===m; }).reduce(function(s,x){ return s+x.amount; },0);
    var eh = Math.max(4, Math.round((e/peak)*90));
    var ih = Math.max(4, Math.round((ic/peak)*90));
    html += '<div class="bcol"><div class="bar-pair"><div class="bar e" style="height:'+eh+'px" title="Exp: '+fmt(e)+'"></div><div class="bar i" style="height:'+ih+'px" title="Inc: '+fmt(ic)+'"></div></div><div class="bar-lbl">'+months[m]+'</div></div>';
  });
  document.getElementById('barChart').innerHTML = html;
}
 
function renderTopCats(exp){
  var cats = {};
  exp.forEach(function(e){ cats[e.cat]=(cats[e.cat]||0)+e.amount; });
  var sorted = Object.keys(cats).map(function(k){ return [k,cats[k]]; }).sort(function(a,b){ return b[1]-a[1]; }).slice(0,5);
  var el = document.getElementById('topCats');
  if(!sorted.length){
    el.innerHTML = '<div class="empty" style="grid-column:span 5"><div class="empty-ico">📦</div><div>No spending yet. Add your first expense!</div></div>';
    return;
  }
  el.innerHTML = sorted.map(function(item){
    var cat=item[0], amt=item[1];
    return '<div class="spend-card"><div class="spend-ico">'+cat.split(' ')[0]+'</div><div class="spend-lbl">'+cat.split(' ').slice(1).join(' ')+'</div><div class="spend-val">'+fmt(amt)+'</div></div>';
  }).join('');
}
 
function renderTx(data){
  var list = document.getElementById('txList');
  var sorted = data.slice().sort(function(a,b){ return new Date(b.date)-new Date(a.date); });
  var show = showAll ? sorted : sorted.slice(0,6);
  document.getElementById('viewAllBtn').textContent = showAll ? 'Show less' : 'View all ('+data.length+')';
  if(!show.length){
    list.innerHTML = '<div class="empty"><div class="empty-ico">💸</div><div>No transactions yet.<br>Click <strong>+ Add Entry</strong> to get started.</div></div>';
    return;
  }
  list.innerHTML = show.map(function(e){
    var d = new Date(e.date);
    var ds = d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
    var col = catColor(e.cat);
    return '<div class="tx-row">'+
      '<div class="tx-ico" style="background:'+col+'1a">'+e.cat.split(' ')[0]+'</div>'+
      '<div class="tx-info"><div class="tx-name">'+e.desc+'</div><div class="tx-sub">'+e.cat+' &middot; '+ds+'</div></div>'+
      '<div class="tx-amt '+(e.type==='expense'?'neg':'pos')+'">'+(e.type==='expense'?'&minus;':'+')+''+fmt(e.amount)+'</div>'+
      '<button class="tx-del" onclick="deleteEntry(\''+e.id+'\')" title="Delete">&times;</button>'+
    '</div>';
  }).join('');
}
 
function renderBudget(exp){
  var cats = {};
  exp.forEach(function(e){ cats[e.cat]=(cats[e.cat]||0)+e.amount; });
  var keys = Object.keys(budgets).slice(0,5);
  document.getElementById('budgetBars').innerHTML = keys.map(function(cat){
    var spent = cats[cat]||0;
    var limit = budgets[cat];
    var pct = Math.min(100, Math.round((spent/limit)*100));
    var col = pct>=90?'var(--r)':pct>=70?'var(--y)':'var(--g)';
    return '<div class="bud-item">'+
      '<div class="bud-top"><div class="bud-name">'+cat.split(' ')[0]+' '+cat.split(' ').slice(1).join(' ')+'</div><div class="bud-nums">'+fmt(spent)+' / '+fmt(limit)+'</div></div>'+
      '<div class="bud-bg"><div class="bud-fill" style="width:'+pct+'%;background:'+col+'"></div></div>'+
      (pct>=90?'<div class="bud-warn">&#9888; '+(pct>=100?'Over budget!':'Near limit')+'</div>':'')+'</div>';
  }).join('');
}
 
// MODAL
function openModal(id){
  editId = id || null;
  curType = 'expense';
  document.getElementById('tExp').className = 'type-opt sel-e';
  document.getElementById('tInc').className = 'type-opt';
  document.getElementById('fDate').value = new Date().toISOString().slice(0,10);
  if(id){
    var e = entries.find(function(x){ return x.id===id; });
    if(!e) return;
    document.getElementById('modalTitle').textContent = 'Edit Entry';
    document.getElementById('fDesc').value = e.desc;
    document.getElementById('fAmt').value = e.amount;
    document.getElementById('fCat').value = e.cat;
    document.getElementById('fDate').value = e.date;
    curType = e.type;
    if(e.type==='income'){ document.getElementById('tInc').className='type-opt sel-i'; document.getElementById('tExp').className='type-opt'; }
  } else {
    document.getElementById('modalTitle').textContent = 'New Entry';
    document.getElementById('fDesc').value = '';
    document.getElementById('fAmt').value = '';
    document.getElementById('fCat').selectedIndex = 0;
  }
  document.getElementById('overlay').classList.add('show');
  setTimeout(function(){ document.getElementById('fDesc').focus(); },100);
}
function closeModal(){ document.getElementById('overlay').classList.remove('show'); }
 
document.getElementById('overlay').addEventListener('click', function(e){
  if(e.target === this) closeModal();
});
 
function selType(t){
  curType = t;
  document.getElementById('tExp').className = 'type-opt' + (t==='expense'?' sel-e':'');
  document.getElementById('tInc').className = 'type-opt' + (t==='income'?' sel-i':'');
}
 
function saveEntry(){
  var desc = document.getElementById('fDesc').value.trim();
  var amt = parseFloat(document.getElementById('fAmt').value);
  var cat = document.getElementById('fCat').value;
  var date = document.getElementById('fDate').value;
  if(!desc){ alert('Please enter a description.'); return; }
  if(!amt || amt <= 0){ alert('Please enter a valid amount greater than 0.'); return; }
  if(!date){ alert('Please select a date.'); return; }
  if(editId){
    var i = entries.findIndex(function(e){ return e.id===editId; });
    if(i>=0) entries[i] = {id:editId, desc:desc, amount:amt, cat:cat, date:date, type:curType};
  } else {
    entries.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2), desc:desc, amount:amt, cat:cat, date:date, type:curType});
  }
  save(); closeModal(); render();
}
 
function deleteEntry(id){
  if(!confirm('Delete this entry?')) return;
  entries = entries.filter(function(e){ return e.id !== id; });
  save(); render();
}
 
function clearAll(){
  if(!entries.length){ alert('Nothing to clear.'); return; }
  if(!confirm('Delete ALL '+entries.length+' entries? This cannot be undone.')) return;
  entries = []; save(); render();
}
 
function toggleAll(){ showAll = !showAll; render(); }
 
// BUDGET MODAL
function openBudgetModal(){
  var cats = ['🍔 Food','🚗 Transport','🏥 Health','🎮 Entertainment','🛍️ Shopping','💡 Utilities','📚 Education','✈️ Travel'];
  document.getElementById('budgetFields').innerHTML = cats.map(function(c){
    return '<div class="field"><label>'+c+'</label><input type="number" id="b_'+c.replace(/\s/g,'_')+'" value="'+(budgets[c]||0)+'" min="0" step="100"></div>';
  }).join('');
  document.getElementById('budgetOverlay').classList.add('show');
}
function closeBudgetModal(){ document.getElementById('budgetOverlay').classList.remove('show'); }
document.getElementById('budgetOverlay').addEventListener('click', function(e){ if(e.target===this) closeBudgetModal(); });
function saveBudgets(){
  var cats = ['🍔 Food','🚗 Transport','🏥 Health','🎮 Entertainment','🛍️ Shopping','💡 Utilities','📚 Education','✈️ Travel'];
  cats.forEach(function(c){
    var v = parseFloat(document.getElementById('b_'+c.replace(/\s/g,'_')).value);
    if(!isNaN(v) && v>=0) budgets[c] = v;
  });
  localStorage.setItem('spendly_budgets', JSON.stringify(budgets));
  closeBudgetModal(); render();
}
 
function setNav(el){
  document.querySelectorAll('.nav-btn').forEach(function(b){
    b.classList.remove('active');
  });
  el.classList.add('active');
}

function scrollToSection(sectionId){
  var section = document.getElementById(sectionId);
  if(section){
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function navigateTo(target, el){
  setNav(el);

  if(target === 'dashboard'){
    scrollToSection('dashboardSection');
  }
  else if(target === 'transactions'){
    scrollToSection('transactionsSection');
  }
  else if(target === 'budgets'){
    scrollToSection('budgetsSection');
  }
  else if(target === 'reports'){
    scrollToSection('reportsSection');
  }
  else if(target === 'alerts'){
    alert('No new alerts right now 🔔');
  }
  else if(target === 'settings'){
    openBudgetModal();
  }
}
function save(){ try{ localStorage.setItem('spendly_v2', JSON.stringify(entries)); }catch(e){} }
 
document.addEventListener('keydown', function(e){ if(e.key==='Escape'){ closeModal(); closeBudgetModal(); } });
 
render();