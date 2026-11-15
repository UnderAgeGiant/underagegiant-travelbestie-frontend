import { qrCanvas } from './trip-card-render';

// The optimized build turns CommonJS `qrcode` into a chunk with only a default export (PR #188 review B1).
const toCanvas = jest.fn(async () => 'canvas');
jest.mock('qrcode', () => ({ __esModule: true, default: { toCanvas } }));

it('qrCanvas works when qrcode only has a default export (optimized build)', async () => {
  await expect(qrCanvas('https://tripilove.com/shared/x', 396)).resolves.toBe('canvas');
  expect(toCanvas).toHaveBeenCalledWith('https://tripilove.com/shared/x', expect.objectContaining({ errorCorrectionLevel: 'M', margin: 4, width: 396 }));
});
