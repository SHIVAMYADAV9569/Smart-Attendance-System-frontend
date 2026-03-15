/**
 * Face Recognition using face-api.js
 * Loads models, detects faces, extracts 128-dim descriptors
 * Compares descriptors using Euclidean distance (threshold 0.6 = match)
 */
import * as faceapi from 'face-api.js';

// Use /models (proxied to backend in dev) or full URL when API_URL is set
const MODEL_URL = import.meta.env.DEV
  ? '/models'
  : (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api\/?$/, '') + '/models';

let modelsLoaded = false;

/**
 * Load face-api.js models (face detection, landmarks, recognition)
 * Must be called before getFaceDescriptor
 */
export async function loadFaceModels() {
  if (modelsLoaded) return true;

  try {
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    modelsLoaded = true;
    console.log('✅ Face recognition models loaded');
    return true;
  } catch (error) {
    console.error('❌ Failed to load face models:', error);
    throw new Error('Failed to load face recognition models. Please ensure the server is running.');
  }
}

/**
 * Get face descriptor (128-dim vector) from an image
 * @param {string} imageSrc - Data URL (e.g. from webcam capture)
 * @returns {Promise<Float32Array|null>} - 128-dim descriptor or null if no face
 */
export async function getFaceDescriptor(imageSrc) {
  if (!modelsLoaded) {
    await loadFaceModels();
  }

  return new Promise((resolve) => {
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;

    img.onload = async () => {
      try {
        const detection = await faceapi
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({
            inputSize: 416,
            scoreThreshold: 0.5
          }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!detection) {
          console.warn('No face detected in image');
          resolve(null);
          return;
        }

        // descriptor is Float32Array of 128 elements
        const descriptor = Array.from(detection.descriptor);
        resolve(descriptor);
      } catch (error) {
        console.error('Error extracting face descriptor:', error);
        resolve(null);
      }
    };

    img.onerror = () => {
      console.error('Failed to load image for face detection');
      resolve(null);
    };
  });
}

/**
 * Calculate Euclidean distance between two descriptors
 * @param {number[]|Float32Array} desc1 - 128-dim descriptor
 * @param {number[]|Float32Array} desc2 - 128-dim descriptor
 * @returns {number} - Euclidean distance
 */
export function euclideanDistance(desc1, desc2) {
  if (!desc1 || !desc2 || desc1.length !== 128 || desc2.length !== 128) {
    return Infinity;
  }

  let sum = 0;
  for (let i = 0; i < 128; i++) {
    const diff = desc1[i] - desc2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}
