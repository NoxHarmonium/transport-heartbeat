
import { TickCallbackFn } from './type_defs'

export default class TimeController {

  private tickCallbacks: Array<TickCallbackFn>;
  private started: boolean = false;
  private currentTime: Date;
  private rate: number;
  private lastTickTime: number;
  private animationFrameId: number = 0;

  constructor() {
    this.tickCallbacks = []
    this.reset()
  }

  reset() {
    this.started = false
    this.currentTime = new Date(2017, 0, 20, 4, 59);
    this.rate = 60 * 5; // Seconds per second
  }

  start() {
    this.started = true
    window.requestAnimationFrame(this.tick.bind(this));
  }

  stop() {
    this.started = false
    window.cancelAnimationFrame(this.animationFrameId)
  }

  tick(time: number) {
    if (this.lastTickTime) {
      const delta = (time - this.lastTickTime) * this.rate
      this.currentTime = new Date(this.currentTime.getTime() + delta)
    }
    if (this.tickCallbacks.length > 0) {
      this.tickCallbacks.forEach((callback: TickCallbackFn) => callback(this.currentTime));
    }
    if (this.started) {
      this.animationFrameId = window.requestAnimationFrame(this.tick.bind(this));
    }
    this.lastTickTime = time;
  }

  registerCallback(callback: TickCallbackFn) {
    this.tickCallbacks.push(callback)
  }

}
