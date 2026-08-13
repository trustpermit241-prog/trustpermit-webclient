export function getCanvasPoint(event, canvas) {
  if (!canvas) return { x: 0, y: 0 };

  const rect = canvas.getBoundingClientRect();
  const clientX = event?.touches?.[0]?.clientX ?? event?.clientX ?? 0;
  const clientY = event?.touches?.[0]?.clientY ?? event?.clientY ?? 0;

  return {
    x: ((clientX - rect.left) / (rect.width || 1)) * canvas.width,
    y: ((clientY - rect.top) / (rect.height || 1)) * canvas.height,
  };
}
