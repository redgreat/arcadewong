# Installs the WinUSB driver for the missing "Arcade (app)" MI_01 interface.
# Must be run as Administrator (the launcher requests UAC elevation).
$ErrorActionPreference = 'Continue'
$inf = Join-Path $PSScriptRoot 'arcade-winusb.inf'
$log = Join-Path $PSScriptRoot 'driver-install.log'

function Write-Log($text) {
    $text | Out-File -FilePath $log -Append -Encoding utf8
}

Remove-Item $log -ErrorAction SilentlyContinue
Write-Log ("=== " + (Get-Date -Format o) + " ===")
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
Write-Log "Elevated: $isAdmin"
if (-not $isAdmin) {
    Write-Log "ERROR: not elevated. Aborting."
    exit 1
}

Write-Log "INF: $inf"
Write-Log "--- pnputil /add-driver /install ---"
$out = & pnputil.exe /add-driver $inf /install 2>&1
Write-Log ($out | Out-String)
Write-Log "pnputil exit: $LASTEXITCODE"

Write-Log "--- pnputil /scan-devices ---"
$out2 = & pnputil.exe /scan-devices 2>&1
Write-Log ($out2 | Out-String)
Write-Log "scan exit: $LASTEXITCODE"

Write-Log "--- device status ---"
$dev = Get-PnpDevice | Where-Object { $_.InstanceId -like 'USB\VID_0483&PID_5799&MI_01*' }
foreach ($d in $dev) {
    Write-Log ("Status={0} Class={1} Name={2} Instance={3}" -f $d.Status, $d.Class, $d.FriendlyName, $d.InstanceId)
    $svc = (Get-PnpDeviceProperty -InstanceId $d.InstanceId -KeyName 'DEVPKEY_Device_Service' -ErrorAction SilentlyContinue).Data
    $infPath = (Get-PnpDeviceProperty -InstanceId $d.InstanceId -KeyName 'DEVPKEY_Device_DriverInfPath' -ErrorAction SilentlyContinue).Data
    Write-Log "Service=$svc Inf=$infPath"
}
Write-Log "=== done ==="
