/**
 * Compatibility checker component for cross-platform QA
 * Displays browser compatibility and provides user guidance
 */

import { useState, useEffect } from "react";
import { platformDetector, getCompatibilityBadgeColor, formatBrowserInfo, getRecommendedSettings } from "../lib/crossPlatformDetection";
import type { CompatibilityReport } from "../lib/crossPlatformDetection";

type CompatibilityCheckerProps = {
  className?: string;
  showDetails?: boolean;
  onCompatibilityChange?: (report: CompatibilityReport) => void;
};

export default function CompatibilityChecker({
  className = "",
  showDetails = false,
  onCompatibilityChange
}: CompatibilityCheckerProps) {
  const [report, setReport] = useState<CompatibilityReport | null>(null);
  const [isExpanded, setIsExpanded] = useState(showDetails);

  useEffect(() => {
    const compatReport = platformDetector.generateCompatibilityReport();
    setReport(compatReport);
    onCompatibilityChange?.(compatReport);
  }, [onCompatibilityChange]);

  if (!report) {
    return (
      <div className={`compatibility-checker loading ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const badgeColor = getCompatibilityBadgeColor(report.overallCompatibility);
  const settings = getRecommendedSettings(report);

  return (
    <div className={`compatibility-checker ${className}`}>
      {/* Compatibility summary */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${badgeColor}`}>
            {report.overallCompatibility.toUpperCase()}
          </div>
          <span className="text-sm text-gray-600">
            {formatBrowserInfo(report.browser)}
          </span>
        </div>

        {(report.limitations.length > 0 || report.recommendations.length > 0) && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
          >
            {isExpanded ? "Hide" : "Show"} Details
            <svg
              className={`w-3 h-3 ml-1 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Export capabilities */}
      <div className="flex space-x-4 mb-3 text-xs">
        <div className="flex items-center">
          <span className="text-gray-500 mr-1">WebM:</span>
          <span className={`font-medium ${
            report.exportCapabilities.webm === "full" ? "text-green-600" :
            report.exportCapabilities.webm === "limited" ? "text-yellow-600" : "text-red-600"
          }`}>
            {report.exportCapabilities.webm}
          </span>
        </div>
        <div className="flex items-center">
          <span className="text-gray-500 mr-1">GIF:</span>
          <span className={`font-medium ${
            report.exportCapabilities.gif === "full" ? "text-green-600" :
            report.exportCapabilities.gif === "limited" ? "text-yellow-600" : "text-red-600"
          }`}>
            {report.exportCapabilities.gif}
          </span>
        </div>
        <div className="flex items-center">
          <span className="text-gray-500 mr-1">PNG:</span>
          <span className={`font-medium ${
            report.exportCapabilities.png === "full" ? "text-green-600" :
            report.exportCapabilities.png === "limited" ? "text-yellow-600" : "text-red-600"
          }`}>
            {report.exportCapabilities.png}
          </span>
        </div>
      </div>

      {/* Detailed information */}
      {isExpanded && (
        <div className="border-t pt-3 space-y-3">
          {/* Recommended settings */}
          <div>
            <h5 className="text-xs font-medium text-gray-700 mb-2">Recommended Settings</h5>
            <div className="bg-blue-50 rounded p-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-blue-600 font-medium">Max Resolution:</span>
                  <div>{settings.maxResolution.width}×{settings.maxResolution.height}</div>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Max FPS:</span>
                  <div>{settings.maxFps}</div>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Max Duration:</span>
                  <div>{settings.maxDuration}s</div>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Best Formats:</span>
                  <div>{settings.preferredFormats.slice(0, 2).join(", ")}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Limitations */}
          {report.limitations.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-amber-600 mb-2">Limitations</h5>
              <ul className="text-xs text-amber-700 space-y-1">
                {report.limitations.map((limitation, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-amber-500 mr-2 mt-0.5">⚠</span>
                    {limitation}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-blue-600 mb-2">Recommendations</h5>
              <ul className="text-xs text-blue-700 space-y-1">
                {report.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-0.5">💡</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Feature support details */}
          <div>
            <h5 className="text-xs font-medium text-gray-700 mb-2">Feature Support</h5>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {Object.entries(report.features).map(([feature, supported]) => (
                <div key={feature} className="flex items-center justify-between">
                  <span className="text-gray-600 capitalize">
                    {feature.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </span>
                  <span className={`${supported ? "text-green-600" : "text-red-600"}`}>
                    {supported ? "✓" : "✗"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function QuickCompatibilityIndicator({ className = "" }: { className?: string }) {
  const [compatibility, setCompatibility] = useState<string>("checking");

  useEffect(() => {
    const report = platformDetector.generateCompatibilityReport();
    setCompatibility(report.overallCompatibility);
  }, []);

  if (compatibility === "checking") {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse mr-2"></div>
        <span className="text-xs text-gray-500">Checking...</span>
      </div>
    );
  }

  const badgeColor = getCompatibilityBadgeColor(compatibility);

  return (
    <div className={`inline-flex items-center ${className}`}>
      <div className={`w-2 h-2 rounded-full mr-2 ${
        compatibility === "excellent" ? "bg-green-500" :
        compatibility === "good" ? "bg-blue-500" :
        compatibility === "limited" ? "bg-yellow-500" : "bg-red-500"
      }`}></div>
      <span className={`text-xs font-medium ${badgeColor.split(' ')[0]}`}>
        {compatibility}
      </span>
    </div>
  );
}

export function CompatibilityWarning({ className = "" }: { className?: string }) {
  const [shouldShow, setShouldShow] = useState(false);
  const [report, setReport] = useState<CompatibilityReport | null>(null);

  useEffect(() => {
    const compatReport = platformDetector.generateCompatibilityReport();
    setReport(compatReport);

    // Show warning for poor or limited compatibility
    setShouldShow(
      compatReport.overallCompatibility === "poor" ||
      compatReport.overallCompatibility === "limited" ||
      compatReport.limitations.length > 2
    );
  }, []);

  if (!shouldShow || !report) return null;

  return (
    <div className={`compatibility-warning ${className}`}>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-amber-800">
              Browser Compatibility Notice
            </h3>
            <p className="mt-1 text-sm text-amber-700">
              Your browser has {report.overallCompatibility} compatibility.
              Some features may be limited or unavailable.
            </p>
            {report.limitations.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-amber-600 font-medium mb-1">Main limitations:</p>
                <ul className="text-xs text-amber-600 list-disc list-inside">
                  {report.limitations.slice(0, 3).map((limitation, index) => (
                    <li key={index}>{limitation}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}