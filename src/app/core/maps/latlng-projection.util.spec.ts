import { latLngToSvgPoint } from './latlng-projection.util';

describe('latLngToSvgPoint', () => {
  it('projects the null island (0, 0) to the center of the map', () => {
    expect(latLngToSvgPoint(0, 0)).toEqual({ x: 50, y: 25 });
  });

  it('projects the north-west corner (90, -180) to the top-left', () => {
    expect(latLngToSvgPoint(90, -180)).toEqual({ x: 0, y: 0 });
  });

  it('projects the south-east corner (-90, 180) to the bottom-right', () => {
    expect(latLngToSvgPoint(-90, 180)).toEqual({ x: 100, y: 50 });
  });

  it('projects a known city (Paris) near the expected location', () => {
    const { x, y } = latLngToSvgPoint(48.8534951, 2.3483915);
    expect(x).toBeCloseTo(50.6523, 3);
    expect(y).toBeCloseTo(11.4296, 3);
  });
});
