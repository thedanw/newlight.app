param()
$ErrorActionPreference = 'Continue'
$wd = 'd:\daniel\Documents\vibecoding\newlight.app'
$log = Join-Path $wd '.agents\planning\people\plan\baseline.log'
Set-Location $wd
'=== TYPECHECK ===' | Out-File $log -Encoding utf8
& pnpm typecheck *>> $log
'TYPECHECK_EXIT=' + $LASTEXITCODE | Out-File $log -Append -Encoding utf8
'=== TEST ===' | Out-File $log -Append -Encoding utf8
& pnpm test *>> $log
'TEST_EXIT=' + $LASTEXITCODE | Out-File $log -Append -Encoding utf8
'DONE' | Out-File $log -Append -Encoding utf8
