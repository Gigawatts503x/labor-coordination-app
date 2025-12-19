/**
 * Custom Hook - useDataStore
 * Provides access to centralized data store
 * REPLACES the old useDataStore.js hook
 */

import { useContext, useCallback, useEffect, useState } from 'react';
import { DataStoreContext, DATA_EVENTS } from '../context/DataStoreContext';

/**
 * Hook to access and interact with the centralized data store
 * @returns {Object} Data store context value with state and methods
 */
export function useDataStore() {
  const context = useContext(DataStoreContext);

  if (!context) {
    throw new Error(
      'useDataStore must be used within a DataStoreProvider. ' +
        'Make sure your component is wrapped with <DataStoreProvider> in App.js'
    );
  }

  return context;
}

/**
 * Hook to subscribe to specific data events
 * @param {string} eventName - Name of the event to subscribe to (from DATA_EVENTS)
 * @param {function} callback - Function to call when event is emitted
 * @param {array} dependencies - Optional dependency array for the callback
 */
export function useDataSubscription(eventName, callback, dependencies = []) {
  const { on } = useDataStore();

  useEffect(() => {
    if (!eventName || !callback) return;

    const unsubscribe = on(eventName, callback);
    return unsubscribe;
  }, [eventName, callback, on, ...dependencies]);
}

/**
 * Hook to track when a specific data type was last updated
 * Useful for components that need to know when data changed
 * @param {string} dataType - Type of data to track (e.g., 'events', 'assignments')
 * @returns {Object} { lastUpdated: Date, triggerUpdate: () => void }
 */
export function useDataUpdateTracker(dataType) {
  const { lastSync, on } = useDataStore();
  const [lastUpdated, setLastUpdated] = useState(lastSync);

  useEffect(() => {
    // Map data type to event names
    const eventMap = {
      events: [DATA_EVENTS.EVENTS_UPDATED, DATA_EVENTS.EVENTS_ADDED, DATA_EVENTS.EVENTS_DELETED],
      assignments: [DATA_EVENTS.ASSIGNMENTS_UPDATED, DATA_EVENTS.ASSIGNMENTS_ADDED, DATA_EVENTS.ASSIGNMENTS_DELETED],
      technicians: [DATA_EVENTS.TECHNICIANS_UPDATED],
      requirements: [DATA_EVENTS.REQUIREMENTS_UPDATED],
    };

    const events = eventMap[dataType] || [];
    const unsubscribers = events.map(event =>
      on(event, () => setLastUpdated(new Date()))
    );

    return () => unsubscribers.forEach(unsub => unsub());
  }, [dataType, on]);

  const triggerUpdate = useCallback(() => {
    setLastUpdated(new Date());
  }, []);

  return { lastUpdated, triggerUpdate };
}

/**
 * Hook to check if data is currently syncing
 * Useful for showing loading states
 * @returns {boolean} True if sync is in progress
 */
export function useSyncStatus() {
  const { syncInProgress } = useDataStore();
  return syncInProgress;
}

/**
 * Hook to manually trigger a full data sync
 * @returns {function} Function to call to trigger sync
 */
export function useManualSync() {
  const { emit } = useDataStore();

  return useCallback(() => {
    emit('manual:refresh');
  }, [emit]);
}

export default useDataStore;