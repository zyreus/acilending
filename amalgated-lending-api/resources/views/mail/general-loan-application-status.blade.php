<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Loan application status</title>
</head>
<body style="font-family: system-ui, -apple-system, Segoe UI, sans-serif; line-height: 1.6; color: #111827; max-width: 640px; margin: 0; padding: 24px;">
    @php
        $isApproved = $status === 'approved';
        $isRejected = $status === 'rejected';
    @endphp
    <p style="margin: 0 0 16px;">Hello {{ $borrowerName }},</p>

    @if ($isApproved)
        <p style="margin: 0 0 16px;">Your application has been <strong>approved</strong> by Amalgated Lending Inc.</p>
    @elseif ($isRejected)
        <p style="margin: 0 0 16px;">Your application has been <strong>rejected</strong> by Amalgated Lending Inc.</p>
    @else
        <p style="margin: 0 0 16px;">Your application has been <strong>submitted</strong>. Please wait for <strong>Amalgated Lending Inc.</strong> confirmation.</p>
    @endif

    <table style="width: 100%; border-collapse: collapse; margin: 0 0 24px; font-size: 14px;">
        <tr>
            <td style="padding: 8px 0; color: #6b7280;">Application reference</td>
            <td style="padding: 8px 0; font-weight: 600;">#{{ $applicationId }}</td>
        </tr>
        <tr>
            <td style="padding: 8px 0; color: #6b7280;">Loan type</td>
            <td style="padding: 8px 0;">{{ $loanType }}</td>
        </tr>
        @if (!empty($submittedAt))
            <tr>
                <td style="padding: 8px 0; color: #6b7280;">Submitted at</td>
                <td style="padding: 8px 0;">{{ $submittedAt }}</td>
            </tr>
        @endif
    </table>

    @if ($isRejected && !empty($rejectionReason))
        <p style="margin: 0 0 12px;"><strong>Reason:</strong> {{ $rejectionReason }}</p>
    @endif

    <p style="margin: 0 0 16px;">You can log in to your borrower portal for updates.</p>
    <p style="margin: 0; color: #374151; font-size: 13px;">
        — Amalgated Lending Inc.<br>
        <span style="color: #6b7280;">This is an automated message; please do not reply directly to this email.</span>
    </p>
</body>
</html>

