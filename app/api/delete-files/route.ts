import { NextRequest, NextResponse } from 'next/server';
import { s3Client, R2_BUCKET_NAME } from '@/lib/cloudflare/r2';
import { DeleteObjectsCommand } from '@aws-sdk/client-s3';

export async function POST(req: NextRequest) {
    if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
        return NextResponse.json({ error: 'Missing R2 credentials in server environment' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { fileKeys } = body;

        if (!fileKeys || !Array.isArray(fileKeys) || fileKeys.length === 0) {
            return NextResponse.json({ error: 'No files provided for deletion' }, { status: 400 });
        }

        // Extrair a chave do URL se for uma URL completa
        const keysToDelete = fileKeys.map((keyOrUrl: string) => {
            // Se for URL publica do nosso dominio
            if (process.env.R2_PUBLIC_DOMAIN && keyOrUrl.startsWith(process.env.R2_PUBLIC_DOMAIN)) {
                return keyOrUrl.replace(`${process.env.R2_PUBLIC_DOMAIN}/`, '');
            }
            // Se for rota de API
            if (keyOrUrl.startsWith('/api/image/')) {
                return decodeURIComponent(keyOrUrl.replace('/api/image/', ''));
            }
            // Retorna como está se não corresponder aos padrões conhecidos
            return keyOrUrl;
        });

        // Agrupar em objetos para o comando Delete
        const objects = keysToDelete.map(key => ({ Key: key }));

        const command = new DeleteObjectsCommand({
            Bucket: R2_BUCKET_NAME,
            Delete: {
                Objects: objects,
                Quiet: false,
            },
        });

        const response = await s3Client.send(command);

        if (response.Errors && response.Errors.length > 0) {
            console.error('Errors deleting files:', response.Errors);
            return NextResponse.json({
                success: false,
                message: 'Some files could not be deleted',
                errors: response.Errors
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            deleted: response.Deleted?.length || 0
        });

    } catch (error: any) {
        console.error('Delete error details:', error);
        return NextResponse.json({
            error: `Delete failed: ${error.message || 'Unknown error'}`,
            details: error.toString()
        }, { status: 500 });
    }
}
