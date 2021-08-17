import mitt, { Emitter } from "mitt";
import { EventType, Handler } from "mitt/src/index";

//@ts-ignore
const emitter: Emitter = mitt();

export default {
  $on: (event: EventType, callback: Handler): void => {
    emitter.on(event, callback);
  },
  $off: (event: EventType, callback: Handler): void =>
    emitter.off(event, callback),
  $emit: (event: EventType, data?: any): void => {
    emitter.emit(event, data);
  },
};
