function escapeCsv(value) {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function downloadCsv(filename, headers, rows) {
  const lines = []
  lines.push(headers.map(escapeCsv).join(','))
  rows.forEach((row) => {
    lines.push(row.map(escapeCsv).join(','))
  })
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function openPrintPdf(title, subtitle, headers, rows) {
  const win = window.open('', '_blank', 'noopener,noreferrer,width=1000,height=800')
  if (!win) return false
  const th = headers.map((h) => `<th>${h}</th>`).join('')
  const tr = rows
    .map((row) => `<tr>${row.map((col) => `<td>${String(col ?? '')}</td>`).join('')}</tr>`)
    .join('')

  win.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
      h1 { margin: 0 0 6px; font-size: 22px; }
      p { margin: 0 0 16px; color: #444; font-size: 12px; }
      table { border-collapse: collapse; width: 100%; font-size: 12px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background: #f4f4f4; }
      .meta { margin-top: 16px; font-size: 11px; color: #666; }
    </style>
  </head>
  <body>
    <h1>${title}</h1>
    <p>${subtitle}</p>
    <table>
      <thead><tr>${th}</tr></thead>
      <tbody>${tr}</tbody>
    </table>
    <div class="meta">Generated: ${new Date().toLocaleString()}</div>
  </body>
</html>`)
  win.document.close()
  win.focus()
  win.print()
  return true
}
