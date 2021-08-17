import { UserId } from "./iuser";

export interface IEnter {
  id: UserId;
  key: string;
  name: string;
  balance?: number | string;
}
