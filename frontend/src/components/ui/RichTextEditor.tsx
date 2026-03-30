import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useCallback, useState } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Unlink,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  /** Use a simpler toolbar (fewer options) */
  minimal?: boolean;
}

// ── Toolbar button ──

function ToolbarBtn({
  active,
  disabled,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={cn(
        "inline-flex items-center justify-center rounded p-1.5 text-sm transition-colors",
        "hover:bg-muted disabled:opacity-40 disabled:pointer-events-none",
        active && "bg-muted text-foreground font-semibold",
        !active && "text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

// ── Link prompt ──

function LinkPrompt({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [url, setUrl] = useState(editor.getAttributes("link").href ?? "");

  const apply = () => {
    const trimmed = url.trim();
    if (trimmed) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
    } else {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    }
    onClose();
  };

  return (
    <div className="flex items-center gap-1.5 border-l border-border pl-2">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            apply();
          }
          if (e.key === "Escape") onClose();
        }}
        placeholder="https://..."
        className="h-7 w-48 rounded border border-input bg-background px-2 text-xs"
        autoFocus
      />
      <button
        type="button"
        onClick={apply}
        className="h-7 rounded bg-primary px-2 text-xs text-primary-foreground hover:bg-primary/90"
      >
        OK
      </button>
      <button
        type="button"
        onClick={onClose}
        className="h-7 rounded px-2 text-xs text-muted-foreground hover:text-foreground"
      >
        ✕
      </button>
    </div>
  );
}

// ── Toolbar ──

function Toolbar({ editor, minimal }: { editor: Editor | null; minimal?: boolean }) {
  const [showLinkPrompt, setShowLinkPrompt] = useState(false);

  if (!editor) return null;

  const iconSize = "h-4 w-4";

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1.5 rounded-t-md">
      {/* Text formatting */}
      <ToolbarBtn
        title="Gras"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className={iconSize} />
      </ToolbarBtn>
      <ToolbarBtn
        title="Italique"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className={iconSize} />
      </ToolbarBtn>
      <ToolbarBtn
        title="Souligné"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className={iconSize} />
      </ToolbarBtn>

      {!minimal && (
        <>
          <ToolbarBtn
            title="Barré"
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className={iconSize} />
          </ToolbarBtn>

          <div className="mx-1 h-5 w-px bg-border" />

          {/* Headings */}
          <ToolbarBtn
            title="Titre 2"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className={iconSize} />
          </ToolbarBtn>
          <ToolbarBtn
            title="Titre 3"
            active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className={iconSize} />
          </ToolbarBtn>

          <div className="mx-1 h-5 w-px bg-border" />

          {/* Lists */}
          <ToolbarBtn
            title="Liste à puces"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className={iconSize} />
          </ToolbarBtn>
          <ToolbarBtn
            title="Liste numérotée"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className={iconSize} />
          </ToolbarBtn>
          <ToolbarBtn
            title="Citation"
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className={iconSize} />
          </ToolbarBtn>

          <div className="mx-1 h-5 w-px bg-border" />

          {/* Alignment */}
          <ToolbarBtn
            title="Aligner à gauche"
            active={editor.isActive({ textAlign: "left" })}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          >
            <AlignLeft className={iconSize} />
          </ToolbarBtn>
          <ToolbarBtn
            title="Centrer"
            active={editor.isActive({ textAlign: "center" })}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          >
            <AlignCenter className={iconSize} />
          </ToolbarBtn>
          <ToolbarBtn
            title="Aligner à droite"
            active={editor.isActive({ textAlign: "right" })}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
          >
            <AlignRight className={iconSize} />
          </ToolbarBtn>
        </>
      )}

      <div className="mx-1 h-5 w-px bg-border" />

      {/* Link */}
      {editor.isActive("link") ? (
        <ToolbarBtn
          title="Retirer le lien"
          active
          onClick={() => editor.chain().focus().unsetLink().run()}
        >
          <Unlink className={iconSize} />
        </ToolbarBtn>
      ) : (
        <ToolbarBtn
          title="Ajouter un lien"
          onClick={() => setShowLinkPrompt(true)}
        >
          <LinkIcon className={iconSize} />
        </ToolbarBtn>
      )}

      {showLinkPrompt && (
        <LinkPrompt editor={editor} onClose={() => setShowLinkPrompt(false)} />
      )}

      <div className="mx-1 h-5 w-px bg-border" />

      {/* Undo / Redo */}
      <ToolbarBtn
        title="Annuler"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo className={iconSize} />
      </ToolbarBtn>
      <ToolbarBtn
        title="Rétablir"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo className={iconSize} />
      </ToolbarBtn>
    </div>
  );
}

// ── Main component ──

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  minimal = false,
}: RichTextEditorProps) {
  const handleUpdate = useCallback(
    ({ editor }: { editor: Editor }) => {
      onChange(editor.getHTML());
    },
    [onChange],
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: minimal ? false : { levels: [2, 3] },
        bulletList: minimal ? false : undefined,
        orderedList: minimal ? false : undefined,
        blockquote: minimal ? false : undefined,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
      }),
      ...(minimal
        ? []
        : [
            TextAlign.configure({ types: ["heading", "paragraph"] }),
          ]),
      Placeholder.configure({ placeholder: placeholder ?? "Commencez à écrire..." }),
    ],
    content: value,
    onUpdate: handleUpdate,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none dark:prose-invert px-3 py-2 min-h-[120px] focus:outline-none",
      },
    },
  });

  // Sync external value changes (e.g. when switching articles)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className={cn(
        "rounded-md border border-input bg-background overflow-hidden",
        "focus-within:ring-1 focus-within:ring-ring",
        className,
      )}
    >
      <Toolbar editor={editor} minimal={minimal} />
      <EditorContent editor={editor} />
    </div>
  );
}
