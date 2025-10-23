import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import userEvent from '@testing-library/user-event';

describe('Integration Tests - Smoke Suite', () => {
    it('should render components with React Query provider', () => {
        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        });

        const TestComponent = () => <div>Test Component</div>;

        render(
            <QueryClientProvider client={queryClient}>
                <TestComponent />
                </QueryClientProvider>
        );

        expect(screen.getByText('Test Component')).toBeInTheDocument();
    });

    it('should handle async data fetching', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            data: [{ id: 1, name: 'Test Product' }],
        });

        const TestComponent = () => {
            const [data, setData] = React.useState<any>(null);

            React.useEffect(() => {
                mockFetch().then((result: { data: any; }) => setData(result.data));
            }, []);

            return <div>{data ? data[0].name : 'Loading...'}</div>;
        };

        render(<TestComponent />);

        expect(screen.getByText('Loading...')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Test Product')).toBeInTheDocument();
        });

        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle user interactions', async () => {
        const user = userEvent.setup();
        const handleClick = vi.fn();

        const TestComponent = () => (
            <button onClick={handleClick}>Click Me</button>
    );

        render(<TestComponent />);

        const button = screen.getByRole('button', { name: /click me/i });
        await user.click(button);

        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should update component state correctly', async () => {
        const user = userEvent.setup();

        const Counter = () => {
            const [count, setCount] = React.useState(0);

            return (
                <div>
                    <p>Count: {count}</p>
            <button onClick={() => setCount(count + 1)}>Increment</button>
            </div>
        );
        };

        render(<Counter />);

        expect(screen.getByText('Count: 0')).toBeInTheDocument();

        const button = screen.getByRole('button', { name: /increment/i });
        await user.click(button);

        expect(screen.getByText('Count: 1')).toBeInTheDocument();
    });

    it('should handle parent-child component communication', () => {
        const Child = ({ message }: { message: string }) => <p>{message}</p>;

        const Parent = () => {
            const [msg, setMsg] = React.useState('Initial Message');

            return (
                <div>
                    <Child message={msg} />
            <button onClick={() => setMsg('Updated Message')}>Update</button>
            </div>
        );
        };

        render(<Parent />);

        expect(screen.getByText('Initial Message')).toBeInTheDocument();
    });
});
