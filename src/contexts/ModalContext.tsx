import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type ModalType = 'AUTH' | 'SETTINGS' | 'UPGRADE' | 'INTERVIEW' | null;

interface ModalContextType {
    activeModal: ModalType;
    modalData: any;
    openModal: (type: ModalType, data?: any) => void;
    closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [modalData, setModalData] = useState<any>(null);

    const openModal = useCallback((type: ModalType, data: any = null) => {
        setActiveModal(type);
        setModalData(data);
    }, []);

    const closeModal = useCallback(() => {
        setActiveModal(null);
        setModalData(null);
    }, []);

    return (
        <ModalContext.Provider value={{ activeModal, modalData, openModal, closeModal }}>
            {children}
        </ModalContext.Provider>
    );
};
