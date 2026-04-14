# Borrower liveness verification (AWS Rekognition)

## Endpoint

- **Method:** `POST`
- **Path:** `/api/v1/liveness/verify` (Laravel `routes/api.php` uses prefix `v1` under `/api`)
- **Full URL (examples):**
  - Direct PHP: `http://127.0.0.1:8000/api/v1/liveness/verify`
  - With Vite dev server: `http://localhost:5173/api/v1/liveness/verify` (Vite proxies `/api` to Laravel — see root `vite.config.js`)

There is **no** `/api/liveness/verify` route without `v1`.

- **Auth:** `Authorization: Bearer <borrower JWT>` (same token as `/api/v1/borrower/me`).

React calls a relative path such as `/liveness/verify` against the **normalized** API base that already includes `/api/v1` (see `src/utils/lendingLaravelApi.js`).

## Browser camera

`getUserMedia` requires **HTTPS** or **`http://localhost`** / **`http://127.0.0.1`**. Same rule as the loan application face capture.

## Reference face (required)

The API compares the live selfie to the **latest loan** for this borrower where:

- `loans.face_photo_path` is set (public disk, from the KYC apply flow).

If none exists, the API returns **HTTP 422** with a clear message.

## AWS IAM (minimum)

Attach a policy that allows **Amazon Rekognition** in the **same region** as `AWS_DEFAULT_REGION` (e.g. `ap-southeast-1`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "RekognitionCompareFacesForLiveness",
      "Effect": "Allow",
      "Action": ["rekognition:CompareFaces"],
      "Resource": "*"
    }
  ]
}
```

Tighten `Resource` if your org uses AWS Organizations / SCPs; for standard Rekognition APIs, `*` is typical.

## Environment (Laravel API)

Set in `amalgated-lending-api/.env`:

| Variable | Purpose |
|----------|---------|
| `AWS_ACCESS_KEY_ID` | IAM user or role access key |
| `AWS_SECRET_ACCESS_KEY` | Secret |
| `AWS_DEFAULT_REGION` | Must match where you allow Rekognition (e.g. `ap-southeast-1`) |
| `LIVENESS_MAX_ATTEMPTS_24H` | Optional; default `3` |
| `LIVENESS_MIN_SIMILARITY` | Optional; default `85` (percent) |
| `LIVENESS_MAX_IMAGE_BYTES` | Optional; default `2097152` (2 MB per image) |

Runtime tuning: `config/liveness.php`.

## Health check

If credentials are missing, liveness returns **503** with a message that verification is not configured.
