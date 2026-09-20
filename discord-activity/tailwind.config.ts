import shared from '../tailwind.config';
export default {
  ...shared,
  content: ['./app/**/*.{ts,tsx}', '../app/chaos/**/*.{ts,tsx}', '../components/**/*.{ts,tsx}', '../lib/**/*.{ts,tsx}'],
};
