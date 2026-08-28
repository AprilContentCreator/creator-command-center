// LocalStorage wrapper namespace with single-user foundation
const AppStorage = {
  defaultUserId: 'owner_april',

  // Internal helper to prefix keys
  _getKey: (key) => {
    return `ccc_${AppStorage.defaultUserId}_${key}`;
  },

  // Safe parsing helper
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(AppStorage._getKey(key));
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Error parsing data for ${key}:`, e);
      return defaultValue;
    }
  },
  
  // Safe setting helper
  set: (key, value) => {
    try {
      localStorage.setItem(AppStorage._getKey(key), JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving data for ${key}. Storage may be full:`, e);
    }
  }
};
