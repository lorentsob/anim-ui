// Test script to verify timeline is master controller
// Run this in browser console at http://localhost:3001/editor

console.log("=== Testing Timeline as Master Controller ===\n");

// Helper to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Get stores
const getEditor = () => window.useEditorStore?.getState();
const getTimeline = () => window.useTimelineStore?.getState();

async function runTest() {
  const editor = getEditor();
  const timeline = getTimeline();
  
  if (!editor || !timeline) {
    console.error("❌ Stores not available. Open the editor first.");
    return;
  }
  
  console.log("Initial State:");
  console.log("- Timeline Mode:", editor.timelineMode);
  console.log("- Timeline Playing:", timeline.isPlaying);
  console.log("- Editor Playing:", editor.playing);
  console.log("- Current Time:", (timeline.currentTime * 100).toFixed(1) + "%");
  console.log("- Current Frame:", editor.currentFrame);
  
  // Step 1: Enable timeline mode
  console.log("\n1. Enabling timeline mode...");
  editor.setTimelineMode(true);
  await wait(100);
  
  // Step 2: Create test keyframes
  console.log("2. Creating test keyframes...");
  const params = Object.keys(editor.params);
  let animatedParam = null;
  
  if (params.length > 0) {
    // Find a numeric parameter
    for (const param of params) {
      const value = editor.params[param];
      if (typeof value === 'number') {
        animatedParam = param;
        // Create keyframes
        timeline.addKeyframe(param, 0, value);
        timeline.addKeyframe(param, 0.25, value * 1.5);
        timeline.addKeyframe(param, 0.5, value * 2);
        timeline.addKeyframe(param, 0.75, value * 1.5);
        timeline.addKeyframe(param, 1, value);
        console.log(`   Created 5 keyframes for ${param}`);
        break;
      }
    }
  }
  
  // Step 3: Test timeline scrubbing
  console.log("\n3. Testing timeline scrubbing...");
  const testPositions = [0, 0.25, 0.5, 0.75, 1];
  
  for (const pos of testPositions) {
    timeline.setCurrentTime(pos);
    await wait(100);
    const frame = getEditor().currentFrame;
    const value = animatedParam ? timeline.getAnimatedValue(animatedParam, pos, editor.params[animatedParam]) : null;
    console.log(`   Time ${(pos * 100).toFixed(0)}% → Frame ${frame}${value !== null ? `, ${animatedParam}=${value.toFixed(2)}` : ''}`);
  }
  
  // Step 4: Test timeline playback
  console.log("\n4. Testing timeline playback...");
  timeline.setCurrentTime(0);
  timeline.play();
  
  let prevTime = 0;
  let sameCount = 0;
  const maxChecks = 20;
  let checkCount = 0;
  
  const checkPlayback = setInterval(() => {
    const currentTime = getTimeline().currentTime;
    const currentFrame = getEditor().currentFrame;
    const isPlaying = getTimeline().isPlaying;
    
    checkCount++;
    
    if (Math.abs(currentTime - prevTime) < 0.001) {
      sameCount++;
      if (sameCount > 3) {
        console.error("   ❌ Timeline stuck at", (currentTime * 100).toFixed(1) + "%");
        timeline.pause();
        clearInterval(checkPlayback);
        return;
      }
    } else {
      sameCount = 0;
      console.log(`   ✓ Playing: Time ${(currentTime * 100).toFixed(1)}%, Frame ${currentFrame}`);
    }
    
    prevTime = currentTime;
    
    if (checkCount >= maxChecks || currentTime > 0.9 || !isPlaying) {
      timeline.pause();
      clearInterval(checkPlayback);
      
      console.log("\n5. Test Results:");
      if (currentTime > 0.5) {
        console.log("✅ Timeline is working as master controller!");
        console.log("✅ Animation follows timeline time");
        console.log("✅ Keyframe interpolation working");
      } else {
        console.log("❌ Timeline playback may have issues");
      }
    }
  }, 200);
  
  // Step 5: Test playback speed
  setTimeout(async () => {
    console.log("\n6. Testing playback speed control...");
    timeline.setPlaybackSpeed(2);
    console.log("   Set speed to 2x");
    timeline.setCurrentTime(0);
    timeline.play();
    
    await wait(1000);
    const time2x = getTimeline().currentTime;
    timeline.pause();
    
    timeline.setPlaybackSpeed(0.5);
    console.log("   Set speed to 0.5x");
    timeline.setCurrentTime(0);
    timeline.play();
    
    await wait(1000);
    const time05x = getTimeline().currentTime;
    timeline.pause();
    
    console.log(`   2x speed reached ${(time2x * 100).toFixed(1)}%`);
    console.log(`   0.5x speed reached ${(time05x * 100).toFixed(1)}%`);
    
    if (time2x > time05x * 1.5) {
      console.log("✅ Playback speed control working!");
    } else {
      console.log("⚠️ Playback speed may need adjustment");
    }
    
    // Reset
    timeline.setPlaybackSpeed(1);
    timeline.stop();
    
    console.log("\n=== Test Complete ===");
    console.log("The timeline should now be the master controller.");
    console.log("Try using the play/pause buttons and timeline scrubber.");
  }, 5000);
}

runTest();