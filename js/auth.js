// ============================================================
// auth.js — User signup and login (Supabase)
// ============================================================

async function signupUser() {
  const email = document.getElementById('acct-email')?.value?.trim()
  const name = document.getElementById('acct-name')?.value?.trim()
  const phone = document.getElementById('acct-phone')?.value?.trim()
  if (!email) { alert('Please enter your email address.'); return }
  const { data, error } = await supabase.auth.signUp({
    email,
    password: phone || 'checkmed123',
    options: { data: { full_name: name, phone } }
  })
  if (error) alert('Signup error: ' + error.message)
  else alert('✅ Account created! Check your email to confirm.')
}

async function loginUser() {
  const email = document.getElementById('acct-email')?.value?.trim()
  const phone = document.getElementById('acct-phone')?.value?.trim()
  if (!email) { alert('Please enter your email.'); return }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: phone || 'checkmed123'
  })
  if (error) alert('Login error: ' + error.message)
  else alert('✅ Logged in! Your reminders will now sync.')
}

async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
