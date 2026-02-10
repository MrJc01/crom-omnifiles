import React, { createContext, useContext } from 'react';
import { useFileSystem as useFileSystemHook } from '../hooks/useFileSystem';

const FileSystemContext = createContext(null);

export const FileSystemProvider = ({ children }) => {
    const fs = useFileSystemHook();

    return (
        <FileSystemContext.Provider value={fs}>
            {children}
        </FileSystemContext.Provider>
    );
};

export const useFileSystem = () => {
    const context = useContext(FileSystemContext);
    if (!context) {
        throw new Error("useFileSystem must be used within a FileSystemProvider");
    }
    return context;
};
