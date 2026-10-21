# Technician beta smoke PowerShell runner

The one-click runner starts or reuses the selected Android device, validates the
installed Technician versions, prepares Appium, applies the reversible
`PPM_WOV.R` admin gate, and runs the production smoke lane.

It reads `D:\workfactech\factech-mobile-appium\.env`. Keep this ignored file
local and configure:

```dotenv
APP_EXPECTED_IN_APP_VERSION=2.2.57
APP_EXPECTED_PLAYSTORE_VERSION_NAME=6.0.7
TECHNICIAN_USERNAME=
TECHNICIAN_PASSWORD=
TECHNICIAN_EXPECTED_GREETING=
TECHNICIAN_WOV_EXPECTED_SEQUENCE=
ISM_API_BASE_URL=
ADMIN_USER=
ADMIN_PASSWORD=
TECHNICIAN_ADMIN_PERMISSION_MUTATION_CONFIRMED=true
TECHNICIAN_ADMIN_PERMISSION_STATE_FILE=artifacts/admin-gates/technician-ppm-wov.json
```

Run from the repository root:

```powershell
pwsh -File .\scripts\run-technician-beta-smoke.ps1
```

The admin step derives the target site and role from the normal Technician
account, saves the complete original permission map, verifies `PPM_WOV.R` both
on and off, leaves it off during smoke, and restores the exact original map in a
`finally` block. The mobile launch then logs out any retained session and signs
in with the configured Technician account so cached permissions are refreshed.

Permission state files are stored under ignored `artifacts/`. A leftover active
state file stops the next run so an interrupted permission change cannot be
silently overwritten.
