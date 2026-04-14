<?php

namespace App\Filament\Resources\GeneralLoanApplicationResource\Pages;

use App\Filament\Resources\GeneralLoanApplicationResource;
use App\Models\LoanApplication;
use Filament\Forms;
use Filament\Actions\Action;
use Filament\Resources\Pages\EditRecord;

class EditGeneralLoanApplication extends EditRecord
{
    protected static string $resource = GeneralLoanApplicationResource::class;

    protected function getHeaderActions(): array
    {
        return array_merge([
            Action::make('print')
                ->label('Print (A4)')
                ->icon('heroicon-o-printer')
                ->url(fn () => route('print.general-loan', $this->record))
                ->openUrlInNewTab(),
            Action::make('approve')
                ->label('Approve')
                ->color('success')
                ->requiresConfirmation()
                ->action(fn () => $this->record->update([
                    'status' => LoanApplication::STATUS_APPROVED,
                ])),
            Action::make('verify')
                ->label('Mark verified')
                ->color('secondary')
                ->requiresConfirmation()
                ->action(fn () => $this->record->update([
                    'verified_at' => now(),
                ])),
            Action::make('reject')
                ->label('Reject')
                ->color('danger')
                ->form([
                    Forms\Components\Textarea::make('rejection_reason')
                        ->label('Reason')
                        ->required(),
                ])
                ->action(function (array $data): void {
                    $this->record->update([
                        'status' => LoanApplication::STATUS_REJECTED,
                        'rejection_reason' => $data['rejection_reason'],
                    ]);
                }),
        ], parent::getHeaderActions());
    }
}
