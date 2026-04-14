<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Loan Application</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.3/dist/cdn.min.js"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
                },
            },
        };
    </script>
    <style>
        [x-cloak] { display: none !important; }
    </style>
    <script>
        document.addEventListener('alpine:init', () => {
            Alpine.data('loanApplicationForm', () => ({
                mainStep: 1,
                appStep: 1,
                appMax: 3,
                dragOver: null,
                alertMessage: '',
                docNames: ['', '', ''],
                submittedSuccess: false,
                trimVal(name) {
                    const el = this.$refs[name];
                    if (!el) return '';
                    return String(el.value ?? '').trim();
                },
                dismissAlert() {
                    this.alertMessage = '';
                },
                get progressPercent() {
                    if (this.mainStep === 1) {
                        return (this.appStep / this.appMax) * 50;
                    }
                    const filled = this.docNames.filter(Boolean).length;
                    return 50 + (filled / 3) * 50;
                },
                get allDocumentsSelected() {
                    return this.docNames.every(Boolean);
                },
                validatePersonal() {
                    const msg =
                        'Please enter your full name, birthdate, address, contact number, and email before continuing.';
                    if (
                        !this.trimVal('fullName') ||
                        !this.trimVal('birthdate') ||
                        !this.trimVal('address') ||
                        !this.trimVal('phone') ||
                        !this.trimVal('email')
                    ) {
                        this.alertMessage = msg;
                        return false;
                    }
                    return true;
                },
                validateEmployment() {
                    const msg =
                        'Please enter your employer name, job title, and monthly income before continuing.';
                    if (!this.trimVal('employer') || !this.trimVal('jobTitle') || !this.trimVal('income')) {
                        this.alertMessage = msg;
                        return false;
                    }
                    return true;
                },
                validateLoan() {
                    const msg =
                        'Please select a loan product, enter a loan amount, choose a term, and describe the purpose before continuing.';
                    if (
                        !this.trimVal('product') ||
                        !this.trimVal('amount') ||
                        !this.trimVal('term') ||
                        !this.trimVal('purpose')
                    ) {
                        this.alertMessage = msg;
                        return false;
                    }
                    return true;
                },
                validateCurrent() {
                    if (this.appStep === 1) return this.validatePersonal();
                    if (this.appStep === 2) return this.validateEmployment();
                    if (this.appStep === 3) return this.validateLoan();
                    return true;
                },
                validateEntireApplication() {
                    if (!this.validatePersonal()) {
                        this.appStep = 1;
                        return false;
                    }
                    if (!this.validateEmployment()) {
                        this.appStep = 2;
                        return false;
                    }
                    if (!this.validateLoan()) {
                        this.appStep = 3;
                        return false;
                    }
                    return true;
                },
                next() {
                    if (this.submittedSuccess) return;
                    if (this.mainStep === 2) return;
                    if (!this.validateCurrent()) return;
                    if (this.appStep < this.appMax) {
                        this.appStep++;
                        this.alertMessage = '';
                        return;
                    }
                    this.mainStep = 2;
                    this.alertMessage = '';
                },
                prev() {
                    if (this.submittedSuccess) return;
                    if (this.mainStep === 2) {
                        this.mainStep = 1;
                        this.alertMessage = '';
                        return;
                    }
                    if (this.appStep > 1) {
                        this.appStep--;
                        this.alertMessage = '';
                    }
                },
                goMain(n) {
                    if (this.submittedSuccess) return;
                    if (n === 1) {
                        this.mainStep = 1;
                        this.alertMessage = '';
                        return;
                    }
                    if (n === 2) {
                        if (!this.validateEntireApplication()) return;
                        this.mainStep = 2;
                        this.alertMessage = '';
                    }
                },
                goApp(n) {
                    if (this.submittedSuccess || this.mainStep !== 1) return;
                    if (n < 1 || n > this.appMax) return;
                    if (n <= this.appStep) {
                        this.appStep = n;
                        this.alertMessage = '';
                        return;
                    }
                    while (this.appStep < n) {
                        if (!this.validateCurrent()) return;
                        this.appStep++;
                    }
                    this.alertMessage = '';
                },
                setDocFile(i, event) {
                    const f = event.target.files?.[0];
                    const next = [...this.docNames];
                    next[i] = f ? f.name : '';
                    this.docNames = next;
                },
                handleDrop(i, event) {
                    this.dragOver = null;
                    const f = event.dataTransfer.files?.[0];
                    if (!f) return;
                    const next = [...this.docNames];
                    next[i] = f.name;
                    this.docNames = next;
                },
                clearDoc(i) {
                    const next = [...this.docNames];
                    next[i] = '';
                    this.docNames = next;
                    const el = this.$refs['docInput' + i];
                    if (el) el.value = '';
                },
                submitApplication() {
                    if (!this.allDocumentsSelected) {
                        this.alertMessage = 'Please upload all required documents before submitting your application.';
                        return;
                    }
                    this.alertMessage = '';
                    this.submittedSuccess = true;
                    this.$nextTick(() => {
                        this.$refs.successAnchor?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    });
                },
            }));
        });
    </script>
</head>
<body class="min-h-screen bg-gray-50 font-sans text-gray-900 antialiased">
    @php
        $appStepLabels = ['Personal', 'Employment', 'Loan details'];
        $uploadSlots = [
            [
                'label' => 'Valid government-issued ID',
                'hint' => 'Clear scan or photo (PDF, JPG, or PNG).',
            ],
            [
                'label' => 'Proof of income',
                'hint' => 'Recent payslip, certificate of employment, or ITR.',
            ],
            [
                'label' => 'Signed application form',
                'hint' => 'Signed PDF of your completed application.',
            ],
        ];
    @endphp
    <div
        class="max-w-4xl mx-auto mt-10 mb-10 px-4"
        x-data="loanApplicationForm"
        x-cloak
    >
        <div class="bg-white shadow-lg shadow-gray-200/50 rounded-xl p-6 sm:p-8 border border-gray-100">
            <header class="mb-8 pb-6 border-b border-gray-100">
                <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Loan Application</h1>
                        <p class="mt-2 text-sm sm:text-base text-gray-500 max-w-xl">
                            Complete your details, then upload required documents in one smooth flow. (UI demo — nothing is saved to a server.)
                        </p>
                    </div>
                    <div class="shrink-0 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 ring-1 ring-blue-100">
                        <span x-text="mainStep === 1 ? 'Step 1 — Application' : 'Step 2 — Documents'"></span>
                    </div>
                </div>

                <div class="mt-6 space-y-4">
                    <div class="flex h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                            class="h-full rounded-full bg-blue-600 transition-all duration-500 ease-out"
                            :style="'width: ' + progressPercent + '%'"
                        ></div>
                    </div>
                    <div class="grid grid-cols-2 gap-2 sm:gap-3">
                        <button
                            type="button"
                            class="rounded-xl py-3 text-sm font-semibold transition"
                            :class="mainStep === 1 ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-blue-50 text-blue-800 ring-1 ring-blue-100 hover:bg-blue-100'"
                            @click="goMain(1)"
                        >
                            <span class="block text-xs font-medium uppercase tracking-wide opacity-80">Step 1</span>
                            Application
                        </button>
                        <button
                            type="button"
                            class="rounded-xl py-3 text-sm font-semibold transition"
                            :class="mainStep === 2 ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-gray-50 text-gray-500 ring-1 ring-gray-100 hover:bg-gray-100'"
                            @click="goMain(2)"
                        >
                            <span class="block text-xs font-medium uppercase tracking-wide opacity-80">Step 2</span>
                            Upload documents
                        </button>
                    </div>
                    <div class="rounded-xl bg-gray-50/90 p-3 ring-1 ring-gray-100" x-show="mainStep === 1">
                        <p class="mb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">Application sections</p>
                        <div class="grid grid-cols-3 gap-1 sm:gap-2 text-center">
                            @foreach ($appStepLabels as $i => $lbl)
                                <button
                                    type="button"
                                    class="rounded-lg py-2 text-xs font-medium transition"
                                    :class="appStep === {{ $i + 1 }} ? 'bg-white text-blue-700 shadow-sm ring-1 ring-blue-100' : appStep > {{ $i + 1 }} ? 'text-blue-600 hover:bg-white/80' : 'text-gray-400 hover:bg-white/60'"
                                    @click="goApp({{ $i + 1 }})"
                                >{{ $lbl }}</button>
                            @endforeach
                        </div>
                    </div>
                </div>
            </header>

            <div
                x-ref="successAnchor"
                x-show="submittedSuccess"
                x-transition
                class="mb-6 rounded-2xl bg-emerald-50 p-5 text-sm leading-relaxed text-emerald-900 ring-1 ring-emerald-100 sm:p-6"
                role="status"
            >
                <p class="font-semibold">Application submitted successfully.</p>
                <p class="mt-2 text-emerald-800">Documents uploaded successfully. Our team will review your files. (Demo — no data was stored.)</p>
            </div>

            <div
                x-show="alertMessage && !submittedSuccess"
                x-transition:enter="transition ease-out duration-200"
                x-transition:enter-start="opacity-0 -translate-y-1"
                x-transition:enter-end="opacity-100 translate-y-0"
                class="mb-6 rounded-2xl bg-red-50 p-5 text-sm leading-relaxed text-red-800 ring-1 ring-red-100 sm:p-6"
                role="alert"
            >
                <div class="flex items-start justify-between gap-3">
                    <p x-text="alertMessage" class="min-w-0 flex-1"></p>
                    <button
                        type="button"
                        class="shrink-0 rounded-lg p-1 text-red-600 transition hover:bg-red-100/80 hover:text-red-900"
                        @click="dismissAlert()"
                        aria-label="Dismiss"
                    >
                        <span class="sr-only">Dismiss</span>
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {{-- Phase 1 — Personal --}}
            <section x-show="mainStep === 1 && appStep === 1 && !submittedSuccess" x-transition.opacity class="space-y-6 mb-6">
                <div>
                    <h2 class="text-lg font-semibold text-gray-900">Personal information</h2>
                    <p class="mt-1 text-sm text-gray-500">Legal name and contact details as they appear on your ID.</p>
                </div>
                <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                        <label for="full_name" class="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
                        <input type="text" id="full_name" name="full_name" x-ref="fullName" placeholder="Juan Dela Cruz"
                            class="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                    </div>
                    <div>
                        <label for="birthdate" class="block text-sm font-medium text-gray-700 mb-1.5">Birthdate</label>
                        <input type="date" id="birthdate" name="birthdate" x-ref="birthdate"
                            class="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                    </div>
                    <div class="md:col-span-2">
                        <label for="address" class="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                        <input type="text" id="address" name="address" x-ref="address" placeholder="Street, barangay, city, province"
                            class="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                    </div>
                    <div>
                        <label for="phone" class="block text-sm font-medium text-gray-700 mb-1.5">Contact number</label>
                        <input type="tel" id="phone" name="phone" x-ref="phone" placeholder="09XX XXX XXXX"
                            class="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                    </div>
                    <div>
                        <label for="email" class="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                        <input type="email" id="email" name="email" x-ref="email" placeholder="you@example.com"
                            class="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                    </div>
                </div>
            </section>

            {{-- Phase 1 — Employment --}}
            <section x-show="mainStep === 1 && appStep === 2 && !submittedSuccess" x-transition.opacity class="space-y-6 mb-6">
                <div>
                    <h2 class="text-lg font-semibold text-gray-900">Employment information</h2>
                    <p class="mt-1 text-sm text-gray-500">Tell us about your current source of income.</p>
                </div>
                <div class="rounded-xl border border-gray-100 bg-gray-50/80 p-5 sm:p-6">
                    <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div class="md:col-span-2">
                            <label for="employer" class="block text-sm font-medium text-gray-700 mb-1.5">Employer name</label>
                            <input type="text" id="employer" name="employer" x-ref="employer" placeholder="Company or organization"
                                class="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        </div>
                        <div>
                            <label for="job_title" class="block text-sm font-medium text-gray-700 mb-1.5">Job title</label>
                            <input type="text" id="job_title" name="job_title" x-ref="jobTitle" placeholder="e.g. Sales Associate"
                                class="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                        </div>
                        <div>
                            <label for="income" class="block text-sm font-medium text-gray-700 mb-1.5">Monthly income</label>
                            <div class="relative">
                                <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-500">₱</span>
                                <input type="text" id="income" name="income" x-ref="income" placeholder="0.00"
                                    class="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-8 pr-3 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {{-- Phase 1 — Loan details only --}}
            <section x-show="mainStep === 1 && appStep === 3 && !submittedSuccess" x-transition.opacity class="space-y-6 mb-6">
                <div>
                    <h2 class="text-lg font-semibold text-gray-900">Loan details</h2>
                    <p class="mt-1 text-sm text-gray-500">Tell us what you need; you will upload supporting documents in the next step.</p>
                </div>
                <div class="rounded-xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm ring-1 ring-gray-100/80">
                    <h3 class="text-sm font-semibold uppercase tracking-wide text-blue-600">Loan request</h3>
                    <div class="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div class="md:col-span-2">
                            <label for="product" class="block text-sm font-medium text-gray-700 mb-1.5">Loan product</label>
                            <div class="relative">
                                <select id="product" name="product" x-ref="product"
                                    class="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 pr-10 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                                    <option value="">Select a product</option>
                                    <option>Salary Loan</option>
                                    <option>Chattel Mortgage</option>
                                    <option>Real Estate Mortgage</option>
                                    <option>Travel Assistance</option>
                                    <option>SSS / GSIS Pension Loan</option>
                                </select>
                                <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </span>
                            </div>
                        </div>
                        <div>
                            <label for="amount" class="block text-sm font-medium text-gray-700 mb-1.5">Loan amount</label>
                            <div class="relative">
                                <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-500">₱</span>
                                <input type="text" id="amount" name="amount" x-ref="amount" placeholder="0.00"
                                    class="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-8 pr-3 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                            </div>
                        </div>
                        <div>
                            <label for="term" class="block text-sm font-medium text-gray-700 mb-1.5">Term</label>
                            <select id="term" name="term" x-ref="term"
                                class="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                                <option value="">Select term</option>
                                <option>6 months</option>
                                <option>12 months</option>
                                <option>24 months</option>
                                <option>36 months</option>
                            </select>
                        </div>
                        <div class="md:col-span-2">
                            <label for="purpose" class="block text-sm font-medium text-gray-700 mb-1.5">Purpose</label>
                            <textarea id="purpose" name="purpose" x-ref="purpose" rows="3" placeholder="Briefly describe how you plan to use the loan."
                                class="w-full resize-y rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm placeholder:text-gray-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"></textarea>
                        </div>
                    </div>
                </div>
            </section>

            {{-- Phase 2 — Upload documents --}}
            <section x-show="mainStep === 2 && !submittedSuccess" x-transition.opacity class="mb-6 space-y-6">
                <div>
                    <h2 class="text-lg font-semibold text-gray-900">Upload required documents</h2>
                    <p class="mt-1 text-sm text-gray-500">
                        Add each file below. You can replace a file anytime before final submission.
                    </p>
                </div>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                    @foreach ($uploadSlots as $idx => $slot)
                        <div
                            class="flex flex-col rounded-xl border border-gray-100 bg-white p-4 shadow-md shadow-gray-200/40 ring-1 ring-gray-100"
                            @dragover.prevent="dragOver = {{ $idx }}"
                            @dragleave.prevent="dragOver = null"
                            @drop.prevent="handleDrop({{ $idx }}, $event)"
                            :class="{ 'ring-2 ring-blue-200 border-blue-200': dragOver === {{ $idx }} }"
                        >
                            <h3 class="text-sm font-semibold text-gray-900">{{ $slot['label'] }}</h3>
                            <p class="mt-1 text-xs text-gray-500 leading-relaxed">{{ $slot['hint'] }}</p>
                            <div
                                class="mt-4 flex min-h-[120px] flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 px-3 py-4 text-center transition"
                                :class="{ 'border-blue-300 bg-blue-50/40': dragOver === {{ $idx }} }"
                            >
                                <input
                                    type="file"
                                    x-ref="docInput{{ $idx }}"
                                    id="doc_upload_{{ $idx }}"
                                    class="sr-only"
                                    @change="setDocFile({{ $idx }}, $event)"
                                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                                />
                                <label
                                    for="doc_upload_{{ $idx }}"
                                    class="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                                >
                                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    Choose file
                                </label>
                                <p class="mt-2 text-[11px] text-gray-500">or drag and drop here</p>
                            </div>
                            <div class="mt-4 min-h-[3rem] rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-left">
                                <div x-show="docNames[{{ $idx }}]" class="flex items-start justify-between gap-2" x-cloak>
                                    <div class="min-w-0 flex-1">
                                        <p class="text-xs font-medium text-emerald-800">File selected</p>
                                        <p class="truncate text-sm text-gray-800" x-text="docNames[{{ $idx }}]"></p>
                                    </div>
                                    <button
                                        type="button"
                                        class="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-800"
                                        @click="clearDoc({{ $idx }})"
                                    >Replace</button>
                                </div>
                                <p x-show="!docNames[{{ $idx }}]" class="text-xs text-gray-500">No file selected yet.</p>
                            </div>
                        </div>
                    @endforeach
                </div>
                <p class="text-center text-xs text-gray-400" x-show="allDocumentsSelected && !submittedSuccess" x-transition>
                    All required documents are attached. You can submit your application below.
                </p>
            </section>

            <footer
                class="mt-8 flex flex-col gap-4 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between"
                x-show="!submittedSuccess"
            >
                <button
                    type="button"
                    @click="prev()"
                    class="order-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 sm:order-1 sm:w-auto sm:min-w-[120px]"
                    x-show="mainStep === 2 || appStep > 1"
                    x-cloak
                >
                    Back
                </button>
                <div class="order-1 flex w-full flex-col gap-3 sm:order-2 sm:ml-auto sm:max-w-md">
                    <button
                        type="button"
                        @click="next()"
                        x-show="mainStep === 1"
                        x-cloak
                        class="w-full rounded-lg bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        <span x-text="appStep < appMax ? 'Continue' : 'Continue to upload documents'"></span>
                    </button>
                    <button
                        type="button"
                        x-show="mainStep === 2"
                        x-cloak
                        @click="submitApplication()"
                        :disabled="!allDocumentsSelected"
                        :class="allDocumentsSelected
                            ? 'w-full rounded-lg bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                            : 'w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-4 py-3.5 text-sm font-semibold text-gray-400'"
                    >
                        Submit application
                    </button>
                </div>
            </footer>
        </div>

        <p class="mt-6 text-center text-xs text-gray-400">
            UI demo — client-side checks only; connect this view to your Laravel routes when you are ready to persist applications.
        </p>
    </div>
</body>
</html>
