// RLS verification for people table (local Supabase stack)
// Verifies: anon sees only access_permission='public' non-deleted people;
// authenticated sees all non-deleted people.
const REST = 'http://127.0.0.1:54321/rest/v1'
const AUTH = 'http://127.0.0.1:54321/auth/v1'
const ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const SERVICE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const results = { pass: 0, fail: 0 }
function check(name, cond, detail) {
  if (cond) {
    results.pass++
    console.log(`  PASS  ${name}`)
  } else {
    results.fail++
    console.log(`  FAIL  ${name}  ${detail ?? ''}`)
  }
}

async function main() {
  // 1. Insert 3 test people via service role (bypasses RLS)
  const people = [
    { id: crypto.randomUUID(), firstname: 'Public', lastname: 'Person', access_permission: 'public', deleted_at: null, journey: { status: 'active' } },
    { id: crypto.randomUUID(), firstname: 'Member', lastname: 'Person', access_permission: 'member_area', deleted_at: null, journey: { status: 'active' } },
    { id: crypto.randomUUID(), firstname: 'Deleted', lastname: 'Person', access_permission: 'public', deleted_at: new Date().toISOString(), journey: { status: 'active' } },
  ]
  const ins = await fetch(`${REST}/people`, {
    method: 'POST',
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(people),
  })
  console.log(`insert status: ${ins.status}`)
  if (ins.status >= 400) {
    console.log(await ins.text())
    process.exit(1)
  }

  // 2. Query as anon -> expect ONLY Public Person (public + not deleted)
  const anonRes = await fetch(`${REST}/people?select=firstname,lastname,access_permission&order=firstname`, {
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
  })
  const anonData = await anonRes.json()
  const anonNames = (anonData ?? []).map((p) => p.firstname)
  console.log(`ANON sees: ${JSON.stringify(anonNames)}`)
  check('anon sees only public non-deleted', anonNames.length === 1 && anonNames[0] === 'Public', `got ${JSON.stringify(anonNames)}`)

  // 3. Sign up a user to get an authenticated token
  const email = `rls-${Date.now()}@test.local`
  const signup = await fetch(`${AUTH}/signup`, {
    method: 'POST',
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'TestPass123!' }),
  })
  const signupData = await signup.json()
  const token = signupData.access_token
  console.log(`signup status: ${signup.status}, has token: ${!!token}`)
  if (!token) {
    console.log(JSON.stringify(signupData))
    process.exit(1)
  }

  // 4. Query as authenticated -> expect Public + Member (all non-deleted)
  const authRes = await fetch(`${REST}/people?select=firstname,lastname,access_permission&order=firstname`, {
    headers: { apikey: ANON, Authorization: `Bearer ${token}` },
  })
  const authData = await authRes.json()
  const authNames = (authData ?? []).map((p) => p.firstname)
  console.log(`AUTH sees: ${JSON.stringify(authNames)}`)
  check(
    'authenticated sees all non-deleted',
    authNames.length === 2 && authNames.includes('Public') && authNames.includes('Member'),
    `got ${JSON.stringify(authNames)}`,
  )

  // 5. Cleanup test people via service role
  const ids = people.map((p) => p.id)
  const del = await fetch(`${REST}/people?id=in.(${ids.join(',')})`, {
    method: 'DELETE',
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, Prefer: 'return=minimal' },
  })
  console.log(`cleanup status: ${del.status}`)

  console.log(`\nRESULT: ${results.pass} passed, ${results.fail} failed`)
  process.exit(results.fail > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})