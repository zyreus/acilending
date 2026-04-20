<?php

use App\Http\Controllers\Web\LoanPrintController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

Route::view('/loan-application-demo', 'loan-application-form')->name('loan.application.demo');

Route::view('/travel-assistance/terms', 'travel.terms')->name('travel.terms');

Route::get('/print/general-loan/{loanApplication}', [LoanPrintController::class, 'generalLoan'])->name('print.general-loan');
Route::get('/print/travel-loan/{travelApplication}', [LoanPrintController::class, 'travelLoan'])->name('print.travel-loan');
Route::get('/print/loan-soa/{loan}', [LoanPrintController::class, 'loanSoa'])->name('print.loan-soa');
