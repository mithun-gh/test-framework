function get(target, prop, receiver) {
  console.log("GET:", target, prop);
  return Reflect.get(target, prop, receiver);
}

export default { get };
