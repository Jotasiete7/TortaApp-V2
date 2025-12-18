# Script to convert all TypeScript files to UTF-8 encoding
Write-Host "🔧 Converting all TypeScript files to UTF-8..." -ForegroundColor Cyan
$fileCount = 0
$errorCount = 0
$files = Get-ChildItem -Path . -Include *.ts,*.tsx -Recurse -File | Where-Object { 
    $_.FullName -notmatch 'node_modules' -and 
    $_.FullName -notmatch '\.vite' -and
    $_.FullName -notmatch 'dist'
}
foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Raw -ErrorAction Stop
        $content | Set-Content -Path $file.FullName -Encoding UTF8 -NoNewline -ErrorAction Stop
        $fileCount++
        Write-Host "  ✅ $($file.Name)" -ForegroundColor Green
    }
    catch {
        $errorCount++
        Write-Host "  ❌ $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "  ✅ Converted: $fileCount files" -ForegroundColor Green
if ($errorCount -gt 0) {
    Write-Host "  ❌ Errors: $errorCount files" -ForegroundColor Red
}
Write-Host "`n✨ Done!" -ForegroundColor Green
