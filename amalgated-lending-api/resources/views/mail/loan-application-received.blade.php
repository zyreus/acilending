<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Application received</title>
</head>
<body style="font-family: system-ui, -apple-system, Segoe UI, sans-serif; line-height: 1.6; color: #111827; max-width: 640px; margin: 0; padding: 24px;">
    <p style="margin: 0 0 16px;">Hello {{ $borrowerName }},</p>
    <p style="margin: 0 0 16px;">Thank you for applying with <strong>Amalgated Lending Inc.</strong>. Your application has been submitted. Please wait for <strong>Amalgated Lending Inc.</strong> confirmation.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 0 0 24px; font-size: 14px;">
        <tr>
            <td style="padding: 8px 0; color: #6b7280;">Reference</td>
            <td style="padding: 8px 0; font-weight: 600;">#{{ $loanId }}</td>
        </tr>
        <tr>
            <td style="padding: 8px 0; color: #6b7280;">Amount requested</td>
            <td style="padding: 8px 0;">₱{{ $principal }}</td>
        </tr>
        <tr>
            <td style="padding: 8px 0; color: #6b7280;">Term</td>
            <td style="padding: 8px 0;">{{ $termMonths }} months</td>
        </tr>
    </table>
    <p style="margin: 0 0 16px;">You can log in to your borrower portal anytime to check status updates.</p>
    <p style="margin: 0; color: #374151; font-size: 13px;">
        — Amalgated Lending Inc.<br>
        <span style="color: #6b7280;">This is an automated message; please do not reply directly to this email.</span>
    </p>
</body>
</html>
