<?php

use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\AdminLeadController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BorrowerController;
use App\Http\Controllers\Api\BorrowerAuthController;
use App\Http\Controllers\Api\BorrowerPortalController;
use App\Http\Controllers\Api\BorrowerLendingSignatureController;
use App\Http\Controllers\Api\BorrowerLoanApplicationWizardController;
use App\Http\Controllers\Api\ChattelMortgageController;
use App\Http\Controllers\Api\RealEstateMortgageController;
use App\Http\Controllers\Api\SalaryLoanController;
use App\Http\Controllers\Api\TravelAssistanceController;
use App\Http\Controllers\Api\TravelLoanWizardController;
use App\Http\Controllers\Api\TravelLoanApplicationAdminController;
use App\Http\Controllers\Api\SssPensionLoanController;
use App\Http\Controllers\Api\CmsController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\LoanController;
use App\Http\Controllers\Api\FaceRecognitionController;
use App\Http\Controllers\Api\LivenessController;
use App\Http\Controllers\Api\DocumentLoanAdminController;
use App\Http\Controllers\Api\DocumentLoanApplicationController;
use App\Http\Controllers\Api\LoanProductController;
use App\Http\Controllers\Api\NavigationController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\BorrowerNotificationController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\PublicLeadController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\SystemSettingController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
| Amalgated Lending — REST API (JWT + dynamic RBAC)
*/

Route::prefix('v1')->group(function () {
    Route::get('/health', fn () => response()->json(['ok' => true]));

    Route::post('/admin/login', [AdminAuthController::class, 'login']);
    Route::post('/borrower/login', [BorrowerAuthController::class, 'login']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/borrower/forgot-password', [PasswordResetController::class, 'requestBorrower']);
    Route::post('/admin/forgot-password', [PasswordResetController::class, 'requestAdmin']);
    Route::post('/password/reset', [PasswordResetController::class, 'reset']);

    Route::post('/liveness/verify', [LivenessController::class, 'verify'])
        ->middleware(['auth:api', 'active', 'borrower', 'throttle:liveness']);

    Route::post('/liveness/faceio-verify', [LivenessController::class, 'verifyFaceIO'])
        ->middleware(['auth:api', 'active', 'borrower', 'throttle:liveness']);

    Route::post('/liveness/amplify-session', [LivenessController::class, 'createAmplifySession'])
        ->middleware(['auth:api', 'active', 'borrower', 'throttle:liveness']);

    Route::get('/liveness/amplify-session/{sessionId}/results', [LivenessController::class, 'getAmplifySessionResults'])
        ->where('sessionId', '[a-zA-Z0-9\-]+')
        ->middleware(['auth:api', 'active', 'borrower', 'throttle:liveness']);

    Route::post('/face/verify', [FaceRecognitionController::class, 'verify'])
        ->middleware(['auth:api', 'active', 'borrower', 'throttle:face_verify']);

    Route::get('/public/cms', [CmsController::class, 'publicSection']);
    Route::get('/public/loan-products', [LoanProductController::class, 'publicIndex']);
    Route::post('/public/loan-products/calculate', [LoanProductController::class, 'calculate']);
    Route::get('/loan-products', [LoanProductController::class, 'publicIndex']);
    Route::get('/loan-products/slug/{slug}/requirements', [LoanProductController::class, 'documentRequirementsBySlug']);
    Route::get('/loan-products/{loanProduct}/requirements', [LoanProductController::class, 'documentRequirements']);

    Route::post('/loan-applications', [DocumentLoanApplicationController::class, 'store']);
    Route::post('/public/loan-applications', [LoanController::class, 'publicApply']);
    Route::post('/public/chattel-mortgage/apply', [ChattelMortgageController::class, 'apply']);
    Route::post('/public/real-estate-mortgage/apply', [RealEstateMortgageController::class, 'apply']);
    Route::post('/public/salary-loan/apply', [SalaryLoanController::class, 'apply']);
    Route::post('/public/travel-assistance-loan/apply', [TravelAssistanceController::class, 'apply']);
    Route::post('/public/sss-pension-loan/apply', [SssPensionLoanController::class, 'apply']);
    Route::post('/public/leads', [PublicLeadController::class, 'store']);
    Route::get('/public/leads/{lead}/messages', [PublicLeadController::class, 'messages']);
    Route::post('/public/leads/{lead}/messages', [PublicLeadController::class, 'sendMessage']);

    Route::middleware(['auth:api', 'active'])->group(function () {
        Route::get('/loan-applications/draft', [DocumentLoanApplicationController::class, 'currentDraft']);
        Route::get('/application/{documentLoanApplication}/print', [DocumentLoanApplicationController::class, 'printApplication']);
        Route::get('/loan-applications/{documentLoanApplication}', [DocumentLoanApplicationController::class, 'show']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::post('/auth/refresh', [AuthController::class, 'refresh']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::get('/navigation', [NavigationController::class, 'index']);

        Route::middleware('permission:dashboard.view')->group(function () {
            Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
            Route::get('/dashboard/charts', [DashboardController::class, 'charts']);
        });

        Route::middleware('permission:users.view')->group(function () {
            Route::get('/users', [UserController::class, 'index']);
            Route::get('/users/{user}', [UserController::class, 'show']);
        });
        Route::middleware('permission:users.manage')->group(function () {
            Route::post('/users', [UserController::class, 'store']);
            Route::put('/users/{user}', [UserController::class, 'update']);
            Route::delete('/users/{user}', [UserController::class, 'destroy']);
        });

        Route::middleware('permission:roles.manage')->group(function () {
            Route::get('/roles', [RoleController::class, 'index']);
            Route::post('/roles', [RoleController::class, 'store']);
            Route::get('/roles/{role}', [RoleController::class, 'show']);
            Route::put('/roles/{role}', [RoleController::class, 'update']);
            Route::delete('/roles/{role}', [RoleController::class, 'destroy']);
            Route::get('/permissions', [RoleController::class, 'permissionsIndex']);
            Route::post('/permissions', [PermissionController::class, 'store']);
            Route::put('/permissions/{permission}', [PermissionController::class, 'update']);
            Route::delete('/permissions/{permission}', [PermissionController::class, 'destroy']);
        });

        Route::middleware('permission:loans.view')->group(function () {
            Route::get('/loans', [LoanController::class, 'index']);
            Route::get('/loans/{loan}', [LoanController::class, 'show']);
        });
        Route::middleware('permission:loans.approve')->group(function () {
            Route::post('/loans', [LoanController::class, 'store']);
            Route::post('/loans/{loan}/approve', [LoanController::class, 'approve']);
            Route::post('/loans/{loan}/reject', [LoanController::class, 'reject']);
            Route::put('/loan/{loanApplication}', [TravelLoanApplicationAdminController::class, 'update']);
            Route::delete('/loan/{loanApplication}', [TravelLoanApplicationAdminController::class, 'destroy']);
            Route::post('/loan/{loanApplication}/receipt', [TravelLoanApplicationAdminController::class, 'upsertReceipt']);
        });

        Route::middleware('permission:loans.view')->group(function () {
            Route::get('/loan/list', [TravelLoanApplicationAdminController::class, 'index']);
            Route::get('/loan/export', [TravelLoanApplicationAdminController::class, 'exportExcel']);
            Route::get('/loan/{loanApplication}', [TravelLoanApplicationAdminController::class, 'show']);
        });

        Route::middleware('permission:loans.assign')->group(function () {
            Route::patch('/loans/{loan}/assign-officer', [LoanController::class, 'assignOfficer']);
        });

        Route::middleware('permission:borrowers.view')->group(function () {
            Route::get('/borrowers', [BorrowerController::class, 'index']);
            Route::get('/borrowers/{borrower}', [BorrowerController::class, 'show']);
        });

        Route::middleware('permission:borrowers.delete')->group(function () {
            Route::delete('/borrowers/{borrower}', [BorrowerController::class, 'destroy']);
        });

        Route::middleware('permission:reports.view')->group(function () {
            Route::get('/reports/summary', [ReportController::class, 'summary']);
        });

        Route::middleware('permission:payments.manage')->group(function () {
            Route::get('/payments', [PaymentController::class, 'index']);
            Route::put('/payments/{payment}', [PaymentController::class, 'record']);
            Route::patch('/payments/{payment}/status', [PaymentController::class, 'updateStatus']);
            Route::get('/users/{user}/payment-history', [PaymentController::class, 'forUser']);
        });

        Route::middleware('permission:cms.manage')->group(function () {
            Route::get('/cms', [CmsController::class, 'index']);
            Route::post('/cms', [CmsController::class, 'upsert']);
        });

        Route::middleware('permission:settings.manage')->group(function () {
            Route::get('/settings', [SystemSettingController::class, 'index']);
            Route::get('/settings/{key}', [SystemSettingController::class, 'show']);
            Route::post('/settings/{key}', [SystemSettingController::class, 'upsert']);
        });

        Route::middleware('permission:activity.view')->group(function () {
            Route::get('/activity-logs', [ActivityLogController::class, 'index']);
        });

        Route::middleware('permission:notifications.view')->group(function () {
            Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
            Route::get('/notifications', [NotificationController::class, 'index']);
            Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
            Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
        });

        Route::middleware('permission:loans.view')->group(function () {
            Route::get('/document-loan-applications', [DocumentLoanAdminController::class, 'index']);
            Route::get('/document-loan-applications/{documentLoanApplication}', [DocumentLoanAdminController::class, 'show']);
        });
        Route::middleware('permission:loans.approve')->group(function () {
            Route::patch('/uploaded-documents/{uploadedDocument}', [DocumentLoanAdminController::class, 'updateUpload']);
        });

        Route::middleware('borrower')->group(function () {
            Route::post('/loan-applications/borrower-draft', [DocumentLoanApplicationController::class, 'createBorrowerDraft']);
            Route::patch('/loan-applications/{documentLoanApplication}/wizard', [DocumentLoanApplicationController::class, 'patchWizard']);
            Route::post('/loan-applications/{documentLoanApplication}/embedded-documents', [DocumentLoanApplicationController::class, 'uploadEmbeddedDocument']);
            Route::post('/upload-document', [DocumentLoanApplicationController::class, 'upload']);
            Route::post('/reupload-document', [DocumentLoanApplicationController::class, 'reupload']);
            Route::post('/upload-signed-form', [DocumentLoanApplicationController::class, 'uploadSignedForm']);
            Route::post('/loan-applications/{documentLoanApplication}/submit', [DocumentLoanApplicationController::class, 'submit']);
        });
    });

    Route::prefix('admin')->middleware(['auth:api', 'active', 'admin'])->group(function () {
        Route::get('/me', [AdminAuthController::class, 'me']);
        Route::post('/logout', [AdminAuthController::class, 'logout']);
        Route::get('/dashboard', [DashboardController::class, 'summary']);
        Route::get('/leads', [AdminLeadController::class, 'index']);
        Route::get('/leads/{lead}', [AdminLeadController::class, 'show']);
        Route::put('/leads/{lead}', [AdminLeadController::class, 'update']);
        Route::delete('/leads/{lead}', [AdminLeadController::class, 'destroy']);
        Route::get('/leads/{lead}/messages', [AdminLeadController::class, 'messages']);
        Route::post('/leads/{lead}/messages', [AdminLeadController::class, 'sendMessage']);
        Route::post('/leads/{lead}/email', [AdminLeadController::class, 'sendEmail']);
        Route::get('/loan-products', [LoanProductController::class, 'adminIndex']);
        Route::post('/loan-products', [LoanProductController::class, 'store']);
        Route::put('/loan-products/{loanProduct}', [LoanProductController::class, 'update']);
        Route::delete('/loan-products/{loanProduct}', [LoanProductController::class, 'destroy']);
    });

    Route::prefix('borrower')->middleware(['auth:api', 'active', 'borrower'])->group(function () {
        Route::get('/loan-applications/wizard/schema', [BorrowerLoanApplicationWizardController::class, 'schema']);
        Route::get('/loan-applications', [BorrowerLoanApplicationWizardController::class, 'index']);
        Route::post('/loan-applications', [BorrowerLoanApplicationWizardController::class, 'store']);
        Route::get('/loan-applications/{loanApplication}', [BorrowerLoanApplicationWizardController::class, 'show']);
        Route::patch('/loan-applications/{loanApplication}', [BorrowerLoanApplicationWizardController::class, 'update']);
        Route::post('/loan-applications/{loanApplication}/documents/{docKey}', [BorrowerLoanApplicationWizardController::class, 'uploadDocument']);
        Route::delete('/loan-applications/{loanApplication}/documents/{docKey}', [BorrowerLoanApplicationWizardController::class, 'removeDocument']);
        Route::post('/loan-applications/{loanApplication}/validate-step', [BorrowerLoanApplicationWizardController::class, 'validateStep']);
        Route::post('/loan-applications/{loanApplication}/signature', [BorrowerLoanApplicationWizardController::class, 'saveSignature']);
        Route::post('/loan-applications/{loanApplication}/submit', [BorrowerLoanApplicationWizardController::class, 'submit']);
        Route::get('/document-loan-applications', [DocumentLoanApplicationController::class, 'borrowerIndex']);
        Route::get('/profile/documents', [BorrowerPortalController::class, 'profileDocuments']);
        Route::get('/lending-applications', [BorrowerPortalController::class, 'lendingApplications']);
        Route::post('/lending-applications/general/{loanApplication}/signature/applicant', [BorrowerLendingSignatureController::class, 'generalApplicant']);
        Route::post('/lending-applications/general/{loanApplication}/signature/spouse', [BorrowerLendingSignatureController::class, 'generalSpouse']);
        Route::post('/lending-applications/general/{loanApplication}/signature/comaker', [BorrowerLendingSignatureController::class, 'generalComaker']);
        Route::post('/lending-applications/travel/{travelApplication}/signature/applicant', [BorrowerLendingSignatureController::class, 'travelApplicant']);
        Route::post('/lending-applications/travel/{travelApplication}/signature/spouse', [BorrowerLendingSignatureController::class, 'travelSpouse']);
        Route::get('/me', [BorrowerAuthController::class, 'me']);
        Route::post('/logout', [BorrowerAuthController::class, 'logout']);
        Route::post('/change-password', [BorrowerAuthController::class, 'changePassword']);
        Route::get('/dashboard', [BorrowerPortalController::class, 'dashboard']);
        Route::get('/payments', [BorrowerPortalController::class, 'payments']);
        Route::get('/payments/history', [BorrowerPortalController::class, 'paymentHistory']);
        Route::post('/upload-payment', [BorrowerPortalController::class, 'uploadPayment']);
        Route::get('/notifications/unread-count', [BorrowerNotificationController::class, 'unreadCount']);
        Route::get('/notifications', [BorrowerNotificationController::class, 'index']);
        Route::post('/notifications/read-all', [BorrowerNotificationController::class, 'markAllRead']);
        Route::post('/notifications/{borrowerNotification}/read', [BorrowerNotificationController::class, 'markRead']);
        Route::post('/profile', [BorrowerPortalController::class, 'updateProfile']);
        Route::get('/chat/messages', [BorrowerPortalController::class, 'chatMessages']);
        Route::post('/chat/messages', [BorrowerPortalController::class, 'sendChatMessage']);
    });
});
