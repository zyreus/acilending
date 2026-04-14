<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentUploadHistory extends Model
{
    protected $table = 'document_upload_histories';

    protected $fillable = [
        'uploaded_document_id',
        'file_path',
        'original_name',
        'version',
    ];

    protected $casts = [
        'version' => 'integer',
    ];

    public function uploadedDocument(): BelongsTo
    {
        return $this->belongsTo(UploadedDocument::class);
    }
}
