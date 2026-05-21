// ============================================================
// app.js — Tabs and navigation
// ============================================================

function showTab(t) {
  ["home","reminders","interactions","about"].forEach(s => {
    const sec = document.getElementById("sec-"+s)
    const tab = document.getElementById("tab-"+s)
    if (sec) sec.classList.toggle("active", s===t)
    if (tab) tab.classList.toggle("active", s===t)
  })
  window.scrollTo(0, 0)
}

function setStep(n, btn) {
  document.querySelectorAll(".step-tab").forEach(b => b.classList.remove("active"))
  btn.classList.add("active")
}

function updatePlanSuggestion() {
  const type = document.getElementById("ins-type")?.value || ""
  const rec = document.getElementById("plan-recommendation")
  if (!rec) return
  if (type === "No insurance") rec.textContent = "Recommended: use the discount card price if you have no insurance."
  else if (type === "Medicare Part D") rec.textContent = "Recommended: check your plan copay vs GoodRx — Medicare patients can't always use manufacturer coupons."
  else rec.textContent = "Recommended: compare your insurance copay against GoodRx — whichever is lower wins."
}

function setPlanFilter(filter, btn) {
  document.querySelectorAll(".plan-filter-btn").forEach(b => b.classList.remove("active"))
  btn.classList.add("active")
  const rec = document.getElementById("plan-recommendation")
  if (!rec) return
  if (filter === "uninsured") rec.textContent = "Recommended: use the discount card price if you have no insurance."
  else if (filter === "copay") rec.textContent = "Recommended: your best insurance copay based on your current plan stage."
  else if (filter === "savings") rec.textContent = "Recommended: manufacturer assistance programs offer the highest savings for eligible patients."
}

function continueAsGuest() {
  document.getElementById("drug-search")?.focus()
}
