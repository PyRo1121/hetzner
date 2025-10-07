/**
 * ML Price Predictor
 * Uses TensorFlow.js for basic price trend prediction
 */

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgpu';

export interface PricePrediction {
  predictedPrice: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TrainingData {
  timestamps: number[];
  prices: number[];
}

/**
 * Initialize TensorFlow.js with best available backend
 */
export async function initializeTF(): Promise<string> {
  // Try WebGPU first for best performance
  if (await tf.setBackend('webgpu').then(() => true).catch(() => false)) {
    await tf.ready();
    console.log('✅ TensorFlow.js initialized with WebGPU backend');
    return 'webgpu';
  }

  // Fallback to WebGL
  if (await tf.setBackend('webgl').then(() => true).catch(() => false)) {
    await tf.ready();
    console.log('✅ TensorFlow.js initialized with WebGL backend');
    return 'webgl';
  }

  // Final fallback to CPU
  await tf.setBackend('cpu');
  await tf.ready();
  console.log('✅ TensorFlow.js initialized with CPU backend');
  return 'cpu';
}

/**
 * Check if WebGPU is available
 */
export async function isWebGPUAvailable(): Promise<boolean> {
  try {
    return await tf.setBackend('webgpu').then(() => true).catch(() => false);
  } catch {
    return false;
  }
}

/**
 * Create a simple linear regression model for price prediction
 */
export function createPriceModel(): tf.Sequential {
  const model = tf.sequential();

  // Input layer: time-based features
  model.add(tf.layers.dense({
    units: 16,
    activation: 'relu',
    inputShape: [1],
  }));

  // Hidden layer
  model.add(tf.layers.dense({
    units: 8,
    activation: 'relu',
  }));

  // Output layer: predicted price
  model.add(tf.layers.dense({
    units: 1,
  }));

  // Compile model
  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'meanSquaredError',
    metrics: ['mae'],
  });

  return model;
}

/**
 * Normalize data for training
 */
function normalizeData(data: number[]): { normalized: number[]; min: number; max: number } {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;

  const normalized = data.map(val => (val - min) / range);

  return { normalized, min, max };
}

/**
 * Denormalize prediction back to original scale
 */
function denormalize(value: number, min: number, max: number): number {
  return value * (max - min) + min;
}

/**
 * Train model on historical price data
 */
export async function trainPriceModel(
  data: TrainingData,
  epochs: number = 100
): Promise<tf.Sequential> {
  const model = createPriceModel();

  // Normalize timestamps and prices
  const { normalized: normalizedTimestamps, min: timeMin, max: timeMax } = normalizeData(data.timestamps);
  const { normalized: normalizedPrices, min: priceMin, max: priceMax } = normalizeData(data.prices);

  // Convert to tensors
  const xs = tf.tensor2d(normalizedTimestamps, [normalizedTimestamps.length, 1]);
  const ys = tf.tensor2d(normalizedPrices, [normalizedPrices.length, 1]);

  // Train model
  await model.fit(xs, ys, {
    epochs,
    verbose: 0,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if (epoch % 20 === 0) {
          console.log(`Epoch ${epoch}: loss = ${logs?.loss.toFixed(4)}`);
        }
      },
    },
  });

  // Store normalization params in model metadata
  (model as any).metadata = {
    timeMin,
    timeMax,
    priceMin,
    priceMax,
  };

  // Cleanup tensors
  xs.dispose();
  ys.dispose();

  return model;
}

/**
 * Predict future price
 */
export async function predictPrice(
  model: tf.Sequential,
  futureTimestamp: number
): Promise<PricePrediction> {
  const metadata = (model as any).metadata;

  if (!metadata) {
    throw new Error('Model metadata not found. Train the model first.');
  }

  const { timeMin, timeMax, priceMin, priceMax } = metadata;

  // Normalize input
  const normalizedTime = (futureTimestamp - timeMin) / (timeMax - timeMin);
  const input = tf.tensor2d([normalizedTime], [1, 1]);

  // Predict
  const prediction = model.predict(input) as tf.Tensor;
  const normalizedPrice = (await prediction.data())[0];

  // Denormalize
  const predictedPrice = denormalize(normalizedPrice, priceMin, priceMax);

  // Calculate confidence (simple heuristic based on how far we're extrapolating)
  const timeRange = timeMax - timeMin;
  const extrapolationDistance = Math.abs(futureTimestamp - timeMax) / timeRange;
  const confidence = Math.max(0, 1 - extrapolationDistance * 0.5);

  // Determine trend
  const currentPrice = priceMax; // Last known price
  const priceDiff = predictedPrice - currentPrice;
  const trend = Math.abs(priceDiff) < currentPrice * 0.02
    ? 'stable'
    : priceDiff > 0
    ? 'up'
    : 'down';

  // Cleanup
  input.dispose();
  prediction.dispose();

  return {
    predictedPrice: Math.round(predictedPrice),
    confidence: Math.round(confidence * 100) / 100,
    trend,
  };
}

/**
 * Save model to Supabase Storage
 */
export async function saveModel(
  model: tf.Sequential,
  modelName: string
): Promise<void> {
  // Save to IndexedDB for now
  await model.save(`indexeddb://${modelName}`);
  console.log(`✅ Model saved: ${modelName}`);
}

/**
 * Load model from storage
 */
export async function loadModel(modelName: string): Promise<tf.Sequential> {
  const model = await tf.loadLayersModel(`indexeddb://${modelName}`) as tf.Sequential;
  console.log(`✅ Model loaded: ${modelName}`);
  return model;
}

/**
 * Evaluate model accuracy
 */
export async function evaluateModel(
  model: tf.Sequential,
  testData: TrainingData
): Promise<{ mae: number; accuracy: number }> {
  const metadata = (model as any).metadata;
  const { timeMin, timeMax, priceMin, priceMax } = metadata;

  // Normalize test data
  const normalizedTimestamps = testData.timestamps.map(
    t => (t - timeMin) / (timeMax - timeMin)
  );
  const normalizedPrices = testData.prices.map(
    p => (p - priceMin) / (priceMax - priceMin)
  );

  const xs = tf.tensor2d(normalizedTimestamps, [normalizedTimestamps.length, 1]);
  const ys = tf.tensor2d(normalizedPrices, [normalizedPrices.length, 1]);

  // Evaluate
  const result = model.evaluate(xs, ys) as tf.Tensor[];
  const mae = (await result[1].data())[0];

  // Calculate accuracy (within 5% threshold)
  const predictions = model.predict(xs) as tf.Tensor;
  const predData = await predictions.data();
  const actualData = await ys.data();

  let correct = 0;
  for (let i = 0; i < predData.length; i++) {
    const predPrice = denormalize(predData[i], priceMin, priceMax);
    const actualPrice = denormalize(actualData[i], priceMin, priceMax);
    if (Math.abs(predPrice - actualPrice) / actualPrice < 0.05) {
      correct++;
    }
  }

  const accuracy = correct / predData.length;

  // Cleanup
  xs.dispose();
  ys.dispose();
  result.forEach(t => t.dispose());
  predictions.dispose();

  return {
    mae: Math.round(mae * 1000) / 1000,
    accuracy: Math.round(accuracy * 100) / 100,
  };
}
