<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\VerifiesFaceWithLoanReference;
use App\Http\Controllers\Controller;
use App\Models\LivenessVerification;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Services\RekognitionFaceCompareService;
use App\Services\RekognitionFaceLivenessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

/**
 * POST {APP_URL}/api/v1/liveness/verify — AWS Rekognition CompareFaces. Borrower JWT.
 * POST {APP_URL}/api/v1/liveness/faceio-verify — FaceIO fio.js.
 * POST/GET {APP_URL}/api/v1/liveness/amplify-session* — Rekognition streaming Face Liveness (Amplify UI).
 */
class LivenessController extends Controller
{
    use VerifiesFaceWithLoanReference;

    public function __construct(
        private RekognitionFaceCompareService $rekognition,
        private RekognitionFaceLivenessService $faceLiveness,
        private ActivityLogger $activityLogger,
    ) {
    }

    private function amplifyBindKey(string $sessionId): string
    {
        return 'face_liveness_bind:'.hash('sha256', $sessionId);
    }

    private function amplifyDoneKey(string $sessionId): string
    {
        return 'face_liveness_done:'.hash('sha256', $sessionId);
    }

    public function verify(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        if (! $user->canUseBorrowerPortal()) {
            return response()->json(['ok' => false, 'message' => 'Borrower access required.'], 403);
        }

        $maxAttempts = (int) config('liveness.max_attempts_per_24h', 3);
        $recentCount = LivenessVerification::query()
            ->where('borrower_id', $user->id)
            ->where('created_at', '>=', now()->subDay())
            ->count();
        if ($recentCount >= $maxAttempts) {
            return response()->json([
                'status' => 'failed',
                'message' => 'Maximum liveness verification attempts reached. Try again after 24 hours.',
            ], 429);
        }

        $validator = Validator::make($request->all(), [
            'borrower_id' => 'nullable|integer',
            'images' => 'required|array|size:3',
            'images.*' => 'required|string',
            'final_image' => 'required|string',
        ]);
        if ($validator->fails()) {
            return response()->json([
                'status' => 'failed',
                'message' => $validator->errors()->first() ?: 'Validation failed.',
            ], 422);
        }

        $maxBytes = (int) config('liveness.max_image_bytes', 2097152);
        $decodedAction = [];
        foreach ($request->input('images', []) as $i => $b64) {
            $bin = $this->decodeBase64Image((string) $b64);
            if ($bin === null) {
                return response()->json([
                    'status' => 'failed',
                    'message' => 'Invalid action image encoding at index '.$i.'.',
                ], 422);
            }
            if (strlen($bin) > $maxBytes) {
                return response()->json([
                    'status' => 'failed',
                    'message' => 'Action image too large.',
                ], 422);
            }
            if (! $this->isAllowedImageBinary($bin)) {
                return response()->json([
                    'status' => 'failed',
                    'message' => 'Action images must be JPEG or PNG.',
                ], 422);
            }
            $decodedAction[] = $bin;
        }

        $finalBin = $this->decodeBase64Image((string) $request->input('final_image'));
        if ($finalBin === null) {
            return response()->json([
                'status' => 'failed',
                'message' => 'Invalid final image encoding.',
            ], 422);
        }
        if (strlen($finalBin) > $maxBytes) {
            return response()->json([
                'status' => 'failed',
                'message' => 'Final image too large.',
            ], 422);
        }
        if (! $this->isAllowedImageBinary($finalBin)) {
            return response()->json([
                'status' => 'failed',
                'message' => 'Final image must be JPEG or PNG.',
            ], 422);
        }

        $referenceBytes = $this->loadReferenceFaceBytes($user);
        if ($referenceBytes === null) {
            return response()->json([
                'status' => 'failed',
                'message' => 'No reference face on file. Complete a loan application with face capture first.',
            ], 422);
        }

        if (! $this->rekognition->isConfigured()) {
            return response()->json([
                'status' => 'failed',
                'message' => 'Liveness verification is not configured (AWS credentials missing).',
            ], 503);
        }

        $dir = 'liveness/'.$user->id.'/'.Str::uuid()->toString();
        $storedPaths = [];
        foreach ($decodedAction as $idx => $bytes) {
            $ext = $this->detectExtension($bytes);
            $rel = $dir.'/action_'.$idx.'.'.$ext;
            Storage::disk('local')->put($rel, $bytes);
            $storedPaths[] = $rel;
        }
        $finalExt = $this->detectExtension($finalBin);
        $finalRel = $dir.'/final.'.$finalExt;
        Storage::disk('local')->put($finalRel, $finalBin);

        $minSimilarity = (float) config('liveness.min_similarity', 85);
        $compare = $this->rekognition->safeCompare($referenceBytes, $finalBin, (int) floor($minSimilarity));

        $similarity = $compare['similarity'];
        $error = $compare['error'] ?? null;

        $verified = $similarity !== null
            && $similarity >= $minSimilarity
            && $error === null;

        $failureReason = null;
        if (! $verified) {
            if ($error !== null) {
                $failureReason = 'aws_error';
            } elseif ($similarity === null) {
                $failureReason = 'no_face_match';
            } else {
                $failureReason = 'similarity_below_threshold';
            }
        }

        $record = LivenessVerification::create([
            'borrower_id' => $user->id,
            'images' => $storedPaths,
            'final_image' => $finalRel,
            'similarity_score' => $similarity,
            'status' => $verified ? LivenessVerification::STATUS_VERIFIED : LivenessVerification::STATUS_FAILED,
            'failure_reason' => $failureReason,
        ]);

        if ($verified) {
            $this->activityLogger->log($user, 'borrower.liveness_verified', $record, [
                'similarity' => $similarity,
                'liveness_verification_id' => $record->id,
            ]);

            return response()->json([
                'status' => 'verified',
                'similarity' => round((float) $similarity, 2),
                'message' => 'Identity verified successfully',
            ]);
        }

        $this->activityLogger->log($user, 'borrower.liveness_failed', $record, [
            'similarity' => $similarity,
            'failure_reason' => $failureReason,
            'liveness_verification_id' => $record->id,
        ]);

        return response()->json([
            'status' => 'failed',
            'message' => $error !== null
                ? 'Face comparison service error.'
                : 'Face does not match or liveness failed',
            'similarity' => $similarity !== null ? round((float) $similarity, 2) : null,
        ], 422);
    }

    /**
     * Start Rekognition streaming Face Liveness session for Amplify FaceLivenessDetector.
     */
    public function createAmplifySession(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        if (! $user->canUseBorrowerPortal()) {
            return response()->json(['ok' => false, 'message' => 'Borrower access required.'], 403);
        }

        $maxAttempts = (int) config('liveness.max_attempts_per_24h', 3);
        $recentCount = LivenessVerification::query()
            ->where('borrower_id', $user->id)
            ->where('created_at', '>=', now()->subDay())
            ->count();
        if ($recentCount >= $maxAttempts) {
            return response()->json([
                'status' => 'failed',
                'message' => 'Maximum liveness verification attempts reached. Try again after 24 hours.',
            ], 429);
        }

        if (! $this->faceLiveness->isConfigured()) {
            return response()->json([
                'status' => 'failed',
                'message' => 'Face Liveness is not configured (set AWS credentials and LIVENESS_AMPLIFY_REGION).',
            ], 503);
        }

        try {
            $sessionId = $this->faceLiveness->createSession();
        } catch (\Throwable $e) {
            report($e);
            Log::warning('liveness.amplify.create_failed', [
                'borrower_id' => $user->id,
                'errors' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'failed',
                'message' => 'Could not start liveness session. Check region supports Face Liveness (e.g. us-east-1).',
            ], 503);
        }

        Cache::put($this->amplifyBindKey($sessionId), $user->id, now()->addMinutes(20));

        Log::info('liveness.amplify.session_created', [
            'borrower_id' => $user->id,
            'ip' => $request->ip(),
        ]);

        return response()->json([
            'sessionId' => $sessionId,
            'region' => (string) config('liveness.amplify_region'),
        ]);
    }

    public function getAmplifySessionResults(Request $request, string $sessionId): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        if (! $user->canUseBorrowerPortal()) {
            return response()->json(['ok' => false, 'message' => 'Borrower access required.'], 403);
        }

        $doneKey = $this->amplifyDoneKey($sessionId);
        $cached = Cache::get($doneKey);
        if (is_array($cached)) {
            return response()->json($cached);
        }

        $bindKey = $this->amplifyBindKey($sessionId);
        $cachedUserId = Cache::get($bindKey);
        if ($cachedUserId !== $user->id) {
            return response()->json([
                'status' => 'failed',
                'message' => 'Invalid or expired liveness session.',
            ], 403);
        }

        $raw = $this->faceLiveness->safeGetSessionResults($sessionId);
        if (isset($raw['error'])) {
            return response()->json([
                'status' => 'failed',
                'message' => 'Could not read liveness results from AWS.',
            ], 503);
        }

        $awsStatus = $raw['Status'] ?? '';
        if ($awsStatus === 'CREATED' || $awsStatus === 'IN_PROGRESS') {
            return response()->json([
                'status' => 'pending',
                'awsStatus' => $awsStatus,
                'message' => 'Analysis still in progress.',
            ], 202);
        }

        $maxAttempts = (int) config('liveness.max_attempts_per_24h', 3);
        $recentCount = LivenessVerification::query()
            ->where('borrower_id', $user->id)
            ->where('created_at', '>=', now()->subDay())
            ->count();
        if ($recentCount >= $maxAttempts) {
            Cache::forget($bindKey);
            $payload = [
                'status' => 'failed',
                'isLive' => false,
                'awsStatus' => $awsStatus,
                'message' => 'Maximum liveness verification attempts reached. Try again after 24 hours.',
            ];
            Cache::put($doneKey, $payload, now()->addMinutes(10));

            return response()->json($payload, 429);
        }

        Cache::forget($bindKey);

        $confidence = $raw['Confidence'] ?? null;
        $minConf = (float) config('liveness.amplify_min_confidence', 80);
        $verified = $awsStatus === 'SUCCEEDED'
            && $confidence !== null
            && (float) $confidence >= $minConf;

        $failureReason = null;
        if (! $verified) {
            if ($awsStatus === 'SUCCEEDED' && $confidence !== null && (float) $confidence < $minConf) {
                $failureReason = 'amplify_below_threshold';
            } elseif ($awsStatus === 'FAILED') {
                $failureReason = 'amplify_rejected';
            } elseif ($awsStatus === 'EXPIRED') {
                $failureReason = 'amplify_expired';
            } else {
                $failureReason = 'amplify_'.$awsStatus;
            }
        }

        $record = LivenessVerification::create([
            'borrower_id' => $user->id,
            'face_id' => null,
            'confidence' => $confidence !== null ? round((float) $confidence / 100, 6) : null,
            'images' => null,
            'final_image' => null,
            'similarity_score' => $confidence,
            'status' => $verified ? LivenessVerification::STATUS_VERIFIED : LivenessVerification::STATUS_FAILED,
            'failure_reason' => $failureReason,
        ]);

        if ($verified) {
            $this->activityLogger->log($user, 'borrower.amplify_liveness_verified', $record, [
                'confidence' => $confidence,
                'liveness_verification_id' => $record->id,
            ]);

            $payload = [
                'status' => 'verified',
                'isLive' => true,
                'awsStatus' => $awsStatus,
                'confidence' => $confidence !== null ? round((float) $confidence, 2) : null,
                'message' => 'Liveness verification successful',
            ];
            Cache::put($doneKey, $payload, now()->addMinutes(10));

            return response()->json($payload);
        }

        $this->activityLogger->log($user, 'borrower.amplify_liveness_failed', $record, [
            'confidence' => $confidence,
            'liveness_verification_id' => $record->id,
            'aws_status' => $awsStatus,
        ]);

        $payload = [
            'status' => 'failed',
            'isLive' => false,
            'awsStatus' => $awsStatus,
            'confidence' => $confidence !== null ? round((float) $confidence, 2) : null,
            'message' => 'Liveness verification failed',
        ];
        Cache::put($doneKey, $payload, now()->addMinutes(10));

        return response()->json($payload, 422);
    }

    /**
     * FaceIO CDN (fio.js) — authenticate() result posted here. POST /api/v1/liveness/faceio-verify
     */
    public function verifyFaceIO(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        if (! $user->canUseBorrowerPortal()) {
            return response()->json(['ok' => false, 'message' => 'Borrower access required.'], 403);
        }

        Log::info('liveness.faceio.attempt', [
            'borrower_id' => $user->id,
            'ip' => $request->ip(),
        ]);

        $maxAttempts = (int) config('liveness.max_attempts_per_24h', 3);
        $recentCount = LivenessVerification::query()
            ->where('borrower_id', $user->id)
            ->where('created_at', '>=', now()->subDay())
            ->count();
        if ($recentCount >= $maxAttempts) {
            return response()->json([
                'status' => 'failed',
                'message' => 'Maximum liveness verification attempts reached. Try again after 24 hours.',
            ], 429);
        }

        $validator = Validator::make($request->all(), [
            'borrower_id' => 'required|integer|exists:users,id',
            'face_id' => 'required|string|max:512',
            'confidence' => 'required|numeric',
        ]);

        if ($validator->fails()) {
            Log::warning('liveness.faceio.validation_failed', [
                'borrower_id' => $user->id,
                'errors' => $validator->errors()->toArray(),
            ]);

            return response()->json([
                'status' => 'failed',
                'message' => $validator->errors()->first() ?: 'Validation failed.',
            ], 422);
        }

        $borrowerId = (int) $request->input('borrower_id');
        if ($borrowerId !== (int) $user->id) {
            return response()->json([
                'status' => 'failed',
                'message' => 'borrower_id must match the authenticated account.',
            ], 403);
        }

        $confidenceRaw = (float) $request->input('confidence');
        $confidence = $confidenceRaw;
        if ($confidence > 1.0) {
            $confidence = $confidence / 100.0;
        }
        $confidence = max(0.0, min(1.0, $confidence));

        $minConf = (float) config('liveness.faceio_min_confidence', 0.8);
        $verified = $confidence >= $minConf;

        $record = LivenessVerification::create([
            'borrower_id' => $user->id,
            'face_id' => $request->input('face_id'),
            'confidence' => $confidence,
            'images' => null,
            'final_image' => null,
            'similarity_score' => null,
            'status' => $verified ? LivenessVerification::STATUS_VERIFIED : LivenessVerification::STATUS_FAILED,
            'failure_reason' => $verified ? null : 'faceio_below_threshold',
        ]);

        if ($verified) {
            $this->activityLogger->log($user, 'borrower.faceio_liveness_verified', $record, [
                'confidence' => $confidence,
                'liveness_verification_id' => $record->id,
            ]);

            return response()->json([
                'status' => 'verified',
                'message' => 'Liveness verification successful',
                'confidence' => round($confidence, 4),
            ]);
        }

        $this->activityLogger->log($user, 'borrower.faceio_liveness_failed', $record, [
            'confidence' => $confidence,
            'liveness_verification_id' => $record->id,
        ]);

        return response()->json([
            'status' => 'failed',
            'message' => 'Liveness verification failed',
            'confidence' => round($confidence, 4),
        ], 422);
    }
}
