module.exports = async function throwError(input) {
  throw new Error(`simple error ${input.value.toFixed(2)}`);
}