import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  uploadToStorage,
  downloadFromStorage,
  getStoragePresignedUrl,
  getBucketName,
} from '@/lib/storage';
import { invokeNeonHello } from '@/lib/functions';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: {
    postgres: {
      status: 'ok' | 'error';
      message: string;
      details?: Record<string, unknown>;
    };
    objectStorage: {
      status: 'ok' | 'error';
      message: string;
      details?: Record<string, unknown>;
    };
    functions: {
      status: 'ok' | 'error';
      message: string;
      details?: Record<string, unknown>;
    };
  } = {
    postgres: { status: 'error', message: 'Not tested' },
    objectStorage: { status: 'error', message: 'Not tested' },
    functions: { status: 'error', message: 'Not tested' },
  };

  // 1. Test Postgres
  const pgStart = Date.now();
  try {
    const [userCount, studentCount, teacherCount] = await Promise.all([
      prisma.user.count(),
      prisma.student.count(),
      prisma.teacher.count(),
    ]);

    results.postgres = {
      status: 'ok',
      message: 'Postgres connection active & queries executed successfully',
      details: {
        latencyMs: Date.now() - pgStart,
        totalUsers: userCount,
        totalStudents: studentCount,
        totalTeachers: teacherCount,
        branch: process.env.NEON_BRANCH || 'production',
      },
    };
  } catch (err: unknown) {
    results.postgres = {
      status: 'error',
      message: err instanceof Error ? err.message : String(err),
      details: { latencyMs: Date.now() - pgStart },
    };
  }

  // 2. Test Object Storage
  const storageStart = Date.now();
  const testKey = `tests/healthcheck-${Date.now()}.json`;
  const testPayload = JSON.stringify({
    service: 'SIM Sekolah - Neon Object Storage',
    timestamp: new Date().toISOString(),
    status: 'healthy',
  });

  try {
    // A. Upload
    await uploadToStorage({
      key: testKey,
      body: Buffer.from(testPayload),
      contentType: 'application/json',
    });

    // B. Presigned URL
    const presignedUrl = await getStoragePresignedUrl(testKey, 600);

    // C. Download back & verify
    const downloadedBytes = await downloadFromStorage(testKey);
    const downloadedText = new TextDecoder().decode(downloadedBytes);
    const matched = downloadedText === testPayload;

    results.objectStorage = {
      status: 'ok',
      message: 'Object Storage read/write/presign round-trip verified successfully',
      details: {
        latencyMs: Date.now() - storageStart,
        bucket: getBucketName(),
        testKey,
        dataVerified: matched,
        presignedUrlPreview: presignedUrl.split('?')[0],
      },
    };
  } catch (err: unknown) {
    results.objectStorage = {
      status: 'error',
      message: err instanceof Error ? err.message : String(err),
      details: { latencyMs: Date.now() - storageStart },
    };
  }

  // 3. Test Functions
  const fnStart = Date.now();
  try {
    const fnResponse = await invokeNeonHello();
    if (fnResponse.success) {
      results.functions = {
        status: 'ok',
        message: 'Neon Function responded successfully',
        details: {
          latencyMs: Date.now() - fnStart,
          output: fnResponse.data,
          httpStatus: fnResponse.status,
        },
      };
    } else {
      results.functions = {
        status: 'error',
        message: `Neon Function returned HTTP ${fnResponse.status}: ${fnResponse.error || fnResponse.raw}`,
        details: { latencyMs: Date.now() - fnStart },
      };
    }
  } catch (err: unknown) {
    results.functions = {
      status: 'error',
      message: err instanceof Error ? err.message : String(err),
      details: { latencyMs: Date.now() - fnStart },
    };
  }

  const allHealthy =
    results.postgres.status === 'ok' &&
    results.objectStorage.status === 'ok' &&
    results.functions.status === 'ok';

  return NextResponse.json(
    {
      success: allHealthy,
      timestamp: new Date().toISOString(),
      services: results,
    },
    { status: allHealthy ? 200 : 500 }
  );
}
