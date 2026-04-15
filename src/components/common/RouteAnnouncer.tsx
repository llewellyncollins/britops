import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Logbook',
  '/log': 'Log Operation',
  '/portfolio': 'Portfolio Summary',
  '/settings': 'Settings',
  '/upgrade': 'Theatrelog Pro',
  '/support': 'Support',
  '/login': 'Sign In',
  '/privacy': 'Privacy Policy',
  '/terms': 'Terms of Service',
};

export function RouteAnnouncer() {
  const location = useLocation();
  const announcerRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    // Don't announce on initial page load
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const basePath = location.pathname.startsWith('/edit/') ? '/edit' : location.pathname;
    const title = basePath === '/edit'
      ? 'Edit Operation'
      : ROUTE_TITLES[basePath] ?? 'Page';

    if (announcerRef.current) {
      announcerRef.current.textContent = `Navigated to ${title}`;
    }
  }, [location.pathname]);

  return (
    <div
      ref={announcerRef}
      role="status"
      aria-live="assertive"
      aria-atomic="true"
      className="sr-only"
    />
  );
}
