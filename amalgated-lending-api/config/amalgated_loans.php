<?php

/**
 * General loan application: exactly one loan_type drives visible fields and documents.
 * Document paths live in loan_applications.documents JSON (keys below).
 */
return [
    'general_loan_types' => [
        'salary' => 'Salary Loan',
        'chattel' => 'Chattel Mortgage Loan',
        'real_estate' => 'Real Estate Mortgage Loan',
        'sss_pension' => 'SSS / GSIS Pension Loan',
    ],

    /*
    | Each loan_type => [ key => [ label, required, multiple ] ]
    | Keys must match FileUpload field names: documents.{key}
    */
    'general_documents' => [
        'salary' => [
            'valid_ids' => ['label' => 'Valid IDs (2 government-issued)', 'required' => true, 'multiple' => true],
            'payslip' => ['label' => 'Payslip (latest)', 'required' => true, 'multiple' => false],
            'billing' => ['label' => 'Proof of billing', 'required' => true, 'multiple' => false],
            'barangay_cert' => ['label' => 'Barangay certificate / clearance', 'required' => true, 'multiple' => false],
        ],
        'chattel' => [
            'valid_ids' => ['label' => 'Valid IDs (2 government-issued)', 'required' => true, 'multiple' => true],
            'or_cr' => ['label' => 'OR/CR (official receipt & certificate of registration)', 'required' => true, 'multiple' => true],
            'stencil' => ['label' => 'Stencil', 'required' => true, 'multiple' => false],
            'income_proof' => ['label' => 'Proof of income', 'required' => true, 'multiple' => false],
            'bank_statement' => ['label' => 'Bank statement', 'required' => true, 'multiple' => true],
        ],
        'real_estate' => [
            'valid_ids' => ['label' => 'Valid IDs (2 government-issued)', 'required' => true, 'multiple' => true],
            'ctc' => ['label' => 'Certified true copy (CTC) of title / related', 'required' => true, 'multiple' => true],
            'tax_declaration' => ['label' => 'Tax declaration', 'required' => true, 'multiple' => true],
            'sketch_map' => ['label' => 'Sketch map / vicinity map', 'required' => true, 'multiple' => false],
            'income_proof' => ['label' => 'Proof of income', 'required' => true, 'multiple' => false],
        ],
        'sss_pension' => [
            'valid_ids' => ['label' => 'Valid IDs (2 government-issued)', 'required' => true, 'multiple' => true],
            'psa' => ['label' => 'PSA birth certificate / marriage certificate (as applicable)', 'required' => true, 'multiple' => false],
            'bank_statement' => ['label' => 'Bank statement', 'required' => true, 'multiple' => true],
            'billing' => ['label' => 'Proof of billing', 'required' => true, 'multiple' => false],
        ],
    ],

    /*
    | Extra structured fields per loan_type (stored in form_data JSON).
    | type: text | textarea | numeric
    | required: only enforced when loan_type matches
    */
    'general_form_fields' => [
        'salary' => [
            ['key' => 'employer_name', 'label' => 'Employer name', 'type' => 'text', 'required' => true],
            ['key' => 'employer_address', 'label' => 'Employer address', 'type' => 'textarea', 'required' => true],
            ['key' => 'employer_phone', 'label' => 'Employer phone', 'type' => 'text', 'required' => false],
            ['key' => 'monthly_salary', 'label' => 'Monthly gross salary (PHP)', 'type' => 'numeric', 'required' => true],
        ],
        'chattel' => [
            ['key' => 'vehicle_description', 'label' => 'Vehicle / collateral description', 'type' => 'textarea', 'required' => true],
            ['key' => 'plate_number', 'label' => 'Plate / serial no.', 'type' => 'text', 'required' => true],
            ['key' => 'comaker_name', 'label' => 'Co-maker full name', 'type' => 'text', 'required' => true],
            ['key' => 'comaker_phone', 'label' => 'Co-maker phone', 'type' => 'text', 'required' => true],
            ['key' => 'comaker_email', 'label' => 'Co-maker email', 'type' => 'text', 'required' => false],
        ],
        'real_estate' => [
            ['key' => 'property_location', 'label' => 'Property location', 'type' => 'textarea', 'required' => true],
            ['key' => 'property_value', 'label' => 'Estimated value (PHP)', 'type' => 'numeric', 'required' => false],
        ],
        'sss_pension' => [
            ['key' => 'pension_type', 'label' => 'Pension type (SSS / GSIS / other)', 'type' => 'text', 'required' => true],
            ['key' => 'monthly_pension', 'label' => 'Monthly pension (PHP)', 'type' => 'numeric', 'required' => true],
        ],
    ],

    /*
    | Borrower multi-step wizard — common fields (flat keys in form_data).
    | required_for_loan_types: null = always required once loan_type is set; else list of loan_type keys.
    */
    'wizard_common' => [
        ['group' => 'personal', 'key' => 'full_name', 'label' => 'Full name', 'type' => 'text', 'required_for_loan_types' => null],
        ['group' => 'personal', 'key' => 'email', 'label' => 'Email', 'type' => 'email', 'required_for_loan_types' => null],
        ['group' => 'personal', 'key' => 'phone', 'label' => 'Mobile number', 'type' => 'text', 'required_for_loan_types' => null],
        ['group' => 'personal', 'key' => 'address', 'label' => 'Current address', 'type' => 'textarea', 'required_for_loan_types' => null],
        ['group' => 'personal', 'key' => 'birthdate', 'label' => 'Date of birth', 'type' => 'date', 'required_for_loan_types' => null],
        ['group' => 'personal', 'key' => 'tin', 'label' => 'TIN', 'type' => 'text', 'required_for_loan_types' => null],
        ['group' => 'employment', 'key' => 'employment_status', 'label' => 'Employment status', 'type' => 'text', 'required_for_loan_types' => ['salary', 'chattel', 'real_estate', 'sss_pension']],
        ['group' => 'employment', 'key' => 'employer_business_name', 'label' => 'Employer / business name', 'type' => 'text', 'required_for_loan_types' => ['salary', 'chattel']],
        ['group' => 'employment', 'key' => 'job_title', 'label' => 'Position / title', 'type' => 'text', 'required_for_loan_types' => ['salary', 'chattel']],
        ['group' => 'employment', 'key' => 'years_in_work', 'label' => 'Years in current work', 'type' => 'numeric', 'required_for_loan_types' => ['salary', 'chattel']],
        ['group' => 'financial', 'key' => 'monthly_income', 'label' => 'Total monthly income (PHP)', 'type' => 'numeric', 'required_for_loan_types' => null],
        ['group' => 'financial', 'key' => 'monthly_expenses', 'label' => 'Monthly expenses (PHP)', 'type' => 'numeric', 'required_for_loan_types' => null],
        ['group' => 'financial', 'key' => 'other_debts', 'label' => 'Other monthly debt payments (PHP)', 'type' => 'numeric', 'required_for_loan_types' => []],
    ],

    'travel_documents' => [
        'passport' => ['label' => 'Passport', 'required' => true, 'multiple' => false],
        'valid_ids' => ['label' => 'Two (2) valid IDs', 'required' => true, 'multiple' => true],
        'photo_2x2' => ['label' => '2×2 picture', 'required' => true, 'multiple' => false],
        'visa' => ['label' => 'Visa (if applicable)', 'required' => false, 'multiple' => false],
        'cedula' => ['label' => 'Community Tax Certificate (Cedula)', 'required' => true, 'multiple' => false],
    ],
];
