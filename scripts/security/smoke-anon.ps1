#!/usr/bin/env pwsh
# Smoke test harness for anonymous caller security probes.
# Reads $url, $anon from .env; each probe prints `PASS`/`FAIL` + HTTP code;
# exit 1 if any FAIL.

# Source env from .env (gitignored)
$url = (Get-Content -Path "$PWD/.env" -ErrorAction SilentlyContinue | Select-String -Pattern '^VITE_SUPABASE_URL=' | ForEach-Object { $_.Line -replace '^VITE_SUPABASE_URL=', '' }).Trim()
$anon = (Get-Content -Path "$PWD/.env" -ErrorAction SilentlyContinue | Select-String -Pattern '^VITE_SUPABASE_PUBLISHABLE_KEY=' | ForEach-Object { $_.Line -replace '^VITE_SUPABASE_PUBLISHABLE_KEY=', '' }).Trim()

function probe($method, $path, $body) {
  $fullUrl = "$url$path"
  $headers = @{
    'apikey' = $anon
    'Authorization' = "Bearer $anon"
    'Content-Type' = 'application/json'
  }
  $bodyJson = $null
  if ($body) {
    $bodyJson = $body | ConvertTo-Json -Compress
  }
  Write-Host "Probing: $method $path"
  try {
    $resp = Invoke-RestMethod -Method $method -Uri $fullUrl -Headers $headers -Body $bodyJson -TimeoutSec 10
    $code = 200
    Write-Host "  RESULT: PASS (HTTP $code)"
    return $code
  } catch {
    $code = $_.Exception.Response.StatusCode.value__ -as [int] -or 500
    Write-Host "  RESULT: FAIL (HTTP $code)"
    return $code
  }
}

$failCount = 0
$totalCount = 0

# Probe 1: GET /rest/v1/addresses - should be 403 for anon
$totalCount++
$code = probe('GET' , '/rest/v1/addresses')
if ($code -ne 403) { Write-Host "  EXPECTED: 403 (anon should not see addresses)"; $failCount++ } else { Write-Host "  OK: 403 returned" }

# Probe 2: GET /rest/v1/people?select=email,wwcc_number - should be 403 for anon (PII)
$totalCount++
$code = probe('GET' , '/rest/v1/people?select=email,wwcc_number')
if ($code -ne 403) { Write-Host "  EXPECTED: 403 (anon should not see people PII)"; $failCount++ } else { Write-Host "  OK: 403 returned" }

# Probe 3: POST /rest/v1/rpc/search_people - should be 403 for anon
$totalCount++
$body = @{query=''; limit=1} | ConvertTo-Json -Compress
$code = probe('POST' , '/rest/v1/rpc/search_people' , $body)
if ($code -ne 403) { Write-Host "  EXPECTED: 403 (anon should not search people)"; $failCount++ } else { Write-Host "  OK: 403 returned" }

# Probe 4: GET /rest/v1/platform_settings - should be 403 for anon
$totalCount++
$code = probe('GET' , '/rest/v1/platform_settings')
if ($code -ne 403) { Write-Host "  EXPECTED: 403 (anon should not see platform_settings)"; $failCount++ } else { Write-Host "  OK: 403 returned" }

# Probe 5: GET /rest/v1/elvanto_settings - should be 403 for anon
$totalCount++
$code = probe('GET' , '/rest/v1/elvanto_settings')
if ($code -ne 403) { Write-Host "  EXPECTED: 403 (anon should not see elvanto_settings)"; $failCount++ } else { Write-Host "  OK: 403 returned" }

# Probe 6: GET /rest/v1/plugins - should be 403 for anon
$totalCount++
$code = probe('GET' , '/rest/v1/plugins')
if ($code -ne 403) { Write-Host "  EXPECTED: 403 (anon should not see plugins)"; $failCount++ } else { Write-Host "  OK: 403 returned" }

# Probe 7: anon INSERT into platform_settings - should be 42501 or 403
$totalCount++
$body = @{} | ConvertTo-Json -Compress
$code = probe('POST' , '/rest/v1/platform_settings' , $body)
if ($code -ne 42501 -and $code -ne 403) { Write-Host "  EXPECTED: 42501 or 403 (anon INSERT should fail)"; $failCount++ } else { Write-Host "  OK: 42501/403 returned" }

# Probe 8: GET /storage/v1/object/list/brand-assets - should be 403 for anon
$totalCount++
$code = probe('GET' , '/storage/v1/object/list/brand-assets')
if ($code -ne 403) { Write-Host "  EXPECTED: 403 (anon should not list brand-assets)"; $failCount++ } else { Write-Host "  OK: 403 returned" }

# Probe 9: GET /rest/v1/people_public - should return only public rows
$totalCount++
$code = probe('GET' , '/rest/v1/people_public')
# We'll note the result but not fail on count here

# Probe 10: POST /functions/v1/email-send (empty body) - should be 401/403 for anon
$totalCount++
$body = @{} | ConvertTo-Json -Compress
$code = probe('POST' , '/functions/v1/email-send' , $body)
if ($code -ne 401 -and $code -ne 403) { Write-Host "  EXPECTED: 401 or 403 (anon should not send email)"; $failCount++ } else { Write-Host "  OK: 401/403 returned" }

# Probe 11: POST /functions/v1/elvanto-sync-worker - should be 401/403 for anon
$totalCount++
$body = @{} | ConvertTo-Json -Compress
$code = probe('POST' , '/functions/v1/elvanto-sync-worker' , $body)
if ($code -ne 401 -and $code -ne 403) { Write-Host "  EXPECTED: 401 or 403 (anon should not trigger elvanto sync)"; $failCount++ } else { Write-Host "  OK: 401/403 returned" }

Write-Host "`n=== SUMMARY ===="
Write-Host "Total probes: $totalCount"
Write-Host "Failed probes: $failCount"
if ($failCount -gt 0) {
  Write-Host "BASELINE STATE: RED ($failCount/$totalCount probes expected to fail for anon)"
  exit 1
} else {
  Write-Host "BASELINE STATE: GREEN (all probes passing - no security issues)"
  exit 0
}