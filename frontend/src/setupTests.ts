// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import React from 'react';

// Mock react-router-dom for tests
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  Routes: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  Route: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
}));
