# Travel Assistance Loan — Full Wizard

## Overview

The Travel Assistance product uses a **multi-section wizard** (loan, personal, employment, spouse, dependents, contacts, uploads, signature, terms) submitted to:

- `POST /api/v1/loan/apply` (multipart: `wizard_payload` JSON + files + `terms_accepted` + optional `signature_data` / `signature_date` + `password`)

Admin APIs (JWT, same as other lending admin routes):

- `GET /api/v1/loan/list` — paginated travel applications (`loan_type = travel_assistance`)
- `GET /api/v1/loan/export` — CSV export
- `GET /api/v1/loan/{loanApplication}` — full detail (wizard JSON, dependents, contacts, documents, CAM)
- `PUT /api/v1/loan/{loanApplication}` — update credit memorandum + pending loan principal/term/rate
- `DELETE /api/v1/loan/{loanApplication}` — pending only
- `POST /api/v1/loan/{loanApplication}/receipt` — upsert receipt row for the loan

Permissions: `loans.view` for read/export; `loans.approve` for write/delete/receipt.

## Database

Migrations add:

- `travel_loan_wizard_forms` — JSON `wizard_data`, terms, signature
- `loan_application_dependents`, `loan_application_contact_persons`
- `loan_credit_memoranda` — CAM fields
- `loan_receipts` — receipt lines (editable)

Run:

```bash
cd amalgated-lending-api
php artisan migrate
```

## Sample data (optional)

```bash
php artisan db:seed --class=TravelLoanWizardSampleSeeder
```

Creates a pending demo application for `travel-demo@amalgated-lending.local` (password `DemoTravel1!`).

## Frontend

- Public form: `/loans/travel-assistance` (`TravelAssistanceLoanPage.jsx`)
- Admin list: `/admin/travel-loans`
- Drafts: stored in `localStorage` under key `amalgated_travel_loan_wizard_draft_v1`
- Print: browser **Print** button (save as PDF from the print dialog)

## Email / PDF

Submission uses existing `LoanApplicationReceivedMail`. Attachments as PDF for receipts can be added later (e.g. `barryvdh/laravel-dompdf`); HTML receipt body is supported via `LoanReceipt` + mail templates.

## Legacy endpoint

The previous simplified endpoint remains:

- `POST /api/v1/public/travel-assistance-loan/apply`

The new wizard uses `POST /api/v1/loan/apply` only.
