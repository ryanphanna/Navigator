import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Header } from './Header';

// Mock Contexts
vi.mock('../../contexts/UserContext', () => ({
    useUser: () => ({
        user: { id: 'test-user' },
        isLoading: false,
        isAdmin: false,
        signOut: vi.fn(),
    }),
}));

vi.mock('../../contexts/ModalContext', () => ({
    useModal: () => ({
        openModal: vi.fn(),
    }),
}));

describe('Header Layout', () => {
    const defaultProps = {
        currentView: 'analyze',
        isCoachMode: false,
        isEduMode: false,
        onViewChange: vi.fn(),
    };

    it('should have the navigation pill correctly centered vertically', () => {
        render(<Header {...defaultProps} />);

        // The navigation pill is a motion.nav element
        const nav = screen.getByRole('navigation');

        // Check for the critical centering classes
        expect(nav.className).toContain('absolute');
        expect(nav.className).toContain('top-1/2');
        expect(nav.className).toContain('-translate-y-1/2');
    });

    it('should render the Navigator logo', () => {
        render(<Header {...defaultProps} />);
        expect(screen.getByText('Navigator')).toBeInTheDocument();
    });

    it('should render the Sign Out button when user is logged in', () => {
        render(<Header {...defaultProps} />);
        expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });
});
