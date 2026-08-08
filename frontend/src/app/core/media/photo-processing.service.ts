import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PhotoProcessingService {
  validate(file: File): void {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
      throw new Error('Choisissez une image JPG, PNG ou WebP.');
    if (file.size > 5 * 1024 * 1024)
      throw new Error('La photo ne peut pas dépasser 5 Mo. Choisissez un portrait cadré sur le visage.');
  }

  read(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });
  }

  crop(source: string, zoom: number, positionX: number, positionY: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onerror = () => reject(new Error('Image illisible.'));
      image.onload = () => {
        const size = 420;
        const coverScale = Math.max(size / image.width, size / image.height) * zoom;
        const drawnWidth = image.width * coverScale;
        const drawnHeight = image.height * coverScale;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        canvas.getContext('2d')!.drawImage(image,
          -(positionX / 100) * Math.max(0, drawnWidth - size),
          -(positionY / 100) * Math.max(0, drawnHeight - size),
          drawnWidth, drawnHeight);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      image.src = source;
    });
  }
}
