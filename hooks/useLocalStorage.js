import { useState, useEffect } from 'react';

/**
 * Custom hook for managing localStorage operations with automatic serialization
 * @param {string} key - The localStorage key
 * @param {*} initialValue - The initial value to use if no stored value exists
 * @returns {[any, function, function]} - [storedValue, setValue, removeValue]
 */
export function useLocalStorage(key, initialValue) {
  // State to store our value
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        
        // Dispatch custom event for cross-tab synchronization
        window.dispatchEvent(new CustomEvent('localStorageChange', {
          detail: { key, newValue: valueToStore }
        }));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Function to remove the value from localStorage
  const removeValue = () => {
    try {
      setStoredValue(initialValue);
      
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
        
        // Dispatch custom event for cross-tab synchronization
        window.dispatchEvent(new CustomEvent('localStorageChange', {
          detail: { key, newValue: null, removed: true }
        }));
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  };

  // Listen for changes in localStorage from other tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Error parsing localStorage change for key "${key}":`, error);
        }
      } else if (e.key === key && e.newValue === null) {
        setStoredValue(initialValue);
      }
    };

    const handleCustomStorageChange = (e) => {
      if (e.detail.key === key) {
        if (e.detail.removed) {
          setStoredValue(initialValue);
        } else {
          setStoredValue(e.detail.newValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageChange', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleCustomStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook for managing multiple localStorage keys with a common prefix
 * @param {string} prefix - The prefix for localStorage keys
 * @returns {object} - Object with methods for managing prefixed storage
 */
export function usePrefixedStorage(prefix) {
  const getItem = (key) => {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = window.localStorage.getItem(`${prefix}_${key}`);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading prefixed localStorage key "${prefix}_${key}":`, error);
      return null;
    }
  };

  const setItem = (key, value) => {
    if (typeof window === 'undefined') return;
    
    try {
      window.localStorage.setItem(`${prefix}_${key}`, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting prefixed localStorage key "${prefix}_${key}":`, error);
    }
  };

  const removeItem = (key) => {
    if (typeof window === 'undefined') return;
    
    try {
      window.localStorage.removeItem(`${prefix}_${key}`);
    } catch (error) {
      console.error(`Error removing prefixed localStorage key "${prefix}_${key}":`, error);
    }
  };

  const getAllItems = () => {
    if (typeof window === 'undefined') return {};
    
    const items = {};
    const prefixWithUnderscore = `${prefix}_`;
    
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(prefixWithUnderscore)) {
          const shortKey = key.substring(prefixWithUnderscore.length);
          const value = window.localStorage.getItem(key);
          items[shortKey] = value ? JSON.parse(value) : null;
        }
      }
    } catch (error) {
      console.error(`Error getting all prefixed localStorage items for "${prefix}":`, error);
    }
    
    return items;
  };

  const clearAll = () => {
    if (typeof window === 'undefined') return;
    
    const prefixWithUnderscore = `${prefix}_`;
    const keysToRemove = [];
    
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(prefixWithUnderscore)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => window.localStorage.removeItem(key));
    } catch (error) {
      console.error(`Error clearing all prefixed localStorage items for "${prefix}":`, error);
    }
  };

  return {
    getItem,
    setItem,
    removeItem,
    getAllItems,
    clearAll
  };
}

/**
 * Hook for managing localStorage with automatic cleanup based on expiration
 * @param {string} key - The localStorage key
 * @param {*} initialValue - The initial value
 * @param {number} expirationHours - Hours until the value expires (default: 24)
 * @returns {[any, function, function, boolean]} - [storedValue, setValue, removeValue, isExpired]
 */
export function useExpiringStorage(key, initialValue, expirationHours = 24) {
  const [isExpired, setIsExpired] = useState(false);
  
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;

      const parsedItem = JSON.parse(item);
      
      // Check if item has expiration data
      if (parsedItem.expiration) {
        const now = new Date().getTime();
        if (now > parsedItem.expiration) {
          // Item has expired, remove it
          window.localStorage.removeItem(key);
          setIsExpired(true);
          return initialValue;
        }
        return parsedItem.value;
      }
      
      // Legacy item without expiration
      return parsedItem;
    } catch (error) {
      console.error(`Error reading expiring localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      const now = new Date().getTime();
      const expiration = now + (expirationHours * 60 * 60 * 1000);
      
      const itemWithExpiration = {
        value: valueToStore,
        expiration: expiration
      };
      
      setStoredValue(valueToStore);
      setIsExpired(false);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(itemWithExpiration));
      }
    } catch (error) {
      console.error(`Error setting expiring localStorage key "${key}":`, error);
    }
  };

  const removeValue = () => {
    try {
      setStoredValue(initialValue);
      setIsExpired(false);
      
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing expiring localStorage key "${key}":`, error);
    }
  };

  // Check for expiration on mount and periodically
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkExpiration = () => {
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          const parsedItem = JSON.parse(item);
          if (parsedItem.expiration) {
            const now = new Date().getTime();
            if (now > parsedItem.expiration) {
              window.localStorage.removeItem(key);
              setStoredValue(initialValue);
              setIsExpired(true);
            }
          }
        }
      } catch (error) {
        console.error(`Error checking expiration for key "${key}":`, error);
      }
    };

    // Check immediately
    checkExpiration();

    // Check every minute
    const interval = setInterval(checkExpiration, 60000);

    return () => clearInterval(interval);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue, isExpired];
}

export default useLocalStorage;