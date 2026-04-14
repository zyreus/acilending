import { Amplify } from 'aws-amplify'

/**
 * Guest Cognito Identity Pool credentials are required for FaceLivenessDetector
 * (streams video to Rekognition). Create a pool in the same region as LIVENESS_AMPLIFY_REGION
 * and attach an IAM role with rekognition:StartFaceLivenessSession (and related) permissions.
 */
const poolId = import.meta.env.VITE_AWS_COGNITO_IDENTITY_POOL_ID
if (typeof poolId === 'string' && poolId.trim() !== '') {
  Amplify.configure({
    Auth: {
      Cognito: {
        identityPoolId: poolId.trim(),
        allowGuestAccess: true,
      },
    },
  })
}
