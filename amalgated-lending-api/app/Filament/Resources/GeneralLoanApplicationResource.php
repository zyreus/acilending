<?php

namespace App\Filament\Resources;

use App\Filament\Resources\GeneralLoanApplicationResource\Pages;
use App\Models\LoanApplication;
use Closure;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;

/**
 * General loan applications: exactly one loan_type controls visible fields, documents, and validation.
 * Filament v2: use Radio (single selection); CheckboxList maxItems is not available in this version.
 */
class GeneralLoanApplicationResource extends Resource
{
    protected static ?string $model = LoanApplication::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-collection';

    protected static ?string $navigationLabel = 'General loan applications';

    protected static string|\UnitEnum|null $navigationGroup = 'Lending';

    protected static ?int $navigationSort = 10;

    public static function form(Schema $schema): Schema
    {
        $unionDocs = [];
        foreach (config('amalgated_loans.general_documents') as $lt => $docs) {
            foreach ($docs as $key => $meta) {
                if (! isset($unionDocs[$key])) {
                    $unionDocs[$key] = [
                        'label' => $meta['label'],
                        'types' => [],
                        'multiple' => false,
                        'required' => false,
                    ];
                }
                $unionDocs[$key]['types'][] = $lt;
                $unionDocs[$key]['multiple'] = $unionDocs[$key]['multiple'] || (bool) ($meta['multiple'] ?? false);
                $unionDocs[$key]['required'] = $unionDocs[$key]['required'] || (bool) ($meta['required'] ?? false);
            }
        }

        $docUploads = [];
        foreach ($unionDocs as $key => $spec) {
            $docUploads[] = Forms\Components\FileUpload::make('documents.'.$key)
                ->label($spec['label'])
                ->disk('public')
                ->directory(fn (Closure $get) => 'documents/'.($get('loan_type') ?: 'general'))
                ->visibility('public')
                ->preserveFilenames()
                ->multiple($spec['multiple'])
                ->maxSize(10240)
                ->acceptedFileTypes(['application/pdf', 'image/jpeg', 'image/png'])
                ->nullable()
                ->visible(fn (Closure $get) => in_array($get('loan_type'), $spec['types'], true))
                ->required(fn (Closure $get) => in_array($get('loan_type'), $spec['types'], true) && $spec['required']);
        }

        $typeForms = [];
        foreach (config('amalgated_loans.general_form_fields') as $lt => $rows) {
            foreach ($rows as $row) {
                $path = 'form_data.'.$row['key'];
                $component = match ($row['type']) {
                    'textarea' => Forms\Components\Textarea::make($path)->label($row['label'])->rows(3),
                    'numeric' => Forms\Components\TextInput::make($path)->label($row['label'])->numeric(),
                    default => Forms\Components\TextInput::make($path)->label($row['label'])->maxLength(500),
                };
                $required = (bool) ($row['required'] ?? false);
                $typeForms[] = $component
                    ->visible(fn (Closure $get) => $get('loan_type') === $lt)
                    ->required(fn (Closure $get) => $get('loan_type') === $lt && $required);
            }
        }

        return $schema
            ->schema([
                Forms\Components\Grid::make(2)->schema([
                    Forms\Components\Select::make('user_id')
                        ->relationship('borrower', 'name')
                        ->searchable()
                        ->required()
                        ->columnSpan(1),
                    Forms\Components\Select::make('status')
                        ->options([
                            LoanApplication::STATUS_DRAFT => 'Draft',
                            LoanApplication::STATUS_PENDING => 'Pending',
                            LoanApplication::STATUS_APPROVED => 'Approved',
                            LoanApplication::STATUS_REJECTED => 'Rejected',
                        ])
                        ->required()
                        ->columnSpan(1),
                    Forms\Components\DateTimePicker::make('submitted_at')->label('Submitted at')->nullable(),
                    Forms\Components\DateTimePicker::make('verified_at')->label('Verified at')->nullable(),
                    Forms\Components\Textarea::make('rejection_reason')->label('Rejection reason')->rows(2)->columnSpanFull(),
                ]),
                Forms\Components\Section::make('Loan type')
                    ->description('Select exactly one loan type. Only the selected type shows fields and required documents below.')
                    ->schema([
                        Forms\Components\Radio::make('loan_type')
                            ->options(config('amalgated_loans.general_loan_types'))
                            ->required()
                            ->live(),
                    ]),
                Forms\Components\Section::make('Applicant')
                    ->description('Core applicant details (form_data JSON).')
                    ->schema([
                        Forms\Components\Grid::make(2)->schema([
                            Forms\Components\TextInput::make('form_data.full_name')->label('Full name')->maxLength(255),
                            Forms\Components\TextInput::make('form_data.email')->label('Email')->email(),
                            Forms\Components\TextInput::make('form_data.phone')->label('Phone')->maxLength(32),
                            Forms\Components\Textarea::make('form_data.address')->label('Address')->rows(2)->columnSpanFull(),
                        ]),
                    ]),
                Forms\Components\Section::make('Loan-type details')
                    ->description('Shown only for the selected loan type.')
                    ->schema($typeForms),
                Forms\Components\Section::make('Required documents')
                    ->description('Upload paths stored in documents JSON; labels follow loan type.')
                    ->schema([
                        Forms\Components\Grid::make(2)->schema($docUploads),
                    ]),
                Forms\Components\Section::make('Signatures')
                    ->description('Applicant required for all types; co-maker required for Chattel when applicable.')
                    ->schema([
                        Forms\Components\Grid::make(2)->schema([
                            Forms\Components\FileUpload::make('applicant_signature')
                                ->label('Applicant signature (image / PNG)')
                                ->disk('public')
                                ->directory('signatures/general')
                                ->visibility('public')
                                ->image()
                                ->maxSize(4096)
                                ->nullable()
                                ->required(),
                            Forms\Components\FileUpload::make('spouse_signature')
                                ->label('Spouse signature (optional)')
                                ->disk('public')
                                ->directory('signatures/general')
                                ->visibility('public')
                                ->image()
                                ->maxSize(4096)
                                ->nullable(),
                            Forms\Components\FileUpload::make('comaker_signature')
                                ->label('Co-maker signature')
                                ->disk('public')
                                ->directory('signatures/general')
                                ->visibility('public')
                                ->image()
                                ->maxSize(4096)
                                ->nullable()
                                ->visible(fn (Closure $get) => $get('loan_type') === LoanApplication::TYPE_CHATTEL)
                                ->required(fn (Closure $get) => $get('loan_type') === LoanApplication::TYPE_CHATTEL),
                        ]),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')->sortable(),
                Tables\Columns\TextColumn::make('borrower.name')->label('Borrower')->searchable(),
                Tables\Columns\TextColumn::make('loan_type')->label('Type'),
                Tables\Columns\TextColumn::make('status')->sortable(),
                Tables\Columns\TextColumn::make('submitted_at')->dateTime()->label('Submitted')->sortable(),
                Tables\Columns\TextColumn::make('verified_at')->dateTime()->label('Verified')->toggleable(),
                Tables\Columns\TextColumn::make('created_at')->dateTime()->sortable(),
            ])
            ->defaultSort('id', 'desc');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListGeneralLoanApplications::route('/'),
            'create' => Pages\CreateGeneralLoanApplication::route('/create'),
            'edit' => Pages\EditGeneralLoanApplication::route('/{record}/edit'),
        ];
    }
}
