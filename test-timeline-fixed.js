// Test to verify timeline fixes
// Run in browser console at http://localhost:3001/editor

console.log("=== Testing Timeline Fixes ===\n");

const editor = window.useEditorStore?.getState();
const timeline = window.useTimelineStore?.getState();

if (!editor || !timeline) {
  console.error("Stores not found. Open the editor first.");
} else {
  // 1. Check basic functionality
  console.log("1. Basic State:");
  console.log("   Timeline Mode:", editor.timelineMode);
  console.log("   Playing:", editor.playing); 
  console.log("   Current Time:", (timeline.currentTime * 100).toFixed(1) + "%");
  
  // 2. Enable timeline mode
  console.log("\n2. Enabling timeline mode...");
  editor.setTimelineMode(true);
  
  // 3. Test adding keyframes
  console.log("3. Adding test keyframes...");
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
  
  // 4. Test scrubbing
  console.log("\n4. Testing timeline scrubbing...");
  timeline.setCurrentTime(0.5);
  console.log("   Set time to 50%");
  
  // 5. Test playback
  console.log("\n5. Testing playback...");
  editor.setPlaying(true);
  console.log("   Started playing");
  
  setTimeout(() => {
    console.log("   Current time after 2s:", (timeline.currentTime * 100).toFixed(1) + "%");
    editor.setPlaying(false);
    
    console.log("\n✅ Timeline Test Complete!");
    console.log("Timeline should now:");
    console.log("- Move when animation plays");
    console.log("- Allow parameter editing with keyframes"); 
    console.log("- Have simplified single-view UI");
    console.log("- Be positioned closer to viewport");
  }, 2000);
}