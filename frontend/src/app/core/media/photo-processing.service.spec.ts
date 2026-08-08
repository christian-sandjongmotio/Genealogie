import { PhotoProcessingService } from './photo-processing.service';

describe('PhotoProcessingService', () => {
  const service = new PhotoProcessingService();

  it('accepts supported portrait formats', () => {
    expect(() => service.validate(new File(['photo'], 'portrait.webp', { type: 'image/webp' }))).not.toThrow();
  });

  it('rejects unsupported files', () => {
    expect(() => service.validate(new File(['document'], 'portrait.pdf', { type: 'application/pdf' }))).toThrow();
  });
});
