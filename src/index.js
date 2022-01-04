/*
  In draw.js, export a function named draw to be called per frame
  and a function named once, to be called on start-up.

  Respects the viewport dimensions and device pixel ratio.

  Doesn't bug out on broken code in the rAF loop.

  Don't need to modify this file unless you wanna get more complex.
*/

import "./styles.css";
import { draw, once } from "./draw";

const canvas = document.createElement("canvas");
const context = canvas.getContext("2d");

document.body.appendChild(canvas);

const invertOfAbsoluteDeltaAt60FPS = 60 / 1000;

let dpr = window.devicePixelRatio;
let rAF = -1;
let lastTimestamp = 0;
let frame = 0;
let timeDelta = 0;
let absoluteDelta = invertOfAbsoluteDeltaAt60FPS;

function resize() {
  dpr = window.devicePixelRatio;

  const WIDTH = window.innerWidth;
  const HEIGHT = window.innerHeight;

  cancelAnimationFrame(rAF);
  once({ frame, delta: timeDelta, absoluteDelta, context, dpr });
  rAF = requestAnimationFrame(loop);

  canvas.width = WIDTH * dpr;
  canvas.height = HEIGHT * dpr;
  canvas.style.width = `${WIDTH}px`;
  canvas.style.height = `${HEIGHT}px`;
}

resize();
window.addEventListener("resize", resize);

function loop() {
  rAF = requestAnimationFrame(loop);
  frame++;

  const currentTimestamp = performance.now();
  absoluteDelta = currentTimestamp - lastTimestamp;
  lastTimestamp = currentTimestamp;
  timeDelta = absoluteDelta * invertOfAbsoluteDeltaAt60FPS;

  try {
    draw({
      frame,
      absoluteDelta,
      delta: timeDelta,
      timestamp: currentTimestamp,
      context,
      dpr
    });
  } catch (e) {
    cancelAnimationFrame(rAF);
    throw new Error(e.message);
  }
}

function cleanUp() {
  cancelAnimationFrame(rAF);
  window.removeEventListener("resize", resize);
  canvas.remove();
}

window.addEventListener("beforeunload", () => {
  cleanUp();
});

if (module.hot) {
  module.hot.dispose(cleanUp);
}

rAF = requestAnimationFrame(loop);
