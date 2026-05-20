/**
 * Comprime y redimensiona una imagen en el cliente utilizando Canvas.
 * @param {File} file - El archivo de imagen original seleccionado por el usuario.
 * @param {number} maxWidth - El ancho máximo permitido (por defecto 1200px).
 * @param {number} maxHeight - El alto máximo permitido (por defecto 1200px).
 * @param {number} quality - Calidad de la compresión JPEG de 0 a 1 (por defecto 0.8).
 * @returns {Promise<Blob>} Un Blob de la imagen comprimida en formato image/jpeg.
 */
export const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    // Si no es una imagen, resolver con el archivo original
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcular nuevas dimensiones manteniendo la relación de aspecto
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('No se pudo obtener el contexto 2D del Canvas'));
        }

        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Exportar como JPEG comprimido
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Error al generar el Blob comprimido'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = (err) => {
        reject(err);
      };
    };

    reader.onerror = (err) => {
      reject(err);
    };
  });
};
