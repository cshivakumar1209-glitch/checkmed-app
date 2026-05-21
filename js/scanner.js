// ============================================================
// scanner.js — Prescription scanner (Claude AI Vision)
// ============================================================

function openScannerModal() {
  document.getElementById("scanner-overlay").classList.add("open")
  document.getElementById("scan-modal-result").style.display = "none"
  document.getElementById("modal-scan-body").innerHTML = ""
  document.getElementById("modal-scan-status").textContent = "Reading prescription with AI..."
  document.getElementById("modal-spinner").style.display = "block"
  document.getElementById("scan-drop-zone").style.display = "block"
}

function closeScannerModal() {
  document.getElementById("scanner-overlay").classList.remove("open")
  document.getElementById("scan-file-inp").value = ""
  document.getElementById("scan-camera-inp").value = ""
}

function handleModalDrop(e) { handleModalFile(e.dataTransfer.files[0]) }

async function handleModalFile(file) {
  if (!file) return
  document.getElementById("scan-drop-zone").style.display = "none"
  document.getElementById("scan-modal-result").style.display = "block"
  document.getElementById("modal-spinner").style.display = "block"
  document.getElementById("modal-scan-status").textContent = "Reading prescription with AI..."
  document.getElementById("modal-scan-body").innerHTML = ""
  try {
    const base64 = await new Promise((res, rej) => {
      const reader = new FileReader()
      reader.onload = () => res(reader.result.split(",")[1])
      reader.onerror = () => rej(new Error("File read failed"))
      reader.readAsDataURL(file)
    })
    const response = await fetch(CONFIG.BACKEND_URL + "/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 800,
        system: "Extract medication info from prescription images. Return ONLY valid JSON, no markdown.",
        messages: [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: file.type || "image/jpeg", data: base64 } },
          { type: "text", text: 'Return ONLY a JSON object: {"drugName":"...","dosage":"...","frequency":"...","quantity":"...","refills":"...","instructions":"...","confidence":"high/medium/low"}' }
        ]}]
      })
    })
    const data = await response.json()
    const text = (data.content?.find(b => b.type === "text")?.text || "{}").replace(/```json|```/g, "").trim()
    const r = JSON.parse(text)
    document.getElementById("modal-spinner").style.display = "none"
    const confIcon = r.confidence === "high" ? "✅" : r.confidence === "medium" ? "⚡" : "⚠️"
    document.getElementById("modal-scan-status").textContent = r.drugName
      ? `${confIcon} Found: ${r.drugName}${r.dosage ? " · " + r.dosage : ""}`
      : "⚠️ Could not read drug name clearly"
    document.getElementById("modal-scan-body").innerHTML = r.drugName ? `
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin:10px 0;">
        <span style="background:#E1F5EE;color:#0F6E56;padding:5px 14px;border-radius:100px;font-size:13px;font-weight:500;">${r.drugName}</span>
        ${r.dosage ? `<span style="background:#f4f3ef;color:#6b6b66;padding:5px 14px;border-radius:100px;font-size:13px;">${r.dosage}</span>` : ""}
        ${r.frequency ? `<span style="background:#f4f3ef;color:#6b6b66;padding:5px 14px;border-radius:100px;font-size:13px;">${r.frequency}</span>` : ""}
      </div>
      ${r.instructions ? `<p style="font-size:12px;color:#9a9a94;margin-bottom:10px;">📝 ${r.instructions}</p>` : ""}
      <div style="display:flex;gap:8px;">
        <button onclick="scanAutoSearch('${(r.drugName||"").replace(/'/g,"\\'")}');" style="padding:9px 16px;background:#1D9E75;color:#fff;border:none;border-radius:100px;font-size:13px;cursor:pointer;">🔍 Search prices</button>
        <button onclick="scanToReminder(${JSON.stringify(JSON.stringify(r))});" style="padding:9px 16px;background:transparent;border:1px solid #ccc;border-radius:100px;font-size:13px;cursor:pointer;">⏰ Add reminder</button>
      </div>` : `<p style="font-size:13px;color:#9a9a94;">Try a clearer, well-lit image of the label.</p>`
  } catch(err) {
    document.getElementById("modal-spinner").style.display = "none"
    document.getElementById("modal-scan-status").textContent = "Could not read prescription"
    document.getElementById("modal-scan-body").innerHTML = `<p style="font-size:13px;color:#9a9a94;">Error: ${err.message}</p>`
  }
}

function scanAutoSearch(drugName) {
  closeScannerModal()
  document.getElementById("drug-search").value = drugName
  searchDrug()
}

function scanToReminder(jsonStr) {
  try {
    const r = JSON.parse(jsonStr)
    closeScannerModal()
    showTab("reminders")
    setTimeout(() => {
      if (r.drugName) document.getElementById("r-drug").value = r.drugName
      if (r.dosage) document.getElementById("r-dose").value = r.dosage
      if (r.instructions) document.getElementById("r-notes").value = r.instructions
      if (r.frequency) {
        const f = r.frequency.toLowerCase()
        const sel = document.getElementById("r-freq")
        if (f.includes("twice") || f.includes("bid")) sel.value = "Twice daily"
        else if (f.includes("three") || f.includes("tid")) sel.value = "Three times daily"
        else if (f.includes("week")) sel.value = "Weekly"
        else sel.value = "Once daily"
      }
    }, 150)
  } catch(e) {}
}
