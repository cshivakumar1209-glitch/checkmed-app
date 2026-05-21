// ============================================================
// search.js — Drug search, FDA lookup, price table
// ============================================================

const DRUG_DATA = {
  metformin: { rows: [
    { provider: "GoodRx (CVS)", type: "pbm", price: "$4.00", copay: "$4.00", savings: "95%", notes: "Lowest available — no insurance needed", best: true },
    { provider: "Express Scripts", type: "pbm", price: "$8.50", copay: "$8.50", savings: "90%", notes: "Generic Tier 1" },
    { provider: "OptumRx", type: "pbm", price: "$9.00", copay: "$9.00", savings: "89%", notes: "Mail order available" },
    { provider: "UnitedHealthcare", type: "insurance", price: "$18.00", copay: "$5.00", savings: "78%", notes: "Tier 1 copay" },
    { provider: "Blue Cross Blue Shield", type: "insurance", price: "$22.00", copay: "$10.00", savings: "73%", notes: "Preferred generic" },
    { provider: "Aetna", type: "insurance", price: "$25.00", copay: "$0.00", savings: "70%", notes: "No cost Tier 1 plan" },
  ]},
  atorvastatin: { rows: [
    { provider: "GoodRx (Walgreens)", type: "pbm", price: "$10.00", copay: "$10.00", savings: "87%", notes: "Best GoodRx price", best: true },
    { provider: "CVS Caremark", type: "pbm", price: "$14.00", copay: "$14.00", savings: "82%", notes: "Tier 1 generic" },
    { provider: "UnitedHealthcare", type: "insurance", price: "$20.00", copay: "$5.00", savings: "75%", notes: "Preferred generic" },
    { provider: "Humana Part D", type: "insurance", price: "$28.00", copay: "$7.00", savings: "65%", notes: "Tier 1" },
    { provider: "Pfizer PAP", type: "manufacturer", price: "$0.00", copay: "$0.00", savings: "100%", notes: "Income-based, apply at pfizer.com" },
  ]},
  ozempic: { rows: [
    { provider: "Novo Nordisk PAP", type: "manufacturer", price: "$0.00", copay: "$0.00", savings: "100%", notes: "Income < $100K household eligible", best: true },
    { provider: "Novo Nordisk savings card", type: "manufacturer", price: "$99.00", copay: "$99.00", savings: "89%", notes: "Insured patients — apply online" },
    { provider: "Express Scripts", type: "pbm", price: "$892.00", copay: "$25.00", savings: "Varies", notes: "Formulary Tier 3 — PA required" },
    { provider: "CVS Caremark", type: "pbm", price: "$950.00", copay: "$30.00", savings: "Varies", notes: "Prior authorization required" },
    { provider: "Medicare Part D", type: "insurance", price: "$892.00", copay: "$47.00", savings: "95%", notes: "Covered with diabetes diagnosis" },
  ]},
  lisinopril: { rows: [
    { provider: "Walmart Pharmacy", type: "pbm", price: "$4.00", copay: "$4.00", savings: "93%", notes: "$4 generic — no coupon needed", best: true },
    { provider: "GoodRx (Walmart)", type: "pbm", price: "$4.00", copay: "$4.00", savings: "93%", notes: "Same as Walmart list" },
    { provider: "OptumRx", type: "pbm", price: "$7.50", copay: "$7.50", savings: "87%", notes: "Mail order available" },
    { provider: "UnitedHealthcare", type: "insurance", price: "$15.00", copay: "$0.00", savings: "75%", notes: "Tier 1 — no cost" },
    { provider: "Cigna", type: "insurance", price: "$18.00", copay: "$5.00", savings: "70%", notes: "Preferred generic" },
  ]},
  humira: { rows: [
    { provider: "AbbVie myAbbVie Assist", type: "manufacturer", price: "$0.00", copay: "$0.00", savings: "100%", notes: "Uninsured patients — apply at abbvie.com", best: true },
    { provider: "AbbVie savings card", type: "manufacturer", price: "$6,922.00", copay: "$5.00", savings: "99%", notes: "Insured — $5/month copay cap" },
    { provider: "Hadlima (biosimilar)", type: "manufacturer", price: "$1,890.00", copay: "Varies", savings: "73%", notes: "Samsung Bioepis — same drug" },
    { provider: "Express Scripts", type: "pbm", price: "$6,922.00", copay: "$180.00", savings: "Varies", notes: "Specialty Tier 4 — PA required" },
    { provider: "CVS Specialty", type: "pbm", price: "$6,922.00", copay: "$150.00", savings: "Varies", notes: "Prior authorization needed" },
  ]}
}

let currentRows = [], currentFilter = "all", lastDrugInfo = null

function quickSearch(name) {
  document.getElementById("drug-search").value = name
  searchDrug()
}

async function searchDrug() {
  const q = document.getElementById("drug-search").value.trim()
  if (!q) return
  const ra = document.getElementById("results-area")
  const nr = document.getElementById("no-results-state")
  ra.style.display = "block"
  nr.style.display = "none"
  document.getElementById("results-title").textContent = `Searching FDA database for "${q}"...`
  document.getElementById("price-tbody").innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:#9a9a94;">Loading FDA data...</td></tr>`
  document.getElementById("ai-content").innerHTML = `<div style="display:flex;align-items:center;gap:10px;color:#9a9a94;"><div style="width:18px;height:18px;border:2px solid #eee;border-top-color:#1D9E75;border-radius:50%;animation:spin 0.7s linear infinite;"></div> Loading...</div>`

  const fdaLabel = await fetchFDADrugInfo(q)
  if (!fdaLabel) {
    const suggestions = await fetchDrugSuggestions(q)
    ra.style.display = "none"
    nr.style.display = "block"
    const h2 = nr.querySelector(".empty-hero h2")
    const p = nr.querySelector(".empty-hero p")
    if (h2) h2.textContent = `No results found for "${q}"`
    if (p) p.innerHTML = suggestions.length
      ? `Did you mean: ${suggestions.slice(0,5).map(s=>`<span style="padding:4px 12px;border:1px solid #ccc;border-radius:100px;font-size:13px;cursor:pointer;margin:2px;" onclick="quickSearch('${s}')">${s}</span>`).join(" ")}`
      : `No close match found. Try a brand name or generic name.`
    return
  }

  const info = parseFDALabel(fdaLabel, q)
  lastDrugInfo = info
  const displayName = info.brandName ? `${info.brandName} (${info.genericName})` : info.genericName
  document.getElementById("results-title").textContent = `FDA data for: ${displayName}`
  currentFilter = "all"
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.toggle("active", b.textContent.trim() === "All sources"))

  const qLower = q.toLowerCase()
  const dataKey = Object.keys(DRUG_DATA).find(k =>
    qLower.includes(k) || k.includes(qLower.split(" ")[0]) ||
    info.genericName.toLowerCase().includes(k) || (info.brandName||"").toLowerCase().includes(k)
  )
  currentRows = dataKey ? DRUG_DATA[dataKey].rows : []

  if (currentRows.length) {
    const pbm = [...currentRows].filter(r=>r.type==="pbm").sort((a,b)=>parseFloat(a.price.replace(/[^0-9.]/g,""))-parseFloat(b.price.replace(/[^0-9.]/g,"")))[0]
    const mfr = [...currentRows].filter(r=>r.type==="manufacturer").sort((a,b)=>parseFloat(a.price.replace(/[^0-9.]/g,""))-parseFloat(b.price.replace(/[^0-9.]/g,"")))[0]
    const ins = [...currentRows].filter(r=>r.type==="insurance").sort((a,b)=>parseFloat(a.copay.replace(/[^0-9.]/g,""))-parseFloat(b.copay.replace(/[^0-9.]/g,"")))[0]
    const cp = document.getElementById("cash-price")
    const dp = document.getElementById("discount-price")
    const mp = document.getElementById("mfr-price")
    if (cp) cp.textContent = ins ? ins.price : "—"
    if (dp) dp.textContent = pbm ? pbm.price : "—"
    if (mp) mp.textContent = mfr ? mfr.price : "—"
  }

  renderTable(currentRows)
  showAI(buildAISuggestion(info))
  showDrugInfoPanel(info)
}

async function fetchFDADrugInfo(drugName) {
  try {
    const res = await fetch(`https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(drugName)}"&limit=1&api_key=${CONFIG.OPENFDA_API_KEY}`)
    if (!res.ok) throw new Error()
    const data = await res.json()
    return data.results?.[0] || null
  } catch {
    try {
      const res2 = await fetch(`https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(drugName)}"&limit=1&api_key=${CONFIG.OPENFDA_API_KEY}`)
      if (!res2.ok) throw new Error()
      const data2 = await res2.json()
      return data2.results?.[0] || null
    } catch { return null }
  }
}

async function fetchDrugSuggestions(query) {
  try {
    const res = await fetch(`https://rxnav.nlm.nih.gov/REST/spellingsuggestions.json?name=${encodeURIComponent(query)}`)
    const data = await res.json()
    return data.suggestionGroup?.suggestionList?.suggestion || []
  } catch { return [] }
}

function parseFDALabel(label, searchTerm) {
  const o = label.openfda || {}
  return {
    brandName: (o.brand_name || [])[0] || "",
    genericName: (o.generic_name || [])[0] || searchTerm,
    manufacturer: (o.manufacturer_name || [])[0] || "Unknown",
    route: (o.route || [])[0] || "",
    form: (o.dosage_form || [])[0] || "",
    warnings: (label.warnings?.[0] || label.warnings_and_cautions?.[0] || "").substring(0, 300),
    indications: (label.indications_and_usage?.[0] || "").substring(0, 400),
    contraindications: (label.contraindications?.[0] || "").substring(0, 300)
  }
}

function buildAISuggestion(info) {
  let t = ""
  if (info.brandName && info.genericName && info.brandName.toLowerCase() !== info.genericName.toLowerCase())
    t += `**${info.brandName} vs Generic (${info.genericName}):** A generic version exists — often 50–90% cheaper. Ask your pharmacist.\n\n`
  if (info.indications) t += `**What it's used for:** ${info.indications.replace(/\n/g," ").trim().substring(0,250)}...\n\n`
  if (info.warnings) t += `**Important warnings:** ${info.warnings.replace(/\n/g," ").trim().substring(0,250)}...\n\n`
  t += `**Find the lowest price:** Compare GoodRx coupons at your pharmacy — the coupon is often cheaper than your copay.\n\n`
  t += `**Source:** Live FDA OpenFDA data · Always verify with your pharmacist.`
  return t
}

function showDrugInfoPanel(info) {
  const existing = document.getElementById("fda-info-panel")
  if (existing) existing.remove()
  const panel = document.createElement("div")
  panel.id = "fda-info-panel"
  panel.style.cssText = "background:#fff;border:1px solid rgba(0,0,0,0.08);border-radius:16px;overflow:hidden;margin-top:1rem;box-shadow:0 2px 12px rgba(0,0,0,0.07);"
  panel.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;padding:14px 20px;border-bottom:1px solid rgba(0,0,0,0.08);background:#f4f3ef;">
      <div style="width:24px;height:24px;background:#1D9E75;border-radius:6px;display:flex;align-items:center;justify-content:center;">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="#fff"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
      </div>
      <span style="font-size:13px;font-weight:500;">Real FDA Drug Information</span>
      <span style="font-size:12px;color:#9a9a94;margin-left:auto;">Source: OpenFDA · Live data</span>
    </div>
    <div style="padding:1.25rem 1.5rem;font-size:14px;color:#6b6b66;line-height:1.7;">
      <p><strong style="color:#1a1a18;">Brand name:</strong> ${info.brandName || "Generic only"}</p>
      <p><strong style="color:#1a1a18;">Generic name:</strong> ${info.genericName}</p>
      <p><strong style="color:#1a1a18;">Manufacturer:</strong> ${info.manufacturer}</p>
      <p><strong style="color:#1a1a18;">Route:</strong> ${info.route || "—"} · <strong style="color:#1a1a18;">Form:</strong> ${info.form || "—"}</p>
      ${info.indications ? `<p style="margin-top:8px;"><strong style="color:#1a1a18;">Used for:</strong> ${info.indications.replace(/\n/g," ").substring(0,200)}...</p>` : ""}
      ${info.warnings ? `<div style="margin-top:1rem;padding:0.75rem;background:#FAEEDA;border-radius:8px;border:1px solid #FAC775;font-size:13px;"><strong>⚠️ Warning:</strong> ${info.warnings.replace(/\n/g," ").substring(0,250)}...</div>` : ""}
      ${info.contraindications ? `<div style="margin-top:0.75rem;padding:0.75rem;background:#FCEBEB;border-radius:8px;border:1px solid #F09595;font-size:13px;"><strong>🚫 Do not use if:</strong> ${info.contraindications.replace(/\n/g," ").substring(0,250)}...</div>` : ""}
      <p style="margin-top:0.75rem;font-size:11px;color:#9a9a94;">Always consult your doctor or pharmacist.</p>
    </div>`
  document.getElementById("results-area").appendChild(panel)
}

function renderTable(rows) {
  const tbody = document.getElementById("price-tbody")
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:#9a9a94;">Price data not yet available. Real-time prices coming with GoodRx API integration.</td></tr>`
    return
  }
  tbody.innerHTML = rows.map(r => `
    <tr style="${r.best ? 'border-left:3px solid #1D9E75;' : ''}">
      <td style="font-weight:500;padding:13px 16px;border-bottom:1px solid rgba(0,0,0,0.08);">${r.provider}</td>
      <td style="padding:13px 16px;border-bottom:1px solid rgba(0,0,0,0.08);">
        <span style="padding:3px 10px;border-radius:100px;font-size:11px;font-weight:500;background:${r.type==='pbm'?'#EEEDFE':r.type==='insurance'?'#E6F1FB':'#E1F5EE'};color:${r.type==='pbm'?'#534AB7':r.type==='insurance'?'#185FA5':'#0F6E56'};">
          ${r.type==='pbm'?'PBM':r.type==='insurance'?'Insurance':'Manufacturer'}
        </span>
      </td>
      <td style="padding:13px 16px;border-bottom:1px solid rgba(0,0,0,0.08);${r.best?'color:#0F6E56;font-weight:500;':''}">${r.price}</td>
      <td style="padding:13px 16px;border-bottom:1px solid rgba(0,0,0,0.08);">${r.copay}</td>
      <td style="padding:13px 16px;border-bottom:1px solid rgba(0,0,0,0.08);color:#0F6E56;font-size:12px;font-weight:500;">${r.savings}</td>
      <td style="padding:13px 16px;border-bottom:1px solid rgba(0,0,0,0.08);font-size:12px;color:#9a9a94;">${r.notes}</td>
    </tr>`).join("")
}

function filterResults(type, btn) {
  currentFilter = type
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"))
  btn.classList.add("active")
  renderTable(type === "all" ? currentRows : currentRows.filter(r => r.type === type))
}

function showAI(text) {
  const el = document.getElementById("ai-content")
  if (!el) return
  el.innerHTML = text.split("\n").map(line => {
    if (!line.trim()) return ""
    return "<p>" + line.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/^•\s/,"&bull;&nbsp;") + "</p>"
  }).filter(Boolean).join("")
}
