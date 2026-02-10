import { useState, useCallback } from 'react';

export function useDragDrop(onDropFiles) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(async (e, currentFolderId) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const newFiles = [];
            for (let i = 0; i < e.dataTransfer.files.length; i++) {
                const file = e.dataTransfer.files[i];
                // Simple size check, can be expanded
                if (file.size > 2 * 1024 * 1024) {
                    alert(`O ficheiro ${file.name} é demasiado grande para o modo local (>2MB).`);
                    continue;
                }

                const content = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    if (file.type.startsWith('image/') || file.type.startsWith('text/')) reader.readAsDataURL(file);
                    else resolve(null);
                });

                newFiles.push({
                    id: `file-${Date.now()}-${i}`,
                    parentId: currentFolderId,
                    name: file.name,
                    type: file.type.startsWith('image/') ? 'image' : file.type.includes('pdf') ? 'pdf' : 'file',
                    size: (file.size / 1024).toFixed(2) + ' KB',
                    date: 'Hoje',
                    content: content
                });
            }
            if (newFiles.length > 0) onDropFiles(newFiles);
        }
    }, [onDropFiles]);

    return { isDragging, handleDragOver, handleDragLeave, handleDrop };
}
