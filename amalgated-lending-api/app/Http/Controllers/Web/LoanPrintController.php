<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\LoanApplication;
use App\Models\TravelApplication;
use App\Support\LoanApplicationDocumentStatus;
use Illuminate\Http\Request;
use Illuminate\View\View;

class LoanPrintController extends Controller
{
    public function generalLoan(Request $request, LoanApplication $loanApplication): View
    {
        $this->authorizePrint($request, $loanApplication->user_id);

        $loanApplication->loadMissing(['borrower', 'loan']);

        $documents = $loanApplication->documents ?? [];
        $docStatus = LoanApplicationDocumentStatus::forGeneralLoanType($loanApplication->loan_type, $documents);

        // Merge loan.application_payload with form_data so print matches admin/submitted data without gaps;
        // form_data wins on key conflicts.
        $payload = $loanApplication->loan?->application_payload;
        $payload = is_array($payload) ? $payload : [];
        $formData = $loanApplication->form_data ?? [];
        $form = array_merge($payload, is_array($formData) ? $formData : []);

        return view('print.general_loan_application', [
            'app' => $loanApplication,
            'borrower' => $loanApplication->borrower,
            'form' => $form,
            'documents' => $documents,
            'docStatus' => $docStatus,
            'loanTypeLabel' => config('amalgated_loans.general_loan_types')[$loanApplication->loan_type] ?? $loanApplication->loan_type,
        ]);
    }

    public function travelLoan(Request $request, TravelApplication $travelApplication): View
    {
        $this->authorizePrint($request, $travelApplication->user_id);

        $travelApplication->loadMissing('borrower');

        $documents = $travelApplication->documents ?? [];
        $docStatus = LoanApplicationDocumentStatus::forTravel($documents);

        return view('print.travel_application', [
            'app' => $travelApplication,
            'borrower' => $travelApplication->borrower,
            't' => $travelApplication->travel_specific_fields ?? [],
            'documents' => $documents,
            'docStatus' => $docStatus,
        ]);
    }

    private function authorizePrint(Request $request, int $ownerUserId): void
    {
        if ($request->hasValidSignature()) {
            return;
        }

        $user = $request->user();
        if ($user && (int) $user->id === $ownerUserId) {
            return;
        }
        if ($user && method_exists($user, 'canAccessAdminPortal') && $user->canAccessAdminPortal()) {
            return;
        }
        abort(403);
    }
}
