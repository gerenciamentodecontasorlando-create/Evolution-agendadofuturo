import { DB } from "./db.js";

async function baseUrl(){
  const url = (await DB.getMeta("syncUrl","") || "").trim();
  return url.replace(/\/+$/,"");
}

async function withPinHeaders(){
  // PIN simples “antitrava” enviado como header (servidor valida)
  return { "Content-Type":"application/json", "X-BTX-PIN":"BTX007" };
}

export async function syncTest(){
  const b = await baseUrl();
  if(!b) return { ok:false, msg:"Servidor vazio (modo local)." };
  try{
    const r = await fetch(`${b}/api/ping`, { headers: await withPinHeaders() });
    const j = await r.json();
    return { ok: !!j.ok, msg: j.ok ? "Servidor OK" : "Servidor respondeu, mas sem OK" };
  }catch(e){
    return { ok:false, msg:"Falha ao conectar. Verifique IP/rede/porta." };
  }
}

export async function getAgenda(dateISO){
  const b = await baseUrl();
  if(!b) return null;
  const r = await fetch(`${b}/api/agenda/${encodeURIComponent(dateISO)}`, { headers: await withPinHeaders() });
  if(!r.ok) throw new Error("Erro agenda");
  return await r.json();
}

export async function addAgenda(dateISO, item){
  const b = await baseUrl();
  if(!b) return null;
  const r = await fetch(`${b}/api/agenda/${encodeURIComponent(dateISO)}`, {
    method:"POST",
    headers: await withPinHeaders(),
    body: JSON.stringify(item)
  });
  if(!r.ok) throw new Error("Erro add");
  return await r.json();
}

export async function updateAgenda(dateISO, id, patch){
  const b = await baseUrl();
  if(!b) return null;
  const r = await fetch(`${b}/api/agenda/${encodeURIComponent(dateISO)}/${encodeURIComponent(id)}`, {
    method:"PUT",
    headers: await withPinHeaders(),
    body: JSON.stringify(patch)
  });
  if(!r.ok) throw new Error("Erro update");
  return await r.json();
}

export async function removeAgenda(dateISO, id){
  const b = await baseUrl();
  if(!b) return null;
  const r = await fetch(`${b}/api/agenda/${encodeURIComponent(dateISO)}/${encodeURIComponent(id)}`, {
    method:"DELETE",
    headers: await withPinHeaders()
  });
  if(!r.ok) throw new Error("Erro delete");
  return await r.json();
}
