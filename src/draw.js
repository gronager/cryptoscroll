function saw(x, p) {
  return (x % p) / p;
}

function sin(x, p) {
  return Math.sin(x / p);
}

function tri(x, p) {
  return p - Math.abs((x % (2 * p)) - p);
}

function sqr(x, p) {
  return x++ % (p * 2) < p ? p : 0;
}

export function once({
  context,
  context: {
    canvas: { width, height }
  }
}) {
  context.fillStyle = "rgb(0, 0, 0)";
  context.fillRect(0, 0, width, height);
}

export function draw({
  frame,
  context,
  context: {
    canvas,
    canvas: { width, height }
  },
  delta,
  absoluteDelta,
  timestamp
}) {
  context.fillStyle = "rgb(255, 255, 255)";
  context.save();
  context.fillStyle = "rgba(0,0,0,0.2)";
  context.fillRect(0, 0, width, height);
  context.restore();

  const lfoSin = 1 + sin(timestamp, height / 2);
  const lfoSaw = saw(timestamp, width);
  const lfoTriW = tri(timestamp, width);
  const lfoTriH = tri(timestamp, height);
  const lfoSqr = sqr(timestamp / 140, 1);

  const x = lfoSaw;
  const y = lfoSin;
  const value = Math.pow(width, x);

  context.beginPath();
  context.arc(value, height - (height * y) / 2, 10 * x, 0, Math.PI * 2);
  context.fill();

  context.beginPath();
  context.arc(lfoTriW, lfoTriH, 10 * lfoSqr, 0, Math.PI * 2);
  context.fill();

  context.save();
  const textX = 2 * (width / 100);
  const textY = 4 * (height / 100);

  context.font = "16px monospace";

  const text = [
    `delta          ${delta}`,
    `absoluteDelta  ${absoluteDelta}`,
    `timestamp      ${timestamp}`,
    `frame          ${frame}`
  ];

  const textWidth = Math.max(
    ...text.map((string) => context.measureText(string).width)
  );
  context.fillStyle = "#000";
  context.fillRect(textX, textY - 16, textWidth, 16 * text.length);

  context.fillStyle = "#fff";
  for (let i = 0; i < text.length; i += 1) {
    context.fillText(text[i], textX, textY + 16 * i);
  }
}
