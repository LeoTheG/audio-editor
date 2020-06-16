import faker from "faker";

export const generatePhrase = (count = 10) => {
  return new Array(count)
    .fill()
    .map((_) => faker.random.word())
    .join(" ");
};
