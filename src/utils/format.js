const specialChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
const regex = new RegExp(specialChars.map(char => '\\' + char).join('|'), 'gm');

export function escapeReponse(message) {
  return String(message).replace(regex, '\\$&');
}

