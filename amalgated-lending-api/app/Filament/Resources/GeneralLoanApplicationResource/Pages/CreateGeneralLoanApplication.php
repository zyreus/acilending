<?php

namespace App\Filament\Resources\GeneralLoanApplicationResource\Pages;

use App\Filament\Resources\GeneralLoanApplicationResource;
use Filament\Resources\Pages\CreateRecord;

class CreateGeneralLoanApplication extends CreateRecord
{
    protected static string $resource = GeneralLoanApplicationResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $data['form_data'] = $data['form_data'] ?? [];
        $data['documents'] = $data['documents'] ?? [];

        return $data;
    }
}
