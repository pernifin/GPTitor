const specialChars = ['*', '[', ']', '(', ')', '+', '|', '{', '}', '.'].map((char) => `\\${char}`)
const regularChars = ['_', '~', '(?<!`)`(?!`)', '>', '#', '-', '=', '!'].join('|');
const regex = new RegExp(specialChars.concat(regularChars).join('|'), 'gm');

export function escapeReponse(message: string|number) {
  return String(message).replace(regex, '\\$&');
}

export function capitalize(str: string) {
  return str[0].toUpperCase() + str.substring(1);
}

export function getCleanMessage(msg: string) {
  return msg.replace(/(^|\s)([/@]\w+(?=\s|\/|@|$))+/gm, '');
}
