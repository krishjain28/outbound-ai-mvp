import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from '../LoginForm';
import { AuthProvider } from '../../../contexts/AuthContext';

describe('LoginForm', () => {
  test('renders login form and validates inputs', async () => {
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    // Check form fields
    expect(screen.getByLabelText(/Email address/i)).toBeTruthy();
    expect(screen.getByLabelText(/^Password$/i)).toBeTruthy();

    // Submit empty form to trigger validation errors
    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/Email is required/i)).toBeTruthy();
      expect(screen.getByText(/Password is required/i)).toBeTruthy();
    });
  });
});
