async function test() {
  const response = await fetch('https://rupujdsalfekudambviu.supabase.co/functions/v1/elvanto-sync-worker', {
    method: 'POST',
    headers: {
      'Origin': 'https://db.newlight.app',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ trigger: 'manual' })
  });
  const data = await response.json();
  console.log('Status:', response.status);
  console.log('Response:', data);
}

test().catch(console.error);