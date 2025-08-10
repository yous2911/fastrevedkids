/**
 * Optimization Dashboard
 * Real-time monitoring and control panel for bundle size, memory, and lazy loading
 */

import React, { useState, useEffect } from 'react';
import { bundleOptimizer } from '../../utils/bundleOptimizer';
import { memoryLeakDetector, useMemoryManagement } from '../../utils/memoryLeakDetector';
import { threeJSMemoryManager, useThreeJSMemory } from '../../utils/threeJsMemoryManager';
import { lazyManager } from '../../utils/lazyOptimized';

interface OptimizationStats {
  bundleSize: {
    totalSize: number;
    chunkSizes: Record<string, number>;
    compressionRatio: number;
  };
  memory: {
    current: number;
    limit: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    leaks: number;
  };
  lazyLoading: {
    totalChunks: number;
    loadedChunks: number;
    cacheHitRate: number;
    averageLoadTime: number;
  };
  threeJS: {
    totalResources: number;
    memoryUsage: number;
    disposedResources: number;
  };
}

export const OptimizationDashboard: React.FC = () => {
  const [stats, setStats] = useState<OptimizationStats | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'bundle' | 'memory' | 'lazy' | 'threejs'>('overview');
  const [reports, setReports] = useState<{
    bundleReport?: string;
    memoryReport?: string;
    lazyReport?: string;
  }>({});

  // Hooks for monitoring
  useMemoryManagement('OptimizationDashboard');
  const threeJSMemory = useThreeJSMemory();

  // Update stats periodically
  useEffect(() => {
    if (!isMonitoring) return;

    const updateStats = () => {
      const memoryStatus = memoryLeakDetector.getMemoryStatus();
      const bundleStats = bundleOptimizer.getBundleStats();
      const lazyStats = lazyManager.getStats();
      const threeStats = threeJSMemoryManager.getMemoryStats();

      setStats({
        bundleSize: {
          totalSize: bundleStats.totalSize,
          chunkSizes: bundleStats.chunkSizes || {},
          compressionRatio: bundleStats.compressionRatio || 2.5,
        },
        memory: {
          current: memoryStatus.current.usedJSHeapSize,
          limit: memoryStatus.current.jsHeapSizeLimit,
          trend: memoryStatus.trend,
          leaks: memoryStatus.leaks.length,
        },
        lazyLoading: {
          totalChunks: lazyStats.totalChunks,
          loadedChunks: lazyStats.loadedChunks,
          cacheHitRate: lazyStats.cacheHitRate,
          averageLoadTime: lazyStats.averageLoadTime,
        },
        threeJS: {
          totalResources: threeStats.totalResources,
          memoryUsage: threeStats.usage.total,
          disposedResources: Object.values(threeStats.resourceCount).reduce((sum, count) => sum + count, 0),
        },
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isMonitoring]);

  const handleGenerateReports = async () => {
    try {
      const bundleReport = bundleOptimizer.generateBundleReport();
      const memoryReport = memoryLeakDetector.generateMemoryReport();
      
      setReports({
        bundleReport,
        memoryReport,
        lazyReport: 'Lazy loading report generated', // Simplified
      });
    } catch (error) {
      console.error('Failed to generate reports:', error);
    }
  };

  const handleOptimize = async () => {
    try {
      console.log('🚀 Starting optimization process...');
      
      // Run optimizations
      await bundleOptimizer.applyOptimizations();
      memoryLeakDetector.performCleanup();
      threeJSMemoryManager.disposeAll();
      
      console.log('✅ Optimization complete!');
    } catch (error) {
      console.error('❌ Optimization failed:', error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (value: number, threshold: number) => {
    if (value > threshold * 0.8) return 'text-red-600 bg-red-50';
    if (value > threshold * 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  if (!stats) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Optimization Dashboard</h2>
            <button
              onClick={() => setIsMonitoring(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Monitoring
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Optimization Dashboard</h2>
            <div className="flex gap-3">
              <button
                onClick={handleGenerateReports}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Generate Reports
              </button>
              <button
                onClick={handleOptimize}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                🚀 Optimize Now
              </button>
              <button
                onClick={() => setIsMonitoring(!isMonitoring)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isMonitoring 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <nav className="flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: '📊' },
              { key: 'bundle', label: 'Bundle Size', icon: '📦' },
              { key: 'memory', label: 'Memory', icon: '🧠' },
              { key: 'lazy', label: 'Lazy Loading', icon: '⚡' },
              { key: 'threejs', label: 'Three.js', icon: '🎮' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Bundle Size */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">📦</div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Bundle Size</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatBytes(stats.bundleSize.totalSize)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Memory Usage */}
              <div className={`rounded-lg p-4 ${getStatusColor(stats.memory.current, stats.memory.limit)}`}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">🧠</div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">Memory Usage</p>
                    <p className="text-lg font-semibold">
                      {formatBytes(stats.memory.current)}
                    </p>
                    <p className="text-xs opacity-75">
                      {((stats.memory.current / stats.memory.limit) * 100).toFixed(1)}% used
                    </p>
                  </div>
                </div>
              </div>

              {/* Lazy Loading */}
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">⚡</div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Cache Hit Rate</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {stats.lazyLoading.cacheHitRate}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Three.js Resources */}
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">🎮</div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">3D Resources</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {stats.threeJS.totalResources}
                    </p>
                    <p className="text-xs text-purple-600">
                      {formatBytes(stats.threeJS.memoryUsage)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bundle' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2">Total Bundle Size</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatBytes(stats.bundleSize.totalSize)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2">Compression Ratio</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.bundleSize.compressionRatio.toFixed(1)}x
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2">Chunk Count</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {Object.keys(stats.bundleSize.chunkSizes).length}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Chunk Sizes</h3>
                <div className="space-y-2">
                  {Object.entries(stats.bundleSize.chunkSizes).map(([chunk, size]) => (
                    <div key={chunk} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="font-medium">{chunk}</span>
                      <span className="text-gray-600">{formatBytes(size)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'memory' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`rounded-lg p-4 ${getStatusColor(stats.memory.current, stats.memory.limit)}`}>
                  <h3 className="text-lg font-semibold mb-2">Current Usage</h3>
                  <p className="text-2xl font-bold">
                    {formatBytes(stats.memory.current)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2">Memory Limit</h3>
                  <p className="text-2xl font-bold text-gray-600">
                    {formatBytes(stats.memory.limit)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2">Trend</h3>
                  <p className={`text-2xl font-bold ${
                    stats.memory.trend === 'increasing' ? 'text-red-600' :
                    stats.memory.trend === 'decreasing' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {stats.memory.trend}
                  </p>
                </div>
              </div>

              {stats.memory.leaks > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">
                    🚨 Memory Leaks Detected
                  </h3>
                  <p className="text-red-700">
                    {stats.memory.leaks} potential memory leaks found. Run optimization to fix.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'lazy' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2">Total Chunks</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.lazyLoading.totalChunks}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2">Loaded</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.lazyLoading.loadedChunks}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2">Cache Hit Rate</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.lazyLoading.cacheHitRate}%
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2">Avg Load Time</h3>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.lazyLoading.averageLoadTime}ms
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'threejs' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2">Total Resources</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.threeJS.totalResources}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2">Memory Usage</h3>
                  <p className="text-2xl font-bold text-red-600">
                    {formatBytes(stats.threeJS.memoryUsage)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2">Active Resources</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.threeJS.disposedResources}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => threeJSMemory.disposeAll()}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  🗑️ Dispose All Resources
                </button>
                <button
                  onClick={() => console.log(threeJSMemory.getStats())}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  📊 Log Stats
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reports */}
        {Object.keys(reports).length > 0 && (
          <div className="border-t border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Generated Reports</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reports.bundleReport && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Bundle Report</h4>
                  <pre className="text-xs text-gray-600 overflow-auto max-h-32">
                    {reports.bundleReport}
                  </pre>
                </div>
              )}
              {reports.memoryReport && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Memory Report</h4>
                  <pre className="text-xs text-gray-600 overflow-auto max-h-32">
                    {reports.memoryReport}
                  </pre>
                </div>
              )}
              {reports.lazyReport && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Lazy Loading Report</h4>
                  <pre className="text-xs text-gray-600 overflow-auto max-h-32">
                    {reports.lazyReport}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};