<?php

namespace Database\Seeders;

use App\Models\Loan;
use App\Models\LoanApplication;
use App\Models\LoanCreditMemorandum;
use App\Models\Role;
use App\Models\TravelLoanWizardForm;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Demo travel wizard application (optional — run: php artisan db:seed --class=TravelLoanWizardSampleSeeder).
 */
class TravelLoanWizardSampleSeeder extends Seeder
{
    public function run(): void
    {
        $email = 'travel-demo@amalgated-lending.local';
        if (LoanApplication::where('loan_type', LoanApplication::TYPE_TRAVEL_ASSISTANCE)->whereHas('borrower', fn ($q) => $q->where('email', $email))->exists()) {
            return;
        }

        $borrower = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => 'Demo Travel Applicant',
                'password' => Hash::make('DemoTravel1!'),
                'role' => 'borrower',
                'phone' => '09171234567',
                'is_active' => true,
            ]
        );
        $br = Role::where('slug', 'borrower')->first();
        if ($br) {
            $borrower->roles()->syncWithoutDetaching([$br->id]);
        }

        $wizard = [
            'loan' => [
                'amount_of_loan' => 50000,
                'purpose_of_loan' => 'Overseas training and certification travel expenses.',
                'desired_term' => 1,
                'country_destination' => 'Singapore',
                'referred_by' => 'Website',
                'travel_date' => now()->addMonth()->toDateString(),
            ],
            'personal' => [
                'email' => $email,
                'last_name' => 'Applicant',
                'first_name' => 'Demo',
                'middle_name' => 'Travel',
                'mobile_no' => '09171234567',
                'home_address' => '123 Sample St., Barangay 1',
                'city' => 'Davao City',
                'province' => 'Davao del Sur',
            ],
            'employment' => [
                'employment_type' => 'employed',
                'tin' => '123-456-789-000',
                'sss_gsis' => '33-1234567-8',
                'employer_name' => 'Sample Employer Inc.',
                'employer_address' => 'Business Park',
                'employer_tel' => '0821234567',
                'start_date' => '2020-01-15',
                'position' => 'Analyst',
            ],
            'dependents' => [],
            'contact_persons' => [],
        ];

        $loan = Loan::create([
            'borrower_id' => $borrower->id,
            'principal' => 50000,
            'term_months' => 1,
            'annual_interest_rate' => 42,
            'status' => Loan::STATUS_PENDING,
            'application_payload' => array_merge($wizard, ['wizard_version' => 2]),
        ]);

        $app = LoanApplication::create([
            'user_id' => $borrower->id,
            'loan_id' => $loan->id,
            'loan_type' => LoanApplication::TYPE_TRAVEL_ASSISTANCE,
            'destination_country' => 'Singapore',
            'travel_date' => now()->addMonth()->toDateString(),
            'purpose' => $wizard['loan']['purpose_of_loan'],
            'status' => LoanApplication::STATUS_PENDING,
        ]);

        TravelLoanWizardForm::create([
            'loan_application_id' => $app->id,
            'wizard_data' => $wizard,
            'terms_accepted' => true,
            'terms_accepted_at' => now(),
        ]);

        LoanCreditMemorandum::create([
            'loan_application_id' => $app->id,
            'date_application_received' => now()->toDateString(),
            'application_status' => 'complete',
            'documents_status' => 'pending_review',
            'payments_status' => 'n/a',
        ]);
    }
}
