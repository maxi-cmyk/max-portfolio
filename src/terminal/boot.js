// The start screen, "the card wakes the desk": the card that was just tapped
// lies on the desk, a field spreads from its coil, then it grows into the About
// window while the desktop builds around it. These are its frames and timings;
// components/boot.js plays them. Pure: no DOM.

export function getTypingFrames(text) {
  return Array.from(text, (_, index) => text.slice(0, index + 1));
}

// Each frame starts `at` ms in and shows one line under the card.
export function getBootFrames() {
  return [
    { id: "tap", at: 0, line: "$ tap --card" },
    { id: "field", at: 170, line: "13.56 MHz · field found" },
    // The line clears as the desktop builds, so it never sits over the icons.
    { id: "wake", at: 410, line: "" },
    { id: "done", at: 730, line: "" },
  ];
}

export function getBootTiming() {
  return {
    typingDelay: 9, // per character of a line
    grow: 280, // the card growing into the window's frame
    fadeOut: 140, // the start layer fading once the frame has landed
    fallback: 3000, // the desktop shows by then whatever happens
  };
}

// What a screen reader hears instead of the typed lines.
export const BOOT_ANNOUNCEMENT = "Starting Max Leong's portfolio";
