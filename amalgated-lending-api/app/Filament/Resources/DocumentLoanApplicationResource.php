<?php

namespace App\Filament\Resources;

use App\Filament\Resources\DocumentLoanApplicationResource\Pages;
use App\Models\DocumentLoanApplication;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;

class DocumentLoanApplicationResource extends Resource
{
    protected static ?string $model = DocumentLoanApplication::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-document-text';

    protected static ?string $navigationLabel = 'Document loan applications';

    protected static string|\UnitEnum|null $navigationGroup = 'Lending';

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->schema([
                Forms\Components\Section::make('Embedded uploads (borrower wizard)')
                    ->description('Same files as borrower Step 4. Disk: public · directory: documents/{application id}.')
                    ->schema([
                        Forms\Components\FileUpload::make('valid_id_path')
                            ->label('Valid ID')
                            ->disk('public')
                            ->directory(fn (?DocumentLoanApplication $record) => $record ? 'documents/'.$record->id : 'documents')
                            ->visibility('public')
                            ->preserveFilenames()
                            ->maxSize(10240)
                            ->acceptedFileTypes(['application/pdf', 'image/jpeg', 'image/png'])
                            ->nullable(),
                        Forms\Components\FileUpload::make('proof_income_path')
                            ->label('Proof of income')
                            ->disk('public')
                            ->directory(fn (?DocumentLoanApplication $record) => $record ? 'documents/'.$record->id : 'documents')
                            ->visibility('public')
                            ->preserveFilenames()
                            ->maxSize(10240)
                            ->acceptedFileTypes(['application/pdf', 'image/jpeg', 'image/png'])
                            ->nullable(),
                        Forms\Components\FileUpload::make('additional_document_paths')
                            ->label('Additional documents')
                            ->multiple()
                            ->disk('public')
                            ->directory(fn (?DocumentLoanApplication $record) => $record ? 'documents/'.$record->id : 'documents')
                            ->visibility('public')
                            ->preserveFilenames()
                            ->maxSize(10240)
                            ->acceptedFileTypes(['application/pdf', 'image/jpeg', 'image/png'])
                            ->nullable(),
                    ])
                    ->columns(1),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')->sortable(),
                Tables\Columns\TextColumn::make('user.name')->label('Borrower')->searchable(),
                Tables\Columns\TextColumn::make('loanProduct.name')->label('Product'),
                Tables\Columns\TextColumn::make('status'),
                Tables\Columns\TextColumn::make('wizard_highest_passed_step')->label('Wizard step'),
                Tables\Columns\TextColumn::make('submitted_at')->dateTime()->sortable(),
            ])
            ->defaultSort('id', 'desc');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListDocumentLoanApplications::route('/'),
            'edit' => Pages\EditDocumentLoanApplication::route('/{record}/edit'),
        ];
    }

    public static function canCreate(): bool
    {
        return false;
    }
}
