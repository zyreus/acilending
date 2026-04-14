<?php

namespace App\Filament\Resources\TravelLoanResource\Pages;

use App\Filament\Resources\TravelLoanResource;
use Filament\Resources\Pages\CreateRecord;

class CreateTravelLoan extends CreateRecord
{
    protected static string $resource = TravelLoanResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $data['travel_specific_fields'] = $data['travel_specific_fields'] ?? [];
        $data['documents'] = $data['documents'] ?? [];
        $data['signatures'] = $data['signatures'] ?? [];

        return $data;
    }
}
