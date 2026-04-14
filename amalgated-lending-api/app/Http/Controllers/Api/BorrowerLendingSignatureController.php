<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoanApplication;
use App\Models\TravelApplication;
use App\Services\SignatureStorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Borrower-facing signature upload (base64 PNG from canvas) for general / travel applications.
 */
class BorrowerLendingSignatureController extends Controller
{
    public function __construct(
        private SignatureStorageService $signatures,
    ) {
    }

    public function generalApplicant(Request $request, LoanApplication $loanApplication): JsonResponse
    {
        $this->authorizeOwner($request, (int) $loanApplication->user_id);

        $data = $request->validate([
            'signature_base64' => 'required|string',
        ]);

        $loanApplication->applicant_signature = $this->signatures->storeBase64Png($data['signature_base64'], 'signatures/general');
        $loanApplication->save();

        return response()->json(['ok' => true, 'path' => $loanApplication->applicant_signature]);
    }

    public function generalSpouse(Request $request, LoanApplication $loanApplication): JsonResponse
    {
        $this->authorizeOwner($request, (int) $loanApplication->user_id);

        $data = $request->validate([
            'signature_base64' => 'required|string',
        ]);

        $loanApplication->spouse_signature = $this->signatures->storeBase64Png($data['signature_base64'], 'signatures/general');
        $loanApplication->save();

        return response()->json(['ok' => true, 'path' => $loanApplication->spouse_signature]);
    }

    public function generalComaker(Request $request, LoanApplication $loanApplication): JsonResponse
    {
        $this->authorizeOwner($request, (int) $loanApplication->user_id);

        $data = $request->validate([
            'signature_base64' => 'required|string',
        ]);

        $loanApplication->comaker_signature = $this->signatures->storeBase64Png($data['signature_base64'], 'signatures/general');
        $loanApplication->save();

        return response()->json(['ok' => true, 'path' => $loanApplication->comaker_signature]);
    }

    public function travelApplicant(Request $request, TravelApplication $travelApplication): JsonResponse
    {
        $this->authorizeOwner($request, (int) $travelApplication->user_id);

        $data = $request->validate([
            'signature_base64' => 'required|string',
        ]);

        $travelApplication->applicant_signature = $this->signatures->storeBase64Png($data['signature_base64'], 'signatures/travel');
        $travelApplication->save();

        return response()->json(['ok' => true, 'path' => $travelApplication->applicant_signature]);
    }

    public function travelSpouse(Request $request, TravelApplication $travelApplication): JsonResponse
    {
        $this->authorizeOwner($request, (int) $travelApplication->user_id);

        $data = $request->validate([
            'signature_base64' => 'required|string',
        ]);

        $travelApplication->spouse_signature = $this->signatures->storeBase64Png($data['signature_base64'], 'signatures/travel');
        $travelApplication->save();

        return response()->json(['ok' => true, 'path' => $travelApplication->spouse_signature]);
    }

    private function authorizeOwner(Request $request, int $ownerUserId): void
    {
        $user = $request->user();
        if (! $user || (int) $user->id !== $ownerUserId) {
            abort(403);
        }
    }
}
