<?php

namespace App\Filament\Resources\GeneralLoanApplicationResource\Pages;

use App\Filament\Resources\GeneralLoanApplicationResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListGeneralLoanApplications extends ListRecords
{
    protected static string $resource = GeneralLoanApplicationResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
