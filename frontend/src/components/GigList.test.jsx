import {render, screen, fireEvent } from '@testing-library/react';
import GigList from './GigList';
import { AuthContext } from '../context/AuthContext';

const mockGigs = [
    {
        _id: 'gig1234',
        title: 'Seamstress Sewing Service',
        description: 'Professional qualified clothing and textile designer for sewing requirements.',
        price: 450
    }
];

const renderGigList = (user = {role: 'client'}, token = 'test-token') => {
    return render(
        <AuthContext.Provider value={{user, token}}>
            <GigList />
        </AuthContext.Provider>
    );
};

beforeEach(() => {
    global.fetch = jest.fn((url) => {
        if (url === '/api/gigs') {
            return Promise.resolve({
                ok: true,
                json: async () => ({ gigs: mockGigs})
            });
        }

        return Promise.resolve({
            ok: true,
            json: async () => ({})
        });
    });
});

afterEach(() => {
    jest.restoreAllMocks();
});

test('loads and displays gigs from the API', async() => {
    renderGigList();

    expect(
        await screen.findByText('Seamstress Sewing Service')
    ).toBeInTheDocument();

    expect(
        screen.getByText('Professional qualified clothing and textile designer for sewing requirements.')
    ).toBeInTheDocument();

    expect(screen.getByText('R450')).toBeInTheDocument();
});

test('client can open the booking form', async () => {
    renderGigList();

    const bookButton = await screen.findByRole('button', {
        name: /book service/i
    });

    fireEvent.click(bookButton);

    expect(
        screen.getByText(/request booking: seamstress sewing service/i)
    ).toBeInTheDocument();
});