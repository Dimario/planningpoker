import mitt from "mitt";
// @ts-ignore
const emitter = new mitt();

export default {
  $on: (event: string, callback: Function | void): void => {
    emitter.on(event, callback);
  },
  $off: (event: string, callback: Function | void): void =>
    emitter.off(event, callback),
  $emit: (event: string, data?: any): void => {
    emitter.emit(event, data);
  },
};
