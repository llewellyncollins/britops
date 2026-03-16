import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TermsOfService } from './TermsOfService';

function renderPage() {
  return render(
    <MemoryRouter>
      <TermsOfService />
    </MemoryRouter>,
  );
}

describe('TermsOfService page', () => {
  it('renders the terms heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Terms of Service' })).toBeInTheDocument();
  });

  it('contains clinical disclaimer', () => {
    renderPage();
    expect(screen.getByText(/Clinical Disclaimer/)).toBeInTheDocument();
    expect(screen.getByText(/does not provide clinical advice/)).toBeInTheDocument();
  });

  it('mentions user responsibilities for patient data', () => {
    renderPage();
    expect(screen.getByText(/information governance policies/)).toBeInTheDocument();
    expect(screen.getByText(/hospital numbers only/)).toBeInTheDocument();
  });

  it('mentions governing law', () => {
    renderPage();
    expect(screen.getByText(/England and Wales/)).toBeInTheDocument();
  });

  it('links to Privacy Policy', () => {
    renderPage();
    const link = screen.getByRole('link', { name: 'Privacy Policy' });
    expect(link).toHaveAttribute('href', '/privacy');
  });

  it('has a back link to settings', () => {
    renderPage();
    const link = screen.getByRole('link', { name: /Back to Settings/ });
    expect(link).toHaveAttribute('href', '/settings');
  });
});
