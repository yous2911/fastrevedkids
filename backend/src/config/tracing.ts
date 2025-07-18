import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { FastifyInstrumentation } from '@opentelemetry/instrumentation-fastify';
import { MySQLInstrumentation } from '@opentelemetry/instrumentation-mysql2';
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis';
import { env } from './environment.js';

// Initialize OpenTelemetry SDK
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'reved-kids-backend',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: env.NODE_ENV,
  }),
  spanProcessor: new BatchSpanProcessor(
    new JaegerExporter({
      endpoint: env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
    })
  ),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
    }),
    new FastifyInstrumentation(),
    new MySQLInstrumentation(),
    new RedisInstrumentation(),
  ],
});

// Initialize metrics
const meterProvider = new MeterProvider();
const prometheusExporter = new PrometheusExporter({
  port: env.METRICS_PORT || 9464,
  endpoint: '/metrics',
});

meterProvider.addMetricReader(prometheusExporter);

// Register instrumentations
registerInstrumentations({
  meterProvider,
  instrumentations: [
    new FastifyInstrumentation(),
    new MySQLInstrumentation(),
    new RedisInstrumentation(),
  ],
});

// Custom span attributes for business logic
export const addBusinessAttributes = (span: any, attributes: Record<string, any>) => {
  Object.entries(attributes).forEach(([key, value]) => {
    span.setAttribute(`business.${key}`, value);
  });
};

// Custom metrics for business KPIs
export const createBusinessMetrics = () => {
  const meter = meterProvider.getMeter('reved-kids-business');
  
  return {
    activeUsers: meter.createCounter('active_users_total', {
      description: 'Total number of active users',
    }),
    exercisesCompleted: meter.createCounter('exercises_completed_total', {
      description: 'Total number of exercises completed',
    }),
    apiResponseTime: meter.createHistogram('api_response_time_seconds', {
      description: 'API response time in seconds',
      unit: 's',
    }),
    errorRate: meter.createCounter('errors_total', {
      description: 'Total number of errors',
    }),
  };
};

// Health check for tracing system
export const checkTracingHealth = async (): Promise<{
  status: 'healthy' | 'unhealthy';
  details: Record<string, any>;
}> => {
  try {
    const jaegerHealth = await fetch(`${env.JAEGER_ENDPOINT}/health`);
    const prometheusHealth = await fetch(`http://localhost:${env.METRICS_PORT || 9464}/metrics`);
    
    return {
      status: 'healthy',
      details: {
        jaeger: jaegerHealth.ok,
        prometheus: prometheusHealth.ok,
        sdkInitialized: sdk.isStarted(),
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        sdkInitialized: sdk.isStarted(),
      },
    };
  }
};

// Initialize tracing
export const initializeTracing = async (): Promise<void> => {
  try {
    await sdk.start();
    console.log('✅ Distributed tracing initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize distributed tracing:', error);
  }
};

// Graceful shutdown
export const shutdownTracing = async (): Promise<void> => {
  try {
    await sdk.shutdown();
    console.log('✅ Distributed tracing shutdown successfully');
  } catch (error) {
    console.error('❌ Error during tracing shutdown:', error);
  }
};

export { sdk, meterProvider, prometheusExporter }; 