export function triggerPrint(): void {
  if (typeof window !== "undefined") {
    window.print();
  }
}

export function exportPdfThroughBrowser(): void {
  if (typeof window !== "undefined") {
    // Uses native high-fidelity print-to-PDF pipeline
    window.print();
  }
}