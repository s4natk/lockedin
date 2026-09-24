import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('GET /health', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('GET /users/me rejects a missing token', () => {
    return request(app.getHttpServer()).get('/users/me').expect(401);
  });

  it('GET /categories rejects a missing token', () => {
    return request(app.getHttpServer()).get('/categories').expect(401);
  });

  it('GET /tasks rejects a missing token', () => {
    return request(app.getHttpServer()).get('/tasks').expect(401);
  });

  it('GET /sessions rejects a missing token', () => {
    return request(app.getHttpServer()).get('/sessions').expect(401);
  });

  it('GET /progression rejects a missing token', () => {
    return request(app.getHttpServer()).get('/progression').expect(401);
  });

  afterEach(async () => {
    await app.close();
  });
});
