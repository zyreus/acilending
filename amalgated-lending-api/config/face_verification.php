<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Face recognition (single image vs loan KYC reference)
    |--------------------------------------------------------------------------
    |
    | Route: POST /api/v1/face/verify (borrower JWT).
    | Reference image: latest loan face_photo_path (same as liveness).
    |
    */

    'verify_path' => '/api/v1/face/verify',

    'max_attempts_per_24h' => (int) env('FACE_VERIFY_MAX_ATTEMPTS_24H', 3),

    'min_similarity' => (float) env('FACE_VERIFY_MIN_SIMILARITY', 85),

    'max_image_bytes' => (int) env('FACE_VERIFY_MAX_IMAGE_BYTES', 2097152),

];
