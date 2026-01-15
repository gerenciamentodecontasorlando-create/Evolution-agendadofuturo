function esc(s=""){
  return String(s).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

function docShell({title, pro, patient, bodyHTML, footerLeftHTML, footerRightHTML}){
  const proName = esc(pro?.name || "");
  const proReg  = esc(pro?.reg || "");
  const proPhone = esc(pro?.phone || "");
  const proAddr = esc(pro?.address || "");
  const pName = esc(patient?.name || "");

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  body{ font-family: Arial, sans-serif; color:#111; }
  .frame{
    border: 1.2px solid rgba(20,40,80,.55);
    border-radius: 14px;
    padding: 14mm 12mm;
    min-height: 260mm;
    position: relative;
  }
  .mark{
    position:absolute; top:10mm; right:12mm;
    font-size:10px; opacity:.55;
  }
  .header{ text-align:center; margin-top:2mm; }
  .header .name{ font-weight:800; letter-spacing:.2px; font-size:14px; }
  .header .sub{ font-size:11px; opacity:.8; margin-top:2px; }
  .divider{ height:1px; background: rgba(20,40,80,.25); margin:10mm 0 8mm; }
  .title{ text-align:center; font-weight:800; margin: 4mm 0 8mm; }
  .row{ display:flex; justify-content:space-between; gap:10mm; font-size:12px; }
  .row .label{ font-weight:700; }
  .content{ font-size:12px; line-height:1.45; white-space:pre-wrap; }
  .footer{
    position:absolute; left:12mm; right:12mm; bottom:10mm;
    font-size:11px;
  }
  .footer .signrow{ display:flex; gap:14mm; margin-bottom:6mm; }
  .line{ border-top:1px solid rgba(20,40,80,.35); padding-top:2mm; }
  .addr{
    text-align:center;
    font-size:10.5px;
    opacity:.85;
    margin-top:4mm;
  }
  .meta{ font-size:10.5px; opacity:.85; text-align:center; margin-top:2mm; }
  @media print{
    body{ margin:0; }
    .no-print{ display:none !important; }
  }
</style>
</head>
<body>
  <div class="frame">
    <div class="mark">BTX-Pront ⬢</div>

    <div class="header">
      <div class="name">${proName}</div>
      <div class="sub">${proReg}${proPhone ? " • "+proPhone : ""}</div>
    </div>

    <div class="divider"></div>

    <div class="row" style="margin-bottom:6mm;">
      <div><span class="label">Paciente:</span> ${pName}</div>
      <div><span class="label">Data:</span> ${new Date().toLocaleDateString("pt-BR")}</div>
    </div>

    <div class="title">${esc(title)}</div>

    ${bodyHTML}

    <div class="footer">
      <div class="signrow">
        <div style="flex:1">
          <div class="line"><strong>Assinatura:</strong></div>
        </div>
        <div style="width:70mm">
          <div class="line"><strong>Data:</strong> ____/____/______</div>
        </div>
      </div>

      <div class="addr">${proAddr}</div>
      <div class="meta">BTX-Pront • Documento gerado para impressão</div>
    </div>
  </div>

  <script>
    window.focus();
    setTimeout(()=>window.print(), 250);
  </script>
</body>
</html>`;
}

function openDoc(html){
  const w = window.open("", "_blank");
  if(!w) return alert("Pop-up bloqueado. Permita pop-ups para gerar PDFs.");
  w.document.open();
  w.document.write(html);
  w.document.close();
}

export async function printPrescription({pro, patient, rxText}){
  const bodyHTML = `<div class="content">${esc(rxText || "")}</div>`;
  openDoc(docShell({ title:"Receituário", pro, patient, bodyHTML }));
}

export async function printFichaClinica({pro, patient, notes, encounters=[]}){
  const hist = encounters.length
    ? encounters.map(e => `• ${new Date(e.dateISO).toLocaleDateString("pt-BR")} — ${e.summary || ""}`).join("\n")
    : "Sem histórico registrado.";

  const bodyHTML = `
    <div class="content"><strong>Evolução atual:</strong>\n${esc(notes || "")}\n\n<strong>Histórico:</strong>\n${esc(hist)}</div>
  `;
  openDoc(docShell({ title:"Ficha clínica", pro, patient, bodyHTML }));
}

export async function printGeneric({pro, patient, title, content}){
  const bodyHTML = `<div class="content">${esc(content || "")}</div>`;
  openDoc(docShell({ title, pro, patient, bodyHTML }));
}

export async function printAgendaDia({pro, dateISO, items=[]}){
  const bodyHTML = `
    <div class="content"><strong>Data:</strong> ${esc(dateISO)}\n\n${esc(
      items.map(i => `${i.time} — ${i.patientName} ${i.patientPhone ? "("+i.patientPhone+")" : ""} — ${i.status||"agendado"}`).join("\n")
    )}</div>
  `;
  openDoc(docShell({ title:"Agenda do dia", pro, patient:{name:""}, bodyHTML }));
}
