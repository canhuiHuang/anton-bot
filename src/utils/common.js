// ["hello", "world", "yes"] --> "hello, world, yes"
const getStringFromArrayObj = (array, key, separator = ",") => {
  let result = "";
  array.forEach((obj, idx) => {
    result += obj[key] + (idx < array.length - 1 ? `${separator} ` : "");
  });
  return result;
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
const divideArrayIntoBlocks = (array, divisions) => {
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
  return divideArrayIntoBlocks(shuffleArray(array), divisions);
};

module.exports = {
  getStringFromArrayObj,
  shuffleArray,
  divideArrayIntoBlocks,
  getRandomizedTeams,
};
