import { useState, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export const useJREFetcher = () => {
  const [jreMap, setJreMap] = useState({});

  const fetchJREData = useCallback(async (jreId) => {
    if (!jreId || jreId === 'No JRE' || jreMap[jreId]) return;

    try {
      const jreDoc = await getDoc(doc(db, 'jreregistrations', jreId));
      if (jreDoc.exists()) {
        const data = jreDoc.data();
        setJreMap(prev => ({
          ...prev,
          [jreId]: {
            primaryMobile: data.primaryMobile?.toString().trim() || null,
            operatorNumber: data.OpertorNumber?.toString().trim() || null,
          }
        }));
      } else {
        setJreMap(prev => ({
          ...prev,
          [jreId]: { primaryMobile: null, operatorNumber: null }
        }));
      }
    } catch (err) {
      console.error('Error fetching JRE:', jreId, err);
      setJreMap(prev => ({
        ...prev,
        [jreId]: { primaryMobile: null, operatorNumber: null }
      }));
    }
  }, [jreMap]);

  return {
    jreMap,
    fetchJREData,
  };
};