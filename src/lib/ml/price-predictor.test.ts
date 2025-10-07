import { describe, it, expect, beforeAll } from 'vitest';
import * as tf from '@tensorflow/tfjs';
import {
  initializeTF,
  createPriceModel,
  trainPriceModel,
  predictPrice,
  evaluateModel,
  type TrainingData,
} from './price-predictor';

describe('ML Price Predictor', () => {
  beforeAll(async () => {
    await initializeTF();
  });

  it('should initialize TensorFlow.js', async () => {
    const backend = await initializeTF();
    expect(['webgpu', 'webgl', 'cpu']).toContain(backend);
  });

  it('should create a price prediction model', () => {
    const model = createPriceModel();
    expect(model).toBeDefined();
    expect(model.layers.length).toBeGreaterThan(0);
  });

  it('should train model on synthetic data', async () => {
    // Generate synthetic price data (linear trend)
    const timestamps: number[] = [];
    const prices: number[] = [];

    for (let i = 0; i < 50; i++) {
      timestamps.push(i);
      prices.push(1000 + i * 10 + Math.random() * 20); // Linear trend with noise
    }

    const trainingData: TrainingData = { timestamps, prices };
    const model = await trainPriceModel(trainingData, 50);

    expect(model).toBeDefined();
    expect((model as any).metadata).toBeDefined();
  }, 30000);

  it('should make predictions with reasonable accuracy', async () => {
    // Generate synthetic data
    const timestamps: number[] = [];
    const prices: number[] = [];

    for (let i = 0; i < 50; i++) {
      timestamps.push(i);
      prices.push(1000 + i * 10);
    }

    const trainingData: TrainingData = { timestamps, prices };
    const model = await trainPriceModel(trainingData, 100);

    // Predict future price
    const prediction = await predictPrice(model, 55);

    expect(prediction.predictedPrice).toBeGreaterThan(1000);
    expect(prediction.confidence).toBeGreaterThan(0);
    expect(prediction.confidence).toBeLessThanOrEqual(1);
    expect(['up', 'down', 'stable']).toContain(prediction.trend);

    console.log('Prediction:', prediction);
  }, 30000);

  it('should evaluate model accuracy', async () => {
    // Generate training data
    const trainTimestamps: number[] = [];
    const trainPrices: number[] = [];

    for (let i = 0; i < 40; i++) {
      trainTimestamps.push(i);
      trainPrices.push(1000 + i * 10);
    }

    const trainingData: TrainingData = {
      timestamps: trainTimestamps,
      prices: trainPrices,
    };

    const model = await trainPriceModel(trainingData, 100);

    // Generate test data
    const testTimestamps: number[] = [];
    const testPrices: number[] = [];

    for (let i = 40; i < 50; i++) {
      testTimestamps.push(i);
      testPrices.push(1000 + i * 10);
    }

    const testData: TrainingData = {
      timestamps: testTimestamps,
      prices: testPrices,
    };

    const evaluation = await evaluateModel(model, testData);

    expect(evaluation.mae).toBeDefined();
    expect(evaluation.accuracy).toBeGreaterThan(0.5); // At least 50% accuracy
    expect(evaluation.accuracy).toBeLessThanOrEqual(1);

    console.log('Evaluation:', evaluation);
  }, 30000);
});
