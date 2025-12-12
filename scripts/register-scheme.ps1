# Helper script to register the custom URL scheme for development
# Run this as Administrator

$Params = @{
    "Scheme" = "torta-app";
    "Description" = "TortaApp OAuth Handler";
    "ExePath" = "$PSScriptRoot\..\src-tauri\target\debug\TortaApp.exe" 
}

# Resolve absolute path
$ExePath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Params.ExePath)

if (-not (Test-Path $ExePath)) {
    Write-Host "Error: Could not find executable at $ExePath" -ForegroundColor Red
    Write-Host "Please make sure you have run 'npm run tauri dev' at least once to compile the app." -ForegroundColor Yellow
    exit 1
}

$RegistryPath = "HKCU:\Software\Classes\$($Params.Scheme)"

try {
    # Create the key
    New-Item -Path $RegistryPath -Force | Out-Null
    
    # Set default value (Description)
    Set-ItemProperty -Path $RegistryPath -Name "(default)" -Value ("URL:" + $Params.Description)
    
    # Set URL Protocol flag (required)
    Set-ItemProperty -Path $RegistryPath -Name "URL Protocol" -Value ""
    
    # Create DefaultIcon key
    $IconPath = Join-Path $RegistryPath "DefaultIcon"
    New-Item -Path $IconPath -Force | Out-Null
    Set-ItemProperty -Path $IconPath -Name "(default)" -Value "$ExePath,0"
    
    # Create shell\open\command key
    $CommandPath = Join-Path $RegistryPath "shell\open\command"
    New-Item -Path $CommandPath -Force | Out-Null
    
    # Set command to run
    # "%1" receives the URL passed by the browser
    Set-ItemProperty -Path $CommandPath -Name "(default)" -Value "`"$ExePath`" `"%1`""
    
    Write-Host "? Successfully registered $($Params.Scheme):// scheme!" -ForegroundColor Green
    Write-Host "Pointing to: $ExePath" -ForegroundColor Gray
    Write-Host "You can now test Google Login." -ForegroundColor Cyan
}
catch {
    Write-Host "? Failed to register scheme: $_" -ForegroundColor Red
    Write-Host "Try running this script as Administrator." -ForegroundColor Yellow
}
