import { Trip } from '../core/models/trip.model';

export const MOCK_TRIPS: Trip[] = [
  {
    id: 'mock-1',
    title: 'Europa Verano 2026',
    stops: [
      {
        stopId: 'mock-stop-paris',
        cityId: 'paris',
        checkIn: '01/06/2026',
        checkOut: '05/06/2026',
        selectedAttractions: [
          { entryId: 'mock-paris-0', attractionId: 'paris_0', startTime: '10:00', endTime: null, date: '02/06/2026' },
          { entryId: 'mock-paris-1', attractionId: 'paris_1', startTime: '14:30', endTime: null, date: '03/06/2026' },
        ],
        lodging: { name: 'Hôtel Le Marais', url: 'https://example.com/lemarais' },
      },
      {
        stopId: 'mock-stop-rome',
        cityId: 'rome',
        checkIn: '06/06/2026',
        checkOut: '10/06/2026',
        selectedAttractions: [
          { entryId: 'mock-rome-0', attractionId: 'rome_0', startTime: '09:00', endTime: null, date: '07/06/2026' },
        ],
        lodging: { name: 'Hotel Pantheon', url: 'https://example.com/pantheon' },
      },
    ],
    transits: [
      {
        fromCityId: '__start__',
        toCityId: '__start__',
        segments: [
          {
            mode: 'flight',
            departureDate: '01/06/2026',
            departureTime: '07:00',
            arrivalDate: '01/06/2026',
            arrivalTime: '09:30',
            notes: 'LATAM LA 706',
          },
        ],
      },
      {
        fromCityId: 'paris',
        toCityId: 'rome',
        segments: [
          {
            mode: 'flight',
            departureDate: '06/06/2026',
            departureTime: '11:00',
            arrivalDate: '06/06/2026',
            arrivalTime: '13:15',
            notes: 'Air France AF 1234',
          },
        ],
      },
    ],
  },
  {
    id: 'mock-2',
    title: 'Japón Otoño 2026',
    stops: [
      {
        stopId: 'mock-stop-tokyo',
        cityId: 'tokyo',
        checkIn: '10/10/2026',
        checkOut: '16/10/2026',
        selectedAttractions: [
          { entryId: 'mock-tokyo-0', attractionId: 'tokyo_0', startTime: '11:00', endTime: null, date: '11/10/2026' },
        ],
        lodging: { name: 'Shinjuku Granbell Hotel', url: 'https://example.com/granbell' },
      },
      {
        stopId: 'mock-stop-kyoto',
        cityId: 'kyoto',
        checkIn: '16/10/2026',
        checkOut: '20/10/2026',
        selectedAttractions: [],
      },
    ],
    transits: [],
  },
];
