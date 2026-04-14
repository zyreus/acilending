/** Whether every field in the official Amalgated application + optional co-maker statement is filled (trimmed non-empty). */

function t(s) {
  return String(s ?? '').trim()
}

function pushMissing(arr, ok, label) {
  if (!ok) arr.push(label)
}

export function getExtendedApplicationMissing(ext) {
  const missing = []
  if (!ext) return ['Application form']

  pushMissing(missing, t(ext.branch_name), 'Branch')
  pushMissing(missing, Boolean(ext.application_nature), 'Application nature')

  const lc = ext.loan_categories || {}
  const hasCategory =
    lc.businessLoan ||
    lc.chattelMortgage ||
    lc.realEstateMortgage ||
    lc.salaryLoan ||
    t(lc.otherSpecify)
  pushMissing(missing, hasCategory, 'Loan category (select one or specify “Others”)')

  pushMissing(missing, t(ext.loan_principal_php), 'Requested loan — principal (Php)')
  pushMissing(missing, t(ext.loan_term_months), 'Requested loan — term (months)')

  const a = ext.applicant || {}
  const applicantLabels = {
    name: 'Applicant — full name',
    email: 'Applicant — email (portal)',
    mobile_phone: 'Applicant — mobile phone',
    age: 'Applicant — age',
    civil_status: 'Applicant — civil status',
    tin: 'Applicant — TIN',
    business_address: 'Applicant — business address',
    business_tel: 'Applicant — business telephone',
    residence_address: 'Applicant — residence address',
    residence_tel: 'Applicant — residence telephone',
    sss_gsis: 'Applicant — SSS / GSIS',
    philhealth: 'Applicant — PhilHealth',
    ctc_number: 'Applicant — CTC number',
    ctc_date: 'Applicant — CTC date',
    ctc_place: 'Applicant — CTC place',
  }
  for (const [k, label] of Object.entries(applicantLabels)) {
    pushMissing(missing, t(a[k]), label)
  }

  const sp = ext.spouse || {}
  const spouseLabels = {
    name: 'Spouse — name',
    age: 'Spouse — age',
    sss: 'Spouse — SSS',
    ctc_number: 'Spouse — CTC number',
    tin: 'Spouse — TIN',
    philhealth: 'Spouse — PhilHealth',
    ctc_date: 'Spouse — CTC date',
    ctc_place: 'Spouse — CTC place',
  }
  for (const [k, label] of Object.entries(spouseLabels)) {
    pushMissing(missing, t(sp[k]), label)
  }

  const em = ext.employed || {}
  const se = ext.self_employed || {}
  const employedKeys = ['employer_name', 'address', 'annual_salary', 'position', 'length_of_service']
  const selfKeys = ['firm_name', 'nature_of_business', 'address', 'ownership', 'capital_invested']
  const employedComplete = employedKeys.every((k) => t(em[k]))
  const selfComplete = selfKeys.every((k) => t(se[k]))
  pushMissing(missing, employedComplete || selfComplete, 'Employment — complete either “Employed” or “Self-employed” (all fields in that column)')

  const incomeRows = ext.monthly_income_rows || []
  incomeRows.forEach((row, i) => {
    pushMissing(missing, t(row?.description) && t(row?.amount), `Monthly income — row ${i + 1} (description & amount)`)
  })

  const expenseRows = ext.expense_rows || []
  expenseRows.forEach((row, i) => {
    pushMissing(missing, t(row?.description) && t(row?.amount), `Expenses — row ${i + 1} (description & amount)`)
  })

  pushMissing(missing, t(ext.home_ownership), 'Residence — own home (yes/no)')
  pushMissing(missing, t(ext.stay_years) || t(ext.stay_months), 'Residence — length of stay (years and/or months)')
  pushMissing(missing, t(ext.dependents), 'Residence — number of dependents')

  const coll = ext.collateral_other || []
  coll.forEach((row, i) => {
    pushMissing(
      missing,
      t(row?.bank) && t(row?.description) && t(row?.dateAvailed) && t(row?.amount),
      `Other collateral — row ${i + 1}`,
    )
  })

  const banks = ext.bank_references || []
  banks.forEach((row, i) => {
    pushMissing(missing, t(row?.bank) && t(row?.depositType) && t(row?.accommodation), `Bank reference — row ${i + 1}`)
  })

  const obs = ext.outstanding_obligations || []
  obs.forEach((row, i) => {
    pushMissing(
      missing,
      t(row?.creditor) && t(row?.originalAmount) && t(row?.presentBalance) && t(row?.maturity),
      `Outstanding obligation — row ${i + 1}`,
    )
  })

  pushMissing(missing, t(ext.certification_date), 'Certification — date')
  pushMissing(missing, t(ext.applicant_signature_ack), 'Certification — applicant signature (or typed name)')
  pushMissing(missing, t(ext.spouse_signature_ack), 'Certification — spouse signature (or typed name)')

  return missing
}

export function isExtendedApplicationComplete(ext) {
  return getExtendedApplicationMissing(ext).length === 0
}

export function getCoMakerStatementMissing(cm) {
  const missing = []
  if (!cm) return ['Co-maker statement']

  pushMissing(missing, t(cm.applicant_name_ref), 'Co-maker block — applicant name')
  pushMissing(missing, t(cm.requested_loan_php), 'Co-maker block — requested loan (Php)')

  const top = [
    ['name', 'Co-maker — full name'],
    ['email', 'Co-maker — email'],
    ['age', 'Co-maker — age'],
    ['status', 'Co-maker — civil status'],
    ['tin', 'Co-maker — TIN'],
    ['business_address', 'Co-maker — business address'],
    ['business_tel', 'Co-maker — business telephone'],
    ['sss_gsis', 'Co-maker — SSS / GSIS'],
    ['residence_address', 'Co-maker — residence address'],
    ['residence_tel', 'Co-maker — residence telephone'],
    ['philhealth', 'Co-maker — PhilHealth'],
    ['ctc_number', 'Co-maker — CTC number'],
    ['ctc_date', 'Co-maker — CTC date'],
    ['ctc_place', 'Co-maker — CTC place'],
  ]
  for (const [k, label] of top) {
    pushMissing(missing, t(cm[k]), label)
  }

  const sps = cm.spouse || {}
  const spouseLabels = {
    name: 'Co-maker spouse — name',
    age: 'Co-maker spouse — age',
    sss_gsis: 'Co-maker spouse — SSS / GSIS',
    ctc_number: 'Co-maker spouse — CTC number',
    tin: 'Co-maker spouse — TIN',
    philhealth: 'Co-maker spouse — PhilHealth',
    ctc_date: 'Co-maker spouse — CTC date',
    ctc_place: 'Co-maker spouse — CTC place',
  }
  for (const [k, label] of Object.entries(spouseLabels)) {
    pushMissing(missing, t(sps[k]), label)
  }

  pushMissing(missing, t(cm.dependents), 'Co-maker — dependents')
  pushMissing(missing, t(cm.home_ownership), 'Co-maker — own residence (yes/no)')
  pushMissing(missing, t(cm.stay_years) || t(cm.stay_months), 'Co-maker — length of stay')

  const em = cm.employed || {}
  const se = cm.self_employed || {}
  const employedKeys = ['employer_name', 'address', 'annual_salary', 'position', 'length_of_service']
  const selfKeys = ['firm_name', 'nature_of_business', 'address', 'ownership', 'capital_invested']
  const employedComplete = employedKeys.every((k) => t(em[k]))
  const selfComplete = selfKeys.every((k) => t(se[k]))
  pushMissing(missing, employedComplete || selfComplete, 'Co-maker — complete either Employed or Self-employed')

  const coll = cm.collateral_other || []
  coll.forEach((row, i) => {
    pushMissing(
      missing,
      t(row?.bank) && t(row?.description) && t(row?.dateAvailed) && t(row?.amount),
      `Co-maker collateral — row ${i + 1}`,
    )
  })

  const banks = cm.bank_references || []
  banks.forEach((row, i) => {
    pushMissing(missing, t(row?.bank) && t(row?.depositType) && t(row?.accommodation), `Co-maker bank ref — row ${i + 1}`)
  })

  const obs = cm.outstanding_obligations || []
  obs.forEach((row, i) => {
    pushMissing(
      missing,
      t(row?.creditor) && t(row?.originalAmount) && t(row?.presentBalance) && t(row?.maturity),
      `Co-maker obligation — row ${i + 1}`,
    )
  })

  pushMissing(missing, t(cm.certification_date), 'Co-maker — certification date')
  pushMissing(missing, t(cm.signature_applicant), 'Co-maker — signature (or typed name)')
  pushMissing(missing, t(cm.signature_spouse), 'Co-maker — spouse signature (or typed name)')

  return missing
}

export function isCoMakerStatementComplete(cm) {
  return getCoMakerStatementMissing(cm).length === 0
}

export function getFullApplicationMissing(ext, cm, includeCoMaker) {
  const a = getExtendedApplicationMissing(ext)
  if (!includeCoMaker) return a
  return [...a, ...getCoMakerStatementMissing(cm)]
}

export function isFullApplicationPrintable(ext, cm, includeCoMaker) {
  if (!isExtendedApplicationComplete(ext)) return false
  if (includeCoMaker && !isCoMakerStatementComplete(cm)) return false
  return true
}
