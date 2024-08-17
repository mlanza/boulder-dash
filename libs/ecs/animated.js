export function Animated(callback, throttle, startTime, lastTime, ticks){
  this.callback = callback;
  this.throttle = throttle;
  this.startTime = startTime;
  this.lastTime = lastTime;
  this.ticks = ticks;
}

export function animated(callback, throttle, startTime = 0, lastTime = 0, ticks = 0){
  return new Animated(callback, throttle, startTime, lastTime, ticks);
}

export function play(animated){
  let {callback, throttle, startTime, lastTime, ticks, rafId} = animated;
  function tick(time) {
    if (!startTime) {
      startTime = time;
    }

    const elapsed = time - startTime;

    if (elapsed - lastTime >= throttle) {
      const delta = Math.round((elapsed - lastTime) * 100) / 100;
      callback({ time, ticks, delta });
      lastTime = elapsed - (elapsed % throttle);
      const paused = animated.paused === animated.ticks;
      ticks++;
      animated.ticks = ticks;
      if (paused){
        return;
      }
    }

    animated.rafId = requestAnimationFrame(tick);

  }
  animated.rafId = requestAnimationFrame(tick);
}

export function pause(animated){
  if (animated.rafId) {
    cancelAnimationFrame(animated.rafId);
    animated.paused = animated.ticks;
  }
}
