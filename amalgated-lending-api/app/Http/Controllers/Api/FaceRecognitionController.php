<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\VerifiesFaceWithLoanReference;
use App\Http\Controllers\Controller;
use App\Models\FaceVerification;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Services\RekognitionFaceCompareService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

/**
 * POST {APP_URL}/api/v1/face/verify — single-image face match (no liveness). Borrower JWT.
 */
class FaceRecognitionController extends Controller
{
    use VerifiesFaceWithLoanReference;

    public function __construct(
        private RekognitionFaceCompareService $rekognition,
        private ActivityLogger $activityLogger,
    ) {
    }

    public function verify(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        if (! $user->canUseBorrowerPortal()) {
            return response()->json(['ok' => false, 'message' => 'Borrower access required.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'borrower_id' => 'required|integer|exists:users,id',
            'image' => 'required|string',
        ]);

        if ($validator->fails()) {
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

        $maxAttempts = (int) config('face_verification.max_attempts_per_24h', 3);
        $recentCount = FaceVerification::query()
            ->where('borrower_id', $user->id)
            ->where('created_at', '>=', now()->subDay())
            ->count();
        if ($recentCount >= $maxAttempts) {
            return response()->json([
                'status' => 'failed',
                'message' => 'Maximum face verification attempts reached. Try again after 24 hours.',
            ], 429);
        }

        $maxBytes = (int) config('face_verification.max_image_bytes', 2097152);
        $imageBin = $this->decodeBase64Image((string) $request->input('image'));
        if ($imageBin === null) {
            return response()->json([
                'status' => 'failed',
                'message' => 'Invalid image encoding.',
            ], 422);
        }
        if (strlen($imageBin) > $maxBytes) {
            return response()->json([
                'status' => 'failed',
                'message' => 'Image too large.',
            ], 422);
        }
        if (! $this->isAllowedImageBinary($imageBin)) {
            return response()->json([
                'status' => 'failed',
                'message' => 'Image must be JPEG or PNG.',
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
                'message' => 'Face verification is not configured (AWS credentials missing).',
            ], 503);
        }

        $rel = 'face_verification/'.$user->id.'/'.Str::uuid()->toString().'.'.$this->detectExtension($imageBin);
        Storage::disk('local')->put($rel, $imageBin);

        $minSimilarity = (float) config('face_verification.min_similarity', 85);
        $compare = $this->rekognition->safeCompare($referenceBytes, $imageBin, (int) floor($minSimilarity));

        $similarity = $compare['similarity'];
        $error = $compare['error'] ?? null;

        $verified = $similarity !== null
            && $similarity >= $minSimilarity
            && $error === null;

        $record = FaceVerification::create([
            'borrower_id' => $user->id,
            'captured_image' => $rel,
            'similarity_score' => $similarity,
            'status' => $verified ? FaceVerification::STATUS_VERIFIED : FaceVerification::STATUS_FAILED,
        ]);

        if ($verified) {
            $this->activityLogger->log($user, 'borrower.face_verified', $record, [
                'similarity' => $similarity,
                'face_verification_id' => $record->id,
            ]);

            return response()->json([
                'status' => 'verified',
                'similarity' => round((float) $similarity, 2),
                'message' => 'Face matched successfully',
            ]);
        }

        $this->activityLogger->log($user, 'borrower.face_verification_failed', $record, [
            'similarity' => $similarity,
            'face_verification_id' => $record->id,
        ]);

        return response()->json([
            'status' => 'failed',
            'message' => $error !== null ? 'Face comparison service error.' : 'Face does not match',
            'similarity' => $similarity !== null ? round((float) $similarity, 2) : null,
        ], 422);
    }
}
