// src/services/cloudinaryService.ts
import axios from 'axios';

const CLOUDINARY_UPLOAD_PRESET = 'hismafoto'; // El preset que mencionaste
const CLOUDINARY_CLOUD_NAME = 'dcf4bewcl';     // El nombre que proporcionaste
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/**
 * Servicio para interactuar con Cloudinary
 */
export const cloudinaryService = {
  /**
   * Sube una imagen a Cloudinary
   * @param file - Archivo de imagen a subir
   * @returns Promise con la URL de la imagen subida
   */
  uploadImage: async (file: File): Promise<string> => {
    try {
      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      
      // Realizar la petición a Cloudinary
      const response = await axios.post(CLOUDINARY_UPLOAD_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Verificar respuesta y retornar la URL de la imagen
      if (response.data && response.data.secure_url) {
        return response.data.secure_url;
      } else {
        throw new Error('No se recibió una URL válida de Cloudinary');
      }
    } catch (error) {
      console.error('Error al subir imagen a Cloudinary:', error);
      throw error;
    }
  },
  
  /**
   * Elimina una imagen de Cloudinary (opcional, requiere autenticación)
   * @param publicId - ID público de la imagen en Cloudinary
   * @returns Promise que se resuelve cuando se completa la eliminación
   */
  deleteImage: async (publicId: string): Promise<void> => {
    // Esta función requeriría credenciales de API completas de Cloudinary
    // Para implementarla, necesitarías API Key y API Secret
    // Por ahora dejamos una implementación básica que indica cómo se haría
    console.warn('La eliminación de imágenes requiere credenciales completas de Cloudinary');
    return Promise.resolve();
  },
  
  /**
   * Extrae el ID público de una URL de Cloudinary
   * @param url - URL de Cloudinary
   * @returns ID público extraído de la URL
   */
  getPublicIdFromUrl: (url: string): string | null => {
    // Las URLs de Cloudinary suelen tener el formato:
    // https://res.cloudinary.com/cloud-name/image/upload/v1234567890/folder/public_id.ext
    try {
      const urlParts = url.split('/');
      // Obtener la última parte y quitar la extensión
      const lastPart = urlParts[urlParts.length - 1];
      return lastPart.split('.')[0];
    } catch (error) {
      console.error('Error al extraer el ID público de la URL:', error);
      return null;
    }
  }
};

export default cloudinaryService;