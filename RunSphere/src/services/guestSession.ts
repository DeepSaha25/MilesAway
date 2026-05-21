export const GUEST_TOKEN = 'milesaway-guest-session';

export const guestUser = {
  _id: 'guest-runner',
  name: 'Guest Runner',
  email: 'guest@milesaway.local',
  city: 'Demo City',
  district: 'Demo District',
  state: 'Demo State',
  country: 'Demo Country',
  totalDistance: 0,
  totalRuns: 0,
  streak: 0,
  weightKg: 70,
  isGuest: true,
};

export const isGuestUser = (user: any) => Boolean(user?.isGuest);
