// Test script to verify timeline animation functionality
// Run this in the browser console while on http://localhost:3000/editor

console.log("Testing Timeline Animation System...");

// Get the stores
const { useEditorStore, useTimelineStore, useBlendingStore } = window;

if (!useEditorStore || !useTimelineStore) {
  console.error("Stores not available. Make sure you're on the editor page.");
} else {
  // Get store states
  const editorState = useEditorStore.getState();
  const timelineState = useTimelineStore.getState();
  const blendingState = useBlendingStore ? useBlendingStore.getState() : null;
  
  console.log("\n=== Current State ===");
  console.log("Timeline Mode:", editorState.timelineMode);
  console.log("Playing:", editorState.playing);
  console.log("Current Effect:", editorState.effectId);
  console.log("Blending Enabled:", blendingState?.blendingEnabled);
  console.log("Timeline Current Time:", timelineState.currentTime);
  console.log("Keyframes:", Object.keys(timelineState.timelines).length > 0 ? 
    "Yes" : "No");
  
  if (Object.keys(timelineState.timelines).length > 0) {
    console.log("\n=== Keyframes by Parameter ===");
    Object.entries(timelineState.timelines).forEach(([param, timeline]) => {
      console.log(`${param}: ${timeline.keyframes.length} keyframes`);
    });
  }
  
  console.log("\n=== Testing Timeline Animation ===");
  
  // Enable timeline mode
  console.log("1. Enabling timeline mode...");
  editorState.setTimelineMode(true);
  
  // Add some test keyframes if none exist
  if (Object.keys(timelineState.timelines).length === 0) {
    console.log("2. Adding test keyframes...");
    const params = Object.keys(editorState.params);
    if (params.length > 0) {
      const firstParam = params[0];
      const value = editorState.params[firstParam];
      
      if (typeof value === 'number') {
        // Add keyframes at 0%, 50%, and 100%
        timelineState.addKeyframe(firstParam, 0, value);
        timelineState.addKeyframe(firstParam, 0.5, value * 2);
        timelineState.addKeyframe(firstParam, 1, value);
        console.log(`   Added keyframes for ${firstParam}`);
      }
    }
  }
  
  // Test scrubbing
  console.log("3. Testing timeline scrubbing...");
  [0, 0.25, 0.5, 0.75, 1].forEach(time => {
    timelineState.setCurrentTime(time);
    console.log(`   Time ${(time * 100).toFixed(0)}%: Frame ${editorState.currentFrame}`);
  });
  
  // Test playback
  console.log("4. Testing playback...");
  editorState.setPlaying(true);
  setTimeout(() => {
    console.log("   After 2 seconds, frame:", editorState.currentFrame);
    editorState.setPlaying(false);
  }, 2000);
  
  console.log("\n=== Test Complete ===");
  console.log("Check if animation appears in viewport when scrubbing timeline.");
}