import { NextRequest, NextResponse } from 'next/server';
import { s3Client, R2_BUCKET_NAME } from '@/lib/cloudflare/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';

export async function POST(req: NextRequest) {
    if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
        return NextResponse.json({ error: 'Missing R2 credentials in server environment' }, { status: 500 });
    }
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Use crypto.randomUUID() for collision-free keys
        const fileExt = file.name.split('.').pop();
        const uuid = crypto.randomUUID();
        const key = `art-oasis/${uuid}.${fileExt}`;

        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: file.type,
        });

        await s3Client.send(command);

        // Path-based URL ensures caches respect unique keys
        const publicUrl = process.env.R2_PUBLIC_DOMAIN
            ? `${process.env.R2_PUBLIC_DOMAIN}/${key}`
            : `/api/image/${encodeURIComponent(key)}`;

        return NextResponse.json({
            success: true,
            key,
            url: publicUrl,
            fileName: file.name
        });

    } catch (error: any) {
        console.error('Upload error details:', error);
        console.error('Attempted Bucket:', R2_BUCKET_NAME);

        return NextResponse.json({
            error: `Upload failed: ${error.message || 'Unknown error'}`,
            details: error.toString(),
            debug: {
                bucket: R2_BUCKET_NAME,
                accountIdLength: process.env.CLOUDFLARE_ACCOUNT_ID?.length
            }
        }, { status: 500 });
    }
}
