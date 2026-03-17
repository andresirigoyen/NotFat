import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';

export const useNotes = (date: Date) => {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const dateKey = date.toISOString().split('T')[0];
  const storageKey = `@notfat_notes_${dateKey}`;

  useEffect(() => {
    const loadNote = async () => {
      setLoading(true);
      try {
        const savedNote = await AsyncStorage.getItem(storageKey);
        setNote(savedNote || '');
      } catch (e) {
        console.error('Error loading note:', e);
      } finally {
        setLoading(false);
      }
    };
    loadNote();
  }, [storageKey]);

  const saveNote = async (text: string) => {
    try {
      if (!text || text.trim() === '') {
        await AsyncStorage.removeItem(storageKey);
      } else {
        await AsyncStorage.setItem(storageKey, text);
      }
      setNote(text);
    } catch (e) {
      console.error('Error saving note:', e);
    }
  };

  return { note, saveNote, loading };
};
