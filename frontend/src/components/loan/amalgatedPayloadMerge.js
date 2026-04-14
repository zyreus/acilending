/** Merge inline applicant fields into extended Amalgated form payload for API storage. */

export function normalizeExtendedApplicationPayload(ext, form) {
  if (!ext || typeof ext !== 'object') return ext
  const a = ext.applicant || {}
  return {
    ...ext,
    applicant: {
      ...ext.applicant,
      name: String(a.name || '').trim() || String(form?.fullName || '').trim(),
      email: String(a.email || '').trim() || String(form?.email || '').trim(),
      mobile_phone: String(a.mobile_phone || '').trim() || String(form?.phone || '').trim(),
    },
  }
}

/**
 * Portal + loan request fields for multipart public apply endpoints (derived from official application).
 * @param {object} ext - extendedApplication
 * @param {object} [form] - optional legacy inline fields (password-only flows pass {})
 */
export function deriveApplicantFromExtended(ext, form = {}) {
  const a = ext?.applicant || {}
  const fullName = String(a.name || '').trim() || String(form.fullName || '').trim()
  const email = String(a.email || '').trim() || String(form.email || '').trim()
  const mobile = String(a.mobile_phone || '').trim()
  const phone =
    mobile ||
    String(a.residence_tel || '').trim() ||
    String(a.business_tel || '').trim() ||
    String(form.phone || '').trim()
  const address =
    String(a.residence_address || '').trim() ||
    String(a.business_address || '').trim() ||
    String(form.address || '').trim()
  const city = String(a.city || form.city || '').trim()
  const province = String(a.province || form.province || '').trim()
  const principal = String(ext?.loan_principal_php ?? '').trim() || String(form.loanAmount ?? '').trim()
  const term = String(ext?.loan_term_months ?? '').trim() || String(form.loanTerm ?? '').trim()
  return { fullName, email, phone, address, city, province, loanAmount: principal, loanTerm: term }
}

/** Product-specific multipart fields stored under extendedApplication.product_extra (+ applicant TIN). */
export function deriveProductApiFields(ext) {
  const px = ext?.product_extra || {}
  const a = ext?.applicant || {}
  return {
    propertyLocation: String(px.property_location || '').trim(),
    propertyValue: String(px.property_value || '').trim(),
    stencilText: String(px.stencil_notes || '').trim(),
    destinationCountry: String(px.destination_country || '').trim(),
    travelDate: String(px.travel_date || '').trim(),
    travelPurpose: String(px.travel_purpose || '').trim(),
    employerName: String(px.employer_name || ext?.employed?.employer_name || '').trim(),
    monthlySalary: String(px.monthly_salary || '').trim(),
    monthlyPension: String(px.monthly_pension || '').trim(),
    age: String(px.age || '').trim(),
    pensionType: String(px.pension_type || 'SSS').trim().toUpperCase(),
    tinNumber: String(a.tin || '').trim(),
  }
}

export function normalizeCoMakerStatementPayload(cm, form, ext) {
  if (!cm || typeof cm !== 'object') return cm
  const applicantName = String(ext?.applicant?.name || '').trim() || String(form?.fullName || '').trim()
  return {
    ...cm,
    applicant_name_ref: String(cm.applicant_name_ref || '').trim() || applicantName,
    requested_loan_php: String(cm.requested_loan_php ?? ext?.loan_principal_php ?? form?.loanAmount ?? '').trim(),
  }
}
