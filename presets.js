export const RX_CATEGORIES = [
  { id:"analgesicos", label:"Analgésicos" },
  { id:"antiinflamatorios", label:"Anti-Inflamatórios" },
  { id:"antibioticos", label:"Antibióticos" },
  { id:"antifungicos", label:"Antifúngicos" },
  { id:"anti_hipertensivos", label:"Anti-hipertensivos" },
  { id:"antidiabeticos", label:"Antidiabéticos" },
];

export const RX_PRESETS = {
  analgesicos: [
    { label:"Dipirona 1g (adulto)", text:"Dipirona 1 g comprimido — tomar 1 comp VO a cada 6/6h se dor ou febre por ___ dias." },
    { label:"Paracetamol 500mg (adulto)", text:"Paracetamol 500 mg comprimido — tomar 1 comp VO a cada 6/6h se dor/febre por ___ dias (máx. 3 g/dia)." },
    { label:"Paracetamol 750mg (adulto)", text:"Paracetamol 750 mg comprimido — tomar 1 comp VO a cada 8/8h se dor/febre por ___ dias (máx. 3 g/dia)." },
    { label:"Paracetamol (pediatria)", text:"Paracetamol suspensão — dose pediátrica conforme peso (mg/kg). Orientar intervalo e duração conforme avaliação." },
    { label:"Dipirona (pediatria)", text:"Dipirona gotas/suspensão — dose pediátrica conforme peso (mg/kg). Orientar intervalo e duração conforme avaliação." },
  ],
  antiinflamatorios: [
    { label:"Diclofenaco (adulto)", text:"Diclofenaco potássico 50 mg — tomar 1 comp VO a cada 8/8h após alimentação por ___ dias." },
    { label:"Naproxeno (adulto)", text:"Naproxeno 500 mg — tomar 1 comp VO a cada 12/12h após alimentação por ___ dias." },
    { label:"Ibuprofeno (adulto)", text:"Ibuprofeno 400 mg — tomar 1 comp VO a cada 8/8h após alimentação por ___ dias." },
    { label:"Ibuprofeno (pediatria - suspensão)", text:"Ibuprofeno suspensão — dose pediátrica conforme peso (mg/kg). Orientar intervalo e duração conforme avaliação." },
  ],
  antibioticos: [
    { label:"Amoxicilina (adulto)", text:"Amoxicilina 500 mg — tomar 1 cáps VO a cada 8/8h por ___ dias." },
    { label:"Amoxicilina (suspensão)", text:"Amoxicilina suspensão — dose pediátrica conforme peso. Orientar posologia e duração conforme avaliação." },
    { label:"Clavulin (amoxi+clav)", text:"Amoxicilina + Clavulanato (Clavulin) — posologia conforme apresentação. Orientar conforme avaliação clínica." },
    { label:"Cefalexina", text:"Cefalexina 500 mg — tomar 1 cáps VO a cada 6/6h por ___ dias." },
    { label:"Azitromicina", text:"Azitromicina 500 mg — tomar 1 comp VO 1x/dia por 3 dias (ou conforme avaliação)." },
    { label:"Ciprofloxacino", text:"Ciprofloxacino 500 mg — tomar 1 comp VO a cada 12/12h por ___ dias." },
    { label:"Metronidazol", text:"Metronidazol 400 mg — tomar 1 comp VO a cada 8/8h por ___ dias." },
  ],
  antifungicos: [
    { label:"Fluconazol (comprimido)", text:"Fluconazol 150 mg — tomar 1 cáps VO dose única (ou conforme avaliação)." },
    { label:"Nistatina (creme)", text:"Nistatina creme — aplicar na área afetada 2x/dia por ___ dias." },
    { label:"Cetoconazol (creme)", text:"Cetoconazol creme — aplicar na área afetada 1–2x/dia por ___ dias." },
    { label:"Cetoconazol (shampoo)", text:"Cetoconazol shampoo — aplicar no couro cabeludo 2–3x/semana, deixar agir 5 min e enxaguar por ___ semanas." },
    { label:"Sabonete antifúngico", text:"Sabonete antifúngico — usar conforme orientação, mantendo pele seca e higiene adequada." },
  ],
  anti_hipertensivos: [
    { label:"Losartana", text:"Losartana 50 mg — tomar 1 comp VO 1x/dia (ajustar conforme PA/condições)." },
    { label:"Anlodipino", text:"Anlodipino 5 mg — tomar 1 comp VO 1x/dia (ajustar conforme resposta)." },
    { label:"Hidroclorotiazida", text:"Hidroclorotiazida 25 mg — tomar 1 comp VO pela manhã 1x/dia (monitorar eletrólitos)." },
  ],
  antidiabeticos: [
    { label:"Metformina", text:"Metformina 500 mg — tomar 1 comp VO 2x/dia com refeições (ajustar conforme tolerância e glicemia)." },
    { label:"Gliclazida", text:"Gliclazida (MR ou comum) — posologia conforme apresentação. Ajustar conforme glicemia/hipoglicemia." },
    { label:"Sitagliptina", text:"Sitagliptina 100 mg — tomar 1 comp VO 1x/dia (ajustar conforme função renal e avaliação)." },
  ],
};
