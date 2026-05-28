
function renderCats(){
  document.getElementById('cats').innerHTML=cats.filter(c=>c.visible!==false).map(c=>
    '<div class="ci'+(curCat===c.id?' on':'')+'" onclick="selCat(\''+c.id+'\')"><span class="ciem">'+c.emoji+'</span><span class="cinm">'+c.name+'</span></div>'
  ).join('');
}
function selCat(id){curCat=id;renderCats();renderProds()}
// RENDER PRODS
function renderProds(){
  const items=prods.filter(p=>{
    if(p.catId!==curCat||p.active===false)return false;
    const modes=p.modes||{ta:true,dl:true,tb:true};
    return modes[curMode]!==false;
  });
  document.getElementById('prods').innerHTML=items.map(p=>{
    const inC=curMode==='tb'&&selTbl?(tblOrders[selTbl]||{items:[]}).items.filter(i=>i.id===p.id).reduce((s,i)=>s+i.qty,0):cart.filter(c=>c.id===p.id).reduce((s,c)=>s+c.qty,0);
    const pr=getPrice(p),vat=getVAT(p);
    return '<div class="pc'+(inC>0?' in':'')+'" onclick="openModal(\''+p.id+'\')">'+(inC>0?'<div class="pcbdg">'+inC+'</div>':'')+
      '<div class="pcem">'+p.emoji+'</div><div class="pcnm">'+p.name+'</div><div class="pcpr">'+pr.toFixed(2).replace('.',',')+'€</div><div class="pcvat">ΦΠΑ '+vat+'%</div></div>';
  }).join('')||'<div style="grid-column:1/-1;text-align:center;color:var(--mt);padding:32px">Κανένα προϊόν</div>';
}
// MODAL
function openModal(id){
  mItem=prods.find(p=>p.id===id);if(!mItem)return;
  mQty=1;mSel={};mMulti={};
  const opts=getOpts(id,mItem.name);
  opts.forEach(og=>{if(og.type==='radio'){const d=og.choices.find(c=>c.default);if(d)mSel[og.name]=d.label}else mMulti[og.name]=[]});
  document.getElementById('omttl').textContent=mItem.name;
  document.getElementById('omcmt').value='';
  document.getElementById('omqn').textContent='1';
  renderOpts();updBtn();
  document.getElementById('optmodal').classList.add('on');
}
function renderOpts(){
  const opts=getOpts(mItem.id,mItem.name);
  document.getElementById('omopts').innerHTML=opts.map(og=>{
    const pills=og.choices.map(ch=>{
      const sel=og.type==='radio'?mSel[og.name]===ch.label:(mMulti[og.name]||[]).includes(ch.label);
      const fn=og.type==='radio'?'sopt("'+og.name+'","'+ch.label+'")'  :'topt("'+og.name+'","'+ch.label+'")';
      const ex=ch.extra?'<span class="pext">+'+parseFloat(ch.extra).toFixed(2).replace('.',',')+'€</span>':'';
      return '<div class="pill'+(sel?' on':'')+'" onclick="'+fn+'"><div class="pchk">'+(sel?'✓':'')+'</div>'+ch.label+ex+'</div>';
    }).join('');
    return '<div class="og"><div class="oglbl">'+og.name+(og.required?'<span class="rbdg">Υποχρεωτικό</span>':'')+' </div><div class="ogpills">'+pills+'</div></div>';
  }).join('');
  const pr=getPrice(mItem);
  document.getElementById('ompr').textContent='Από '+pr.toFixed(2).replace('.',',')+'€';
}
function sopt(g,l){mSel[g]=l;renderOpts();updBtn()}
function topt(g,l){if(!mMulti[g])mMulti[g]=[];const i=mMulti[g].indexOf(l);if(i>=0)mMulti[g].splice(i,1);else mMulti[g].push(l);renderOpts();updBtn()}
function omq(d){mQty=Math.max(1,mQty+d);document.getElementById('omqn').textContent=mQty;updBtn()}
function calcEx(){
  let e=0;
  getOpts(mItem.id,mItem.name).forEach(og=>{
    if(og.type==='radio'){const s=og.choices.find(c=>c.label===mSel[og.name]);if(s&&s.extra)e+=s.extra}
    else(mMulti[og.name]||[]).forEach(l=>{const s=og.choices.find(c=>c.label===l);if(s&&s.extra)e+=s.extra});
  });
  return e;
}
function updBtn(){
  const t=(getPrice(mItem)+calcEx())*mQty;
  document.getElementById('omadd').textContent='Προσθήκη — '+t.toFixed(2).replace('.',',')+'€';
}
function closeOptModal(){document.getElementById('optmodal').classList.remove('on')}
document.getElementById('optmodal').addEventListener('click',e=>{if(e.target===document.getElementById('optmodal'))closeOptModal()});
function addFromModal(){
  const ex=calcEx(),vat=getVAT(mItem),bp=getPrice(mItem);
  const ro=Object.entries(mSel).map(([g,v])=>v).join(' · ');
  const mo=Object.entries(mMulti).flatMap(([g,vs])=>vs).join(', ');
  const optStr=[ro,mo].filter(Boolean).join(' | ');
  const cmt=document.getElementById('omcmt').value.trim();
  closeOptModal();
  if(curMode==='tb'&&selTbl){addToTable({...mItem,price:bp},optStr,cmt,mQty,ex,vat)}
  else{cart.push({id:mItem.id,name:mItem.name,emoji:mItem.emoji,basePrice:bp,extra:ex,opts:optStr,comment:cmt,qty:mQty,vat});renderCart();renderProds();toast('✅ Προστέθηκε!')}
}
// CART
function renderCart(){
  const el=document.getElementById('clist');
  if(!cart.length){el.innerHTML='<div class="cempty">Επίλεξε προϊόντα →</div>';updTot();return}
  el.innerHTML=cart.map((c,i)=>'<div class="crow"><span style="font-size:1.1rem">'+c.emoji+'</span><div class="crinfo"><div class="crnm">'+c.name+'</div>'+(c.opts?'<div class="cropts">'+c.opts+'</div>':'')+(c.comment?'<div class="cropts">📝 '+c.comment+'</div>':'')+'</div><div class="qc"><button class="qb" onclick="cq('+i+',-1)">−</button><span class="qn">'+c.qty+'</span><button class="qb" onclick="cq('+i+',1)">+</button></div><div class="crpr">'+((c.basePrice+c.extra)*c.qty).toFixed(2).replace('.',',')+'€</div></div>').join('');
  updTot();
}
function cq(i,d){cart[i].qty=Math.max(0,cart[i].qty+d);if(cart[i].qty===0)cart.splice(i,1);renderCart();renderProds()}
function clrCart(){cart=[];renderCart();renderProds()}
function selPay(t){
  payMode=t;
  ['cash','card','account'].forEach(x=>{const el=document.getElementById('p-'+x);if(el)el.classList.toggle('on',x===t)});
}
function updTot(){
  const t=cart.reduce((s,c)=>s+(c.basePrice+c.extra)*c.qty,0);
  document.getElementById('ctotval').textContent=t.toFixed(2).replace('.',',')+'€';
  document.getElementById('okbtn').disabled=cart.length===0;
}
async function checkout(){
  const total=cart.reduce((s,c)=>s+(c.basePrice+c.extra)*c.qty,0);
  const payLbl=payMode==='cash'?'Μετρητά':payMode==='card'?'Κάρτα':'Λογαριασμός';
  try{
    await db.collection('pos_sales').add({mode:curMode,date:new Date().toISOString().split('T')[0],timestamp:firebase.firestore.FieldValue.serverTimestamp(),items:cart.map(c=>({name:c.name,qty:c.qty,price:c.basePrice,extra:c.extra})),total:Math.round(total*100)/100,payment:payLbl});
  }catch(e){}
  printReceipt(null,cart,total,payLbl,curMode==='ta'?'TAKE AWAY':'DELIVERY');
  doFlash();cart=[];renderCart();renderProds();
}
// TABLES
async function loadTables(){
  try{
    const snap=await db.collection('pos_areas').get();
    areas=[];snap.forEach(d=>areas.push({id:d.id,...d.data()}));areas.sort((a,b)=>(a.order||0)-(b.order||0));
    if(!areas.length){await db.collection('pos_areas').add({name:'Σαλόνι',order:0,tables:['Τ1','Τ2','Τ3','Τ4','Τ5']});await loadTables();return}
    if(areas.length)curArea=areas[0].id;
    const oSnap=await db.collection('table_orders').where('status','==','open').get();
    tblOrders={};oSnap.forEach(d=>{tblOrders[d.data().tableKey]={id:d.id,...d.data()}});
    renderAreaTabs();renderTables();
    db.collection('table_orders').where('status','==','open').onSnapshot(s=>{tblOrders={};s.forEach(d=>{tblOrders[d.data().tableKey]={id:d.id,...d.data()}});renderTables();if(selTbl)renderTableOrder()});
  }catch(e){}
}
function renderAreaTabs(){
  document.getElementById('atabs').innerHTML=
    areas.map(a=>'<div class="atab'+(curArea===a.id?' on':'')+'" onclick="selArea(\''+a.id+'\')" oncontextmenu="event.preventDefault();renameArea(\''+a.id+'\',\''+a.name+'\');return false">'+
      a.name+'<span onclick="event.stopPropagation();deleteArea(\''+a.id+'\')" style="color:var(--dn);font-size:.65rem;opacity:.7;cursor:pointer">✕</span></div>').join('')+
    '<div class="atab" onclick="addArea()" style="color:var(--ac)">+ Περιοχή</div>';
}
function selArea(id){curArea=id;renderAreaTabs();renderTables()}
async function addArea(){
  const name=prompt('Όνομα νέας περιοχής:');if(!name)return;
  if(areas.find(a=>a.name===name)){toast('⚠️ Υπάρχει ήδη!');return}
  const ref=await db.collection('pos_areas').add({name,order:areas.length,tables:[]});
  areas.push({id:ref.id,name,order:areas.length,tables:[]});curArea=ref.id;
  renderAreaTabs();renderTables();
}
async function deleteArea(id){
  if(!confirm('Διαγραφή περιοχής;'))return;
  await db.collection('pos_areas').doc(id).delete();
  areas=areas.filter(a=>a.id!==id);
  curArea=areas.length?areas[0].id:'';
  renderAreaTabs();renderTables();toast('🗑️ Διαγράφηκε');
}
function renameArea(id,oldName){
  renameCtx={type:'area',id,oldName};
  document.getElementById('renamettl').textContent='Μετονομασία Περιοχής';
  document.getElementById('renameinp').value=oldName;
  document.getElementById('renamemodal').classList.add('on');
}
async function confirmRename(){
  const newName=document.getElementById('renameinp').value.trim();
  if(!newName){toast('⚠️ Βάλε όνομα!');return}
  document.getElementById('renamemodal').classList.remove('on');
  if(renameCtx.type==='area'){
    await db.collection('pos_areas').doc(renameCtx.id).update({name:newName});
    const a=areas.find(x=>x.id===renameCtx.id);if(a)a.name=newName;
    renderAreaTabs();toast('✅ Μετονομάστηκε!');
  }else if(renameCtx.type==='table'){
    const area=areas.find(a=>a.id===curArea);if(!area)return;
    area.tables=area.tables.map(t=>t===renameCtx.oldName?newName:t);
    await db.collection('pos_areas').doc(curArea).update({tables:area.tables});
    renderTables();toast('✅ Μετονομάστηκε!');
  }
}
function renderTables(){
  const area=areas.find(a=>a.id===curArea);
  if(!area){document.getElementById('tgrid').innerHTML='<div style="color:var(--mt);padding:20px;text-align:center">Δεν υπάρχουν περιοχές</div>';return}
  document.getElementById('tgrid').innerHTML=
    (area.tables||[]).map(t=>{
      const key=curArea+'_'+t,order=tblOrders[key],isOpen=!!order,isSel=selTbl===key;
      const total=isOpen?(order.items||[]).reduce((s,i)=>s+(i.price+i.extra)*i.qty,0):0;
      const cnt=isOpen?(order.items||[]).reduce((s,i)=>s+i.qty,0):0;
      return '<div class="tbl'+(isSel?' sel':isOpen?' open':'')+'" onclick="selTable(\''+key+'\',\''+t+'\')" oncontextmenu="event.preventDefault();renameTable(\''+t+'\');return false">'+
        (isOpen?'':'<span class="tblx" onclick="event.stopPropagation();deleteTbl(\''+t+'\')">✕</span>')+
        '<div class="tblnm">'+t+'</div>'+
        (isOpen?'<div class="tbltot">'+total.toFixed(2).replace('.',',')+'€</div><div class="tblcnt">'+cnt+' τεμ.</div>':'<div class="tblcnt" style="color:var(--ac)">Ελεύθερο</div>')+
      '</div>';
    }).join('')+
    '<div class="tbl" style="border-style:dashed" onclick="addTable()"><div style="font-size:1.2rem;color:var(--ac)">+</div><div class="tblnm" style="color:var(--ac)">Τραπέζι</div></div>';
}
async function addTable(){
  const area=areas.find(a=>a.id===curArea);if(!area)return;
  const name=prompt('Όνομα τραπεζιού (π.χ. Τ6):');if(!name)return;
  if((area.tables||[]).includes(name)){toast('⚠️ Υπάρχει ήδη!');return}
  area.tables=[...(area.tables||[]),name];
  await db.collection('pos_areas').doc(curArea).update({tables:area.tables});
  renderTables();
}
async function deleteTbl(name){
  if(!confirm('Διαγραφή τραπεζιού "'+name+'";'))return;
  const area=areas.find(a=>a.id===curArea);if(!area)return;
  area.tables=area.tables.filter(t=>t!==name);
  await db.collection('pos_areas').doc(curArea).update({tables:area.tables});
  renderTables();toast('🗑️ Διαγράφηκε');
}
function renameTable(oldName){
  renameCtx={type:'table',oldName};
  document.getElementById('renamettl').textContent='Μετονομασία Τραπεζιού';
  document.getElementById('renameinp').value=oldName;
  document.getElementById('renamemodal').classList.add('on');
}
function selTable(key,name){
  selTbl=key;
  document.getElementById('tablesview').classList.remove('on');
  document.getElementById('tableorder').classList.add('on');
  document.getElementById('tottl').textContent='🪑 '+name;
  renderTableOrder();
}
function backToTables(){selTbl=null;document.getElementById('tableorder').classList.remove('on');document.getElementById('tablesview').classList.add('on');renderTables()}
function renderTableOrder(){
  const order=tblOrders[selTbl];
  const items=order?order.items||[]:[];
  const el=document.getElementById('toitems');
  el.innerHTML=items.length?items.map((it,i)=>'<div class="crow"><span style="font-size:1.1rem">'+it.emoji+'</span><div class="crinfo"><div class="crnm">'+it.name+'</div>'+(it.opts?'<div class="cropts">'+it.opts+'</div>':'')+(it.comment?'<div class="cropts">📝 '+it.comment+'</div>':'')+'</div><div class="qc"><button class="qb" onclick="chTQ('+i+',-1)">−</button><span class="qn">'+it.qty+'</span><button class="qb" onclick="chTQ('+i+',1)">+</button></div><div class="crpr">'+((it.price+it.extra)*it.qty).toFixed(2).replace('.',',')+'€</div></div>').join(''):'<div class="cempty">Δεν υπάρχουν παραγγελίες<br><small>Επίλεξε προϊόντα</small></div>';
  const total=items.reduce((s,i)=>s+(i.price+i.extra)*i.qty,0);
  document.getElementById('tototval').textContent=total.toFixed(2).replace('.',',')+'€';
}
async function chTQ(i,d){
  const order=tblOrders[selTbl];if(!order)return;
  order.items[i].qty=Math.max(0,order.items[i].qty+d);
  if(order.items[i].qty===0)order.items.splice(i,1);
  await db.collection('table_orders').doc(order.id).update({items:order.items});
  renderTableOrder();renderTables();
}
async function addToTable(item,opts,comment,qty,extra,vat){
  const order=tblOrders[selTbl];
  const ni={id:item.id,name:item.name,emoji:item.emoji,price:item.price,extra,opts,comment,qty,vat};
  if(order){order.items.push(ni);await db.collection('table_orders').doc(order.id).update({items:order.items,updatedAt:firebase.firestore.FieldValue.serverTimestamp()})}
  else{const ref=await db.collection('table_orders').add({tableKey:selTbl,tableName:document.getElementById('tottl').textContent.replace('🪑 ',''),status:'open',items:[ni],createdAt:firebase.firestore.FieldValue.serverTimestamp(),updatedAt:firebase.firestore.FieldValue.serverTimestamp()});tblOrders[selTbl]={id:ref.id,tableKey:selTbl,status:'open',items:[ni]}}
  renderTableOrder();renderTables();toast('✅ Προστέθηκε!');
}
function printPre(){
  const order=tblOrders[selTbl];if(!order||!order.items.length){toast('⚠️ Κανένα προϊόν');return}
  const total=order.items.reduce((s,i)=>s+(i.price+i.extra)*i.qty,0);
  printReceipt('ΠΡΟΣΩΡΙΝΗ',order.items,total,'',document.getElementById('tottl').textContent);
}
function openPayModal(){
  const order=tblOrders[selTbl];if(!order||!order.items.length){toast('⚠️ Κανένα προϊόν');return}
  const total=order.items.reduce((s,i)=>s+(i.price+i.extra)*i.qty,0);
  document.getElementById('paytot').textContent=total.toFixed(2).replace('.',',')+'€';
  pmModal='cash';['cash','card','account'].forEach(x=>document.getElementById('pm-'+x).classList.toggle('on',x==='cash'));
  document.getElementById('paymodal').classList.add('on');
}
function selPM(t){pmModal=t;['cash','card','account'].forEach(x=>document.getElementById('pm-'+x).classList.toggle('on',x===t))}
async function confirmPay(){
  const order=tblOrders[selTbl];if(!order)return;
  const total=order.items.reduce((s,i)=>s+(i.price+i.extra)*i.qty,0);
  const payLbl=pmModal==='cash'?'Μετρητά':pmModal==='card'?'Κάρτα':'Λογαριασμός';
  printReceipt(null,order.items,total,payLbl,document.getElementById('tottl').textContent);
  await db.collection('table_orders').doc(order.id).update({status:'closed',payment:payLbl,closedAt:firebase.firestore.FieldValue.serverTimestamp(),total});
  delete tblOrders[selTbl];
  document.getElementById('paymodal').classList.remove('on');
  doFlash();backToTables();
}
async function closeTableNoCharge(){
  if(!confirm('Κλείσιμο χωρίς πληρωμή;'))return;
  const order=tblOrders[selTbl];
  if(order)await db.collection('table_orders').doc(order.id).update({status:'cancelled',closedAt:firebase.firestore.FieldValue.serverTimestamp()});
  delete tblOrders[selTbl];backToTables();
}
// CASH REGISTER
async function openCash(){document.getElementById('cashmodal').classList.add('on');await loadCash()}
async function loadCash(){
  const el=document.getElementById('cashcontent');
  el.innerHTML='<div style="color:var(--mt);padding:16px;text-align:center">Φόρτωση...</div>';
  try{
    const today=new Date();today.setHours(0,0,0,0);
    let cash=0,card=0,acc=0;
    const tSnap=await db.collection('table_orders').where('status','==','closed').get();
    tSnap.forEach(d=>{
      const data=d.data();
      const closed=data.closedAt?data.closedAt.toDate():new Date(0);
      if(closed<today)return;
      const t=parseFloat(data.total)||0;
      if(data.payment==='Μετρητά')cash+=t;
      else if(data.payment==='Κάρτα')card+=t;
      else acc+=t;
    });
    // pos_sales: take away + delivery
    let taCash=0,taCard=0,taAcc=0,dlCash=0,dlCard=0,dlAcc=0;
    const pSnap=await db.collection('pos_sales').where('date','==',today.toISOString().split('T')[0]).get();
    pSnap.forEach(d=>{
      const data=d.data(),t=parseFloat(data.total)||0;
      const isTa=data.mode==='ta';
      if(data.payment==='Μετρητά'){if(isTa)taCash+=t;else dlCash+=t;cash+=t}
      else if(data.payment==='Κάρτα'){if(isTa)taCard+=t;else dlCard+=t;card+=t}
      else{if(isTa)taAcc+=t;else dlAcc+=t;acc+=t}
    });
    const total=cash+card+acc;
    el.innerHTML=
      '<div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:var(--mt);margin:8px 0 4px">🥡 Take Away</div>'+
      crow('💵 Μετρητά',taCash)+crow('💳 Κάρτα',taCard)+crow('📋 Λογαριασμός',taAcc)+
      '<div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:var(--mt);margin:8px 0 4px">🚚 Delivery</div>'+
      crow('💵 Μετρητά',dlCash)+crow('💳 Κάρτα',dlCard)+crow('📋 Λογαριασμός',dlAcc)+
      '<div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:var(--mt);margin:8px 0 4px">🪑 Τραπέζια</div>'+
      crow('💵 Μετρητά',cash-taCash-dlCash)+crow('💳 Κάρτα',card-taCard-dlCard)+crow('📋 Λογαριασμός',acc-taAcc-dlAcc)+
      '<div class="cashrow cashrowtot" style="margin-top:8px"><span class="cashlbl">🏆 Γενικό Σύνολο</span><span class="cashval" style="color:var(--ac)">'+total.toFixed(2).replace('.',',')+'€</span></div>';
  }catch(e){el.innerHTML='<div style="color:var(--dn);padding:16px">Σφάλμα: '+e.message+'</div>'}
}
function crow(lbl,amount){return '<div class="cashrow"><span class="cashlbl">'+lbl+'</span><span class="cashval">'+amount.toFixed(2).replace('.',',')+'€</span></div>'}
async function closeDayCash(){
  if(!confirm('Κλείσιμο ημέρας; Θα εκτυπωθεί αναφορά.'))return;
  await loadCash();
  const n=new Date();
  let r='================================\n        NORTH APE\n================================\nΗΜΕΡΗΣΙΟ ΤΑΜΕΙΟ\n'+n.toLocaleDateString('el-GR')+'\n================================\n';
  document.getElementById('cashcontent').querySelectorAll('.cashrow').forEach(row=>{r+=row.textContent.trim()+'\n'});
  r+='================================\n   Τέλος Ημέρας\n================================\n';
  const w=window.open('','_blank','width=350,height=400');
  w.document.write('<html><head><title>Ταμείο</title><style>body{font-family:monospace;font-size:13px;white-space:pre;padding:10px}</style></head><body>'+r+'</body></html>');
  w.document.close();setTimeout(()=>w.print(),400);
  document.getElementById('cashmodal').classList.remove('on');
}
// PRINT
function printReceipt(type,items,total,payLbl,title){
  const n=new Date();
  let r='================================\n        NORTH APE\n     Σταμάτα Αττικής\n================================\n';
  if(type)r+=type+'\n';
  r+=title+'\n'+n.toLocaleDateString('el-GR')+'  '+n.toLocaleTimeString('el-GR',{hour:'2-digit',minute:'2-digit'})+'\n--------------------------------\n';
  items.forEach(it=>{r+=it.emoji+' '+it.name+' x'+it.qty+'\n';if(it.opts)r+='  '+it.opts+'\n';if(it.comment)r+='  * '+it.comment+'\n';r+='  '+((it.price+it.extra)*it.qty).toFixed(2)+'€'+(it.vat?' ΦΠΑ '+it.vat+'%':'')+'\n'});
  r+='================================\nΣΥΝΟΛΟ: '+total.toFixed(2)+'€\n';
  if(payLbl)r+='ΠΛΗΡΩΜΗ: '+payLbl+'\n';
  r+='================================\n   Σας ευχαριστούμε! 🦍\n================================\n';
  const w=window.open('','_blank','width=350,height=500');
  w.document.write('<html><head><title>Απόδειξη</title><style>body{font-family:monospace;font-size:13px;white-space:pre;padding:10px}</style></head><body>'+r+'</body></html>');
  w.document.close();setTimeout(()=>w.print(),400);
}
function doFlash(){const f=document.getElementById('flash');f.classList.add('on');setTimeout(()=>f.classList.remove('on'),1500)}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('on');setTimeout(()=>t.classList.remove('on'),1500)}
