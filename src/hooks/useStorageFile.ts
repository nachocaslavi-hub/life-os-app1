import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const BUCKET = 'lifeos-vault';

export function useStorageFile(filePath?: string | null) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    if (!filePath) {
      setSignedUrl(null);
      return;
    }

    setLoading(true);
    supabase.storage
      .from(BUCKET)
      .createSignedUrl(filePath, 3600)
      .then(({ data, error }) => {
        if (!active) return;
        if (!error && data?.signedUrl) {
          setSignedUrl(data.signedUrl);
        }
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filePath]);

  return { signedUrl, loading };
}

export function useStorageUploader(userId: string) {
  const [uploading, setUploading] = useState(false);

  const uploadFile = useCallback(
    async (file: File, folder: 'estudios' | 'grupo' | 'creativa'): Promise<string | null> => {
      setUploading(true);
      try {
        const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${userId}/${folder}/${Date.now()}_${cleanName}`;

        const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

        if (error) throw error;
        return path;
      } catch (err) {
        console.error('Error subiendo archivo a Storage:', err);
        alert('Error al subir el archivo. Verifica el formato y tamaño (<50MB).');
        return null;
      } finally {
        setUploading(false);
      }
    },
    [userId]
  );

  return { uploadFile, uploading };
}