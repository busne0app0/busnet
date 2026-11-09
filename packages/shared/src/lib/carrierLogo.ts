import { supabase } from '../supabase/config';

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export async function uploadCarrierLogo(
  file: File,
  uid: string,
  previousLogoUrl?: string | null
): Promise<string> {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Лише формати PNG, JPG або WebP');
  }
  if (file.size > MAX_LOGO_SIZE_BYTES) {
    throw new Error('Розмір файлу не повинен перевищувати 2 МБ');
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const filePath = `${uid}/logo-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { cacheControl: '3600', upsert: true });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  const { error: updateError } = await supabase
    .from('users')
    .update({ logoUrl: publicUrl })
    .eq('uid', uid);

  if (updateError) throw updateError;

  // Cleanup old logo from storage if present
  if (previousLogoUrl) {
    try {
      const oldPath = previousLogoUrl.split('/avatars/')[1];
      if (oldPath && oldPath !== filePath) {
        await supabase.storage.from('avatars').remove([oldPath]);
      }
    } catch (cleanupError) {
      console.warn('Could not cleanup previous logo:', cleanupError);
    }
  }

  return publicUrl;
}
