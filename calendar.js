export function renderCalendar({year, month, selectedISO}, onPick){
  const grid = document.getElementById("calGrid");
  const title = document.getElementById("calTitle");
  grid.innerHTML = "";

  const monthStart = new Date(year, month, 1);
  title.textContent = monthStart.toLocaleDateString("pt-BR",{month:"long",year:"numeric"});

  const dows = ["D","S","T","Q","Q","S","S"];
  for(const d of dows){
    const el = document.createElement("div");
    el.className = "cal-dow";
    el.textContent = d;
    grid.appendChild(el);
  }

  const start = new Date(monthStart);
  start.setDate(1 - start.getDay());

  const todayISO = new Date().toISOString().slice(0,10);

  for(let i=0;i<42;i++){
    const day = new Date(start);
    day.setDate(start.getDate()+i);
    const iso = day.toISOString().slice(0,10);

    const btn = document.createElement("div");
    btn.className = "cal-day";
    btn.textContent = day.getDate();

    if(day.getMonth() !== month) btn.classList.add("muted");
    if(iso === todayISO) btn.classList.add("today");
    if(iso === selectedISO) btn.classList.add("active");

    btn.addEventListener("click", () => onPick(iso));
    grid.appendChild(btn);
  }
}
