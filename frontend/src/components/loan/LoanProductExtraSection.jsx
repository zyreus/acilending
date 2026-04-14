const LABEL = 'block text-xs font-medium text-slate-600 mb-1'
const INPUT = 'w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-900 focus:border-[#c41e3a] focus:outline-none focus:ring-1 focus:ring-[#c41e3a]'
const SECTION = 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm'
const H3 = 'text-sm font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2'

function inputClass(hasError) {
  return hasError
    ? `${INPUT} border-red-500 ring-1 ring-red-500/20`
    : INPUT
}

function fieldError(errors, path) {
  const message = errors?.[path]
  return message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null
}

function setProductExtra(value, onChange, key, val) {
  const px = { ...(value.product_extra || {}) }
  px[key] = val
  onChange({ ...value, product_extra: px })
}

/**
 * Product-specific fields stored in `extendedApplication.product_extra` (not duplicate “Applicant” strip).
 * @param {'chattel'|'rem'|'salary'|'travel'|'pension'} props.mode
 */
export default function LoanProductExtraSection({ mode, value, onChange, travelDateMin, fieldErrors = {} }) {
  if (!mode || mode === 'none') return null
  const px = value.product_extra || {}

  return (
    <div className={SECTION}>
      <h3 className={H3}>
        {mode === 'chattel' && 'Vehicle / collateral notes'}
        {mode === 'rem' && 'Property (collateral)'}
        {mode === 'salary' && 'Employment (salary loan)'}
        {mode === 'travel' && 'Travel details'}
        {mode === 'pension' && 'Pensioner details'}
      </h3>

      {mode === 'chattel' ? (
        <div>
          <label className={LABEL}>Stencil / engine / vehicle notes *</label>
          <textarea
            data-field-path="product_extra.stencil_notes"
            className={inputClass(fieldErrors['product_extra.stencil_notes'])}
            rows={3}
            value={px.stencil_notes}
            onChange={(e) => setProductExtra(value, onChange, 'stencil_notes', e.target.value)}
            placeholder="Vehicle/engine/stencil details (required for chattel)"
          />
          {fieldError(fieldErrors, 'product_extra.stencil_notes')}
        </div>
      ) : null}

      {mode === 'rem' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={LABEL}>Property location *</label>
            <input
              data-field-path="product_extra.property_location"
              className={inputClass(fieldErrors['product_extra.property_location'])}
              value={px.property_location}
              onChange={(e) => setProductExtra(value, onChange, 'property_location', e.target.value)}
            />
            {fieldError(fieldErrors, 'product_extra.property_location')}
          </div>
          <div>
            <label className={LABEL}>Estimated property value (PHP) *</label>
            <input
              data-field-path="product_extra.property_value"
              className={inputClass(fieldErrors['product_extra.property_value'])}
              type="number"
              min={0}
              step="1000"
              value={px.property_value}
              onChange={(e) => setProductExtra(value, onChange, 'property_value', e.target.value)}
            />
            {fieldError(fieldErrors, 'product_extra.property_value')}
          </div>
        </div>
      ) : null}

      {mode === 'salary' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={LABEL}>Employer name *</label>
            <input
              data-field-path="product_extra.employer_name"
              className={inputClass(fieldErrors['product_extra.employer_name'])}
              value={px.employer_name}
              onChange={(e) => setProductExtra(value, onChange, 'employer_name', e.target.value)}
            />
            {fieldError(fieldErrors, 'product_extra.employer_name')}
          </div>
          <div>
            <label className={LABEL}>Monthly gross salary (PHP) *</label>
            <input
              data-field-path="product_extra.monthly_salary"
              className={inputClass(fieldErrors['product_extra.monthly_salary'])}
              type="number"
              min={1}
              step="100"
              value={px.monthly_salary}
              onChange={(e) => setProductExtra(value, onChange, 'monthly_salary', e.target.value)}
            />
            {fieldError(fieldErrors, 'product_extra.monthly_salary')}
          </div>
        </div>
      ) : null}

      {mode === 'travel' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={LABEL}>Destination country *</label>
            <input
              data-field-path="product_extra.destination_country"
              className={inputClass(fieldErrors['product_extra.destination_country'])}
              value={px.destination_country}
              onChange={(e) => setProductExtra(value, onChange, 'destination_country', e.target.value)}
            />
            {fieldError(fieldErrors, 'product_extra.destination_country')}
          </div>
          <div>
            <label className={LABEL}>Travel date *</label>
            <input
              data-field-path="product_extra.travel_date"
              className={inputClass(fieldErrors['product_extra.travel_date'])}
              type="date"
              min={travelDateMin}
              value={px.travel_date}
              onChange={(e) => setProductExtra(value, onChange, 'travel_date', e.target.value)}
            />
            {fieldError(fieldErrors, 'product_extra.travel_date')}
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL}>Purpose of travel / work abroad *</label>
            <textarea
              data-field-path="product_extra.travel_purpose"
              className={inputClass(fieldErrors['product_extra.travel_purpose'])}
              rows={4}
              minLength={10}
              value={px.travel_purpose}
              onChange={(e) => setProductExtra(value, onChange, 'travel_purpose', e.target.value)}
              placeholder="At least 10 characters"
            />
            {fieldError(fieldErrors, 'product_extra.travel_purpose')}
          </div>
        </div>
      ) : null}

      {mode === 'pension' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Pension type *</label>
            <select
              className={INPUT}
              value={px.pension_type || 'SSS'}
              onChange={(e) => setProductExtra(value, onChange, 'pension_type', e.target.value)}
            >
              <option value="SSS">SSS</option>
              <option value="GSIS">GSIS</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Age *</label>
            <input
              data-field-path="product_extra.age"
              className={inputClass(fieldErrors['product_extra.age'])}
              type="number"
              min={18}
              max={70}
              value={px.age}
              onChange={(e) => setProductExtra(value, onChange, 'age', e.target.value)}
            />
            {fieldError(fieldErrors, 'product_extra.age')}
          </div>
          <div>
            <label className={LABEL}>Monthly pension (PHP) *</label>
            <input
              data-field-path="product_extra.monthly_pension"
              className={inputClass(fieldErrors['product_extra.monthly_pension'])}
              type="number"
              min={1}
              step="100"
              value={px.monthly_pension}
              onChange={(e) => setProductExtra(value, onChange, 'monthly_pension', e.target.value)}
            />
            {fieldError(fieldErrors, 'product_extra.monthly_pension')}
          </div>
        </div>
      ) : null}
    </div>
  )
}
