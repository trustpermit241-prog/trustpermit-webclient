import { getFilteredInspections, getPagedInspections } from './inspectionListUtils';

describe('inspection list utilities', () => {
  const inspections = [
    { _id: '1', type: 'Fire Safety Inspection', citizenId: { fullName: 'Anna Cruz', email: 'anna@demo.com' }, status: 'Approved' },
    { _id: '2', type: 'Environmental', citizenId: { fullName: 'Bob Santos', email: 'bob@demo.com' }, status: 'Pending' },
    { _id: '3', type: 'Locational / Zoning', citizenId: { fullName: 'Carla James', email: 'carla@demo.com' }, status: 'Rejected' },
    { _id: '4', type: 'Building & Electrical', citizenId: { fullName: 'Daniel Lee', email: 'daniel@demo.com' }, status: 'Approved' },
    { _id: '5', type: 'Sanitary Inspection', citizenId: { fullName: 'Ella Reyes', email: 'ella@demo.com' }, status: 'Pending' },
    { _id: '6', type: 'Fire Safety Inspection', citizenId: { fullName: 'Frank Woods', email: 'frank@demo.com' }, status: 'Approved' },
    { _id: '7', type: 'Environmental', citizenId: { fullName: 'Grace Park', email: 'grace@demo.com' }, status: 'Pending' },
  ];

  test('filters inspections by citizen name or email', () => {
    expect(getFilteredInspections(inspections, 'anna')).toHaveLength(1);
    expect(getFilteredInspections(inspections, 'demo.com')).toHaveLength(7);
    expect(getFilteredInspections(inspections, 'grace')).toEqual([inspections[6]]);
  });

  test('splits inspections into 6-row pages', () => {
    const result = getPagedInspections(inspections, 1, 6);
    expect(result.items).toHaveLength(6);
    expect(result.totalPages).toBe(2);
    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBe(5);
  });

  test('keeps page index within bounds', () => {
    const result = getPagedInspections(inspections, 99, 6);
    expect(result.page).toBe(2);
    expect(result.items).toHaveLength(1);
  });
});
