import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import GuestLobby from './pages/guestLobby';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock MediaDevices
beforeAll(() => {
    Object.defineProperty(global.navigator, 'mediaDevices', {
        value: {
            getUserMedia: jest.fn().mockResolvedValue({
                getTracks: () => [
                    { stop: jest.fn(), kind: 'video' },
                    { stop: jest.fn(), kind: 'audio' }
                ]
            }),
            getDisplayMedia: jest.fn().mockResolvedValue({
                getTracks: () => [{ stop: jest.fn() }]
            })
        },
        writable: true,
        configurable: true
    });
});

describe('ConnectX Application Tests', () => {
    test('renders landing page with ConnectX branding and Join as Guest button', () => {
        render(<App />);

        // Branding
        expect(screen.getByText('ConnectX')).toBeInTheDocument();
        expect(screen.getByText('Join as Guest')).toBeInTheDocument();
        expect(screen.getByText(/Cover the distance with ConnectX/i)).toBeInTheDocument();
    });

    test('Guest Lobby renders with Google Meet-inspired UI elements', async () => {
        render(
            <MemoryRouter initialEntries={['/guest']}>
                <GuestLobby />
            </MemoryRouter>
        );

        // Header and Title
        expect(screen.getByText('Enter into Lobby')).toBeInTheDocument();
        expect(screen.getByText('ConnectX')).toBeInTheDocument();

        // Left Section Inputs & Labels
        expect(screen.getByText('Meeting code')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter meeting code')).toBeInTheDocument();
        expect(screen.getByText('Your name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();

        // Device Controls
        expect(screen.getByText('Mic ON')).toBeInTheDocument();
        expect(screen.getByText('Camera ON')).toBeInTheDocument();

        // Join Button
        expect(screen.getByText('Join Meeting')).toBeInTheDocument();

        // Right Section
        expect(screen.getByText('Live Camera Feed (Mirrored)')).toBeInTheDocument();
    });

    test('Guest Lobby validates empty meeting code and empty guest name', async () => {
        render(
            <MemoryRouter initialEntries={['/guest']}>
                <GuestLobby />
            </MemoryRouter>
        );

        const joinBtn = screen.getByText('Join Meeting');

        // Click with empty fields
        fireEvent.click(joinBtn);
        expect(await screen.findByText('Please enter a meeting code.')).toBeInTheDocument();

        // Enter meeting code only
        const codeInput = screen.getByPlaceholderText('Enter meeting code');
        fireEvent.change(codeInput, { target: { value: 'abc-defg-hij' } });
        fireEvent.click(joinBtn);
        expect(await screen.findByText('Please enter your name.')).toBeInTheDocument();
    });

    test('Guest Lobby toggles camera and shows Camera is off placeholder', async () => {
        render(
            <MemoryRouter initialEntries={['/guest']}>
                <GuestLobby />
            </MemoryRouter>
        );

        const cameraBtn = screen.getByText('Camera ON');
        fireEvent.click(cameraBtn);

        // Now camera should be OFF
        expect(screen.getByText('Camera OFF')).toBeInTheDocument();
        expect(screen.getByText('Camera is off')).toBeInTheDocument();
        expect(screen.getByText('Camera Disabled')).toBeInTheDocument();

        // Toggle back ON
        fireEvent.click(screen.getByText('Camera OFF'));
        expect(screen.getByText('Camera ON')).toBeInTheDocument();
        expect(screen.getByText('Live Camera Feed (Mirrored)')).toBeInTheDocument();
    });

    test('Guest Lobby toggles microphone ON and OFF independently', async () => {
        render(
            <MemoryRouter initialEntries={['/guest']}>
                <GuestLobby />
            </MemoryRouter>
        );

        const micBtn = screen.getByText('Mic ON');
        fireEvent.click(micBtn);
        expect(screen.getByText('Mic OFF')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Mic OFF'));
        expect(screen.getByText('Mic ON')).toBeInTheDocument();
    });

    test('Guest Lobby shows clean error when meeting is not found', async () => {
        axios.get.mockRejectedValueOnce({
            response: { status: 404, data: { message: 'Meeting not found' } }
        });

        render(
            <MemoryRouter initialEntries={['/guest']}>
                <GuestLobby />
            </MemoryRouter>
        );

        const codeInput = screen.getByPlaceholderText('Enter meeting code');
        const nameInput = screen.getByPlaceholderText('Enter your name');
        const joinBtn = screen.getByText('Join Meeting');

        fireEvent.change(codeInput, { target: { value: 'invalid-code' } });
        fireEvent.change(nameInput, { target: { value: 'Rahul' } });

        fireEvent.click(joinBtn);

        expect(await screen.findByText(/Meeting not found. Please check your meeting code/i)).toBeInTheDocument();
    });
});
