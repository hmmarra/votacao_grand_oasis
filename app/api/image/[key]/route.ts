import { NextRequest, NextResponse } from 'next/server';
import { s3Client, R2_BUCKET_NAME } from '@/lib/cloudflare/r2';
import { GetObjectCommand } from '@aws-sdk/client-s3';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ key: string }> }
) {
    try {
        const { key } = await params;

        if (!key) {
            return NextResponse.json({ error: 'Key is required' }, { status: 400 });
        }

        // Decodificar a chave, pois ela vem codificada na URL
        const decodedKey = decodeURIComponent(key);

        const command = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: decodedKey,
        });

        const response = await s3Client.send(command);

        if (!response.Body) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // Converter o stream do S3 para um ReadableStream compatível com Web Standard (para Next.js Response)
        const stream = response.Body.transformToWebStream();

        return new NextResponse(stream, {
            headers: {
                'Content-Type': response.ContentType || 'application/octet-stream',
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });

    } catch (error: any) {
        console.error('Error fetching image:', error);
        return NextResponse.json({ error: 'Error fetching image' }, { status: 500 });
    }
}
