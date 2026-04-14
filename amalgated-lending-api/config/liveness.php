<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Borrower liveness verification
    |--------------------------------------------------------------------------
    |
    | Two flows (Bearer JWT, borrower role, routes in routes/api.php):
    |
    | 1) AWS Rekognition - POST /api/v1/liveness/verify
    |    Compares captured frames to the reference face on the latest loan
    |    (face_photo_path from KYC). Tuning: min_similarity, max_image_bytes.
    |
    | 2) FaceIO (fio.js) - POST /api/v1/liveness/faceio-verify
    |    Client sends facialId + confidence from faceio.authenticate().
    |    Tuning: faceio_min_confidence (default 0.8, env FACEIO_MIN_CONFIDENCE).
    |
    | 3) AWS Amplify FaceLivenessDetector - POST /api/v1/liveness/amplify-session
    |    and GET .../amplify-session/{sessionId}/results
    |    Region LIVENESS_AMPLIFY_REGION must support Face Liveness (often us-east-1).
    |    Frontend needs Cognito Identity Pool (VITE_AWS_COGNITO_IDENTITY_POOL_ID) for credentials.
    |
    | Shared: max_attempts_per_24h counts all liveness_verifications rows.
    | Camera in browser: HTTPS or http://localhost|127.0.0.1 for getUserMedia.
    |
    */

    'verify_path' => '/api/v1/liveness/verify',

    'max_attempts_per_24h' => (int) env('LIVENESS_MAX_ATTEMPTS_24H', 3),

    'min_similarity' => (float) env('LIVENESS_MIN_SIMILARITY', 85),

    'max_image_bytes' => (int) env('LIVENESS_MAX_IMAGE_BYTES', 2097152),

    'faceio_min_confidence' => (float) env('FACEIO_MIN_CONFIDENCE', 0.8),

    'faceio_verify_path' => '/api/v1/liveness/faceio-verify',

    /*
    | Rekognition streaming Face Liveness (Amplify UI FaceLivenessDetector)
    */
    'amplify_region' => env('LIVENESS_AMPLIFY_REGION', 'us-east-1'),

    'amplify_min_confidence' => (float) env('LIVENESS_AMPLIFY_MIN_CONFIDENCE', 80),

];
