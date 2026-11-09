# Flash one of the three sample games to the MakeCode Arcade console.
# Usage: powershell -File flash.ps1 -Game 1   (1 / 2 / 3)
# Press the RESET button on the console once; the ARCADE drive appears and this script copies the UF2.
param(
    [ValidateSet('1', '2', '3', '4', '5', '6', '7', '8', '9')][string]$Game = '1',
    [int]$TimeoutSec = 240
)
$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
$fwDir = Join-Path $root 'firmware'
$names = @{
    '1' = '01-catch-the-pizza.uf2'
    '2' = '02-flappy-bird.uf2'
    '3' = '03-space-shooter.uf2'
    '4' = '04-game-collection.uf2'   # 3 合 1 游戏合集
    '5' = '05-toolbox.uf2'           # 非游戏工具箱
    '6' = '06-py-catch-star.uf2'     # Python 版
    '7' = '07-py-dice.uf2'
    '8' = '08-py-stopwatch.uf2'
    '9' = '09-legend-4in1.uf2'   # 四大经典游戏合集（贪吃蛇/闯关/枪战/坦克）
}
$name = $names[$Game]
$fw = Join-Path $fwDir $name
$log = Join-Path $PSScriptRoot 'flash.log'

("=== " + (Get-Date -Format o) + " game=" + $Game + " ===") | Out-File $log -Encoding utf8
function W($m) { $m | Out-File $log -Append -Encoding utf8; Write-Output $m }

if (-not (Test-Path -LiteralPath $fw)) { W "MISSING FIRMWARE: $fw"; exit 1 }

$deadline = (Get-Date).AddSeconds($TimeoutSec)
$letter = $null
while ((Get-Date) -lt $deadline) {
    $vols = Get-CimInstance Win32_LogicalDisk | Where-Object { $_.DriveType -eq 2 -or $_.DriveType -eq 3 }
    foreach ($v in $vols) {
        $marker = Test-Path -LiteralPath (Join-Path $v.DeviceID 'INFO_UF2.TXT')
        if ($v.VolumeName -match 'ARCADE|ARCD|FTHR840BOOT|RPI-RP2' -or $marker) { $letter = $v.DeviceID; break }
    }
    if ($letter) { break }
    Start-Sleep -Milliseconds 500
}

if (-not $letter) {
    W 'TIMEOUT: no ARCADE drive found. Press the RESET button once on the console, then run this script again.'
    exit 2
}

W "Found bootloader drive: $letter"
try {
    Copy-Item -LiteralPath $fw -Destination (Join-Path $letter $name) -Force -ErrorAction Stop
    W "FLASHED $name to $letter"
} catch {
    W ("COPY note: " + $_.Exception.Message + " (UF2 drives often disappear while copying - check the console screen)")
}
