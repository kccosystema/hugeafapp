// Reserves space for the device's real status bar / notch (via safe-area inset).
// No faux time/battery — that's drawn by the OS on a real device.
export default function StatusBar() {
  return <div className="status-spacer" aria-hidden="true" />
}
