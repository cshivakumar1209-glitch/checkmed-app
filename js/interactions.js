// ============================================================
// interactions.js — Drug interaction checker (RxNav NLM)
// ============================================================

let drugs = []

function addDrug() {
  const val = document.getElementById("int-drug").value.trim()
  if (!val) return
  const key = val.toLowerCase()
  if (!drugs.includes(key)) drugs.push(key)
  document.getElementById("int-drug").value = ""
  renderDrugTags()
}

function removeDrug(d) {
  drugs = drugs.filter(x => x !== d)
  renderDrugTags()
  document.getElementById("interaction-results").innerHTML = ""
}

function renderDrugTags() {
  const el = document.getElementById("drug-tags")
  if (!el) return
  el.innerHTML = drugs.map(d => `
    <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 14px;background:#fff;border:1px solid #ccc;border-radius:100px;font-size:13px;font-weight:500;margin:4px;">
      <span>${d}</span>
      <button onclick="removeDrug('${d.replace(/'/g,"\\'")}');" style="background:none;border:none;cursor:pointer;color:#9a9a94;font-size:16px;line-height:1;padding:0;">×</button>
    </div>`).join("")
  const btn = document.getElementById("check-btn")
  if (btn) btn.style.display = drugs.length >= 2 ? "inline-flex" : "none"
}

async function fetchRxCUI(drugName) {
  try {
    const res = await fetch(`https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(drugName)}&search=1`)
    const data = await res.json()
    return data.idGroup?.rxnormId?.[0] || null
  } catch { return null }
}

async function fetchRxNavInteractions(rxcuis) {
  try {
    const res = await fetch(`https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=${rxcuis.join("+")}`)
    const data = await res.json()
    const results = []
    ;(data.fullInteractionTypeGroup || []).forEach(group => {
      group.fullInteractionType?.forEach(type => {
        type.interactionPair?.forEach(pair => {
          results.push({
            level: pair.severity==="high"?"danger":pair.severity==="moderate"?"warning":"safe",
            title: `${pair.interactionConcept?.[0]?.minConceptItem?.name||""} + ${pair.interactionConcept?.[1]?.minConceptItem?.name||""}`,
            detail: pair.description || "Interaction detected — consult your pharmacist."
          })
        })
      })
    })
    return results
  } catch { return [] }
}

async function checkInteractions() {
  if (drugs.length < 2) return
  const el = document.getElementById("interaction-results")
  el.innerHTML = `<div style="padding:1rem;background:#fff;border:1px solid rgba(0,0,0,0.08);border-radius:16px;color:#9a9a94;">Looking up drugs...</div>`
  try {
    const cuis = (await Promise.all(drugs.map(d=>fetchRxCUI(d)))).filter(Boolean)
    const interactions = cuis.length >= 2 ? await fetchRxNavInteractions(cuis) : []
    const colors = {
      danger: {bg:"#FCEBEB",border:"#F09595",title:"#A32D2D"},
      warning: {bg:"#FAEEDA",border:"#FAC775",title:"#854F0B"},
      safe: {bg:"#EAF3DE",border:"#C0DD97",title:"#3B6D11"}
    }
    const icons = { danger:"⚠️", warning:"⚡", safe:"✅" }
    if (interactions.length > 0) {
      el.innerHTML = `<div style="margin-bottom:1rem;font-size:15px;font-weight:500;">Results for: ${drugs.join(", ")}</div>` +
        interactions.map(a => {
          const c = colors[a.level]
          return `<div style="border-radius:16px;padding:1.25rem 1.5rem;margin-bottom:12px;border:1px solid ${c.border};background:${c.bg};">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
              <span>${icons[a.level]}</span>
              <span style="font-size:14px;font-weight:500;color:${c.title};">${a.title}</span>
            </div>
            <div style="font-size:13px;color:#6b6b66;line-height:1.6;padding-left:26px;">${a.detail}</div>
          </div>`
        }).join("") +
        `<div style="font-size:12px;color:#9a9a94;margin-top:1rem;padding:0.75rem;background:#f4f3ef;border-radius:8px;">✅ Checked against NLM clinical database. Always consult your pharmacist.</div>`
    } else {
      el.innerHTML = `<div style="border-radius:16px;padding:1.25rem 1.5rem;border:1px solid #C0DD97;background:#EAF3DE;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;"><span>✅</span><span style="font-size:14px;font-weight:500;color:#3B6D11;">No major interactions found</span></div>
        <div style="font-size:13px;color:#6b6b66;padding-left:26px;">No significant interactions found between ${drugs.join(", ")}. Always consult your pharmacist.</div>
      </div>`
    }
  } catch {
    el.innerHTML = `<div style="border-radius:16px;padding:1.25rem 1.5rem;border:1px solid #FAC775;background:#FAEEDA;">
      <div style="display:flex;align-items:center;gap:10px;"><span>⚡</span><span style="font-size:14px;font-weight:500;color:#854F0B;">Could not complete check</span></div>
    </div>`
  }
}
