export const integrationConfig = {
  systems: {
    performanceTuning: {
      enabled: true,
      metricsWindow: 100,
      tuningInterval: 60000, // 1 minute
    },
    dataAnalytics: {
      enabled: true,
      decisionTracking: true,
      feedbackCollection: true,
    },
    continuousImprovement: {
      enabled: true,
      suggestionGeneration: true,
      feedbackAnalysis: true,
    },
    integratedDashboard: {
      enabled: true,
      metricsCollection: true,
      alertManagement: true,
    },
  },

  integrations: {
    semanticCore: {
      enabled: true,
      decisionTracking: true,
      strategyAnalysis: true,
    },
    applicationPipeline: {
      enabled: true,
      zipSynthesis: true,
      conflictResolution: true,
    },
    webPlatform: {
      enabled: true,
      dashboard: true,
      analytics: true,
      optimization: true,
    },
  },

  monitoring: {
    prometheus: {
      enabled: true,
      port: 9090,
    },
    alerts: {
      enabled: true,
      severityLevels: ['info', 'warning', 'critical'],
    },
  },

  database: {
    type: 'mysql',
    tables: ['decisions', 'feedback', 'metrics', 'suggestions', 'optimization_history'],
  },
};
