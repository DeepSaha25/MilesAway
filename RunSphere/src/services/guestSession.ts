export const GUEST_TOKEN = 'milesaway-guest-session';

export const guestUser = {
  _id: 'guest-runner',
  name: 'Guest Runner',
  email: '',
  totalDistance: 0,
  totalRuns: 0,
  streak: 0,
  weightKg: null,
  isGuest: true,
};

export const isGuestUser = (user: any) => Boolean(user?.isGuest);
