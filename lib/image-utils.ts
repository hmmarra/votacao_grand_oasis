
/**
 * Compresses an image file to a target size in KB.
 * It resizes dimensions if necessary and adjusts JPEG quality until the size constraint is met.
 * 
 * @param file - The original File object
 * @param targetSizeKB - The max size in KB (default: 120)
 * @returns A Promise resolving to the compressed File object
 */
export const compressImage = async (file: File, targetSizeKB: number = 120): Promise<File> => {
    // If file is already smaller than target, return it as is
    if (file.size <= targetSizeKB * 1024) return file;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Initial resize logic to help compression
                // If image is huge (e.g. > 1920px), resize it first to a reasonable max dimension
                const MAX_DIMENSION = 1600;
                if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                    if (width > height) {
                        height *= MAX_DIMENSION / width;
                        width = MAX_DIMENSION;
                    } else {
                        width *= MAX_DIMENSION / height;
                        height = MAX_DIMENSION;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                // Fill background with white (handling transparent PNGs converted to JPEG)
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                // Recursive function to try different qualities
                const attemptCompression = (quality: number) => {
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error('Canvas to Blob failed'));
                                return;
                            }

                            // If blob fits or we hit minimum quality/iterations
                            if (blob.size <= targetSizeKB * 1024 || quality <= 0.2) {
                                const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
                                const compressedFile = new File([blob], newFileName, {
                                    type: 'image/jpeg',
                                    lastModified: Date.now(),
                                });
                                resolve(compressedFile);
                            } else {
                                // Reduce quality and try again
                                // Reduce drastically if far from target, subtle if close
                                const step = blob.size > (targetSizeKB * 1024 * 2) ? 0.2 : 0.1;
                                attemptCompression(Math.max(0.1, quality - step));
                            }
                        },
                        'image/jpeg',
                        quality
                    );
                };

                // Start with high quality but slightly reduced (0.9)
                attemptCompression(0.9);
            };

            img.onerror = (error) => reject(error);
        };

        reader.onerror = (error) => reject(error);
    });
};
