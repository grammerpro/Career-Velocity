// ============================================================================
// CareerVelocity — S3 Storage Utility
// Upload/download buffers to AWS S3 (or Supabase Storage via S3 API).
// ============================================================================

import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ── S3 Client Singleton ─────────────────────────────────────────────────────

let _s3Client: S3Client | null = null;

function getS3Client(): S3Client {
    if (!_s3Client) {
        _s3Client = new S3Client({
            region: process.env.AWS_REGION ?? "us-east-1",
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        });
    }
    return _s3Client;
}

const BUCKET = process.env.AWS_S3_BUCKET!;

// ── Types ───────────────────────────────────────────────────────────────────

export interface UploadResult {
    s3Key: string;
    s3Url: string;
}

// ── Upload Buffer ───────────────────────────────────────────────────────────

/**
 * Upload a buffer to S3 and return the key + public URL.
 * Key format: `{userId}/{folder}/{timestamp}-{filename}`
 */
export async function uploadToS3(
    buffer: Buffer,
    options: {
        userId: string;
        folder: string;
        filename: string;
        contentType: string;
    }
): Promise<UploadResult> {
    const { userId, folder, filename, contentType } = options;
    const timestamp = Date.now();
    const s3Key = `${userId}/${folder}/${timestamp}-${filename}`;

    const client = getS3Client();

    await client.send(
        new PutObjectCommand({
            Bucket: BUCKET,
            Key: s3Key,
            Body: buffer,
            ContentType: contentType,
            // Set private ACL — use presigned URLs for access
            ServerSideEncryption: "AES256",
            Metadata: {
                userId,
                uploadedAt: new Date().toISOString(),
            },
        })
    );

    // Construct the S3 URL (region-specific)
    const region = process.env.AWS_REGION ?? "us-east-1";
    const s3Url = `https://${BUCKET}.s3.${region}.amazonaws.com/${s3Key}`;

    return { s3Key, s3Url };
}

// ── Generate Presigned Download URL ─────────────────────────────────────────

/**
 * Generate a time-limited presigned URL for secure downloads.
 * Default expiry: 1 hour.
 */
export async function getPresignedDownloadUrl(
    s3Key: string,
    expiresInSeconds: number = 3600
): Promise<string> {
    const client = getS3Client();

    const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
    });

    return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

// ── Delete Object ───────────────────────────────────────────────────────────

/**
 * Delete an object from S3 (used for GDPR data purge or re-generation).
 */
export async function deleteFromS3(s3Key: string): Promise<void> {
    const client = getS3Client();

    await client.send(
        new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: s3Key,
        })
    );
}
