# Script para finalizar todos os processos de desenvolvimento
# Use antes de iniciar npm run tauri:dev para evitar múltiplas instâncias

Write-Host "?? Limpando processos de desenvolvimento..." -ForegroundColor Cyan

# Finalizar processos Node.js
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "  ? Finalizando $($nodeProcesses.Count) processo(s) Node.js..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force
} else {
    Write-Host "  ? Nenhum processo Node.js encontrado" -ForegroundColor Green
}

# Finalizar processos Vite
$viteProcesses = Get-Process | Where-Object { $_.ProcessName -match "vite" } -ErrorAction SilentlyContinue
if ($viteProcesses) {
    Write-Host "  ? Finalizando $($viteProcesses.Count) processo(s) Vite..." -ForegroundColor Yellow
    $viteProcesses | Stop-Process -Force
} else {
    Write-Host "  ? Nenhum processo Vite encontrado" -ForegroundColor Green
}

# Finalizar processos Tauri
$tauriProcesses = Get-Process | Where-Object { $_.ProcessName -match "tauri|torta-app" } -ErrorAction SilentlyContinue
if ($tauriProcesses) {
    Write-Host "  ? Finalizando $($tauriProcesses.Count) processo(s) Tauri..." -ForegroundColor Yellow
    $tauriProcesses | Stop-Process -Force
} else {
    Write-Host "  ? Nenhum processo Tauri encontrado" -ForegroundColor Green
}

# Finalizar processos Cargo/Rust
$cargoProcesses = Get-Process | Where-Object { $_.ProcessName -match "cargo|rustc" } -ErrorAction SilentlyContinue
if ($cargoProcesses) {
    Write-Host "  ? Finalizando $($cargoProcesses.Count) processo(s) Cargo/Rust..." -ForegroundColor Yellow
    $cargoProcesses | Stop-Process -Force
} else {
    Write-Host "  ? Nenhum processo Cargo/Rust encontrado" -ForegroundColor Green
}

Write-Host ""
Write-Host "? Limpeza concluída! Agora você pode iniciar o dev server com segurança." -ForegroundColor Green
Write-Host "   Execute: npm run tauri:dev" -ForegroundColor Cyan
