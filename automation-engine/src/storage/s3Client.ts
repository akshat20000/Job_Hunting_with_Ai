import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/index.js';

function createS3Client(): S3Client {
  const config: ConstructorParameters<typeof S3Client>[0] = {
    region: env.S3_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  };

  // When S3_ENDPOINT is set (e.g. MinIO in dev), use path-style URLs
  if (env.S3_ENDPOINT) {
    config.endpoint = env.S3_ENDPOINT;
    config.forcePathStyle = true;
  }

  return new S3Client(config);
}

export const s3Client = createS3Client();

/**
 * Upload a buffer or stream to S3/MinIO.
 * Returns the S3 object key (not a signed URL).
 */
export async function uploadToS3(params: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}): Promise<string> {
  const input: PutObjectCommandInput = {
    Bucket: env.S3_BUCKET_NAME,
    Key: params.key,
    Body: params.body,
    ContentType: params.contentType,
  };

  await s3Client.send(new PutObjectCommand(input));
  return params.key;
}

/**
 * Generate a pre-signed GET URL for a private S3 object.
 * Default expiry: 1 hour (3600 seconds).
 */
export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET_NAME,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}
