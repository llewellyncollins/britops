import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PrivacyPolicy } from './PrivacyPolicy';

function renderPage() {
  return render(
    <MemoryRouter>
      <PrivacyPolicy />
    </MemoryRouter>,
  );
}

describe('PrivacyPolicy page', () => {
  it('renders the privacy policy heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Privacy Policy' })).toBeInTheDocument();
  });

  it('contains required GDPR sections', () => {
    renderPage();

    expect(screen.getByText(/2\. Data We Collect/)).toBeInTheDocument();
    expect(screen.getByText(/3\. Why We Process Your Data/)).toBeInTheDocument();
    expect(screen.getByText(/4\. Where Your Data Is Stored/)).toBeInTheDocument();
    expect(screen.getByText(/5\. Third Parties/)).toBeInTheDocument();
    expect(screen.getByText(/6\. Data Retention/)).toBeInTheDocument();
    expect(screen.getByText(/7\. Your Rights/)).toBeInTheDocument();
    expect(screen.getByText(/8\. Cookies & Local Storage/)).toBeInTheDocument();
    expect(screen.getByText(/9\. Security/)).toBeInTheDocument();
  });

  it('mentions ARCP and UK doctors', () => {
    renderPage();
    expect(screen.getByText(/ARCP \(Annual Review/)).toBeInTheDocument();
  });

  it('describes user rights: access, rectification, erasure, portability', () => {
    renderPage();
    expect(screen.getByText(/Access:/)).toBeInTheDocument();
    expect(screen.getByText(/Rectification:/)).toBeInTheDocument();
    expect(screen.getByText(/Erasure:/)).toBeInTheDocument();
    expect(screen.getByText(/Portability:/)).toBeInTheDocument();
  });

  it('states no analytics or tracking', () => {
    renderPage();
    expect(screen.getByText(/no analytics, tracking, or advertising/i)).toBeInTheDocument();
  });

  it('has a back link to settings', () => {
    renderPage();
    const link = screen.getByRole('link', { name: /Back to Settings/ });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/settings');
  });
});
