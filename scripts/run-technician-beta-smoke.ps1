<#
.SYNOPSIS
Runs the Technician beta smoke bundle with a reversible PPM_WOV admin gate.

.DESCRIPTION
This repository uses WebdriverIO/Appium rather than Playwright. The script starts
or reuses an Android device, waits for boot completion, verifies the installed
Play Store Technician package and exact version, prepares the repository-local
Appium installation, and runs the production-smoke lane with mutations disabled.
The optional complaint lifecycle is a separately guarded production-regression
phase on a physical device; it is never executed inside the read-only lane.
Before smoke, the script logs in through the admin API, verifies PPM_WOV.R can
be turned on, turns it off for QR routing, and restores the original permission
map afterward.

.EXAMPLE
.\scripts\run-technician-beta-smoke.ps1

.EXAMPLE
.\scripts\run-technician-beta-smoke.ps1 -AvdName Pixel_6_Pro -ExpectedInAppVersion 2.2.57

.EXAMPLE
.\scripts\run-technician-beta-smoke.ps1 -ExpectedBuildVersion 6.0.7

.EXAMPLE
.\scripts\run-technician-beta-smoke.ps1 -ExpectedInAppVersion 2.2.57 -ExpectedBuildVersion 6.0.7

.EXAMPLE
.\scripts\run-technician-beta-smoke.ps1 -AllowCredentialLogin -ExpectedGreeting 'Hi Approved Test User! 👋' -TechnicianQrRunFile 'artifacts\qr\run-current.json'

.EXAMPLE
.\scripts\run-technician-beta-smoke.ps1 -SkipAppiumSetup

.EXAMPLE
.\scripts\run-technician-beta-smoke.ps1 -DeviceTarget physical -DeviceSerial R5CT... -IncludeComplaintLifecycle
#>

[CmdletBinding()]
param(
    [string]$AvdName,

    [string]$DeviceSerial = 'emulator-5554',

    [ValidateSet('emulator', 'physical')]
    [string]$DeviceTarget = 'emulator',

    [AllowEmptyString()]
    [ValidateScript({ -not $_ -or $_ -match '^\d+(\.\d+)+$' })]
    [string]$ExpectedInAppVersion = '2.2.57',

    [ValidatePattern('^\d+(\.\d+)+$')]
    [string]$ExpectedBuildVersion,

    [string]$ExpectedGreeting,

    [string]$TechnicianQrRunFile,

    [switch]$AllowCredentialLogin,

    [ValidateSet('auto', 'host', 'swiftshader', 'swiftshader_indirect')]
    [string]$GpuMode = 'swiftshader_indirect',

    [ValidateRange(30, 600)]
    [int]$BootTimeoutSeconds = 240,

    [string]$AdbPath,

    [string]$EmulatorPath,

    [switch]$SkipPlayStorePreflight,

    [switch]$SkipAppiumSetup,

    [switch]$IncludeComplaintLifecycle
)

$ErrorActionPreference = 'Stop'
$script:RepositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$script:TechnicianPackage = 'com.sumasamu.isocietyManagerAdmin'

function Get-DotEnvValue {
    param([Parameter(Mandatory)][string]$Key)
    $envFile = Join-Path $script:RepositoryRoot '.env'
    if (-not (Test-Path -LiteralPath $envFile)) { return $null }
    foreach ($line in Get-Content -LiteralPath $envFile) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith('#') -or -not $trimmed.Contains('=')) {
            continue
        }
        $parts = $trimmed -split '=', 2
        if ($parts[0].Trim() -eq $Key) { return $parts[1].Trim() }
    }
    return $null
}

# Explicit parameters override .env. Supplying only -ExpectedBuildVersion still
# intentionally selects build-only verification.
$buildOnlyVerification =
    $PSBoundParameters.ContainsKey('ExpectedBuildVersion') -and
    -not $PSBoundParameters.ContainsKey('ExpectedInAppVersion')
if ($buildOnlyVerification) {
    $ExpectedInAppVersion = ''
}
elseif (-not $PSBoundParameters.ContainsKey('ExpectedInAppVersion')) {
    $configuredInAppVersion = Get-DotEnvValue 'APP_EXPECTED_IN_APP_VERSION'
    if ($configuredInAppVersion) { $ExpectedInAppVersion = $configuredInAppVersion }
}
if (-not $PSBoundParameters.ContainsKey('ExpectedBuildVersion')) {
    $ExpectedBuildVersion = Get-DotEnvValue 'APP_EXPECTED_PLAYSTORE_VERSION_NAME'
}
if (-not $PSBoundParameters.ContainsKey('ExpectedGreeting')) {
    $ExpectedGreeting = Get-DotEnvValue 'TECHNICIAN_EXPECTED_GREETING'
}
if (-not $PSBoundParameters.ContainsKey('AllowCredentialLogin')) {
    $AllowCredentialLogin = (Get-DotEnvValue 'PRODUCTION_CREDENTIAL_LOGIN_CONFIRMED') -eq 'true'
}

function Write-Step {
    param([Parameter(Mandatory)][string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Resolve-AndroidTool {
    param(
        [Parameter(Mandatory)][ValidateSet('adb', 'emulator')][string]$Tool,
        [string]$ExplicitPath
    )

    if ($ExplicitPath) {
        return (Resolve-Path -LiteralPath $ExplicitPath -ErrorAction Stop).Path
    }

    $executable = "$Tool.exe"
    $command = Get-Command $executable -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    $relativePath = if ($Tool -eq 'adb') {
        'platform-tools\adb.exe'
    }
    else {
        'emulator\emulator.exe'
    }
    $sdkRoots = @(
        $env:ANDROID_SDK_ROOT,
        $env:ANDROID_HOME,
        $(if ($env:LOCALAPPDATA) { Join-Path $env:LOCALAPPDATA 'Android\Sdk' })
    ) | Where-Object { $_ } | Select-Object -Unique

    foreach ($sdkRoot in $sdkRoots) {
        $candidate = Join-Path $sdkRoot $relativePath
        if (Test-Path -LiteralPath $candidate -PathType Leaf) {
            return (Resolve-Path -LiteralPath $candidate).Path
        }
    }

    throw "$executable was not found. Add it to PATH or pass the explicit path parameter."
}

function Invoke-Adb {
    param(
        [Parameter(Mandatory)][string[]]$Arguments,
        [switch]$WithoutSerial,
        [switch]$AllowFailure,
        [switch]$Quiet
    )

    $allArguments = @()
    if (-not $WithoutSerial) {
        $allArguments += @('-s', $DeviceSerial)
    }
    $allArguments += $Arguments

    # Windows PowerShell can promote native stderr to a terminating ErrorRecord
    # when the script-wide preference is Stop. Probe commands are expected to
    # fail while an emulator is booting, so capture them before evaluating the
    # native exit code ourselves.
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $output = & $script:ResolvedAdb @allArguments 2>&1 | Out-String
        $exitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }
    $output = $output.Trim()
    if ($output -and -not $Quiet) {
        Write-Host $output
    }
    if ($exitCode -ne 0 -and -not $AllowFailure) {
        throw "ADB command failed with exit code ${exitCode}: adb $($allArguments -join ' ')"
    }

    [pscustomobject]@{ ExitCode = $exitCode; Output = $output }
}

function Initialize-AdbServer {
    $probe = Invoke-Adb -Arguments @('devices') -WithoutSerial -AllowFailure -Quiet
    if ($probe.ExitCode -eq 0) {
        return
    }

    Write-Warning 'ADB did not respond. Restarting only the matching ADB server process.'
    & $script:ResolvedAdb kill-server 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Get-Process adb -ErrorAction SilentlyContinue |
            Where-Object { $_.Path -eq $script:ResolvedAdb } |
            Stop-Process -Force
    }
    Start-Sleep -Milliseconds 500
    $start = Invoke-Adb -Arguments @('start-server') -WithoutSerial -AllowFailure
    if ($start.ExitCode -ne 0) {
        throw 'ADB server could not be started.'
    }
}

function Get-OnlineDevices {
    $result = Invoke-Adb -Arguments @('devices') -WithoutSerial -Quiet
    @(
        $result.Output -split "`r?`n" |
            Where-Object { $_ -match '^([^\s]+)\s+device(?:\s|$)' } |
            ForEach-Object { ($_ -split '\s+')[0] }
    )
}

function Get-AvailableAvds {
    $output = & $script:ResolvedEmulator -list-avds 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) {
        throw 'Unable to list Android Virtual Devices.'
    }
    @($output -split "`r?`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ })
}

function Resolve-AvdName {
    $available = @(Get-AvailableAvds)
    if ($available.Count -eq 0) {
        throw 'No Android Virtual Devices are installed.'
    }
    if ($AvdName) {
        if ($available -notcontains $AvdName) {
            throw "AVD '$AvdName' was not found. Available AVDs: $($available -join ', ')"
        }
        return $AvdName
    }

    $configured = $env:AVD_NAME
    if ($configured -and $available -contains $configured) {
        return $configured
    }

    $selected = $available[0]
    if ($available.Count -gt 1) {
        Write-Warning "Multiple AVDs are available. Using '$selected'. Pass -AvdName to select another."
    }
    return $selected
}

function Wait-ForAndroidBoot {
    $deadline = (Get-Date).AddSeconds($BootTimeoutSeconds)
    do {
        $state = Invoke-Adb -Arguments @('get-state') -AllowFailure -Quiet
        if ($state.ExitCode -eq 0 -and $state.Output -eq 'device') {
            $boot = Invoke-Adb -Arguments @('shell', 'getprop', 'sys.boot_completed') -AllowFailure -Quiet
            if ($boot.ExitCode -eq 0 -and $boot.Output -eq '1') {
                Invoke-Adb -Arguments @('shell', 'wm', 'dismiss-keyguard') -AllowFailure -Quiet | Out-Null
                return
            }
        }
        Start-Sleep -Seconds 2
    } while ((Get-Date) -lt $deadline)

    throw "Android device '$DeviceSerial' did not finish booting within $BootTimeoutSeconds seconds."
}

function Start-OrReuseEmulator {
    $online = @(Get-OnlineDevices)
    if ($DeviceTarget -eq 'physical') {
        if ($DeviceSerial -like 'emulator-*') {
            throw 'Physical smoke bundle requires an explicit physical -DeviceSerial.'
        }
        if ($online -notcontains $DeviceSerial) {
            throw "Physical Android device '$DeviceSerial' is not online."
        }
        Write-Host "Reusing physical Android device '$DeviceSerial'." -ForegroundColor Green
        Wait-ForAndroidBoot
        return
    }
    if ($online -contains $DeviceSerial) {
        $renderer = (Invoke-Adb -Arguments @('shell', 'dumpsys', 'SurfaceFlinger') -Quiet).Output
        $softwareRendererRequested = $GpuMode -like 'swiftshader*'
        $softwareRendererActive = $renderer -match '(?m)^GLES:.*SwiftShader'
        if ($softwareRendererRequested -and -not $softwareRendererActive) {
            Write-Warning "'$DeviceSerial' is using the host GPU. Restarting it with $GpuMode to avoid black emulator surfaces."
            Invoke-Adb -Arguments @('emu', 'kill') -AllowFailure -Quiet | Out-Null
            $deadline = (Get-Date).AddSeconds(30)
            do {
                Start-Sleep -Seconds 1
                $online = @(Get-OnlineDevices)
            } while ($online -contains $DeviceSerial -and (Get-Date) -lt $deadline)
            if ($online -contains $DeviceSerial) {
                throw "Android device '$DeviceSerial' did not stop before renderer restart."
            }
        }
        else {
            Write-Host "Reusing online Android device '$DeviceSerial'." -ForegroundColor Green
            Wait-ForAndroidBoot
            return
        }
    }
    if ($online.Count -gt 0) {
        throw "Other Android devices are online ($($online -join ', ')), but '$DeviceSerial' is not. Pass the intended -DeviceSerial."
    }

    $selectedAvd = Resolve-AvdName
    Write-Step "Launching AVD '$selectedAvd' as '$DeviceSerial'"
    Start-Process -FilePath $script:ResolvedEmulator -ArgumentList @(
        '-avd', $selectedAvd,
        '-gpu', $GpuMode,
        '-no-snapshot-load',
        '-no-snapshot-save'
    ) -WindowStyle Hidden | Out-Null
    Wait-ForAndroidBoot
}

function Assert-TechnicianBuildVersion {
    Write-Step 'Reading the installed Technician build version'
    $packagePath = Invoke-Adb -Arguments @('shell', 'pm', 'path', $script:TechnicianPackage) -AllowFailure -Quiet
    if ($packagePath.ExitCode -ne 0 -or $packagePath.Output -notmatch '^package:') {
        throw "Technician package '$($script:TechnicianPackage)' is not installed on '$DeviceSerial'. Install the approved Play Store beta first."
    }

    $details = Invoke-Adb -Arguments @('shell', 'dumpsys', 'package', $script:TechnicianPackage) -Quiet
    $versionName = [regex]::Match($details.Output, '(?m)^\s*versionName=(\S+)').Groups[1].Value
    $versionCode = [regex]::Match($details.Output, '(?m)^\s*versionCode=(\d+)').Groups[1].Value
    if (-not $versionName) {
        throw "Could not read the installed version of '$($script:TechnicianPackage)'."
    }
    if ($ExpectedBuildVersion -and $versionName -ne $ExpectedBuildVersion) {
        throw "Installed Technician build version is '$versionName' (code $versionCode), expected '$ExpectedBuildVersion'. Update the selected track before running smoke checks."
    }
    if ($ExpectedBuildVersion) {
        Write-Host "Verified build version $versionName (code $versionCode)." -ForegroundColor Green
    }
    else {
        Write-Host "Installed build version: $versionName (code $versionCode)." -ForegroundColor Green
    }
}

function Assert-TechnicianInAppVersion {
    if (-not $ExpectedInAppVersion) {
        return
    }

    Write-Step "Verifying bundled in-app version $ExpectedInAppVersion"
    $packagePaths = Invoke-Adb -Arguments @('shell', 'pm', 'path', $script:TechnicianPackage) -Quiet
    $basePackage = @(
        $packagePaths.Output -split "`r?`n" |
            Where-Object { $_ -match '^package:.*/base\.apk$' } |
            Select-Object -First 1
    )
    if (-not $basePackage) {
        throw "Installed base APK was not found for '$($script:TechnicianPackage)'."
    }

    $remoteApk = $basePackage[0].Substring('package:'.Length)
    $temporaryDirectory = Join-Path ([IO.Path]::GetTempPath()) (
        'factech-technician-version-' + [guid]::NewGuid().ToString('N')
    )
    New-Item -ItemType Directory -Path $temporaryDirectory | Out-Null
    $localApk = Join-Path $temporaryDirectory 'base.apk'

    try {
        Invoke-Adb -Arguments @('pull', $remoteApk, $localApk) -Quiet | Out-Null
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $archive = [IO.Compression.ZipFile]::OpenRead($localApk)
        try {
            $bundle = $archive.GetEntry('assets/index.android.bundle')
            if (-not $bundle) {
                throw 'The installed APK does not contain assets/index.android.bundle.'
            }
            $reader = [IO.StreamReader]::new($bundle.Open(), [Text.Encoding]::UTF8, $true)
            try {
                $bundleText = $reader.ReadToEnd()
            }
            finally {
                $reader.Dispose()
            }
        }
        finally {
            $archive.Dispose()
        }

        if (-not $bundleText.Contains($ExpectedInAppVersion)) {
            throw "Installed Technician APK does not contain in-app version '$ExpectedInAppVersion'."
        }
        Write-Host "Verified bundled in-app version $ExpectedInAppVersion." -ForegroundColor Green
    }
    finally {
        if (Test-Path -LiteralPath $temporaryDirectory) {
            Remove-Item -LiteralPath $temporaryDirectory -Recurse -Force
        }
    }
}

function Set-SafeSmokeEnvironment {
    $androidSdkRoot = Split-Path (Split-Path $script:ResolvedEmulator -Parent) -Parent
    $qrSequence = Get-DotEnvValue 'TECHNICIAN_WOV_EXPECTED_SEQUENCE'
    if (-not $qrSequence) {
        throw 'TECHNICIAN_WOV_EXPECTED_SEQUENCE is required for QR-routing smoke.'
    }
    foreach ($key in @(
        'TECHNICIAN_USERNAME',
        'TECHNICIAN_PASSWORD',
        'ISM_API_BASE_URL',
        'ADMIN_USER',
        'ADMIN_PASSWORD'
    )) {
        if (-not (Get-DotEnvValue $key)) {
            throw "$key is required for the reversible PPM_WOV admin step."
        }
    }
    if ((Get-DotEnvValue 'TECHNICIAN_ADMIN_PERMISSION_MUTATION_CONFIRMED') -ne 'true') {
        throw 'Set TECHNICIAN_ADMIN_PERMISSION_MUTATION_CONFIRMED=true in .env after approving the reversible role-permission change.'
    }
    $values = [ordered]@{
        ANDROID_HOME                          = $androidSdkRoot
        ANDROID_SDK_ROOT                      = $androidSdkRoot
        APP_TARGET                            = 'technician'
        MOBILE_PLATFORM                       = 'android'
        APP_ENV                               = 'production'
        DEVICE_TARGET                         = $DeviceTarget
        ANDROID_UDID                          = $DeviceSerial
        APP_SOURCE                            = 'installed'
        PLAYSTORE_BETA_CONFIRMED              = 'true'
        APP_EXPECTED_PLAYSTORE_VERSION_NAME   = $(if ($ExpectedBuildVersion) { $ExpectedBuildVersion } else { '' })
        # The shared schema coerces an empty string to zero. Technician uses the
        # build version name, so neutralize any stale .env minimum with a safe
        # positive floor rather than conflating version name and version code.
        APP_EXPECTED_PLAYSTORE_VERSION_CODE   = '1'
        APP_EXPECTED_IN_APP_VERSION           = $ExpectedInAppVersion
        APP_BASELINE_PRODUCTION_CONFIRMED     = 'false'
        PRODUCTION_SMOKE_CONFIRMED            = 'true'
        PRODUCTION_CREDENTIAL_LOGIN_CONFIRMED = $(if ($AllowCredentialLogin) { 'true' } else { 'false' })
        PRODUCTION_TEST_ACCOUNT_CONFIRMED     = 'false'
        TEST_LANE                             = 'production-smoke'
        RESET_MODE                            = 'retain'
        RUN_HARDWARE_TESTS                    = 'false'
        ALLOW_MUTATIONS                       = 'false'
        TECHNICIAN_WOV_EXPECTED_SEQUENCE      = $qrSequence
        TECHNICIAN_FORCE_RELOGIN_AFTER_PERMISSION_CHANGE = 'true'
    }
    foreach ($entry in $values.GetEnumerator()) {
        [Environment]::SetEnvironmentVariable($entry.Key, $entry.Value, 'Process')
    }
    if ($ExpectedGreeting) {
        [Environment]::SetEnvironmentVariable(
            'TECHNICIAN_EXPECTED_GREETING',
            $ExpectedGreeting,
            'Process'
        )
    }
    $resolvedQrRunFile = $null
    if ($TechnicianQrRunFile) {
        $resolvedQrRunFile = (Resolve-Path -LiteralPath $TechnicianQrRunFile -ErrorAction Stop).Path
    }
    if ($resolvedQrRunFile) {
        [Environment]::SetEnvironmentVariable(
            'TECHNICIAN_QR_RUN_FILE',
            $resolvedQrRunFile,
            'Process'
        )
    }
}

function Invoke-PpmWovAdminGate {
    param([Parameter(Mandatory)][ValidateSet('prepare', 'restore')][string]$Mode)
    & node.exe --import tsx scripts/technician-ppm-wov-admin.ts $Mode
    if ($LASTEXITCODE -ne 0) {
        throw "PPM_WOV admin gate '$Mode' failed with exit code $LASTEXITCODE."
    }
}

function Set-ComplaintRegressionEnvironment {
    if ($DeviceTarget -ne 'physical') {
        throw 'Complaint lifecycle requires -DeviceTarget physical and an explicit physical -DeviceSerial.'
    }
    $requiredKeys = @(
        'TECHNICIAN_TEST_COMPLAINT_CATEGORY',
        'TECHNICIAN_TEST_COMPLAINT_SUBCATEGORY',
        'TECHNICIAN_TEST_COMPLAINT_LOCATION',
        'TECHNICIAN_TEST_COMPLAINT_STAFF',
        'TECHNICIAN_COMPLAINT_ADMIN_EVIDENCE_DIR'
    )
    foreach ($key in $requiredKeys) {
        if (-not (Get-DotEnvValue $key)) {
            throw "$key is required for -IncludeComplaintLifecycle."
        }
    }
    $complaintUsername = Get-DotEnvValue 'TECHNICIAN_USERNAME'
    $complaintPassword = Get-DotEnvValue 'TECHNICIAN_PASSWORD'
    if (-not $complaintUsername -or -not $complaintPassword) {
        throw 'TECHNICIAN_USERNAME and TECHNICIAN_PASSWORD are required for the complaint lifecycle account.'
    }
    [Environment]::SetEnvironmentVariable('TEST_LANE', 'production-regression', 'Process')
    [Environment]::SetEnvironmentVariable('DEVICE_TARGET', 'physical', 'Process')
    [Environment]::SetEnvironmentVariable('RUN_HARDWARE_TESTS', 'true', 'Process')
    [Environment]::SetEnvironmentVariable('ALLOW_MUTATIONS', 'true', 'Process')
    [Environment]::SetEnvironmentVariable('PRODUCTION_TEST_ACCOUNT_CONFIRMED', 'true', 'Process')
    [Environment]::SetEnvironmentVariable('PRODUCTION_CREDENTIAL_LOGIN_CONFIRMED', 'true', 'Process')
    [Environment]::SetEnvironmentVariable('TECHNICIAN_USERNAME', $complaintUsername, 'Process')
    [Environment]::SetEnvironmentVariable('TECHNICIAN_PASSWORD', $complaintPassword, 'Process')
}

function Invoke-Npm {
    param([Parameter(Mandatory)][string[]]$Arguments)
    & npm.cmd @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "npm $($Arguments -join ' ') failed with exit code $LASTEXITCODE."
    }
}

function Invoke-PlayStorePreflight {
    & node.exe --import tsx scripts/playstore-preflight.ts
    if ($LASTEXITCODE -ne 0) {
        throw "Play Store preflight failed with exit code $LASTEXITCODE."
    }
}

try {
    Set-Location -LiteralPath $script:RepositoryRoot
    $script:ResolvedEmulator = Resolve-AndroidTool -Tool emulator -ExplicitPath $EmulatorPath
    if ($AdbPath) {
        $script:ResolvedAdb = Resolve-AndroidTool -Tool adb -ExplicitPath $AdbPath
    }
    else {
        # Keep the emulator and ADB on the same SDK installation. Mixing a PATH
        # platform-tools build with Android Studio's emulator can leave shell
        # commands blocked while Appium initializes UiAutomator2.
        $emulatorSdkRoot = Split-Path (Split-Path $script:ResolvedEmulator -Parent) -Parent
        $sdkAdb = Join-Path $emulatorSdkRoot 'platform-tools\adb.exe'
        $script:ResolvedAdb = Resolve-AndroidTool -Tool adb -ExplicitPath $sdkAdb
    }

    Write-Step 'Starting ADB and preparing the emulator'
    Initialize-AdbServer
    Start-OrReuseEmulator
    Set-SafeSmokeEnvironment

    if (-not $SkipPlayStorePreflight) {
        $targetDescription = if ($ExpectedBuildVersion) {
            "build $ExpectedBuildVersion"
        }
        else {
            'the latest enrolled Technician build'
        }
        Write-Step "Installing or updating $targetDescription"
        Invoke-PlayStorePreflight
    }
    Assert-TechnicianBuildVersion
    Assert-TechnicianInAppVersion

    if (-not $SkipAppiumSetup) {
        Write-Step 'Checking the repository-local Appium installation'
        Invoke-Npm -Arguments @('run', 'appium:setup')
    }

    $permissionStateFile = Get-DotEnvValue 'TECHNICIAN_ADMIN_PERMISSION_STATE_FILE'
    if (-not $permissionStateFile) {
        $permissionStateFile = 'artifacts/admin-gates/technician-ppm-wov.json'
    }
    $resolvedPermissionStateFile = if ([IO.Path]::IsPathRooted($permissionStateFile)) {
        $permissionStateFile
    }
    else {
        Join-Path $script:RepositoryRoot $permissionStateFile
    }
    if (Test-Path -LiteralPath $resolvedPermissionStateFile) {
        throw "A previous PPM_WOV gate state exists at '$resolvedPermissionStateFile'. Restore or archive it before starting another run."
    }

    Write-Step 'Admin login: verifying PPM_WOV ON, then setting and verifying OFF'
    try {
        Invoke-PpmWovAdminGate -Mode prepare
        Write-Step 'Running the read-only Technician production-smoke suite with QR routing'
        Invoke-Npm -Arguments @('run', 'test:production-smoke')
    }
    finally {
        Write-Step 'Admin login: restoring and verifying the original PPM_WOV state'
        Invoke-PpmWovAdminGate -Mode restore
    }
    if ($IncludeComplaintLifecycle) {
        Write-Step 'Running the guarded Technician complaint lifecycle phase'
        Set-ComplaintRegressionEnvironment
        Invoke-Npm -Arguments @(
            'run',
            'test:production-regression',
            '--',
            '--spec',
            'tests/technician/production-regression/complaint-addition.spec.ts',
            '--spec',
            'tests/technician/production-regression/hardware/complaint-access.spec.ts'
        )
    }
    $verifiedVersions = @()
    if ($ExpectedInAppVersion) { $verifiedVersions += "in-app $ExpectedInAppVersion" }
    if ($ExpectedBuildVersion) { $verifiedVersions += "build $ExpectedBuildVersion" }
    Write-Host "`nTechnician smoke checks passed ($($verifiedVersions -join ', '))." -ForegroundColor Green
}
catch {
    Write-Error $_
    exit 1
}
finally {
    Set-Location -LiteralPath $script:RepositoryRoot
}
