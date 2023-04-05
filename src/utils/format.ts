const specialChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
const regex = new RegExp(specialChars.map(char => '\\' + char).join('|'), 'gm');

export function escapeReponse(message: string|number) {
  return String(message).replace(regex, '\\$&');
}

export function capitalize(str: string) {
  return str[0].toUpperCase() + str.substring(1);
}

