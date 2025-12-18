# Script to fix corrupted emojis and special characters
Write-Host '🔧 Fixing corrupted emojis and special characters...' -ForegroundColor Cyan

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
        
        # Replace corrupted emojis
        $content = $content -replace 'ðŸ'°', '💰'
        $content = $content -replace 'ðŸ"‹', '📋'
        $content = $content -replace 'ðŸ"§', '🔧'
        $content = $content -replace 'ðŸ'¡', '💡'
        $content = $content -replace 'ðŸ›¡ï¸', '🛡️'
        $content = $content -replace 'ðŸŽ–ï¸', '🎖️'
        $content = $content -replace 'ðŸŽ', '🎁'
        $content = $content -replace 'ðŸ§ª', '🧪'
        $content = $content -replace 'ðŸ"ˆ', '📈'
        $content = $content -replace 'ðŸ†', '🏆'
        $content = $content -replace 'ðŸ"¥', '🔥'
        $content = $content -replace 'ðŸ''', '👑'
        $content = $content -replace 'ðŸ'Ž', '💎'
        $content = $content -replace 'ðŸ"œ', '📜'
        $content = $content -replace 'ðŸ—ºï¸', '🗺️'
        $content = $content -replace 'ðŸ§­', '🧭'
        $content = $content -replace 'ðŸ"¨', '🔨'
        $content = $content -replace 'ðŸª"', '🪓'
        $content = $content -replace 'ðŸŸ¢', '🟢'
        $content = $content -replace 'ðŸŸ¡', '🟡'
        $content = $content -replace 'ðŸ"´', '🔴'
        $content = $content -replace 'ðŸ"Ž', '🔎'
        $content = $content -replace 'ðŸ'¸', '💸'
        $content = $content -replace 'âš ï¸', '⚠️'
        $content = $content -replace 'âœ"', '✓'
        $content = $content -replace 'ðŸŽ¯', '🎯'
        $content = $content -replace 'ðŸ"', '🔍'
        $content = $content -replace 'ðŸ"Š', '📊'
        $content = $content -replace 'ðŸš€', '🚀'
        $content = $content -replace 'âœ…', '✅'
        $content = $content -replace 'â€¢', '•'
        
        # Replace corrupted Portuguese characters
        $content = $content -replace 'Ã©', 'é'
        $content = $content -replace 'Ã§', 'ç'
        $content = $content -replace 'Ã£', 'ã'
        $content = $content -replace 'Ã¡', 'á'
        $content = $content -replace 'Ã­', 'í'
        $content = $content -replace 'Ãµ', 'õ'
        $content = $content -replace 'Ã³', 'ó'
        $content = $content -replace 'Ãº', 'ú'
        $content = $content -replace 'Ã ', 'à'
        $content = $content -replace 'Ã¢', 'â'
        $content = $content -replace 'Ãª', 'ê'
        $content = $content -replace 'Ã´', 'ô'
        
        if ($content -ne $originalContent) {
            $content | Set-Content -Path $file.FullName -Encoding UTF8 -NoNewline -ErrorAction Stop
            $fileCount++
            $fixCount += (($originalContent.Length - $content.Replace('ð','').Replace('Ã','').Replace('â','').Length) / 2)
            Write-Host "  ✅ $($file.Name)" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "  ❌ $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "  ✅ Files fixed: $fileCount" -ForegroundColor Green
Write-Host "`n✨ Done!" -ForegroundColor Green
