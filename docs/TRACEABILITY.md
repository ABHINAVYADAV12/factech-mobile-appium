# Mobile traceability status

Status: **Connected — verified on 2026-08-26**.

Authoritative sources:

- [iSocietyManager App Smoke](https://isocietymanager.atlassian.net/wiki/spaces/T/pages/734265345/ISM+App+Smoke), source page version 5
- [Technician App Smoke](https://isocietymanager.atlassian.net/wiki/spaces/T/pages/732528655/Technician+App+Smoke), source page version 5
- [Feature, Requirement and Test Registry](https://isocietymanager.atlassian.net/wiki/spaces/T/pages/725778453/Feature+Requirement+and+Test+Registry), reviewed at version 4
- [Application and Functional Family Registry](https://isocietymanager.atlassian.net/wiki/spaces/T/pages/725090317/Application+and+Functional+Family+Registry), reviewed at version 6

The source smoke pages contain historical feature labels such as `LOGIN` and `ASSET_SCAN`. Those are retained only as `sourceFeatureLabel`. They are not treated as canonical Feature Codes because the registries do not establish those mappings. The Technician registry currently establishes `TEC-ATT-001` for attendance/geofencing only; that does not authorize mappings for the smoke cases. The Resident application also needs registry confirmation.

Executable v1 source cases:

| Source case | Lane             | Device               | Classification                  |
| ----------- | ---------------- | -------------------- | ------------------------------- |
| `ISM_SK001` | observe smoke    | emulator or physical | read-only                       |
| `TEC_SK001` | observe smoke    | emulator or physical | read-only                       |
| `TEC_SK002` | observe hardware | physical             | read-only, operator-assisted QR |

Every other source case remains explicitly classified in `src/traceability/catalog.ts` as planned, mutation-blocked, external-blocked, or hardware-blocked. New canonical mappings require registry authority; this repository will not invent `MTC-*`, Feature, Story, or AC identifiers.
