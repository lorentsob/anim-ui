// Test script to verify timeline moves with viewport animation
// Run this in the browser console at http://localhost:3001/editor

console.log("=== Testing Timeline Sync with Animation ===");

// Get store functions
const getEditorState = () => window.useEditorStore?.getState();
const getTimelineState = () => window.useTimelineStore?.getState();

if (!getEditorState || !getTimelineState) {
  console.error("Stores not available. Make sure you're on the editor page.");
} else {
  const editor = getEditorState();
  const timeline = getTimelineState();
  
  console.log("\nInitial State:");
  console.log("- Timeline Mode:", editor.timelineMode);
  console.log("- Playing:", editor.playing);
  console.log("- Current Frame:", editor.currentFrame);
  console.log("- Timeline Time:", (timeline.currentTime * 100).toFixed(1) + "%");
  
  // Enable timeline mode
  console.log("\n1. Enabling timeline mode...");
  editor.setTimelineMode(true);
  
  // Add test keyframes if needed
  if (Object.keys(timeline.timelines).length === 0) {
    console.log("2. Adding test keyframes...");
    const params = Object.keys(editor.params);
    if (params.length > 0) {
      const param = params[0];
      const value = editor.params[param];
      if (typeof value === 'number') {
        timeline.addKeyframe(param, 0, value);
        timeline.addKeyframe(param, 0.5, value * 2);
        timeline.addKeyframe(param, 1, value);
        console.log(`   Added 3 keyframes for ${param}`);
      }
    }
  }
  
  // Start playback
  console.log("3. Starting playback...");
  editor.setPlaying(true);
  
  // Monitor timeline position
  let lastTime = -1;
  let sameCount = 0;
  const checkInterval = setInterval(() => {
    const currentTime = getTimelineState().currentTime;
    const currentFrame = getEditorState().currentFrame;
    const playing = getEditorState().playing;
    
    if (currentTime === lastTime) {
      sameCount++;
      if (sameCount > 5) {
        console.error("❌ TIMELINE NOT MOVING! Stuck at", (currentTime * 100).toFixed(1) + "%");
        clearInterval(checkInterval);
        editor.setPlaying(false);
        return;
      }
    } else {
      sameCount = 0;
      console.log(`✓ Timeline: ${(currentTime * 100).toFixed(1)}%, Frame: ${currentFrame}, Playing: ${playing}`);
    }
    
    lastTime = currentTime;
    
    // Stop after a full loop
    if (currentTime > 0.95 || !playing) {
      clearInterval(checkInterval);
      editor.setPlaying(false);
      console.log("\n4. Test complete!");
      console.log(currentTime > 0.95 ? "✓ Timeline moved with animation!" : "❌ Timeline did not move properly");
    }
  }, 200); // Check every 200ms
  
  // Safety timeout
  setTimeout(() => {
    clearInterval(checkInterval);
    editor.setPlaying(false);
    console.log("\nTest timed out after 10 seconds");
  }, 10000);
}