//TODO: продумать как можно наказывать за изменение LocalStorage
export default class LS {
  constructor() {
    window.onstorage = () => {
      console.log("WOO");
    };
  }
}
