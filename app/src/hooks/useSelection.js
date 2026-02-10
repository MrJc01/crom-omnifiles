import { useState, useCallback } from 'react';

export function useSelection() {
    const [selectedFileIds, setSelectedFileIds] = useState([]);

    const toggleSelection = useCallback((id, multiSelect = false) => {
        if (multiSelect) {
            setSelectedFileIds(prev =>
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
            );
        } else {
            setSelectedFileIds([id]);
        }
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedFileIds([]);
    }, []);

    return { selectedFileIds, setSelectedFileIds, toggleSelection, clearSelection };
}
