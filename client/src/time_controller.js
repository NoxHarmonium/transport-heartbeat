
export default class TimeController {

  constructor() {
    this.tickCallbacks = []
    this.reset()
  }

  reset() {
    this.started = false
    this.currentTime = new Date(2017, 0, 20, 3, 45);
    this.rate = 60 * 5; // Seconds per second
  }

  start() {
    this.started = true
    this.tick()
  }

  stop() {
    this.started = false
    window.cancelAnimationFrame()
  }

  tick(time) {
    if (this.lastTickTime) {
      const delta = (time - this.lastTickTime) * this.rate
      this.currentTime = new Date(this.currentTime.getTime() + delta)
    }
    if (this.tickCallbacks.length > 0) {
      this.tickCallbacks.forEach((callback) => callback(this.currentTime));
    }
    if (this.started) {
      window.requestAnimationFrame(this.tick.bind(this));
    }
    this.lastTickTime = time
  }

}
