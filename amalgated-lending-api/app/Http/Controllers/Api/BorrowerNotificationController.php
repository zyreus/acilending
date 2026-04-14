<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BorrowerNotification;
use App\Models\Loan;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class BorrowerNotificationController extends Controller
{
    /**
     * Sync payment-related reminders from current loan state (idempotent; preserves read_at).
     */
    public static function syncPaymentRemindersForUser(User $user): void
    {
        $allLoans = Loan::query()
            ->where('borrower_id', $user->id)
            ->orderByDesc('id')
            ->get();

        if ($allLoans->isEmpty()) {
            return;
        }

        $priority = [
            Loan::STATUS_ONGOING => 1,
            Loan::STATUS_APPROVED => 2,
            Loan::STATUS_PENDING => 3,
            Loan::STATUS_REJECTED => 4,
            Loan::STATUS_COMPLETED => 5,
        ];

        $loan = $allLoans->sort(function ($a, $b) use ($priority) {
            $pa = $priority[$a->status] ?? 99;
            $pb = $priority[$b->status] ?? 99;
            if ($pa !== $pb) {
                return $pa <=> $pb;
            }

            return $b->id <=> $a->id;
        })->first();

        if (! $loan) {
            return;
        }

        $loan->load(['payments' => fn ($q) => $q->orderBy('due_date')]);
        $pendingRows = collect($loan->payments ?? [])
            ->filter(fn (Payment $p) => $p->status !== Payment::STATUS_PAID)
            ->values();

        $seenDedupe = [];

        foreach ($pendingRows as $row) {
            if (! $row->due_date) {
                continue;
            }
            $days = Carbon::now()->startOfDay()->diffInDays($row->due_date->copy()->startOfDay(), false);
            $dedupe = 'installment:'.$row->id;

            if ($days >= 0 && $days <= 5) {
                $title = 'Upcoming payment';
                $body = 'Payment due in '.$days.' day(s): installment #'.$row->installment_no;
                $seenDedupe[] = $dedupe;
                self::upsertReminder($user->id, $dedupe, 'upcoming_due', $title, $body, ['payment_id' => $row->id]);
            } elseif ($days < 0) {
                $title = 'Overdue payment';
                $body = 'Overdue by '.abs($days).' day(s): installment #'.$row->installment_no;
                $seenDedupe[] = $dedupe;
                self::upsertReminder($user->id, $dedupe, 'overdue', $title, $body, ['payment_id' => $row->id]);
            }
        }

        // Remove stale installment reminders that no longer apply
        BorrowerNotification::query()
            ->where('user_id', $user->id)
            ->whereIn('type', ['upcoming_due', 'overdue'])
            ->whereNotNull('dedupe_key')
            ->where('dedupe_key', 'like', 'installment:%')
            ->whereNotIn('dedupe_key', $seenDedupe)
            ->delete();
    }

    private static function upsertReminder(int $userId, string $dedupeKey, string $type, string $title, ?string $body, array $data): void
    {
        $row = BorrowerNotification::query()
            ->where('user_id', $userId)
            ->where('dedupe_key', $dedupeKey)
            ->first();

        if ($row) {
            $row->type = $type;
            $row->title = $title;
            $row->body = $body;
            $row->data = $data;
            $row->save();

            return;
        }

        BorrowerNotification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'dedupe_key' => $dedupeKey,
            'data' => $data,
            'read_at' => null,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        self::syncPaymentRemindersForUser($user);

        $q = BorrowerNotification::query()
            ->where('user_id', $user->id)
            ->orderByDesc('created_at');

        if ($request->boolean('unread_only')) {
            $q->whereNull('read_at');
        }

        $items = $q->paginate((int) $request->query('per_page', 30));

        return response()->json(['ok' => true, 'data' => $items]);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $user = $request->user();
        self::syncPaymentRemindersForUser($user);

        $n = BorrowerNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();

        return response()->json(['ok' => true, 'count' => $n]);
    }

    public function markRead(Request $request, BorrowerNotification $borrowerNotification): JsonResponse
    {
        if ($borrowerNotification->user_id !== $request->user()->id) {
            abort(403);
        }
        $borrowerNotification->read_at = now();
        $borrowerNotification->save();

        return response()->json(['ok' => true]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $user = $request->user();
        BorrowerNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['ok' => true]);
    }
}
