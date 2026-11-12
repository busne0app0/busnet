import { supabase } from '../../supabase/config';

export interface UploadResult {
    url: string | null;
    error: string | null;
}

/**
 * Клієнтська компресія фото у WebP перед завантаженням (Canvas API)
 * Зменшує розмір фото з 5-10 МБ до 150-400 КБ без втрати візуальної якості
 */
export async function compressImage(
    file: File,
    maxWidth = 1000,
    maxHeight = 1000,
    quality = 0.82
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                let { width, height } = img;
                if (width > maxWidth || height > maxHeight) {
                    if (width > height) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error('Не вдалося ініціалізувати контекст обробки фото'));

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error('Помилка компресії зображення'));
                    },
                    'image/webp',
                    quality
                );
            };
            img.onerror = (e) => reject(e);
        };
        reader.onerror = (e) => reject(e);
    });
}

/**
 * Завантаження аватарки у Supabase Storage Bucket 'avatars'
 */
export async function uploadUserAvatar(userId: string, file: File): Promise<UploadResult> {
    try {
        // 1. Стискаємо фото на стороні клієнта
        const compressedBlob = await compressImage(file, 400, 400, 0.85);
        const fileName = `${userId}-${Date.now()}.webp`;
        const filePath = `avatars/${fileName}`;

        // 2. Вантажимо у бакет 'avatars'
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, compressedBlob, {
                contentType: 'image/webp',
                upsert: true,
            });

        if (uploadError) {
            // Якщо бакет не налаштовано або закритий RLS — кидаємо пояснення
            console.warn('[connectMediaService] Помилка завантаження у Storage:', uploadError.message);
            throw uploadError;
        }

        // 3. Отримуємо публічний URL
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        return { url: data.publicUrl, error: null };
    } catch (err: any) {
        return {
            url: null,
            error: err.message || 'Не вдалося завантажити аватар. Перевірте сховище Supabase.'
        };
    }
}

/**
 * Завантаження фотографій постів / історій у 'connect_media'
 */
export async function uploadPostMedia(userId: string, file: File): Promise<UploadResult> {
    try {
        const compressedBlob = await compressImage(file, 1400, 1400, 0.8);
        const fileName = `post-${userId}-${Date.now()}.webp`;
        const filePath = `posts/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('connect_media')
            .upload(filePath, compressedBlob, {
                contentType: 'image/webp',
                upsert: true,
            });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('connect_media').getPublicUrl(filePath);
        return { url: data.publicUrl, error: null };
    } catch (err: any) {
        return { url: null, error: err.message || 'Помилка завантаження фото' };
    }
}