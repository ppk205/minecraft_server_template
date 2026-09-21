const express = require('express');
const request = require('supertest');

// Mock authentication middleware prior to importing router
jest.mock('../routes/auth', () => ({
    authenticateToken: (req, res, next) => next()
}));

// Mock dockerode
const mockListContainers = jest.fn();
const mockGetContainer = jest.fn();
const mockInspect = jest.fn();
const mockLogs = jest.fn();
const mockStart = jest.fn();
const mockStop = jest.fn();
const mockRestart = jest.fn();

const mockContainerObj = {
    inspect: mockInspect,
    logs: mockLogs,
    start: mockStart,
    stop: mockStop,
    restart: mockRestart
};

jest.mock('dockerode', () => {
    return jest.fn().mockImplementation(() => {
        return {
            listContainers: mockListContainers,
            getContainer: mockGetContainer
        };
    });
});

const dockerRouter = require('../routes/docker');
const { getMcContainer } = dockerRouter;

describe('Docker Routes & getMcContainer tests', () => {
    let app;

    beforeEach(() => {
        jest.clearAllMocks();
        mockGetContainer.mockReturnValue(mockContainerObj);

        app = express();
        app.use(express.json());
        app.use('/api/docker', dockerRouter);
    });

    describe('getMcContainer unit tests', () => {
        it('should find container by com.docker.compose.service label', async () => {
            mockListContainers.mockResolvedValue([
                {
                    Id: 'container-id-123',
                    Labels: { 'com.docker.compose.service': 'mc' },
                    Names: ['/random-name']
                }
            ]);

            const container = await getMcContainer();
            expect(mockListContainers).toHaveBeenCalledWith({ all: true });
            expect(mockGetContainer).toHaveBeenCalledWith('container-id-123');
            expect(container).toBe(mockContainerObj);
        });

        it('should find container by name containing "-mc-"', async () => {
            mockListContainers.mockResolvedValue([
                {
                    Id: 'container-id-456',
                    Labels: {},
                    Names: ['/myproject-mc-1']
                }
            ]);

            const container = await getMcContainer();
            expect(mockListContainers).toHaveBeenCalledWith({ all: true });
            expect(mockGetContainer).toHaveBeenCalledWith('container-id-456');
            expect(container).toBe(mockContainerObj);
        });

        it('should throw an error when no matching container is found', async () => {
            mockListContainers.mockResolvedValue([
                {
                    Id: 'other-container',
                    Labels: { 'com.docker.compose.service': 'web' },
                    Names: ['/web-service']
                }
            ]);

            await expect(getMcContainer()).rejects.toThrow('MC container not found');
        });

        it('should throw error when listContainers rejects', async () => {
            mockListContainers.mockRejectedValue(new Error('Docker daemon error'));

            await expect(getMcContainer()).rejects.toThrow('Docker daemon error');
        });
    });

    describe('Docker Express endpoints', () => {
        beforeEach(() => {
            mockListContainers.mockResolvedValue([
                {
                    Id: 'container-123',
                    Labels: { 'com.docker.compose.service': 'mc' },
                    Names: ['/mc-1']
                }
            ]);
        });

        describe('GET /api/docker/status', () => {
            it('should return container status on success', async () => {
                mockInspect.mockResolvedValue({ State: { Status: 'running' } });

                const res = await request(app).get('/api/docker/status');
                expect(res.status).toBe(200);
                expect(res.body).toEqual({ status: 'running' });
            });

            it('should handle errors gracefully and return status unknown', async () => {
                mockInspect.mockRejectedValue(new Error('Inspect failed'));

                const res = await request(app).get('/api/docker/status');
                expect(res.status).toBe(200);
                expect(res.body).toEqual({ status: 'unknown', error: 'Inspect failed' });
            });
        });

        describe('GET /api/docker/logs', () => {
            it('should return logs as string on success', async () => {
                mockLogs.mockResolvedValue(Buffer.from('Log output lines'));

                const res = await request(app).get('/api/docker/logs');
                expect(res.status).toBe(200);
                expect(res.body).toEqual({ logs: 'Log output lines' });
            });

            it('should return 500 error on failure', async () => {
                mockLogs.mockRejectedValue(new Error('Log error'));

                const res = await request(app).get('/api/docker/logs');
                expect(res.status).toBe(500);
                expect(res.body).toEqual({ error: 'Log error' });
            });
        });

        describe('POST /api/docker/restart', () => {
            it('should restart container successfully', async () => {
                mockRestart.mockResolvedValue();

                const res = await request(app).post('/api/docker/restart');
                expect(res.status).toBe(200);
                expect(res.body).toEqual({ message: 'Server restarted successfully' });
            });

            it('should return 500 on restart error', async () => {
                mockRestart.mockRejectedValue(new Error('Restart error'));

                const res = await request(app).post('/api/docker/restart');
                expect(res.status).toBe(500);
                expect(res.body).toEqual({ error: 'Restart error' });
            });
        });

        describe('POST /api/docker/start', () => {
            it('should start container successfully', async () => {
                mockStart.mockResolvedValue();

                const res = await request(app).post('/api/docker/start');
                expect(res.status).toBe(200);
                expect(res.body).toEqual({ message: 'Server started successfully' });
            });

            it('should return 500 on start error', async () => {
                mockStart.mockRejectedValue(new Error('Start error'));

                const res = await request(app).post('/api/docker/start');
                expect(res.status).toBe(500);
                expect(res.body).toEqual({ error: 'Start error' });
            });
        });

        describe('POST /api/docker/stop', () => {
            it('should stop container successfully', async () => {
                mockStop.mockResolvedValue();

                const res = await request(app).post('/api/docker/stop');
                expect(res.status).toBe(200);
                expect(res.body).toEqual({ message: 'Server stopped successfully' });
            });

            it('should return 500 on stop error', async () => {
                mockStop.mockRejectedValue(new Error('Stop error'));

                const res = await request(app).post('/api/docker/stop');
                expect(res.status).toBe(500);
                expect(res.body).toEqual({ error: 'Stop error' });
            });
        });
    });
});
