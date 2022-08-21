// ["hello", "world", "yes"] --> "hello, world, yes"
const getStringFromArrayObj = (array, key, separator = ",") => {
  let result = "";
  array.forEach((obj, idx) => {
    result += obj[key] + (idx < array.length - 1 ? `${separator} ` : "");
  });
  return result;
};

// "ramon,  sapo , ,, eli, sandia lopez , sarah" --> [ramon, sapo, eli, sandia lopez, sarah]
const accurateSplit = (text, separator = ",") => {
  const splitRegex = new RegExp(`\\s*${separator}\\s*`, "g");
  const list = text.split(splitRegex);
  return list.filter((item) => item !== "");
};

// [1,2,3,4,5,6] --> [3,6,1,2,5,4]
const shuffleArray = (array) => {
  const results = [];
  const stack = [...array];

  while (stack.length > 0) {
    const randomIndex = Math.floor(Math.random() * stack.length);
    results.push(stack[randomIndex]);
    stack.splice(randomIndex, 1);
  }
  return results;
};

// [3,6,1,2,5,4] --> [[3,6,1], [2,5,4]]
const divideArray = (array, divisions) => {
  const stack = [...array];
  const blockSize = Math.floor(stack.length / divisions);
  let remaining =
    stack.length % (Math.floor(stack.length / divisions) * divisions);

  const newDivisiones = [];
  for (let j = 0; j < divisions; j++) {
    const block = [];
    for (let i = 0; i < blockSize; i++) {
      block.push(stack.pop());
    }
    if (remaining > 0) {
      block.push(stack.pop());

      remaining--;
    }

    newDivisiones.push(block);
  }
  return newDivisiones;
};

// [1,2,3,4,5,6] --> [[3,6,1], [2,5,4]]
const getRandomizedTeams = (array, divisions = 2) => {
  return divideArray(shuffleArray(array), divisions);
};

module.exports = {
  getStringFromArrayObj,
  accurateSplit,
  shuffleArray,
  divideArray,
  getRandomizedTeams,
};
