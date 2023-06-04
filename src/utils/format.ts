// const specialChars = ['*', '[', ']', '(', ')', '+', '|', '{', '}', '.', '\\'].map((char) => `\\${char}`)
// const regularChars = ['_', '~', '>', '#', '-', '=', '!'];
// const regex = new RegExp(specialChars.concat(regularChars).join('|'), 'gm');

const allowedTags = ['code', 'pre', 'b'].join('|');
const tagsRegex = new RegExp(`<(?!/?(${allowedTags})\\b)|(?<!${allowedTags})>|&`, 'gm');
const tagReplacers = {
  '<': '&lt;',
  '</': '&lt;/',
  '>': '&gt;',
  '&': '&amp;'
};

export function escape(text: string) {
  return text
    .replace(/```(?:\w+\n)?(.+?)\n?```/gs, "<pre>$1</pre>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(tagsRegex, (match) => tagReplacers[match as keyof typeof tagReplacers]);
}