<?php

namespace App\Filament\Resources\TravelLoanResource\Pages;

use App\Filament\Resources\TravelLoanResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListTravelLoans extends ListRecords
{
    protected static string $resource = TravelLoanResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
