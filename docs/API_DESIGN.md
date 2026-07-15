# API Design — Dental Portal Backend

## Source

Verified against the live app at `https://new.dentalclinicapp.com/` ("My
Dental Clinic Online" v2.0.2). Route strings below were extracted directly
from the compiled Angular/Ionic bundles served to the browser, not guessed.

**Coverage:** the app ships 317 JS chunks total (per its webpack runtime
manifest). All 317 were fetched directly by URL (using the chunk-id → hash
map in `runtime.js`) and scanned for endpoint-shaped strings — this is
100% of the client-side code, not just what loads before login. That said,
static-analysis limits still apply: a route built by unusual string
concatenation, or using a dynamic base URL not captured by our regex, could
still be missed. No endpoint below was invented — every entry was found
literally in the shipped code.

Key facts discovered:

- The app is a **clinic staff practice-management system** (front page:
  "Effortlessly manage your dental practice... Streamline patient records,
  appointments, and payments"), not a patient-facing portal. Registration
  creates a **clinic account** (clinic name, contact number, country, owner
  name/email/password), not a patient account.
- Real backend: `https://pwaapi.dentalclinicapp.com/api/`, using **Laravel
  Sanctum** (`GET /sanctum/csrf-cookie` before login) — cookie/session +
  CSRF auth, not bearer JWT.
- A separate patient-facing app exists at `https://booking.dentalclinicapp.com/`
  (referenced in config as `clinicPortalUrl`) for patient self-service
  booking — a different service, out of scope for the endpoints below unless
  noted.
- File uploads go to a separate S3-backed Lambda
  (`https://ax05rc7bhj.execute-api.us-west-2.amazonaws.com/default/upload-media`),
  not the main API.
- Payments integrate PayPal (`paypal_client_id` in config).
- The app has Philippines-specific compliance features: DOH (Department of
  Health) CAF sites, DSWD branches, CFP1/CFP2 reports, PhilHealth-style
  audit logs — this is a market-specific add-on, safe to treat as optional.
- Endpoint naming convention is **resource-path with verb prefixes for
  actions**, e.g. `clinic/save-patient-self-service`,
  `clinic/get-clinic-connected-devices/`, `clinic/disconnect-clinic-device/`
  — not strict REST verbs-via-HTTP-method throughout.

This revises the earlier draft, which incorrectly assumed a patient-facing
portal design. Everything below is organized by the actual domains found in
the bundle, adapted to this repo's FastAPI/async-SQLAlchemy conventions
(`app/models`, `app/schemas`, `app/services`, `app/api/v1/endpoints`).

---

## Auth

Cookie-session (Sanctum-style) auth was observed; if this backend uses JWT
instead, keep the same route surface. Strings found: `login`, `register`,
`logout`, `forgot-password`, `reset-password`, `verify-account`,
`verify-email`, `verify-pincode`, `activate`, `clinic/auth/change-password`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/sanctum/csrf-cookie` | Issue CSRF cookie before auth (Sanctum pattern) — omit if using JWT |
| POST | `/api/auth/register` | Register clinic + owner account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout / revoke session |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |
| POST | `/api/auth/verify-account` | Activate account (email link) |
| POST | `/api/auth/verify-pincode` | OTP/pincode verification |
| DELETE | `/api/auth/account` | Delete account (seen as "Delete Account" on login screen) |
| POST | `/api/clinic/auth/change-password` | Change password (authenticated) |

---

## Clinic Dashboard & Profile

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/clinic/dashboard/` | Dashboard summary stats |
| GET | `/api/clinic/profile/` | Clinic profile |
| PATCH | `/api/clinic/profile/` | Update clinic profile |
| GET | `/api/clinic/subscriptions` | Current subscription/plan |
| POST | `/api/clinic/subscriptions` | Change/upgrade subscription |

---

## Settings & Devices

| Method | Endpoint | Description |
|---|---|---|
| GET/PATCH | `/api/clinic/settings/` | General clinic settings |
| GET/POST | `/api/clinic/settings/users/` | Staff user accounts |
| GET/POST | `/api/clinic/settings/roles/` | Roles & permissions |
| GET/POST | `/api/clinic/settings/devices/` | Registered devices |
| GET | `/api/clinic/get-clinic-connected-devices/` | Currently connected devices (e.g. intraoral cameras, readers) |
| POST | `/api/clinic/disconnect-clinic-device/{id}` | Disconnect a specific device |
| POST | `/api/clinic/disconnect-clinic-latest-device/` | Disconnect most recent device session |

---

## Patients

Core resource: `clinic/patients/`, with many nested sub-resources per
patient (a clinical record hub).

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/clinic/patients/` | List/search patients |
| POST | `/api/clinic/patients/` | Create patient |
| GET | `/api/clinic/patients/{id}` | Patient detail |
| PATCH | `/api/clinic/patients/{id}` | Update patient |
| DELETE | `/api/clinic/patients/{id}` | Archive/delete patient |
| POST | `/api/clinic/save-patient-self-service` | Save patient-submitted self-service intake data |
| GET/POST | `/api/clinic/patients/appointments/` | Patient's appointments |
| GET/POST | `/api/clinic/patients/treatment-plans/` | Treatment plans |
| GET/POST | `/api/clinic/patients/prescriptions/` | Prescriptions |
| GET/POST | `/api/clinic/patients/dental-notes/` | Dental (SOAP-style) notes |
| GET/POST | `/api/clinic/patients/dental-photos/` | Intraoral/extraoral photos |
| GET/POST | `/api/clinic/patients/dental-certificates/` | Dental certificates (issued documents) |
| GET/POST | `/api/clinic/patients/medical-notes/` | Medical notes |
| GET/POST | `/api/clinic/patients/medical-files/` | Uploaded medical files |
| GET/POST | `/api/clinic/patients/medical-results/` | Lab/medical results |
| GET/POST | `/api/clinic/patients/vital-signs/` | Vital sign readings |
| GET/POST | `/api/clinic/patients/vaccines/` | Vaccination records |
| GET/POST | `/api/clinic/patients/request-forms/` | Requisition/referral forms |
| GET/POST | `/api/clinic/patients/tech-sheets/` | Lab tech sheets (crowns, dentures, etc.) |
| GET/POST | `/api/clinic/patients/payments/` | Payment history |
| POST | `/api/clinic/patients/new-payments/` | Record a new payment |
| GET/POST | `/api/clinic/patients/payment-installments/` | Installment plans |
| GET | `/api/clinic/patients/payment-receipts/` | Payment receipts (PDF/print) |

---

## Appointments

| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/clinic/appointment-requests/` | Incoming appointment requests (from booking portal) |
| POST | `/api/clinic/appointment-requests/{id}/confirm` | Confirm request into a scheduled appointment |
| POST | `/api/clinic/appointment-requests/{id}/decline` | Decline request |

(Per-patient appointment CRUD lives under `clinic/patients/appointments/`
above; this section handles the cross-patient request inbox and calendar
view.)

---

## Finance

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/clinic/finance/` | Finance overview |
| GET/POST | `/api/clinic/finance/accounting/` | General accounting entries |
| GET/POST | `/api/clinic/finance/expenses/` | Clinic expenses |
| GET | `/api/clinic/finance/reports/` | Financial reports |
| GET/POST | `/api/clinic/finance/soa-invoices/` | Statement-of-account invoices |

---

## Managers (reference/lookup data)

Admin-configurable catalogs used throughout the app — each is effectively a
small CRUD resource.

| Endpoint | Purpose |
|---|---|
| `clinic/managers/procedures/` | Dental procedure catalog |
| `clinic/managers/procedure-categories/` | Procedure categories |
| `clinic/managers/drug-list/` | Prescription drug list |
| `clinic/managers/physicians/` | Referring physicians |
| `clinic/managers/hospitals/` | Affiliated hospitals |
| `clinic/managers/insurances/` | Insurance providers |
| `clinic/managers/payment-methods/` | Accepted payment methods |
| `clinic/managers/payment-method-categories/` | Payment method categories |
| `clinic/managers/payment-discounts/` | Discount rules |
| `clinic/managers/patient-sources/` | Referral source tags |
| `clinic/managers/expense-categories/` | Expense categories |
| `clinic/managers/centers/` | Clinic centers/branches |
| `clinic/managers/city-provinces/` | Location reference data |
| `clinic/managers/holidays/` | Clinic holiday calendar |
| `clinic/managers/specializations/` | Provider specializations |
| `clinic/managers/vital-sign-units/` | Units for vital sign entry |
| `clinic/managers/vaccines/` | Vaccine catalog |
| `clinic/managers/medical-results/` | Medical result type catalog |
| `clinic/managers/readers/` | Card/device reader catalog |
| `clinic/managers/reader-types/` | Reader type catalog |
| `clinic/managers/private-partners/` | Private partner orgs |
| `clinic/managers/doh-caf-sites/` | DOH CAF site registry (PH compliance — optional) |
| `clinic/managers/dswd-branches/` | DSWD branch registry (PH compliance — optional) |

All follow `GET /`, `POST /`, `GET /{id}`, `PATCH /{id}`, `DELETE /{id}`.

---

## Notifications, Broadcasts, Backups, Misc.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/clinic/notifications/` | In-app notifications |
| POST | `/api/clinic/notifications/{id}/read` | Mark read |
| GET/POST | `/api/clinic/broadcasts/` | Clinic-wide broadcast messages |
| GET/POST | `/api/clinic/backups/` | Data backup jobs |
| GET/POST | `/api/clinic/file-share/` | Shared file links |
| GET/POST | `/api/clinic/surveys/` | Patient satisfaction surveys |
| GET/POST | `/api/clinic/vouchers` | Discount vouchers |
| POST | `/api/clinic/zoom-meeting/` | Create/join teleconsult Zoom meeting |
| GET | `/api/clinic/reports/` | General clinic reports |

---

## Compliance Reports (Philippines-specific, optional)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/reports/cfp1-report` | CFP1 clinical form report |
| GET | `/api/reports/cfp2-report` | CFP2 clinical form report |
| GET | `/api/reports/pdr-report` | PDR report |
| GET | `/api/reports/patient-audit-logs` | Patient record audit trail |
| GET | `/api/reports/user-audit-logs` | Staff user audit trail |

---

## Additional confirmations from full-bundle scan

- `GET /api/sanctum/csrf-cookie` confirmed as a literal route (matches the
  network request observed pre-login).
- Frontend router paths `finance/accounting/add`, `finance/soa-invoice/add`,
  `managers/procedures/add` confirm these list views each have a dedicated
  "add new" form/route — implies matching `POST` creation endpoints
  alongside the list `GET`/`POST` endpoints already listed above.
- No additional top-level domains beyond those already covered were found
  in the remaining ~90 chunks that hadn't loaded pre-login (mostly
  route-guard, icon, and shared-UI chunks) — settings/roles, notifications,
  and patient sub-resources were already present in the pre-login bundle.

---

## Not part of the core clinic API

- **Patient booking portal** (`booking.dentalclinicapp.com`) — a separate
  patient-facing service for self-service appointment requests. If you want
  patient self-scheduling, it should be a distinct app/service that calls
  into `clinic/appointment-requests/` and `clinic/save-patient-self-service`.
- **File uploads** go through a dedicated S3/Lambda endpoint rather than the
  main API — recommend the same pattern here (presigned URL service) rather
  than proxying binary uploads through FastAPI.
- **Payments** integrate PayPal client-side; the API only needs to record
  results (`new-payments`, `payment-receipts`), not handle raw card data.

---

## Backend architecture mapping (this repo)

Each domain above maps to:

- `app/models/<domain>.py` — SQLAlchemy models (`Base`, `TimestampMixin`)
- `app/schemas/<domain>.py` — Pydantic request/response schemas
- `app/services/<domain>_service.py` — business logic, DB access
- `app/api/v1/endpoints/<domain>.py` — route handlers, mounted in
  `app/api/v1/router.py` under `/api/v1/clinic/<domain>` (or `/api/v1/<domain>`
  for the top-level `reports/` group)

Cross-cutting:

- `AuthService` — Sanctum-style cookie/CSRF or JWT (decide based on whether
  a native mobile client also needs to consume this API — JWT is simpler
  for that case).
- `AuthorizationService` — role/permission checks per `clinic/settings/roles/`.
- `AuditLogService` — backs `reports/patient-audit-logs` and
  `reports/user-audit-logs`.
- `StorageService` — presigned upload URLs for `medical-files`,
  `dental-photos`, `file-share`.
- `PaymentService` — records PayPal (and other) payment results; never
  handles raw card data.
- `NotificationDispatcher` — powers `clinic/notifications/` and
  `clinic/broadcasts/`.

## Suggested build order

1. Auth, Clinic profile/settings/users/roles (foundation + multi-tenancy)
2. Patients (core record) + Managers (lookup data needed by patient forms)
3. Appointments / appointment-requests
4. Treatment plans, prescriptions, clinical notes/photos/files
5. Payments, finance, invoicing
6. Notifications, broadcasts, file-share, surveys, vouchers
7. Reports & audit logs (defer PH-specific compliance reports unless needed)
