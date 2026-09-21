const request = require('supertest');
const jwt = require('jsonwebtoken');
const express = require('express');

// Set environment variables before requiring modules that depend on process.env
process.env.WEBUI_ADMIN_USER = 'testadmin';
process.env.WEBUI_ADMIN_PASS = 'testpassword123';
process.env.JWT_SECRET = 'testsecretkey12345';

const app = require('../server');
const { authenticateToken } = require('../routes/auth');

describe('Auth API & Middleware', () => {
    describe('POST /api/auth/login', () => {
        it('should return token when valid credentials are provided', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'testadmin',
                    password: 'testpassword123'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token');

            const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
            expect(decoded.username).toEqual('testadmin');
        });

        it('should return 401 with invalid username', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'wronguser',
                    password: 'testpassword123'
                });

            expect(res.statusCode).toEqual(401);
            expect(res.body).toEqual({ error: 'Invalid credentials' });
        });

        it('should return 401 with invalid password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'testadmin',
                    password: 'wrongpassword'
                });

            expect(res.statusCode).toEqual(401);
            expect(res.body).toEqual({ error: 'Invalid credentials' });
        });

        it('should return 401 when request body is empty or missing credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({});

            expect(res.statusCode).toEqual(401);
            expect(res.body).toEqual({ error: 'Invalid credentials' });
        });
    });

    describe('authenticateToken Middleware', () => {
        let testApp;

        beforeAll(() => {
            testApp = express();
            testApp.use(express.json());
            testApp.get('/protected', authenticateToken, (req, res) => {
                res.json({ message: 'success', user: req.user });
            });
        });

        it('should return 401 if authorization header is missing', async () => {
            const res = await request(testApp).get('/protected');
            expect(res.statusCode).toEqual(401);
        });

        it('should return 403 if token is invalid or malformed', async () => {
            const res = await request(testApp)
                .get('/protected')
                .set('Authorization', 'Bearer invalidtoken123');
            expect(res.statusCode).toEqual(403);
        });

        it('should return 200 and set req.user if token is valid', async () => {
            const token = jwt.sign({ username: 'testadmin' }, process.env.JWT_SECRET, { expiresIn: '1h' });

            const res = await request(testApp)
                .get('/protected')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toEqual('success');
            expect(res.body.user.username).toEqual('testadmin');
        });
    });
});
