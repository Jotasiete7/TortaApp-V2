# Script to fix corrupted emojis and special characters
Write-Host "🔧 Fixing corrupted emojis and special characters..." -ForegroundColor Cyan

$replacements = @{
    'ðŸ'°' = '💰'
    'ðŸ"‹' = '��'
    'ðŸ"§' = '🔧'
    'ðŸ'¡' = '💡'
    'ðŸ›¡ï¸' = '🛡️'
    'ðŸŽ–ï¸' = '🎖️'
    'ðŸŽ' = '🎁'
    'ðŸ§ª' = '🧪'
    'ðŸ"ˆ' = '📈'
    'ðŸ†' = '🏆'
    'ðŸ"¥' = '🔥'
    'ðŸ''' = '👑'
    'ðŸ'Ž' = '💎'
    'ðŸ"œ' = '📜'
    'ðŸ—ºï¸' = '🗺️'
    'ðŸ§­' = '🧭'
    'ðŸ"¨' = '🔨'
    'ðŸª"' = '🪓'
    'ðŸŸ¢' = '🟢'
    'ðŸŸ¡' = '🟡'
    'ðŸ"´' = '🔴'
    'ðŸ"Ž' = '🔎'
    'ðŸ'¸' = '💸'
    'âš ï¸' = '⚠️'
    'âœ"' = '✓'
    'ðŸŽ¯' = '🎯'
    'ðŸ"' = '🔍'
    'ðŸ"Š' = '📊'
    'ðŸš€' = '🚀'
    'âœ…' = '✅'
    'â€¢' = '•'
    'Ã©' = 'é'
    'Ã§' = 'ç'
    'Ã£' = 'ã'
    'Ã¡' = 'á'
    'Ã­' = 'í'
    'Ãµ' = 'õ'
    'Ã³' = 'ó'
    'Ãº' = 'ú'
    'Ã ' = 'à'
    'Ã¢' = 'â'
    'Ãª' = 'ê'
    'Ã´' = 'ô'
}

$fileCount = 0
$fixCount = 0

$files = Get-ChildItem -Path . -Include *.ts,*.tsx -Recurse -File | Where-Object { 
    $_.FullName -notmatch 'node_modules' -and 
    $_.FullName -notmatch '\.vite' -and
    $_.FullName -notmatch 'dist'
}

foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Raw -Encoding UTF8 -ErrorAction Stop
        $originalContent = $content
        
        foreach ($key in $replacements.Keys) {
            if ($content -match [regex]::Escape($key)) {
                $content = $content -replace [regex]::Escape($key), $replacements[$key]
                $fixCount++
            }
        }
        
        if ($content -ne $originalContent) {
            $content | Set-Content -Path $file.FullName -Encoding UTF8 -NoNewline -ErrorAction Stop
            $fileCount++
            Write-Host "  ✅ $($file.Name)" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "  ❌ $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "  ✅ Files fixed: $fileCount" -ForegroundColor Green
Write-Host "  ✅ Replacements made: $fixCount" -ForegroundColor Green
Write-Host "`n✨ Done!" -ForegroundColor Green
