# Face recognition (single image)

- **Route:** `POST /api/v1/face/verify` (not `/api/face/verify` without `v1`).
- **Auth:** Bearer JWT (borrower). Body must include `borrower_id` equal to the authenticated user.
- **Payload:** `{ "borrower_id": <int>, "image": "<base64 JPEG/PNG>" }`
- **Reference face:** Latest loan `face_photo_path` (public disk), same as liveness.
- **Storage:** Captured uploads under `storage/app/face_verification/{borrower_id}/...`
- **DB:** `face_verifications` table; activity logs `borrower.face_verified` / `borrower.face_verification_failed`.

Config: `config/face_verification.php`. AWS: same `AWS_*` env vars as Rekognition liveness.
