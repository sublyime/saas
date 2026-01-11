import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { logger } from './config/logger';
import config from './config';
import { initDatabase, closeDatabase } from './database/connection';
import { initializeTables } from './database/schema';
import { auditMiddleware, errorHandler, notFoundHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import incidentRoutes from './routes/incidentRoutes';
import resolutionRoutes from './routes/resolutionRoutes';
import healthRoutes from './routes/healthRoutes';
import { aiService } from './services/ai';

const app: Express = express();

/**
 * Security Middleware
 */
// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(
  cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Audit middleware
app.use(auditMiddleware);

/**
 * Routes
 */
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/resolutions', resolutionRoutes);

/**
 * Error Handling
 */
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Database Initialization
 */
const initializeApp = async () => {
  try {
    logger.info('Initializing application...');

    // Connect to database
    await initDatabase();
    logger.info('Database connection established');

    // Initialize schema
    await initializeTables();
    logger.info('Database schema initialized');

    // Initialize AI service
    const aiProviders = aiService.getAvailableProviders();
    const configuredProviders = aiProviders.filter((p) => p.configured);

    if (configuredProviders.length > 0) {
      logger.info(`AI service ready with provider: ${aiService.getActiveProvider().name}`);
    } else {
      logger.warn(
        'No AI provider configured. Resolution generation will be unavailable. ' +
          'Configure OPENAI_API_KEY, ANTHROPIC_API_KEY, or OLLAMA_BASE_URL'
      );
    }

    // Start server
    const server = app.listen(config.port, config.host, () => {
      logger.info(
        `Server running at http://${config.host}:${config.port} in ${config.nodeEnv} mode`
      );
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');
      server.close(async () => {
        await closeDatabase();
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
};

initializeApp();

export default app;
