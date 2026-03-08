"use client";

import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { BlogChessBoard } from "@/components/blog-chess-board";

/* eslint-disable @typescript-eslint/no-explicit-any */
const customComponents: Components & Record<string, any> = {
  // Map <chess-position> custom HTML elements to our interactive board
  "chess-position": ({ node, ...props }: any) => {
    const attrs = node?.properties ?? props;
    const fen = attrs.fen ?? attrs.dataFen ?? "";
    const moves = attrs.moves ?? attrs.dataMoves ?? "";
    const orientation =
      attrs.orientation ?? attrs.dataOrientation ?? "white";
    const caption = attrs.caption ?? attrs.dataCaption ?? "";
    if (!fen) return null;
    return (
      <BlogChessBoard
        fen={fen}
        moves={moves || undefined}
        orientation={orientation as "white" | "black"}
        caption={caption || undefined}
      />
    );
  },
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={customComponents}
    >
      {content}
    </ReactMarkdown>
  );
}
