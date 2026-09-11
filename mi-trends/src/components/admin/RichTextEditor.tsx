"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  label?: string;
  placeholder?: string;
}

export function RichTextEditor({
  value,
  onChange,
  label = "Description",
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose-mitrends min-h-48 w-full px-4 py-4 text-body-sm leading-relaxed text-ink outline-none " +
          "[&_h2]:mt-4 [&_h2]:font-serif [&_h2]:text-xl [&_h3]:mt-3 [&_h3]:font-medium " +
          "[&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 " +
          "[&_blockquote]:border-l-2 [&_blockquote]:border-hairline [&_blockquote]:pl-4 [&_blockquote]:text-muted " +
          "[&_a]:text-accent [&_a]:underline",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Keep the editor in sync when the form resets or loads a different product.
  useEffect(() => {
    if (editor && !editor.isDestroyed && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
    // Intentionally keyed on `value` only — re-running on `editor` identity
    // would fight the user's own typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) {
    return (
      <div>
        <span className="label-caps">{label}</span>
        <div className="mt-3 h-64 animate-pulse rounded-sm border border-ink/12 bg-cream/50" />
      </div>
    );
  }

  const buttons = [
    {
      Icon: Bold,
      label: "Bold",
      action: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive("bold"),
    },
    {
      Icon: Italic,
      label: "Italic",
      action: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive("italic"),
    },
    {
      Icon: Strikethrough,
      label: "Strikethrough",
      action: () => editor.chain().focus().toggleStrike().run(),
      active: editor.isActive("strike"),
    },
    {
      Icon: Heading2,
      label: "Heading",
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive("heading", { level: 2 }),
    },
    {
      Icon: List,
      label: "Bullet list",
      action: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive("bulletList"),
    },
    {
      Icon: ListOrdered,
      label: "Numbered list",
      action: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive("orderedList"),
    },
    {
      Icon: Quote,
      label: "Quote",
      action: () => editor.chain().focus().toggleBlockquote().run(),
      active: editor.isActive("blockquote"),
    },
    {
      Icon: Link2,
      label: "Link",
      action: () => {
        const previous = editor.getAttributes("link").href as string | undefined;
        const url = window.prompt("Link URL", previous ?? "https://");
        if (url === null) return;
        if (url === "") {
          editor.chain().focus().extendMarkRange("link").unsetLink().run();
          return;
        }
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
      },
      active: editor.isActive("link"),
    },
  ];

  return (
    <div>
      <span className="label-caps">{label}</span>

      <div className="mt-3 overflow-hidden rounded-sm border border-ink/12 bg-white focus-within:border-accent">
        <div className="flex flex-wrap items-center gap-0.5 border-b border-hairline bg-cream/40 p-1.5">
          {buttons.map(({ Icon, label: title, action, active }) => (
            <button
              key={title}
              type="button"
              onClick={action}
              title={title}
              aria-label={title}
              aria-pressed={active}
              className={cn(
                "cursor-pointer rounded-sm p-2 transition-colors",
                active ? "bg-ink text-white" : "text-muted hover:bg-ink/5 hover:text-ink",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </button>
          ))}

          <span className="mx-1 h-5 w-px bg-hairline" />

          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
            aria-label="Undo"
            className="cursor-pointer rounded-sm p-2 text-muted transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-30"
          >
            <Undo2 className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
            aria-label="Redo"
            className="cursor-pointer rounded-sm p-2 text-muted transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-30"
          >
            <Redo2 className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
