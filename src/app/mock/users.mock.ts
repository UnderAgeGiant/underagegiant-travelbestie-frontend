export interface MockUser {
  name: string;
  email: string;
  password: string;
}

export const DEMO_USERS: MockUser[] = [
  { name: 'Matías Fuentes', email: 'matias@demo.com', password: 'demo1234' },
];
