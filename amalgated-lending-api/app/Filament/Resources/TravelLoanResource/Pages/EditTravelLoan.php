<?php

namespace App\Filament\Resources\TravelLoanResource\Pages;

use App\Filament\Resources\TravelLoanResource;
use Filament\Actions\Action;
use Filament\Resources\Pages\EditRecord;

class EditTravelLoan extends EditRecord
{
    protected static string $resource = TravelLoanResource::class;

    protected function getHeaderActions(): array
    {
        return array_merge([
            Action::make('print')
                ->label('Print (A4)')
                ->icon('heroicon-o-printer')
                ->url(fn () => route('print.travel-loan', $this->record))
                ->openUrlInNewTab(),
            Action::make('terms')
                ->label('Terms & conditions')
                ->icon('heroicon-o-document-text')
                ->url(fn () => route('travel.terms'))
                ->openUrlInNewTab(),
        ], parent::getHeaderActions());
    }
}
