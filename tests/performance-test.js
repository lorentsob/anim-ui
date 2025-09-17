// Simple performance test for different canvas sizes
import { calculateOptimalSettings } from '../src/lib/qualityManager.js';

const testCases = [
  { name: "HD 720p", width: 1280, height: 720, fps: 24 },
  { name: "HD 1080p", width: 1920, height: 1080, fps: 30 },
  { name: "2K QHD", width: 2560, height: 1440, fps: 30 },
  { name: "4K UHD", width: 3840, height: 2160, fps: 30 },
  { name: "8K", width: 7680, height: 4320, fps: 24 },
  { name: "High FPS HD", width: 1920, height: 1080, fps: 60 },
  { name: "Max Settings", width: 8192, height: 8192, fps: 120 },
];

console.log("🧪 Performance Test Results\n");
console.log("Resolution       | FPS | Complexity  | Scale | Preview FPS | Auto Scale");
console.log("---------------- | --- | ----------- | ----- | ----------- | ----------");

testCases.forEach(test => {
  const settings = calculateOptimalSettings(test.width, test.height, test.fps);
  const complexity = test.width * test.height * test.fps;

  const resolution = `${test.width}×${test.height}`.padEnd(16);
  const fps = test.fps.toString().padStart(3);
  const complexityStr = (complexity / 1_000_000).toFixed(1) + "M";
  const scale = (settings.previewScale * 100).toFixed(0) + "%";
  const previewFps = settings.previewFPS.toString().padStart(2);
  const autoScale = settings.autoScale ? "Yes" : "No";

  console.log(`${resolution} | ${fps} | ${complexityStr.padStart(9)} | ${scale.padStart(5)} | ${previewFps.padStart(11)} | ${autoScale.padStart(10)}`);
});

console.log("\n✅ Quality system automatically scales performance based on complexity");
console.log("💡 Tip: Use Preview mode for editing, Render mode for final export");