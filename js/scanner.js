// scanner.js — Prescription scanner (Claude AI Vision)

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
        model: "claude-opus-4-5",
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: [{
            type: "image",
            source: { type: "base64", media_type: file.type, data: base64 }
          }, {
            type: "text",
            text: "Read this prescription and list: medication names, dosages, and instructions."
          }]
        }]
      })
    })
    const data = await response.json()
    document.getElementById("modal-spinner").style.display = "none"
    document.getElementById("modal-scan-status").textContent = "Done!"
    document.getElementById("modal-scan-body").innerHTML = data.content?.[0]?.text?.replace(/\n/g, "<br>") || "Could not read prescription."
  } catch(e) {
    document.getElementById("modal-spinner").style.display = "none"
    document.getElementById("modal-scan-status").textContent = "Error!"
    document.getElementById("modal-scan-body").innerHTML = "Failed: " + e.message
  }
}
