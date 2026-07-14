"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "thinksharp_last_entry";

export interface LastEntryData {
  entryType: "volunteer" | "intern";
  shared: {
    volunteer_name: string;
    location: string;
    remarks: string;
    submitted_by: string;
    staff_in_charge: string;
  };
  vol: {
    volunteer_type: string;
    organisation: string;
    programme_name: string;
    project_type: string;
  };
  intern: {
    organisation: string;
    department: string;
    intern_work_type: string;
    milestone: string;
    supervisor_name: string;
    internship_start_date: string;
    internship_end_date: string;
  };
}

export function useLastEntry() {
  const [lastEntry, setLastEntry] = useState<LastEntryData | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setLastEntry(JSON.parse(raw));
      } catch (e) {
        console.error("Failed to parse last entry", e);
      }
    }
  }, []);

  const saveLastEntry = (data: LastEntryData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setLastEntry(data);
    } catch (e) {
      console.error("Failed to save last entry", e);
    }
  };

  const clearLastEntry = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setLastEntry(null);
    } catch (e) {
      console.error("Failed to clear last entry", e);
    }
  };

  return {
    lastEntry,
    hasLastEntry: !!lastEntry,
    saveLastEntry,
    clearLastEntry
  };
}
