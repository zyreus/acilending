<?php

namespace App\Services;

use Aws\Rekognition\RekognitionClient;
use Illuminate\Support\Str;
use Throwable;

/**
 * Amazon Rekognition Face Liveness (streaming) — CreateFaceLivenessSession / GetFaceLivenessSessionResults.
 * Must use a region where Face Liveness is available (often us-east-1), not necessarily the same as CompareFaces.
 */
class RekognitionFaceLivenessService
{
    public function isConfigured(): bool
    {
        $key = config('services.aws.key');
        $secret = config('services.aws.secret');
        $region = config('liveness.amplify_region');

        return is_string($key) && $key !== ''
            && is_string($secret) && $secret !== ''
            && is_string($region) && $region !== '';
    }

    protected function client(): ?RekognitionClient
    {
        if (! $this->isConfigured()) {
            return null;
        }

        return new RekognitionClient([
            'version' => 'latest',
            'region' => config('liveness.amplify_region'),
            'credentials' => [
                'key' => config('services.aws.key'),
                'secret' => config('services.aws.secret'),
            ],
        ]);
    }

    /**
     * @throws Throwable
     */
    public function createSession(): string
    {
        $client = $this->client();
        if ($client === null) {
            throw new \RuntimeException('Rekognition Face Liveness is not configured.');
        }

        $result = $client->createFaceLivenessSession([
            'ClientRequestToken' => (string) Str::uuid(),
        ]);

        $id = $result['SessionId'] ?? null;
        if (! is_string($id) || $id === '') {
            throw new \RuntimeException('CreateFaceLivenessSession did not return SessionId.');
        }

        return $id;
    }

    /**
     * @return array{Status: ?string, Confidence: ?float, raw: array<string, mixed>}
     */
    public function getSessionResults(string $sessionId): array
    {
        $client = $this->client();
        if ($client === null) {
            throw new \RuntimeException('Rekognition Face Liveness is not configured.');
        }

        $result = $client->getFaceLivenessSessionResults([
            'SessionId' => $sessionId,
        ]);
        $arr = $result->toArray();

        $status = isset($arr['Status']) ? (string) $arr['Status'] : null;
        $confidence = isset($arr['Confidence']) ? (float) $arr['Confidence'] : null;

        return [
            'Status' => $status,
            'Confidence' => $confidence,
            'raw' => $arr,
        ];
    }

    public function safeGetSessionResults(string $sessionId): array
    {
        try {
            return $this->getSessionResults($sessionId);
        } catch (Throwable $e) {
            report($e);

            return [
                'Status' => null,
                'Confidence' => null,
                'raw' => [],
                'error' => $e->getMessage(),
            ];
        }
    }
}
