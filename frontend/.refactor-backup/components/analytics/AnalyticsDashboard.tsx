/**
 * Analytics Dashboard
 * Comprehensive analytics visualization dashboard for all tracked metrics
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analytics } from '../../utils/analyticsSystem';
import { useXPSystemAnalytics } from '../../hooks/useXPSystemAnalytics';
import { useWardrobeAnalytics } from '../../hooks/useWardrobeAnalytics';
import { crossDeviceTracker } from '../../utils/crossDevicePerformanceTracker';
import { errorTracker } from '../../utils/errorTrackingSystem';
import { loadTimeMonitor } from '../../utils/componentLoadTimeMonitor';

interface AnalyticsDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  isVisible,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'xp' | 'wardrobe' | 'performance' | 'errors' | 'loadtimes'>('overview');
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [isLiveMode, setIsLiveMode] = useState(true);

  // Analytics hooks
  const xpAnalytics = useXPSystemAnalytics();
  const wardrobeAnalytics = useWardrobeAnalytics();

  // State for various analytics data
  const [overviewData, setOverviewData] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [errorData, setErrorData] = useState<any>(null);
  const [loadTimeData, setLoadTimeData] = useState<any>(null);

  // Refresh data periodically
  useEffect(() => {
    const refreshData = () => {
      // Gather all analytics data
      setOverviewData({
        sessionInfo: analytics.getSessionInfo(),
        deviceInfo: analytics.getDeviceInfo(),
        xpAnalytics: analytics.getXPAnalytics(),
        wardrobeAnalytics: analytics.getWardrobeAnalytics()
      });

      setPerformanceData(crossDeviceTracker.getCrossDeviceAnalysis());
      setErrorData(errorTracker.getErrorAnalytics());
      setLoadTimeData(loadTimeMonitor.getComponentLoadAnalytics());
    };

    if (isVisible) {
      refreshData();
      
      if (isLiveMode) {
        const interval = setInterval(refreshData, refreshInterval);
        return () => clearInterval(interval);
      }
    }
  }, [isVisible, isLiveMode, refreshInterval]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-4 bg-gray-900 text-white rounded-lg shadow-2xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Analytics Dashboard</h2>
          <div className="text-sm opacity-80">
            Real-time component usage and performance analytics
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isLiveMode}
              onChange={(e) => setIsLiveMode(e.target.checked)}
              className="rounded"
            />
            Live Mode
          </label>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
            disabled={!isLiveMode}
          >
            <option value={5000}>5s</option>
            <option value={15000}>15s</option>
            <option value={30000}>30s</option>
            <option value={60000}>1m</option>
          </select>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-sm font-medium"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex h-full">
        {/* Sidebar Navigation */}
        <div className="w-48 bg-gray-800 p-4 border-r border-gray-700">
          <div className="space-y-2">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'xp', label: 'XP System', icon: '⭐' },
              { id: 'wardrobe', label: 'Wardrobe', icon: '👗' },
              { id: 'performance', label: 'Performance', icon: '⚡' },
              { id: 'errors', label: 'Errors', icon: '🚨' },
              { id: 'loadtimes', label: 'Load Times', icon: '⏱️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="mt-6 p-3 bg-gray-700 rounded-lg">
            <h3 className="font-medium mb-2 text-sm">Quick Stats</h3>
            <div className="text-xs space-y-1">
              {overviewData && (
                <>
                  <div className="flex justify-between">
                    <span>Session:</span>
                    <span className="text-blue-400">
                      {Math.round(overviewData.sessionInfo.duration / 60000)}min
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>XP Gained:</span>
                    <span className="text-green-400">
                      {xpAnalytics.sessionXP}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Interactions:</span>
                    <span className="text-purple-400">
                      {xpAnalytics.sessionInteractions + wardrobeAnalytics.sessionInteractions}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Errors:</span>
                    <span className={errorData?.overallErrorRate > 0 ? 'text-red-400' : 'text-green-400'}>
                      {errorData?.criticalErrors?.length || 0}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              {activeTab === 'overview' && (
                <OverviewTab data={overviewData} />
              )}
              
              {activeTab === 'xp' && (
                <XPAnalyticsTab 
                  analytics={xpAnalytics}
                  data={overviewData?.xpAnalytics}
                />
              )}
              
              {activeTab === 'wardrobe' && (
                <WardrobeAnalyticsTab 
                  analytics={wardrobeAnalytics}
                  data={overviewData?.wardrobeAnalytics}
                />
              )}
              
              {activeTab === 'performance' && (
                <PerformanceAnalyticsTab data={performanceData} />
              )}
              
              {activeTab === 'errors' && (
                <ErrorAnalyticsTab data={errorData} />
              )}
              
              {activeTab === 'loadtimes' && (
                <LoadTimeAnalyticsTab data={loadTimeData} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// Overview Tab
const OverviewTab: React.FC<{ data: any }> = ({ data }) => {
  if (!data) return <div>Loading overview...</div>;

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-blue-400">Analytics Overview</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Session Duration"
          value={`${Math.round(data.sessionInfo.duration / 60000)}min`}
          change="+5%"
          color="blue"
        />
        <MetricCard
          title="Total XP Gained"
          value={data.xpAnalytics.xpGained.toString()}
          change="+12%"
          color="green"
        />
        <MetricCard
          title="Items Equipped"
          value={data.wardrobeAnalytics.itemEquips.toString()}
          change="+8%"
          color="purple"
        />
        <MetricCard
          title="Engagement Score"
          value={`${Math.round((data.xpAnalytics.effectivenessScore + data.wardrobeAnalytics.customizationDepth * 10) / 2)}`}
          change="+15%"
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="font-medium mb-3">Device Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Device Type:</span>
              <span className="text-blue-400">{data.deviceInfo?.deviceType}</span>
            </div>
            <div className="flex justify-between">
              <span>Performance Tier:</span>
              <span className="text-green-400">{data.deviceInfo?.performanceTier}</span>
            </div>
            <div className="flex justify-between">
              <span>Memory Size:</span>
              <span className="text-purple-400">{data.deviceInfo?.memorySize}</span>
            </div>
            <div className="flex justify-between">
              <span>WebGL Support:</span>
              <span className={data.deviceInfo?.supportsWebGL ? 'text-green-400' : 'text-red-400'}>
                {data.deviceInfo?.supportsWebGL ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="font-medium mb-3">Session Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Page Views:</span>
              <span className="text-blue-400">{data.sessionInfo.pageViews}</span>
            </div>
            <div className="flex justify-between">
              <span>Interactions:</span>
              <span className="text-green-400">{data.sessionInfo.interactions}</span>
            </div>
            <div className="flex justify-between">
              <span>Errors:</span>
              <span className="text-red-400">{data.sessionInfo.errors}</span>
            </div>
            <div className="flex justify-between">
              <span>Crashes:</span>
              <span className="text-red-400">{data.sessionInfo.crashes}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// XP Analytics Tab
const XPAnalyticsTab: React.FC<{ analytics: any; data: any }> = ({ analytics, data }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-green-400">XP System Analytics</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Session XP"
          value={analytics.sessionXP.toString()}
          change="+25%"
          color="green"
        />
        <MetricCard
          title="Interactions"
          value={analytics.sessionInteractions.toString()}
          change="+18%"
          color="blue"
        />
        <MetricCard
          title="Engagement Score"
          value={analytics.engagementScore.toString()}
          change="+10%"
          color="purple"
        />
      </div>

      {analytics.sourceMetrics && (
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="font-medium mb-3">XP Sources</h4>
          <div className="space-y-2">
            {Object.entries(analytics.sourceMetrics).map(([source, metrics]: [string, any]) => (
              <div key={source} className="flex justify-between items-center">
                <span className="capitalize">{source}</span>
                <div className="flex gap-4 text-sm">
                  <span className="text-blue-400">{metrics.count} times</span>
                  <span className="text-green-400">{metrics.totalXP} XP</span>
                  <span className="text-purple-400">{metrics.averageXP.toFixed(1)} avg</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analytics.insights && analytics.insights.length > 0 && (
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="font-medium mb-3">Insights</h4>
          <ul className="space-y-2">
            {analytics.insights.map((insight: string, index: number) => (
              <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-blue-400">•</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Wardrobe Analytics Tab
const WardrobeAnalyticsTab: React.FC<{ analytics: any; data: any }> = ({ analytics, data }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-purple-400">Wardrobe Analytics</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Outfit Changes"
          value={analytics.currentOutfitSize.toString()}
          change="+12%"
          color="purple"
        />
        <MetricCard
          title="Interactions"
          value={analytics.sessionInteractions.toString()}
          change="+8%"
          color="blue"
        />
        <MetricCard
          title="Engagement"
          value={analytics.engagementScore.toString()}
          change="+15%"
          color="green"
        />
      </div>

      {analytics.engagementMetrics && (
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="font-medium mb-3">Engagement Metrics</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Items Equipped</div>
              <div className="text-lg font-medium">{analytics.engagementMetrics.itemEquips}</div>
            </div>
            <div>
              <div className="text-gray-400">Items Unequipped</div>
              <div className="text-lg font-medium">{analytics.engagementMetrics.itemUnequips}</div>
            </div>
            <div>
              <div className="text-gray-400">Browsing Time</div>
              <div className="text-lg font-medium">{Math.round(analytics.engagementMetrics.browsingTime / 1000)}s</div>
            </div>
            <div>
              <div className="text-gray-400">Customization Depth</div>
              <div className="text-lg font-medium">{analytics.engagementMetrics.customizationDepth}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Performance Analytics Tab
const PerformanceAnalyticsTab: React.FC<{ data: any }> = ({ data }) => {
  if (!data) return <div>Loading performance data...</div>;

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-yellow-400">Performance Analytics</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Device Profiles"
          value={data.deviceProfiles?.length?.toString() || '0'}
          color="blue"
        />
        <MetricCard
          title="High Performance"
          value={`${Math.round((data.performanceDistribution?.high || 0) * 100)}%`}
          color="green"
        />
        <MetricCard
          title="Optimizations"
          value={data.optimizationRecommendations?.length?.toString() || '0'}
          color="purple"
        />
      </div>

      {data.performanceDistribution && (
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="font-medium mb-3">Performance Distribution</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>High Performance: {Math.round(data.performanceDistribution.high * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>Medium Performance: {Math.round(data.performanceDistribution.medium * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Low Performance: {Math.round(data.performanceDistribution.low * 100)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Error Analytics Tab
const ErrorAnalyticsTab: React.FC<{ data: any }> = ({ data }) => {
  if (!data) return <div>Loading error data...</div>;

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-red-400">Error Analytics</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Error Rate"
          value={data.overallErrorRate?.toFixed(2) || '0.00'}
          color="red"
        />
        <MetricCard
          title="Recovery Rate"
          value={`${Math.round((data.recoveryRate || 0) * 100)}%`}
          color="green"
        />
        <MetricCard
          title="Critical Errors"
          value={data.criticalErrors?.length?.toString() || '0'}
          color="red"
        />
      </div>

      {data.errorDistribution && (
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="font-medium mb-3">Error Distribution</h4>
          <div className="space-y-2">
            {Object.entries(data.errorDistribution).map(([type, count]: [string, any]) => (
              <div key={type} className="flex justify-between">
                <span className="capitalize">{type.replace('_', ' ')}</span>
                <span className="text-red-400">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Load Time Analytics Tab
const LoadTimeAnalyticsTab: React.FC<{ data: any }> = ({ data }) => {
  if (!data) return <div>Loading load time data...</div>;

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-cyan-400">Load Time Analytics</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Fast Loads"
          value={`${Math.round((data.performanceDistribution?.fast || 0) * 100)}%`}
          color="green"
        />
        <MetricCard
          title="Bottlenecks"
          value={data.bottlenecks?.length?.toString() || '0'}
          color="red"
        />
        <MetricCard
          title="Optimizations"
          value={data.optimizationOpportunities?.length?.toString() || '0'}
          color="blue"
        />
      </div>

      {data.averageLoadTimes && (
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="font-medium mb-3">Average Load Times</h4>
          <div className="space-y-2">
            {Object.entries(data.averageLoadTimes).map(([component, time]: [string, any]) => (
              <div key={component} className="flex justify-between">
                <span>{component}</span>
                <span className={time > 300 ? 'text-red-400' : time > 100 ? 'text-yellow-400' : 'text-green-400'}>
                  {time.toFixed(1)}ms
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable Metric Card Component
const MetricCard: React.FC<{
  title: string;
  value: string;
  change?: string;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'cyan';
}> = ({ title, value, change, color }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
    cyan: 'from-cyan-500 to-cyan-600'
  };

  return (
    <div className={`bg-gradient-to-r ${colorClasses[color]} p-4 rounded-lg text-white`}>
      <div className="text-sm opacity-80">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
      {change && (
        <div className="text-sm opacity-80">{change} from last period</div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;