import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '../../firebase';
import { logEvent } from 'firebase/analytics';

export const useAnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    if (analytics) {
      const pagePath = location.pathname + location.search;
      logEvent(analytics, 'page_view', { page_path: pagePath });
      console.log('Logged page_view:', pagePath);
    }
  }, [location]);
};