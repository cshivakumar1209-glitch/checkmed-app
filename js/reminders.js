// ============================================================
// reminders.js — Medication reminders (Supabase + localStorage)
// ============================================================

let reminders = JSON.parse(localStorage.getItem("cm_reminders_v2") || "[]")

async function addReminder() {
  const drug = document.getElementById("r-drug").value.trim()
  const dose = document.getElementById("r-dose").value.trim()
  const time = document.getElementById("r-time").value
  const freq = document.getElementById("r-freq").value
  const refill = document.getElementById("r-refill").value
  const notes = document.getElementById("r-notes").value.trim()
  if (!drug) { alert("Please enter a medication name."); return }

  const user = await getUser()
  if (user) {
    const { error } = await supabase.from("reminders").insert({
      user_id: user.id, drug, dose, time,
      frequency: freq, refill_days: parseInt(refill), notes
    })
    if (error) alert("Error saving: " + error.message)
  } else {
    const r = { id: Date.now(), drug, dose, time, freq, refill, notes }
    reminders.push(r)
    localStorage.setItem("cm_reminders_v2", JSON.stringify(reminders))
    scheduleNotification(r)
  }

  renderReminders()
  document.getElementById("r-drug").value = ""
  document.getElementById("r-dose").value = ""
  document.getElementById("r-notes").value = ""
}

async function renderReminders() {
  const el = document.getElementById("reminder-list")
  if (!el) return
  const user = await getUser()
  let reminderData = []
  if (user) {
    const { data, error } = await supabase.from("reminders").select("*").eq("user_id", user.id).order("created_at")
    if (!error) reminderData = data
  } else {
    reminderData = reminders
  }
  if (!reminderData.length) {
    el.innerHTML = '<div style="text-align:center;padding:2.5rem;color:#9a9a94;font-size:14px;">No reminders set yet. Add one above.</div>'
    return
  }
  const emojis = ["💊","💉","🩺","🏥","💙"]
  el.innerHTML = reminderData.map((r,i) => `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;background:#FAFAF8;border:1px solid rgba(0,0,0,0.08);border-radius:10px;padding:1rem 1.25rem;margin-bottom:10px;">
      <div style="display:flex;align-items:center;gap:14px;">
        <div style="width:40px;height:40px;border-radius:10px;background:#E1F5EE;display:flex;align-items:center;justify-content:center;font-size:18px;">${emojis[i%emojis.length]}</div>
        <div>
          <div style="font-size:14px;font-weight:500;">${r.drug}${r.dose?' — '+r.dose:''}</div>
          <div style="font-size:12px;color:#6b6b66;">${r.frequency||r.freq} · Refill alert ${r.refill_days||r.refill} days prior</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
        <span style="background:#E1F5EE;color:#0F6E56;font-size:12px;font-weight:500;padding:3px 10px;border-radius:100px;">${r.time}</span>
        <button onclick="deleteReminder('${r.id}')" style="padding:4px 12px;border:1px solid #ccc;background:transparent;border-radius:8px;font-size:12px;cursor:pointer;color:#9a9a94;">Remove</button>
      </div>
    </div>`).join("")
}

async function deleteReminder(id) {
  const user = await getUser()
  if (user) {
    await supabase.from("reminders").delete().eq("id", id)
  } else {
    reminders = reminders.filter(r => String(r.id) !== String(id))
    localStorage.setItem("cm_reminders_v2", JSON.stringify(reminders))
  }
  renderReminders()
}

function requestNotifications() {
  if (!("Notification" in window)) { alert("Your browser does not support notifications."); return }
  Notification.requestPermission().then(p => {
    if (p === "granted") {
      const banner = document.getElementById("notify-banner")
      if (banner) banner.classList.add("show")
      new Notification("CheckMed", { body: "Medication reminders are now active!" })
      reminders.forEach(scheduleNotification)
    } else { alert("Notifications blocked. Please enable them in your browser settings.") }
  })
}

function scheduleNotification(r) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return
  const [h,m] = r.time.split(":").map(Number)
  const now = new Date(), fire = new Date()
  fire.setHours(h,m,0,0)
  if (fire <= now) fire.setDate(fire.getDate()+1)
  setTimeout(() => new Notification("CheckMed Reminder", { body: `Time to take ${r.drug}${r.dose?' — '+r.dose:''}` }), fire-now)
}
