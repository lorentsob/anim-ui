/**
 * Performance monitoring component for real-time export metrics
 */

import { useState, useEffect } from "react";
import { ExportPerformanceMonitor, formatDuration, formatMemory, formatFileSize, getPerformanceBadgeColor } from "../lib/performanceMonitor";
import type { PerformanceMetrics, PerformanceConfig } from "../lib/performanceMonitor";

type PerformanceMonitorProps = {
  monitor: ExportPerformanceMonitor | null;
  config: PerformanceConfig;
  isActive: boolean;
  className?: string;
};

export default function PerformanceMonitor({ monitor, config, isActive, className = "" }: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [analysis, setAnalysis] = useState(() => ExportPerformanceMonitor.analyzeConfig(config));

  useEffect(() => {
    setAnalysis(ExportPerformanceMonitor.analyzeConfig(config));
  }, [config]);

  useEffect(() => {
    if (monitor && isActive) {
      // Set up real-time monitoring
      const monitorWithCallback = new ExportPerformanceMonitor(config, setMetrics);
      monitor.start = monitorWithCallback.start.bind(monitorWithCallback);
      monitor.stop = monitorWithCallback.stop.bind(monitorWithCallback);
    }
  }, [monitor, config, isActive]);

  if (!isActive && !metrics) {
    return (
      <div className={`performance-monitor-preview ${className}`}>
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Export Analysis</h4>
          <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getPerformanceBadgeColor(analysis.severity)}`}>
            {analysis.severity.toUpperCase()} COMPLEXITY
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
          <div>
            <span className="text-gray-500">Est. Duration:</span>
            <span className="ml-1 font-mono">{formatDuration(analysis.estimatedDuration)}</span>
          </div>
          <div>
            <span className="text-gray-500">Est. File Size:</span>
            <span className="ml-1 font-mono">{formatFileSize(analysis.estimatedFileSize)}</span>
          </div>
        </div>

        {analysis.warnings.length > 0 && (
          <div className="mb-3">
            <h5 className="text-xs font-medium text-amber-600 mb-1">Warnings</h5>
            <ul className="text-xs text-amber-700 space-y-1">
              {analysis.warnings.map((warning, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-amber-500 mr-1">⚠</span>
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.recommendations.length > 0 && (
          <div>
            <h5 className="text-xs font-medium text-blue-600 mb-1">Recommendations</h5>
            <ul className="text-xs text-blue-700 space-y-1">
              {analysis.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-1">💡</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  if (!metrics) return null;

  const progressPercent = (metrics.framesProcessed / config.totalFrames) * 100;

  return (
    <div className={`performance-monitor ${className}`}>
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-medium text-gray-700">Export Performance</h4>
          <span className="text-xs text-gray-500">
            {metrics.framesProcessed}/{config.totalFrames} frames
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
        <div>
          <span className="text-gray-500">Duration:</span>
          <span className="ml-1 font-mono">{formatDuration(metrics.duration)}</span>
        </div>
        <div>
          <span className="text-gray-500">Time Left:</span>
          <span className="ml-1 font-mono">{formatDuration(metrics.estimatedTimeRemaining)}</span>
        </div>
        <div>
          <span className="text-gray-500">Frame Time:</span>
          <span className="ml-1 font-mono">{formatDuration(metrics.avgFrameTime)}</span>
        </div>
        <div>
          <span className="text-gray-500">Memory:</span>
          <span className="ml-1 font-mono">{formatMemory(metrics.memoryUsage)}</span>
        </div>
      </div>

      {metrics.warnings.length > 0 && (
        <div className="mb-3">
          <h5 className="text-xs font-medium text-amber-600 mb-1">Performance Warnings</h5>
          <ul className="text-xs text-amber-700 space-y-1">
            {metrics.warnings.slice(0, 3).map((warning, index) => (
              <li key={index} className="flex items-start">
                <span className="text-amber-500 mr-1">⚠</span>
                {warning}
              </li>
            ))}
            {metrics.warnings.length > 3 && (
              <li className="text-amber-600 italic">
                +{metrics.warnings.length - 3} more warnings
              </li>
            )}
          </ul>
        </div>
      )}

      {metrics.recommendations.length > 0 && (
        <div>
          <h5 className="text-xs font-medium text-blue-600 mb-1">Recommendations</h5>
          <ul className="text-xs text-blue-700 space-y-1">
            {metrics.recommendations.slice(0, 2).map((rec, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-500 mr-1">💡</span>
                {rec}
              </li>
            ))}
            {metrics.recommendations.length > 2 && (
              <li className="text-blue-600 italic">
                +{metrics.recommendations.length - 2} more recommendations
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export function PerformanceIndicator({ config, className = "" }: { config: PerformanceConfig; className?: string }) {
  const analysis = ExportPerformanceMonitor.analyzeConfig(config);

  return (
    <div className={`performance-indicator ${className}`}>
      <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getPerformanceBadgeColor(analysis.severity)}`}>
        {analysis.severity.toUpperCase()}
      </div>
      {analysis.warnings.length > 0 && (
        <span className="ml-2 text-xs text-amber-600">
          {analysis.warnings.length} warning{analysis.warnings.length !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}