import { getCanvasPoint } from './signatureUtils';

describe('getCanvasPoint', () => {
  test('maps touch coordinates to canvas space using the canvas bounding box', () => {
    const canvas = {
      width: 400,
      height: 150,
      getBoundingClientRect: () => ({ left: 20, top: 30, width: 200, height: 75 }),
    };

    const result = getCanvasPoint({ clientX: 70, clientY: 60 }, canvas);

    expect(result).toEqual({ x: 100, y: 60 });
  });

  test('prefers touch coordinates when present', () => {
    const canvas = {
      width: 400,
      height: 150,
      getBoundingClientRect: () => ({ left: 10, top: 10, width: 200, height: 75 }),
    };

    const result = getCanvasPoint({ touches: [{ clientX: 80, clientY: 50 }] }, canvas);

    expect(result).toEqual({ x: 140, y: 80 });
  });
});
