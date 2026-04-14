<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Loan application update</title>
</head>
<body style="font-family: system-ui, -apple-system, Segoe UI, sans-serif; line-height: 1.6; color: #111827; max-width: 640px; margin: 0; padding: 24px;">
    @php $isRejected = $decision === 'rejected'; @endphp
    <p style="margin: 0 0 16px;">Hello {{ $borrowerName }},</p>

    @if ($isRejected)
        <p style="margin: 0 0 16px;">Your loan application has been <strong>rejected</strong>.</p>
    @else
        <p style="margin: 0 0 16px;">Good news — your loan application has been <strong>approved</strong>.</p>
    @endif

    <table style="width: 100%; border-collapse: collapse; margin: 0 0 24px; font-size: 14px;">
        <tr>
            <td style="padding: 8px 0; color: #6b7280;">Reference</td>
            <td style="padding: 8px 0; font-weight: 600;">#{{ $loanId }}</td>
        </tr>
        <tr>
            <td style="padding: 8px 0; color: #6b7280;">Amount</td>
            <td style="padding: 8px 0;">₱{{ $principal }}</td>
        </tr>
        <tr>
            <td style="padding: 8px 0; color: #6b7280;">Term</td>
            <td style="padding: 8px 0;">{{ $termMonths }} months</td>
        </tr>
        @if (! $isRejected)
            <tr>
                <td style="padding: 8px 0; color: #6b7280;">Monthly payment</td>
                <td style="padding: 8px 0;">₱{{ number_format($monthlyPayment, 2) }}</td>
            </tr>
        @endif
        @if (!empty($approvedAt))
            <tr>
                <td style="padding: 8px 0; color: #6b7280;">Decision date</td>
                <td style="padding: 8px 0;">{{ $approvedAt }}</td>
            </tr>
        @endif
    </table>

    @if ($isRejected && !empty($rejectionReason))
        <p style="margin: 0 0 12px;"><strong>Reason:</strong> {{ $rejectionReason }}</p>
    @endif

    <p style="margin: 0 0 16px;">You can sign in to the borrower portal to review details.</p>
    <p style="margin: 0; color: #374151; font-size: 13px;">
        — Amalgated Lending<br>
        <span style="color: #6b7280;">This is an automated message; please do not reply directly to this email.</span>
    </p>
</body>
</html>
