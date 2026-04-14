/** Default state for the official Amalgated loan application format (mirrors paper form sections). */

export const APPLICATION_NATURE = {
  NEW: 'new',
  RELOAN: 'reloan',
  RESTRUCTURED: 'restructured',
}

const emptyRow = () => ({ description: '', amount: '' })
const emptyCollateral = () => ({ bank: '', description: '', dateAvailed: '', amount: '' })
const emptyBankRef = () => ({ bank: '', depositType: '', accommodation: '' })
const emptyObligation = () => ({
  creditor: '',
  role: 'principal',
  originalAmount: '',
  presentBalance: '',
  maturity: '',
})

/**
 * @param {null|'business'|'chattel'|'real_estate'|'salary'} preset
 * @param {{ otherSpecify?: string }} [options] — e.g. prefill “Others (specify)” for travel / pension pages
 */
export function createEmptyExtendedApplication(preset = null, options = {}) {
  const presetKey = preset || null
  const otherDefault = typeof options.otherSpecify === 'string' ? options.otherSpecify : ''
  let defaultTermMonths = ''
  if (typeof options.loanTermMonthsDefault === 'string') {
    defaultTermMonths = options.loanTermMonthsDefault
  } else if (presetKey === 'chattel') {
    defaultTermMonths = '36'
  } else if (presetKey === 'salary') {
    defaultTermMonths = '24'
  } else if (presetKey === 'real_estate') {
    defaultTermMonths = '24'
  }
  const loanCategories = {
    businessLoan: presetKey === 'business',
    chattelMortgage: presetKey === 'chattel',
    realEstateMortgage: presetKey === 'real_estate',
    salaryLoan: presetKey === 'salary',
    otherSpecify: otherDefault,
  }

  return {
    branch_name: '',
    application_nature: APPLICATION_NATURE.NEW,
    loan_categories: loanCategories,
    loan_principal_php: '',
    loan_term_months: defaultTermMonths,
    applicant: {
      name: '',
      email: '',
      mobile_phone: '',
      age: '',
      civil_status: '',
      tin: '',
      city: '',
      province: '',
      business_address: '',
      business_tel: '',
      residence_address: '',
      residence_tel: '',
      sss_gsis: '',
      philhealth: '',
      ctc_number: '',
      ctc_date: '',
      ctc_place: '',
    },
    product_extra: {
      property_location: '',
      property_value: '',
      stencil_notes: '',
      destination_country: '',
      travel_date: '',
      travel_purpose: '',
      employer_name: '',
      monthly_salary: '',
      monthly_pension: '',
      age: '',
      pension_type: 'SSS',
    },
    spouse: {
      name: '',
      age: '',
      sss: '',
      ctc_number: '',
      tin: '',
      philhealth: '',
      ctc_date: '',
      ctc_place: '',
    },
    employed: {
      employer_name: '',
      address: '',
      annual_salary: '',
      position: '',
      length_of_service: '',
    },
    self_employed: {
      firm_name: '',
      nature_of_business: '',
      address: '',
      ownership: '',
      capital_invested: '',
    },
    monthly_income_rows: [emptyRow(), emptyRow(), emptyRow(), emptyRow()],
    expense_rows: [emptyRow(), emptyRow(), emptyRow(), emptyRow()],
    home_ownership: '',
    stay_years: '',
    stay_months: '',
    dependents: '',
    collateral_other: [emptyCollateral(), emptyCollateral(), emptyCollateral(), emptyCollateral()],
    bank_references: [emptyBankRef(), emptyBankRef(), emptyBankRef()],
    outstanding_obligations: [emptyObligation(), emptyObligation(), emptyObligation()],
    certification_date: '',
    applicant_signature_ack: '',
    spouse_signature_ack: '',
  }
}

/** Infer preset loan category from generic apply page selections (product slug + loan type label). */
export function getAmalgatedPresetFromLoanContext(loanType, productSlug) {
  const s = String(productSlug || '').toLowerCase()
  const l = String(loanType || '').toLowerCase()
  if (s.includes('chattel') || l.includes('vehicle')) return 'chattel'
  if (s.includes('real') || s.includes('rem') || l.includes('home')) return 'real_estate'
  if (s.includes('salary') || l.includes('salary')) return 'salary'
  if (s.includes('travel')) return null
  if (s.includes('pension') || s.includes('sss')) return null
  if (l.includes('business')) return 'business'
  return null
}

export function createEmptyCoMakerStatement() {
  return {
    applicant_name_ref: '',
    requested_loan_php: '',
    name: '',
    email: '',
    age: '',
    status: '',
    tin: '',
    business_address: '',
    business_tel: '',
    sss_gsis: '',
    residence_address: '',
    residence_tel: '',
    philhealth: '',
    ctc_number: '',
    ctc_date: '',
    ctc_place: '',
    spouse: {
      name: '',
      age: '',
      sss_gsis: '',
      ctc_number: '',
      ctc_date: '',
      ctc_place: '',
      tin: '',
      philhealth: '',
    },
    dependents: '',
    home_ownership: '',
    stay_years: '',
    stay_months: '',
    employed: {
      employer_name: '',
      address: '',
      annual_salary: '',
      position: '',
      length_of_service: '',
    },
    self_employed: {
      firm_name: '',
      nature_of_business: '',
      address: '',
      ownership: '',
      capital_invested: '',
    },
    collateral_other: [emptyCollateral(), emptyCollateral(), emptyCollateral(), emptyCollateral()],
    bank_references: [emptyBankRef(), emptyBankRef(), emptyBankRef()],
    outstanding_obligations: [emptyObligation(), emptyObligation(), emptyObligation()],
    certification_date: '',
    signature_applicant: '',
    signature_spouse: '',
  }
}
