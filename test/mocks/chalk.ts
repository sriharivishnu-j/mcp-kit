const passthrough = (value: string): string => value;

const chalk = {
  cyan: passthrough,
  green: passthrough,
  yellow: passthrough,
  red: passthrough,
  blue: passthrough,
  gray: passthrough,
  bold: passthrough,
  bgGray: { white: passthrough }
};

export default chalk;
