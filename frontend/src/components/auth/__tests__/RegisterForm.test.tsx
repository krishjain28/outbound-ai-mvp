import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterForm from '../RegisterForm';
import { AuthProvider } from '../../../contexts/AuthContext';

describe('RegisterForm', () => {
  test('renders registration form and validates inputs', async () => {
    render(
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>
    );

    // Check form fields
    expect(screen.getByLabelText(/Full Name/i)).toBeTruthy();
    expect(screen.getByLabelText(/Email address/i)).toBeTruthy();
    expect(screen.getByLabelText(/^Password$/i)).toBeTruthy();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeTruthy();

    // Submit empty form to trigger validation errors
    fireEvent.click(screen.getByRole('button', { name: /Create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/Name is required/i)).toBeTruthy();
      expect(screen.getByText(/Email is required/i)).toBeTruthy();
      expect(screen.getByText(/Password is required/i)).toBeTruthy();
      expect(screen.getByText(/Please confirm your password/i)).toBeTruthy();
    });
  });

  test('shows password strength indicator', () => {
    render(
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>
    );

    const passwordInput = screen.getByLabelText(/^Password$/i);
    fireEvent.change(passwordInput, { target: { value: 'Abc123' } });

    expect(screen.getByText(/Password strength/i)).toBeTruthy();
  });
});
