import React from 'react';

export function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return React.lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.error('Chunk load error, attempting to reload page to get latest assets...', error);
      // Only reload once to prevent infinite loops if the chunk is permanently broken
      const hasRetried = sessionStorage.getItem('lazy-import-retry');
      if (!hasRetried) {
        sessionStorage.setItem('lazy-import-retry', 'true');
        window.location.reload();
      }
      throw error;
    }
  });
}
