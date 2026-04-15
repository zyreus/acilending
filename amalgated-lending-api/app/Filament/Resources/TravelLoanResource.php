<?php

namespace App\Filament\Resources;

use App\Filament\Resources\TravelLoanResource\Pages;
use App\Models\TravelApplication;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

/**
 * Travel Assistance Loan — isolated from general loan_applications.
 */
class TravelLoanResource extends Resource
{
    protected static ?string $model = TravelApplication::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-paper-airplane';

    protected static ?string $navigationLabel = 'Travel assistance loan';

    protected static string|\UnitEnum|null $navigationGroup = 'Lending';

    protected static ?int $navigationSort = 20;

    public static function form(Form $form): Form
    {
        $travelDocs = [];
        foreach (config('amalgated_loans.travel_documents') as $key => $meta) {
            $travelDocs[] = Forms\Components\FileUpload::make('documents.'.$key)
                ->label($meta['label'])
                ->disk('public')
                ->directory('documents/travel')
                ->visibility('public')
                ->preserveFilenames()
                ->multiple((bool) ($meta['multiple'] ?? false))
                ->maxSize(10240)
                ->acceptedFileTypes(['application/pdf', 'image/jpeg', 'image/png'])
                ->nullable()
                ->required((bool) ($meta['required'] ?? false));
        }

        return $form
            ->schema([
                Forms\Components\Select::make('user_id')
                    ->relationship('borrower', 'name')
                    ->searchable()
                    ->required(),
                Forms\Components\Select::make('status')
                    ->options([
                        TravelApplication::STATUS_PENDING => 'Pending',
                        TravelApplication::STATUS_APPROVED => 'Approved',
                        TravelApplication::STATUS_REJECTED => 'Rejected',
                    ])
                    ->required(),
                Forms\Components\Section::make('Travel loan request')
                    ->schema([
                        Forms\Components\Grid::make(2)->schema([
                            Forms\Components\TextInput::make('travel_specific_fields.amount_of_loan')
                                ->label('Amount of loan (PHP)')
                                ->numeric(),
                            Forms\Components\TextInput::make('travel_specific_fields.desired_term')
                                ->label('Desired term'),
                            Forms\Components\Textarea::make('travel_specific_fields.purpose_of_loan')
                                ->label('Purpose of loan')
                                ->rows(2)
                                ->columnSpanFull(),
                            Forms\Components\TextInput::make('travel_specific_fields.country_of_destination')
                                ->label('Country of destination'),
                            Forms\Components\TextInput::make('travel_specific_fields.referred_by')
                                ->label('Referred by'),
                        ]),
                    ]),
                Forms\Components\Section::make('Personal data')
                    ->schema([
                        Forms\Components\Grid::make(3)->schema([
                            Forms\Components\TextInput::make('travel_specific_fields.personal.last_name')->label('Last name'),
                            Forms\Components\TextInput::make('travel_specific_fields.personal.first_name')->label('First name'),
                            Forms\Components\TextInput::make('travel_specific_fields.personal.middle_name')->label('Middle name'),
                        ]),
                        Forms\Components\Grid::make(2)->schema([
                            Forms\Components\DatePicker::make('travel_specific_fields.personal.birthdate')->label('Birthdate'),
                            Forms\Components\TextInput::make('travel_specific_fields.personal.place_of_birth')->label('Place of birth'),
                            Forms\Components\TextInput::make('travel_specific_fields.personal.civil_status')->label('Civil status'),
                            Forms\Components\TextInput::make('travel_specific_fields.personal.citizenship')->label('Citizenship'),
                            Forms\Components\TextInput::make('travel_specific_fields.personal.gender')->label('Gender'),
                        ]),
                        Forms\Components\Textarea::make('travel_specific_fields.personal.address_line')->label('Address (full)')->rows(3),
                        Forms\Components\Grid::make(2)->schema([
                            Forms\Components\TextInput::make('travel_specific_fields.personal.city')->label('City / municipality'),
                            Forms\Components\TextInput::make('travel_specific_fields.personal.province')->label('Province'),
                            Forms\Components\TextInput::make('travel_specific_fields.personal.zip')->label('ZIP'),
                            Forms\Components\TextInput::make('travel_specific_fields.personal.residence_type')->label('Residence type (Owned / Rented / etc.)'),
                            Forms\Components\TextInput::make('travel_specific_fields.personal.mobile_number')->label('Mobile number'),
                        ]),
                    ]),
                Forms\Components\Section::make('Spouse')
                    ->schema([
                        Forms\Components\Grid::make(2)->schema([
                            Forms\Components\TextInput::make('travel_specific_fields.spouse.name')->label('Full name'),
                            Forms\Components\TextInput::make('travel_specific_fields.spouse.employment_status')->label('Employment status'),
                            Forms\Components\Textarea::make('travel_specific_fields.spouse.employer_info')->label('Employer info')->rows(2)->columnSpanFull(),
                        ]),
                    ]),
                Forms\Components\Section::make('Work / employment')
                    ->schema([
                        Forms\Components\Grid::make(2)->schema([
                            Forms\Components\TextInput::make('travel_specific_fields.work.employment_type')->label('Employment type'),
                            Forms\Components\TextInput::make('travel_specific_fields.work.tin_sss')->label('TIN / SSS'),
                            Forms\Components\TextInput::make('travel_specific_fields.work.employer_name')->label('Employer name'),
                            Forms\Components\Textarea::make('travel_specific_fields.work.employer_address')->label('Employer address')->rows(2),
                            Forms\Components\TextInput::make('travel_specific_fields.work.position')->label('Position'),
                            Forms\Components\DatePicker::make('travel_specific_fields.work.start_date')->label('Start date'),
                        ]),
                    ]),
                Forms\Components\Section::make('Dependents')
                    ->schema([
                        Forms\Components\Repeater::make('travel_specific_fields.dependents')
                            ->schema([
                                Forms\Components\TextInput::make('name')->required(),
                                Forms\Components\DatePicker::make('birthdate')->label('Birthdate'),
                                Forms\Components\TextInput::make('school_or_work')->label('School / work'),
                            ])
                            ->columns(3)
                            ->defaultItems(0)
                            ->collapsible(),
                    ]),
                Forms\Components\Section::make('Contact persons')
                    ->schema([
                        Forms\Components\Repeater::make('travel_specific_fields.contact_persons')
                            ->schema([
                                Forms\Components\TextInput::make('name')->required(),
                                Forms\Components\TextInput::make('relationship')->label('Relationship'),
                                Forms\Components\TextInput::make('phone')->label('Phone'),
                                Forms\Components\TextInput::make('address')->label('Address'),
                            ])
                            ->columns(2)
                            ->defaultItems(0)
                            ->collapsible(),
                    ]),
                Forms\Components\Section::make('Residence sketch')
                    ->schema([
                        Forms\Components\Textarea::make('travel_specific_fields.sketch_notes')
                            ->label('Notes / description of sketch')
                            ->rows(2),
                    ]),
                Forms\Components\Section::make('Travel documents')
                    ->description('Stored in documents JSON on travel_applications.')
                    ->schema($travelDocs),
                Forms\Components\Section::make('Signatures')
                    ->description('Applicant signature required; spouse optional. Saved as PNG/JPEG on the public disk.')
                    ->schema([
                        Forms\Components\Grid::make(2)->schema([
                            Forms\Components\FileUpload::make('applicant_signature')
                                ->label('Applicant signature (image)')
                                ->disk('public')
                                ->directory('signatures/travel')
                                ->visibility('public')
                                ->image()
                                ->maxSize(4096)
                                ->nullable()
                                ->required(),
                            Forms\Components\FileUpload::make('spouse_signature')
                                ->label('Spouse signature (optional)')
                                ->disk('public')
                                ->directory('signatures/travel')
                                ->visibility('public')
                                ->image()
                                ->maxSize(4096)
                                ->nullable(),
                        ]),
                    ]),
                Forms\Components\Section::make('Terms & conditions')
                    ->schema([
                        Forms\Components\Toggle::make('terms_accepted')->label('Applicant accepted terms'),
                        Forms\Components\DateTimePicker::make('terms_accepted_at')->label('Accepted at')->nullable(),
                        Forms\Components\TextInput::make('signatures.applicant_printed_name')
                            ->label('Applicant printed name (signature line)'),
                        Forms\Components\DatePicker::make('signatures.date')->label('Date (signature)'),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')->sortable(),
                Tables\Columns\TextColumn::make('borrower.name')->label('Borrower')->searchable(),
                Tables\Columns\TextColumn::make('status'),
                Tables\Columns\TextColumn::make('terms_accepted')
                    ->label('Terms')
                    ->formatStateUsing(fn ($state) => $state ? 'Yes' : 'No'),
                Tables\Columns\TextColumn::make('created_at')->dateTime()->sortable(),
            ])
            ->defaultSort('id', 'desc');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListTravelLoans::route('/'),
            'create' => Pages\CreateTravelLoan::route('/create'),
            'edit' => Pages\EditTravelLoan::route('/{record}/edit'),
        ];
    }
}
