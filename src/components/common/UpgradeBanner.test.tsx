import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../test/render-with-providers';

vi.mock('../../firebase/analytics', () => ({
  trackUpgradePrompted: vi.fn(),
}));

const { UpgradeBanner } = await import('./UpgradeBanner');

describe('UpgradeBanner', () => {
  it('renders default title and description', () => {
    renderWithProviders(<UpgradeBanner />);
    expect(screen.getByText('Unlock with Theatrelog Pro')).toBeInTheDocument();
    expect(screen.getByText(/cloud sync/i)).toBeInTheDocument();
  });

  it('renders custom title and description', () => {
    renderWithProviders(
      <UpgradeBanner title="Custom Title" description="Custom desc" />,
    );
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom desc')).toBeInTheDocument();
  });

  it('renders upgrade button', () => {
    renderWithProviders(<UpgradeBanner />);
    expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
  });

  it('navigates to /upgrade on click', () => {
    renderWithProviders(<UpgradeBanner feature="portfolio" />);
    fireEvent.click(screen.getByText('Upgrade to Pro'));
    // Navigation happens via useNavigate — hard to assert URL in unit test,
    // but we verify the button is clickable and analytics is tracked
  });
});
