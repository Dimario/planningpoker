//TODO: продумать как можно наказывать за изменение LocalStorage или обновлять сразу имя?
export default class LS {
  constructor() {
    window.onstorage = () => {
      console.log("WOO");
    };
  }
}
