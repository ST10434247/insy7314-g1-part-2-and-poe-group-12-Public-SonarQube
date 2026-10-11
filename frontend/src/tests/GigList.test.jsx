import {render, screen, fireEvent } from '@testing-library/react';
import GigList from '../components/GigList';
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

//(Borenkraout, M.,2024)
// Testing to see if the Gigs load correctly from the API.

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

//(Borenkraout, M., 2024)
// Make sure booking form opens opens when client select it.

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

//(Borenkraout, M., 2024)
// Testing to see make sure client leaves a description (not empty or blank) when 
// describing what work need to be done for the gig. (additional info for the freelancer)

test('prevents booking when the client has left the requirements description blank', async () => {
    renderGigList();

    const bookButton = await screen.findByRole('button', {
        name: /book service/i
    });

    fireEvent.click(bookButton);

    const submitButton = screen.getByRole('button', {
        name: /submit request/i
    });

    fireEvent.click(submitButton);

    expect(await screen.findByRole('alert')).toHaveTextContent(
        /please describe your project requirements before submitting the booking/i
    );

    expect(global.fetch).not.toHaveBeenCalledWith(
        '/api/bookings',
        expect.anything()
    );
});