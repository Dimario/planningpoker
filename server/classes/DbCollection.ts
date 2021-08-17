import { Collection } from "mongodb";

export class DbCollection {
  public collection: Collection;

  constructor(collection: Collection) {
    this.collection = collection;
  }

  public async drop() {
    await this.collection.deleteMany({});
  }
}
