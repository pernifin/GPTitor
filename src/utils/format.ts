const regex = new RegExp("[-_~>#=.!*+|(){}[\\]]", "g");

export function escapeText(message: string) {
  return message.replace(regex, "\\$&");
}

export function formatCode(code: string) {
  return "```" + code.replace(/[`\\]/g, "\\$&").trimEnd() + "\n```";
}

export default function format(text: string, chunkSize = 4000) {
  const chunks: string[] = [];

  while (text.length) {
    const blocks = text.substring(0, chunkSize).split("```");

    if (text.length > chunkSize) {
      const lastBlock = blocks[blocks.length - 1];
      const delimeters = blocks.length % 2 ? ["\n\n", "\n", "."] : ["\n\n", "\n"];
      const position = delimeters
        .map((delimeter) => lastBlock.lastIndexOf(delimeter))
        .find((indexOf) => indexOf > 0);
  
      if (position) {
        blocks[blocks.length - 1] = lastBlock.substring(0, position + 1);
      }
    }

    text = (blocks.length % 2 ? "" : "```" ) + text.substring(blocks.join("```").length);

    const chunk = blocks
      .map((block, index) => index % 2 && block ? formatCode(block) : escapeText(block))
      .filter(Boolean)
      .join("")
      .trim();

    // If after formatting we got longer than allowed, let's try again
    chunks.push(...(chunk.length > chunkSize ? format(chunk) : [chunk]));
  }

  return chunks;
}
