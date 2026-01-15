export const DB = (() => {
  const DB_NAME = "btx_pront_db_v13";
  const DB_VER = 1;

  const STORES = {
    patients: { keyPath: "id" },
    appointments: { keyPath: "id", indexes: [{ name:"date", keyPath:"date" }] },
    encounters: { keyPath: "id", indexes: [{ name:"patientId", keyPath:"patientId" }] },
    meta: { keyPath: "key" }
  };

  function uid(prefix="id"){
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
  }

  function open(){
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VER);

      req.onupgradeneeded = () => {
        const db = req.result;
        for(const [name, cfg] of Object.entries(STORES)){
          if(!db.objectStoreNames.contains(name)){
            const st = db.createObjectStore(name, { keyPath: cfg.keyPath });
            (cfg.indexes||[]).forEach(ix => st.createIndex(ix.name, ix.keyPath, { unique:false }));
          } else {
            const st = req.transaction.objectStore(name);
            (cfg.indexes||[]).forEach(ix => {
              if(!st.indexNames.contains(ix.name)) st.createIndex(ix.name, ix.keyPath, { unique:false });
            });
          }
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function tx(store, mode="readonly"){
    const db = await open();
    const t = db.transaction(store, mode);
    return { db, t, st: t.objectStore(store) };
  }

  async function get(store, id){
    const { db, st } = await tx(store);
    return new Promise((resolve, reject) => {
      const r = st.get(id);
      r.onsuccess = () => { db.close(); resolve(r.result || null); };
      r.onerror = () => { db.close(); reject(r.error); };
    });
  }

  async function put(store, obj){
    const { db, st } = await tx(store, "readwrite");
    return new Promise((resolve, reject) => {
      const r = st.put(obj);
      r.onsuccess = () => { db.close(); resolve(true); };
      r.onerror = () => { db.close(); reject(r.error); };
    });
  }

  async function del(store, id){
    const { db, st } = await tx(store, "readwrite");
    return new Promise((resolve, reject) => {
      const r = st.delete(id);
      r.onsuccess = () => { db.close(); resolve(true); };
      r.onerror = () => { db.close(); reject(r.error); };
    });
  }

  async function getAll(store){
    const { db, st } = await tx(store);
    return new Promise((resolve, reject) => {
      const r = st.getAll();
      r.onsuccess = () => { db.close(); resolve(r.result || []); };
      r.onerror = () => { db.close(); reject(r.error); };
    });
  }

  async function getAllByIndex(store, indexName, value){
    const { db, st } = await tx(store);
    return new Promise((resolve, reject) => {
      const ix = st.index(indexName);
      const r = ix.getAll(IDBKeyRange.only(value));
      r.onsuccess = () => { db.close(); resolve(r.result || []); };
      r.onerror = () => { db.close(); reject(r.error); };
    });
  }

  async function setMeta(key, value){ return put("meta", { key, value }); }
  async function getMeta(key, fallback=null){
    const r = await get("meta", key);
    return r ? r.value : fallback;
  }

  async function exportAll(){
    const patients = await getAll("patients");
    const appointments = await getAll("appointments");
    const encounters = await getAll("encounters");
    const meta = await getAll("meta");
    return { version: DB_NAME, exportedAt: new Date().toISOString(), patients, appointments, encounters, meta };
  }

  async function clearStore(store){
    const { db, st } = await tx(store, "readwrite");
    return new Promise((resolve, reject) => {
      const r = st.clear();
      r.onsuccess = () => { db.close(); resolve(true); };
      r.onerror = () => { db.close(); reject(r.error); };
    });
  }

  async function importAll(payload){
    await clearStore("patients");
    await clearStore("appointments");
    await clearStore("encounters");
    await clearStore("meta");

    for(const p of (payload.patients||[])) await put("patients", p);
    for(const a of (payload.appointments||[])) await put("appointments", a);
    for(const e of (payload.encounters||[])) await put("encounters", e);
    for(const m of (payload.meta||[])) await put("meta", m);
    return true;
  }

  return { uid, get, put, del, getAll, getAllByIndex, setMeta, getMeta, exportAll, importAll };
})();
