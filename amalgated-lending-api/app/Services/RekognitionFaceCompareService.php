<?php

namespace App\Services;

use Aws\Rekognition\RekognitionClient;
use Throwable;

class RekognitionFaceCompareService
{
    public function isConfigured(): bool
    {
        $key = config('services.aws.key');
        $secret = config('services.aws.secret');
        $region = config('services.aws.region');

        return is_string($key) && $key !== ''
            && is_string($secret) && $secret !== ''
            && is_string($region) && $region !== '';
    }

    /**
     * @return array{similarity: float|null, raw: mixed}
     */
    public function compareFaceBytes(string $sourceBytes, string $targetBytes, int $similarityThreshold = 85): array
    {
        $client = new RekognitionClient([
            'version' => 'latest',
            'region' => config('services.aws.region'),
            'credentials' => [
                'key' => config('services.aws.key'),
                'secret' => config('services.aws.secret'),
            ],
        ]);

        $result = $client->compareFaces([
            'SimilarityThreshold' => $similarityThreshold,
            'SourceImage' => ['Bytes' => $sourceBytes],
            'TargetImage' => ['Bytes' => $targetBytes],
        ]);

        $matches = $result['FaceMatches'] ?? [];
        $best = null;
        foreach ($matches as $m) {
            $s = isset($m['Similarity']) ? (float) $m['Similarity'] : null;
            if ($s !== null && ($best === null || $s > $best)) {
                $best = $s;
            }
        }

        return [
            'similarity' => $best,
            'raw' => $result->toArray(),
        ];
    }

    public function safeCompare(string $sourceBytes, string $targetBytes, int $similarityThreshold = 85): array
    {
        try {
            return $this->compareFaceBytes($sourceBytes, $targetBytes, $similarityThreshold);
        } catch (Throwable $e) {
            report($e);

            return [
                'similarity' => null,
                'raw' => null,
                'error' => $e->getMessage(),
            ];
        }
    }
}
