// src/utils/storage.js
import { Preferences } from '@capacitor/preferences';

const saveData = async (key, value) => {
  await Preferences.set({
    key,
    value: JSON.stringify(value),
  });
};

const loadData = async (key) => {
  const { value } = await Preferences.get({ key });
  return value ? JSON.parse(value) : null;
};

const removeData = async (key) => {
  await Preferences.remove({ key });
};

export { saveData, loadData, removeData };