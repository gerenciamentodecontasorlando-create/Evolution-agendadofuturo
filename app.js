import { DB } from "./db.js";
import { renderCalendar } from "./calendar.js";
import { RX_CATEGORIES, RX_PRESETS } from "./presets.js";
import { printPrescription, printFichaClinica, printGeneric, printAgendaDia } from "./docs.js";
import * as SYNC from "./sync.js";

const PIN = "BTX007";

const $ = (id)=>document.getElementById(id);
const toast = (msg)=>{
  const el = $("toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(()=>el.classList.remove("show"), 1600);
};

function setSaveState(s){ $("saveState").textContent = s; }

function isoToday(){
  return new Date().toISOString().slice(0,10);
}
function addDaysISO(iso, delta){
  const d = new Date(iso+"T00:00:00");
  d.setDate(d.getDate()+delta);
  return d.toISOString().slice(0,10);
}

const state = {
  dateISO: isoToday(),
  month: new Date().getMonth(),
  year: new Date().getFullYear(),
  selectedApptId: null,
  selectedPatientId: null,
  rxCat: "analgesicos",
  syncEnabled: false,
  pollTimer: null
};

async function getPro(){
  return await DB.getMeta("professional", {
    name:"", reg:"", phone:"", address:""
  });
}

function updateBrandFromProName(name){
  const clean = (name||"").trim();
  if(!clean){
    $("brandName").textContent = "BTX-Pront";
    $("brandSub").textContent = "⬢";
    return;
  }
  const parts = clean.replace(/\s+/g," ").split(" ");
  const short = parts.slice(0,2).join(" ").toUpperCase();
  $("brandName").textContent = short;
  $("brandSub").textContent = "BTX-Pront ⬢";
}

function showLogin(force=false){
  const ok = sessionStorage.getItem("btx_ok")==="1";
  if(ok && !force) return;
  $("loginOverlay").classList.add("show");
  $("loginOverlay").setAttribute("aria-hidden","false");
  $("pinInput").value = "";
  $("loginMsg").textContent = "";
  setTimeout(()=>$("pinInput").focus(), 50);
}

function hideLogin(){
  $("loginOverlay").classList.remove("show");
  $("loginOverlay").setAttribute("aria-hidden","true");
}

$("btnLogin").addEventListener("click", ()=>{
  const pin = ($("pinInput").value || "").trim();
  if(pin === PIN){
    sessionStorage.setItem("btx_ok","1");
    hideLogin();
    toast("Acesso liberado");
  } else {
    $("loginMsg").textContent = "PIN inválido.";
  }
});
$("btnLoginHint").addEventListener("click", ()=>{
  $("loginMsg").textContent = "PIN padrão: BTX007";
});
$("btnLock").addEventListener("click", ()=>{
  sessionStorage.removeItem("btx_ok");
  showLogin(true);
});

function fillTimeSlots(){
  const sel = $("slotTime");
  sel.innerHTML = "";
  for(let h=8; h<=20; h++){
    const opt = document.createElement("option");
    const hh = String(h).padStart(2,"0");
    opt.value = `${hh}:00`;
    opt.textContent = `${hh}:00`;
    sel.appendChild(opt);
  }
}

function setDayTitle(){
  const d = new Date(state.dateISO+"T00:00:00");
  const label = d.toLocaleDateString("pt-BR",{weekday:"short", day:"2-digit", month:"2-digit", year:"numeric"});
  $("dayTitle").textContent = `Dia — ${label}`;
  $("quickDate").value = state.dateISO;
}

async function loadCalendar(){
  renderCalendar(
    { year: state.year, month: state.month, selectedISO: state.dateISO },
    async (iso)=>{
      state.dateISO = iso;
      state.month = new Date(iso+"T00:00:00").getMonth();
      state.year  = new Date(iso+"T00:00:00").getFullYear();
      setDayTitle();
      await refreshAgenda();
      loadCalendar();
    }
  );
}

$("calPrev").addEventListener("click", async ()=>{
  state.month -= 1;
  if(state.month < 0){ state.month = 11; state.year -= 1; }
  loadCalendar();
});
$("calNext").addEventListener("click", async ()=>{
  state.month += 1;
  if(state.month > 11){ state.month = 0; state.year += 1; }
  loadCalendar();
});
$("quickDate").addEventListener("change", async ()=>{
  const iso = $("quickDate").value;
  if(!iso) return;
  state.dateISO = iso;
  state.month = new Date(iso+"T00:00:00").getMonth();
  state.year = new Date(iso+"T00:00:00").getFullYear();
  setDayTitle();
  await refreshAgenda();
  loadCalendar();
});

$("btnPrevDay").addEventListener("click", async ()=>{
  state.dateISO = addDaysISO(state.dateISO, -1);
  setDayTitle();
  await refreshAgenda();
  loadCalendar();
});
$("btnNextDay").addEventListener("click", async ()=>{
  state.dateISO = addDaysISO(state.dateISO, +1);
  setDayTitle();
  await refreshAgenda();
  loadCalendar();
});
$("btnToday").addEventListener("click", async ()=>{
  state.dateISO = isoToday();
  state.month = new Date().getMonth();
  state.year = new Date().getFullYear();
  setDayTitle();
  await refreshAgenda();
  loadCalendar();
});

async function setSyncEnabled(){
  const url = (await DB.getMeta("syncUrl","") || "").trim();
  state.syncEnabled = !!url;
  if(state.syncEnabled){
    // polling leve para “quase tempo real”
    if(state.pollTimer) clearInterval(state.pollTimer);
    state.pollTimer = setInterval(()=>refreshAgenda().catch(()=>{}), 4000);
  } else {
    if(state.pollTimer) clearInterval(state.pollTimer);
    state.pollTimer = null;
  }
}

async function agendaGet(dateISO){
  if(state.syncEnabled){
    const remote = await SYNC.getAgenda(dateISO);
    return remote?.items || [];
  }
  return await DB.getAllByIndex("appointments","date", dateISO);
}

async function agendaAdd(dateISO, item){
  if(state.syncEnabled){
    await SYNC.addAgenda(dateISO, item);
    return true;
  }
  await DB.put("appointments", item);
  return true;
}
async function agendaUpdate(dateISO, id, patch){
  if(state.syncEnabled){
    await SYNC.updateAgenda(dateISO, id, patch);
    return true;
  }
  const old = await DB.get("appointments", id);
  if(!old) return false;
  await DB.put("appointments", { ...old, ...patch });
  return true;
}
async function agendaRemove(dateISO, id){
  if(state.syncEnabled){
    await SYNC.removeAgenda(dateISO, id);
    return true;
  }
  await DB.del("appointments", id);
  return true;
}

async function refreshAgenda(){
  const list = await agendaGet(state.dateISO);
  list.sort((a,b)=> (a.time||"").localeCompare(b.time||""));

  const ul = $("agendaList");
  ul.innerHTML = "";
  for(const it of list){
    const li = document.createElement("li");
    if(it.id === state.selectedApptId) li.classList.add("active");

    const meta = document.createElement("div");
    meta.className = "meta";
    const s1 = document.createElement("strong");
    s1.textContent = `${it.time || "--:--"} — ${it.patientName || "(sem nome)"}`;
    const s2 = document.createElement("span");
    s2.textContent = `${it.patientPhone || ""} • ${it.status || "agendado"}`.trim();
    meta.appendChild(s1);
    meta.appendChild(s2);

    const actions = document.createElement("div");
    actions.className = "actions";

    const btnOpen = document.createElement("button");
    btnOpen.className = "ghost";
    btnOpen.textContent = "Abrir";
    btnOpen.addEventListener("click", async ()=>{
      state.selectedApptId = it.id;
      state.selectedPatientId = it.patientId || null;
      await loadPatientFromAppointment(it);
      await refreshAgenda();
      await refreshHistory();
    });

    const btnRemove = document.createElement("button");
    btnRemove.className = "ghost";
    btnRemove.textContent = "Remover";
    btnRemove.addEventListener("click", async ()=>{
      await agendaRemove(state.dateISO, it.id);
      toast("Removido");
      if(state.selectedApptId === it.id){
        state.selectedApptId = null;
        state.selectedPatientId = null;
      }
      await refreshAgenda();
      await refreshHistory();
    });

    actions.appendChild(btnOpen);
    actions.appendChild(btnRemove);

    li.appendChild(meta);
    li.appendChild(actions);
    ul.appendChild(li);
  }
}

async function findOrCreatePatientFromInputs(){
  const name = ($("patientName").value || "").trim();
  const phone = ($("patientPhone").value || "").trim();
  const dob = $("patientDob").value || "";

  if(state.selectedPatientId){
    const p = await DB.get("patients", state.selectedPatientId);
    if(p){
      const updated = { ...p, name: name || p.name, phone: phone || p.phone, dob: dob || p.dob };
      await DB.put("patients", updated);
      return updated;
    }
  }

  // tenta achar por telefone ou nome
  const all = await DB.getAll("patients");
  const existing = all.find(p => (phone && p.phone===phone) || (name && p.name===name));
  if(existing){
    state.selectedPatientId = existing.id;
    const updated = { ...existing, name: name || existing.name, phone: phone || existing.phone, dob: dob || existing.dob };
    await DB.put("patients", updated);
    return updated;
  }

  const id = DB.uid("pat");
  const p = { id, name, phone, dob, createdAt: Date.now() };
  await DB.put("patients", p);
  state.selectedPatientId = id;
  return p;
}

async function loadPatientFromAppointment(appt){
  $("patientName").value = appt.patientName || "";
  $("patientPhone").value = appt.patientPhone || "";
  $("patientDob").value = appt.patientDob || "";

  state.selectedPatientId = appt.patientId || null;

  // tenta carregar do banco se tiver id
  if(appt.patientId){
    const p = await DB.get("patients", appt.patientId);
    if(p){
      $("patientName").value = p.name || $("patientName").value;
      $("patientPhone").value = p.phone || $("patientPhone").value;
      $("patientDob").value = p.dob || $("patientDob").value;
    }
  }
}

$("btnAddAppt").addEventListener("click", async ()=>{
  setSaveState("...");
  try{
    const time = $("slotTime").value;
    const q = ($("searchPatient").value || "").trim().toLowerCase();

    // tenta buscar paciente existente
    let patient = null;
    if(q){
      const all = await DB.getAll("patients");
      patient = all.find(p =>
        (p.name||"").toLowerCase().includes(q) || (p.phone||"").toLowerCase().includes(q)
      ) || null;
    }

    if(!patient){
      // cria/atualiza pelo prontuário atual
      patient = await findOrCreatePatientFromInputs();
    }

    const item = {
      id: DB.uid("apt"),
      date: state.dateISO,
      time,
      patientId: patient.id,
      patientName: patient.name || "(sem nome)",
      patientPhone: patient.phone || "",
      patientDob: patient.dob || "",
      status: "agendado",
      createdAt: Date.now()
    };

    await agendaAdd(state.dateISO, item);

    $("searchPatient").value = "";
    toast("Agendado");
    setSaveState("ok");

    await refreshAgenda();
    await refreshHistory();
  }catch(e){
    console.error(e);
    setSaveState("erro");
    toast("Falha ao adicionar");
  }
});

$("btnNewPatient").addEventListener("click", async ()=>{
  state.selectedApptId = null;
  state.selectedPatientId = null;
  $("patientName").value = "";
  $("patientPhone").value = "";
  $("patientDob").value = "";
  $("clinicalNotes").value = "";
  toast("Novo paciente");
  await refreshHistory();
});

$("btnSaveEncounter").addEventListener("click", async ()=>{
  setSaveState("...");
  try{
    const patient = await findOrCreatePatientFromInputs();

    const notes = ($("clinicalNotes").value || "").trim();
    const encounter = {
      id: DB.uid("enc"),
      patientId: patient.id,
      dateISO: state.dateISO,
      notes,
      summary: notes.split("\n")[0]?.slice(0,80) || "atendimento",
      createdAt: Date.now()
    };
    await DB.put("encounters", encounter);

    // mantém appointment vinculado se houver seleção
    if(state.selectedApptId){
      await agendaUpdate(state.dateISO, state.selectedApptId, {
        patientId: patient.id,
        patientName: patient.name || "(sem nome)",
        patientPhone: patient.phone || "",
        patientDob: patient.dob || "",
        status: "agendado"
      });
    }

    setSaveState("salvo✓");
    toast("Atendimento salvo");
    await refreshHistory();
    await refreshAgenda();
    setTimeout(()=>setSaveState("ok"), 1100);
  }catch(e){
    console.error(e);
    setSaveState("erro");
    toast("Falha ao salvar");
  }
});

$("btnClearEncounter").addEventListener("click", ()=>{
  $("clinicalNotes").value = "";
  toast("Limpo");
});

async function refreshHistory(){
  const box = $("historyBox");
  box.innerHTML = "";

  if(!state.selectedPatientId){
    box.innerHTML = `<small class="muted">Selecione um paciente na agenda.</small>`;
    return;
  }

  const all = await DB.getAllByIndex("encounters", "patientId", state.selectedPatientId);
  all.sort((a,b)=> (b.createdAt||0)-(a.createdAt||0));

  if(!all.length){
    box.innerHTML = `<small class="muted">Sem histórico registrado.</small>`;
    return;
  }

  const ul = document.createElement("ul");
  ul.className = "history-list";

  for(const e of all){
    const li = document.createElement("li");
    li.className = "history-item";

    const left = document.createElement("div");
    left.className = "left";
    const dt = document.createElement("strong");
    dt.textContent = new Date(e.dateISO+"T00:00:00").toLocaleDateString("pt-BR");
    const sm = document.createElement("span");
    sm.textContent = e.summary || "";
    left.appendChild(dt); left.appendChild(sm);

    const right = document.createElement("div");
    right.className = "right";
    const b = document.createElement("button");
    b.className = "ghost";
    b.textContent = "Carregar";
    b.addEventListener("click", ()=>{
      $("clinicalNotes").value = e.notes || "";
      toast("Histórico carregado");
    });
    right.appendChild(b);

    li.appendChild(left);
    li.appendChild(right);
    ul.appendChild(li);
  }

  box.appendChild(ul);
}

$("btnRefreshHistory").addEventListener("click", refreshHistory);

function renderRxTabs(){
  const tabs = $("rxTabs");
  tabs.innerHTML = "";
  for(const c of RX_CATEGORIES){
    const b = document.createElement("button");
    b.className = "chip" + (c.id===state.rxCat ? " active": "");
    b.textContent = c.label;
    b.addEventListener("click", ()=>{
      state.rxCat = c.id;
      renderRxTabs();
      renderRxChips();
    });
    tabs.appendChild(b);
  }
}
function renderRxChips(){
  const chips = $("rxChips");
  chips.innerHTML = "";
  for(const p of (RX_PRESETS[state.rxCat] || [])){
    const b = document.createElement("button");
    b.className = "chip";
    b.textContent = p.label;
    b.addEventListener("click", ()=>{
      const cur = ($("rxText").value || "").trim();
      const add = p.text.trim();
      $("rxText").value = cur ? (cur + "\n\n" + add) : add;
    });
    chips.appendChild(b);
  }
}

$("btnRxClear").addEventListener("click", ()=>{
  $("rxText").value = "";
  toast("Receita limpa");
});

$("btnPrintRx").addEventListener("click", async ()=>{
  const pro = await getPro();
  const patient = { name: $("patientName").value || "" };
  await printPrescription({ pro, patient, rxText: $("rxText").value || "" });
});

$("btnPrintFicha").addEventListener("click", async ()=>{
  const pro = await getPro();
  const patientId = state.selectedPatientId;
  if(!patientId) return toast("Selecione um paciente");
  const patient = await DB.get("patients", patientId);
  const encounters = await DB.getAllByIndex("encounters","patientId",patientId);
  const notes = $("clinicalNotes").value || "";
  await printFichaClinica({ pro, patient, notes, encounters });
});

$("btnDocAtestado").addEventListener("click", async ()=>{
  const pro = await getPro();
  const patient = { name: $("patientName").value || "" };
  await printGeneric({ pro, patient, title:"Atestado", content:"Atesto para os devidos fins que o(a) paciente acima esteve em atendimento nesta data.\n\nCID (se aplicável):\nTempo de afastamento:\nObservações:" });
});

$("btnDocRecibo").addEventListener("click", async ()=>{
  const pro = await getPro();
  const patient = { name: $("patientName").value || "" };
  await printGeneric({ pro, patient, title:"Recibo", content:"Recebi do(a) paciente acima a quantia de R$ ______ referente a __________________________.\n\nForma de pagamento:\n\nObservações:" });
});

$("btnDocLaudo").addEventListener("click", async ()=>{
  const pro = await getPro();
  const patient = { name: $("patientName").value || "" };
  await printGeneric({ pro, patient, title:"Laudo", content:"Descrição do exame/procedimento:\n\nAchados:\n\nConclusão:\n\nConduta:" });
});

$("btnDocOrcamento").addEventListener("click", async ()=>{
  const pro = await getPro();
  const patient = { name: $("patientName").value || "" };
  await printGeneric({ pro, patient, title:"Orçamento", content:"Procedimentos:\n- \n- \n\nValor total: R$ ______\nCondições:\n\nValidade deste orçamento:" });
});

$("btnDocAgenda").addEventListener("click", async ()=>{
  const pro = await getPro();
  const items = await agendaGet(state.dateISO);
  await printAgendaDia({ pro, dateISO: state.dateISO, items });
});

$("btnBackup").addEventListener("click", async ()=>{
  const payload = await DB.exportAll();
  const blob = new Blob([JSON.stringify(payload,null,2)], { type:"application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `BTX-Pront-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  toast("Backup baixado");
});

$("btnImport").addEventListener("click", ()=> $("fileImport").click());
$("fileImport").addEventListener("change", async (ev)=>{
  const f = ev.target.files?.[0];
  if(!f) return;
  const text = await f.text();
  const payload = JSON.parse(text);
  await DB.importAll(payload);
  toast("Importado");
  await init();
});

$("btnSavePro").addEventListener("click", async ()=>{
  const pro = {
    name: ($("proName").value||"").trim(),
    reg: ($("proReg").value||"").trim(),
    phone: ($("proPhone").value||"").trim(),
    address: ($("proAddress").value||"").trim()
  };
  await DB.setMeta("professional", pro);
  updateBrandFromProName(pro.name);
  toast("Profissional salvo");
});

$("btnSaveSync").addEventListener("click", async ()=>{
  await DB.setMeta("syncUrl", ($("syncUrl").value||"").trim());
  await setSyncEnabled();
  toast(state.syncEnabled ? "Integração ativada" : "Modo local");
});

$("btnTestSync").addEventListener("click", async ()=>{
  $("syncMsg").textContent = "Testando...";
  const r = await SYNC.syncTest();
  $("syncMsg").textContent = r.msg;
  toast(r.ok ? "Servidor OK" : "Falha no servidor");
});

async function init(){
  showLogin(false);

  fillTimeSlots();
  setDayTitle();

  // carrega profissional
  const pro = await getPro();
  $("proName").value = pro.name || "";
  $("proReg").value = pro.reg || "";
  $("proPhone").value = pro.phone || "";
  $("proAddress").value = pro.address || "";
  updateBrandFromProName(pro.name || "");

  // carrega sync
  $("syncUrl").value = (await DB.getMeta("syncUrl","")) || "";
  await setSyncEnabled();

  renderRxTabs();
  renderRxChips();

  await loadCalendar();
  await refreshAgenda();
  await refreshHistory();

  // registra service worker
  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
  }
}

init().catch(console.error);
