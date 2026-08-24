(() => {
  'use strict';

  const DEFAULT_CONFIG = Object.freeze({
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.82,
    allowOriginal: false,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
    maxBytes: 5 * 1024 * 1024
  });

  const isObject = (value) => !!value && typeof value === 'object';

  const normalizeConfig = (config = {}) => {
    const base = { ...DEFAULT_CONFIG, ...(isObject(config) ? config : {}) };
    if (Array.isArray(config.allowedTypes) && config.allowedTypes.length > 0) {
      base.allowedTypes = config.allowedTypes.filter(Boolean).map(String);
    }
    return {
      ...base,
      maxWidth: Number(base.maxWidth) || DEFAULT_CONFIG.maxWidth,
      maxHeight: Number(base.maxHeight) || DEFAULT_CONFIG.maxHeight,
      quality: Math.min(Math.max(Number(base.quality) || DEFAULT_CONFIG.quality, 0.1), 1),
      maxBytes: Number(base.maxBytes) || DEFAULT_CONFIG.maxBytes
    };
  };

  const readImageElement = (file) => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image could not be decoded.'));
    };

    image.src = url;
  });

  const toBlob = (canvas, mimeType, quality) => new Promise((resolve, reject) => {
    if (typeof canvas.toBlob === 'function') {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Could not generate an optimized image blob.'));
          return;
        }
        resolve(blob);
      }, mimeType, quality);
      return;
    }

    try {
      const fallback = canvas.toDataURL(mimeType, quality);
      const data = fallback.split(',')[1];
      const bytes = atob(data);
      const buffer = new Uint8Array(bytes.length);
      for (let index = 0; index < bytes.length; index += 1) {
        buffer[index] = bytes.charCodeAt(index);
      }
      resolve(new Blob([buffer], { type: mimeType }));
    } catch (error) {
      reject(error);
    }
  });

  const prepareOptimizedFile = async (file, configValue = {}) => {
    const config = normalizeConfig(configValue);
    if (!isObject(file) || !file.type || typeof file.size !== 'number') {
      return {
        ok: false,
        code: 'INVALID_FILE',
        message: 'A valid image file is required.'
      };
    }

    if (!config.allowedTypes.includes(file.type)) {
      return {
        ok: false,
        code: 'UNSUPPORTED_MEDIA_TYPE',
        message: 'Unsupported file type for image optimization.'
      };
    }

    if (typeof document === 'undefined' || !document.createElement) {
      return {
        ok: true,
        file,
        optimized: false,
        originalBytes: file.size,
        bytes: file.size,
        config,
        event: 'media:upload:skipped'
      };
    }

    const image = await readImageElement(file);
    const scale = Math.min(1, config.maxWidth / image.width, config.maxHeight / image.height);
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      return {
        ok: false,
        code: 'CANVAS_UNAVAILABLE',
        message: 'Canvas is not available for image optimization.'
      };
    }

    context.drawImage(image, 0, 0, width, height);
    const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    let outputQuality = config.quality;
    if (file.size > config.maxBytes) {
      outputQuality = Math.min(outputQuality, 0.52);
    }

    const blob = await toBlob(canvas, mimeType, outputQuality);
    const optimizedFile = new File([blob], file.name, {
      type: blob.type || mimeType,
      lastModified: Date.now()
    });

    return {
      ok: true,
      file: optimizedFile,
      optimized: blob.size < file.size,
      originalBytes: file.size,
      bytes: blob.size,
      dimensions: { width, height },
      quality: outputQuality,
      config,
      event: 'media:upload:optimized'
    };
  };

  const MediaManager = {
    defaultConfig: { ...DEFAULT_CONFIG },

    async optimizeImage(file, config = {}) {
      return prepareOptimizedFile(file, config);
    },

    validateUpload(file, config = {}) {
      const normalized = normalizeConfig(config);
      if (!isObject(file) || !file.type || typeof file.size !== 'number') {
        return { ok: false, code: 'INVALID_FILE', message: 'A valid upload is required.' };
      }
      const allowed = normalized.allowedTypes.includes(file.type);
      return {
        ok: allowed,
        code: allowed ? 'UPLOAD_VALID' : 'UNSUPPORTED_MEDIA_TYPE',
        message: allowed ? 'Upload is valid.' : 'Unsupported media type.',
        maxBytes: normalized.maxBytes,
        size: file.size
      };
    },

    async optimizeUpload(file, config = {}) {
      const validation = this.validateUpload(file, config);
      if (!validation.ok) {
        return validation;
      }
      return prepareOptimizedFile(file, config);
    }
  };

  if (!window.MediaManager) {
    window.MediaManager = MediaManager;
  }

  if (window && window.Core) {
    window.Core.emit('media:manager:initialized', {
      supportedTypes: DEFAULT_CONFIG.allowedTypes,
      maxBytes: DEFAULT_CONFIG.maxBytes
    });
  }
})();
