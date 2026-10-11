# Patient 2.0 UI integration notes

The canonical patient application is `patient/ui`. This folder is the
teammate UI/design source. UI assets and presentation are copied into the
canonical app only after checking them against the authenticated workflows.

## Copied exactly

- `src/components/FloatingMediBot.jsx` presentation and controls
- `src/components/FloatingMediBot.css`
- `src/pages/AssistantScreen.jsx` presentation and chat layout
- `src/pages/AssistantScreen.css`
- `public/images/medibot-avatar.jpg`
- `react-icons` dependency required by the 2.0 assistant send icon

The copied MediBot presentation uses the canonical `mediBotApi` service and
patient-scoped browser storage. The copied Assistant presentation keeps the
canonical report-grounded `patientApi.queryAssistant` workflow and does not
replace it with the MediBot service.

## Files with workflow conflicts

These 2.0 files must not be copied verbatim into `patient/ui`:

| 2.0 file | Conflict | Canonical handling |
| --- | --- | --- |
| `src/App.jsx` | Always renders the shell and assumes a demo session; it does not protect the authenticated portal or mount the integrated services correctly. | Keep canonical auth-aware shell and authenticated MediBot mount. |
| `src/context/PatientContext.jsx` | Uses demo patient switching/local state instead of restoring the signed patient session. | Keep canonical OTP session restoration, ownership, logout, and encounter state. |
| `src/routes/AppRoutes.jsx` | Uses the demo route flow and does not preserve the canonical protected routes. | Keep canonical protected routes and provider-QR continuation. |
| `src/services/patientApi.js` | Uses demo/local data and different method signatures. | Keep canonical `/api` requests and patient ownership enforcement. |
| `src/components/PatientSwitcherModal.jsx` | Offers demo patient switching and local patient creation. | Keep the authenticated profile and sign-out behavior. |
| `src/pages/HomeScreen.jsx` | Reads reports/grants through demo-oriented method signatures and owns MediBot rendering. | Keep canonical authenticated report/grant calls; MediBot is mounted by the authenticated app shell. |
| `src/pages/ReportsScreen.jsx` | Passes a demo patient ID to report loading. | Keep the canonical session-derived report request. |
| `src/pages/TimelineScreen.jsx` | Reads a synchronous local timeline. | Keep the canonical authenticated asynchronous timeline request. |
| `src/pages/WaitingRoomScreen.jsx` | Polls local storage only. | Keep server-side encounter polling and patient ownership checks. |
| `src/components/LabPermissionModal.jsx` | Uses the demo laboratory payload flow. | Keep the canonical laboratory grant request while retaining the 2.0 visual design. |

## Rule for future teammate changes

Copy compatible visual/layout/assets changes from this folder into
`patient/ui`, `lab/ui`, or `doctor/ui` after review. Preserve the canonical
authentication, API service, ownership, persistence, and queue/report
workflow. If a future UI change conflicts with those workflows, record the
file and the specific conflict here before adapting it.
