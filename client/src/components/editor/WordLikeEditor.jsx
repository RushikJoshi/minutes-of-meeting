import { useEffect, useId, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { Placeholder } from "@tiptap/extensions/placeholder";
import { Extension, Mark, Node, mergeAttributes } from "@tiptap/core";
import {
  addColumnAfter,
  addColumnBefore,
  addRowAfter,
  addRowBefore,
  deleteColumn,
  deleteRow,
  deleteTable,
  mergeCells,
  splitCell,
  tableEditing,
} from "@tiptap/pm/tables";

const FONT_FAMILIES = [
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
];

const FONT_SIZES = [
  { label: "Small", value: "12px" },
  { label: "Medium", value: "16px" },
  { label: "Large", value: "20px" },
  { label: "XL", value: "28px" },
];

function stripHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
}

function extractActionItemsFromText(text) {
  // Split by newlines or sentence endings
  const sentences = text
    .split(/[\n.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const extracted = [];
  // More flexible regex: Allow optional quotes and ignore leading/trailing punctuation/quotes
  const regex = /^\s*["']?([A-Za-z][A-Za-z.\- ]{1,50})["']?\s+will\s+(.+?)(?:\s+(?:by|before|on)\s+([A-Za-z0-9,\-/ ]+))?\s*["']?[.!?]?["']?\s*$/i;

  for (const sentence of sentences) {
    console.log("[Detector] Checking sentence:", sentence);
    const match = sentence.match(regex);
    if (match) {
      const [, assignee, task, deadline] = match;
      console.log("[Detector] Match found!", { assignee, task, deadline });
      extracted.push({
        assignedTo: assignee.trim(),
        task: task.trim(),
        deadline: deadline ? deadline.trim() : "TBD",
        isGenerated: true
      });
    }
  }
  return extracted;
}

function styleValueToString(style, fallback = "") {
  return style ? String(style).replace(/^['"]|['"]$/g, "") : fallback;
}

function createTableNode(schema, rows = 3, cols = 3, withHeaderRow = true) {
  const rowNodes = [];

  for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
    const cellNodes = [];
    for (let colIndex = 0; colIndex < cols; colIndex += 1) {
      const cellType = withHeaderRow && rowIndex === 0 ? schema.nodes.tableHeader : schema.nodes.tableCell;
      cellNodes.push(
        cellType.createAndFill(
          null,
          schema.nodes.paragraph.create(null, schema.text(withHeaderRow && rowIndex === 0 ? `Heading ${colIndex + 1}` : ""))
        )
      );
    }
    rowNodes.push(schema.nodes.tableRow.createChecked(null, cellNodes));
  }

  return schema.nodes.table.createChecked(null, rowNodes);
}

const TextStyle = Mark.create({
  name: "textStyle",

  parseHTML() {
    return [
      {
        tag: "span",
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) return false;
          const hasStyle =
            element.style.fontFamily || element.style.fontSize || element.style.color || element.style.textDecoration;
          return hasStyle ? {} : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
});

const FontFamily = Extension.create({
  name: "fontFamily",

  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: (element) => styleValueToString(element.style.fontFamily, null),
            renderHTML: (attributes) => {
              if (!attributes.fontFamily) return {};
              return { style: `font-family: ${attributes.fontFamily}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontFamily:
        (fontFamily) =>
          ({ chain }) =>
            chain().setMark("textStyle", { fontFamily }).run(),
    };
  },
});

const FontSize = Extension.create({
  name: "fontSize",

  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => styleValueToString(element.style.fontSize, null),
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
          ({ chain }) =>
            chain().setMark("textStyle", { fontSize }).run(),
    };
  },
});

const TextColor = Extension.create({
  name: "textColor",

  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          color: {
            default: null,
            parseHTML: (element) => styleValueToString(element.style.color, null),
            renderHTML: (attributes) => {
              if (!attributes.color) return {};
              return { style: `color: ${attributes.color}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setTextColor:
        (color) =>
          ({ chain }) =>
            chain().setMark("textStyle", { color }).run(),
    };
  },
});

const TextAlign = Extension.create({
  name: "textAlign",

  addGlobalAttributes() {
    return [
      {
        types: ["heading", "paragraph"],
        attributes: {
          textAlign: {
            default: "left",
            parseHTML: (element) => element.style.textAlign || "left",
            renderHTML: (attributes) => {
              if (!attributes.textAlign || attributes.textAlign === "left") return {};
              return { style: `text-align: ${attributes.textAlign}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setTextAlign:
        (textAlign) =>
          ({ commands }) =>
            commands.updateAttributes("paragraph", { textAlign }) || commands.updateAttributes("heading", { textAlign }),
    };
  },
});

const ImageNode = Node.create({
  name: "image",
  group: "block",
  draggable: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "" },
      title: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "img[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "figure",
      { class: "word-editor-figure" },
      ["img", mergeAttributes({ class: "word-editor-image" }, HTMLAttributes)],
    ];
  },

  addCommands() {
    return {
      setImage:
        (attributes) =>
          ({ commands }) =>
            commands.insertContent({ type: this.name, attrs: attributes }),
    };
  },
});

const Table = Node.create({
  name: "table",
  group: "block",
  content: "tableRow+",
  isolating: true,
  tableRole: "table",

  addAttributes() {
    return {
      class: {
        default: "word-editor-table",
      },
    };
  },

  parseHTML() {
    return [{ tag: "table" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["table", mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      insertTable:
        ({ rows = 3, cols = 3, withHeaderRow = true } = {}) =>
          ({ state, dispatch }) => {
            const table = createTableNode(state.schema, rows, cols, withHeaderRow);
            if (!table) return false;
            if (dispatch) {
              dispatch(state.tr.replaceSelectionWith(table).scrollIntoView());
            }
            return true;
          },
      addColumnBefore:
        () =>
          ({ state, dispatch }) =>
            addColumnBefore(state, dispatch),
      addColumnAfter:
        () =>
          ({ state, dispatch }) =>
            addColumnAfter(state, dispatch),
      deleteColumn:
        () =>
          ({ state, dispatch }) =>
            deleteColumn(state, dispatch),
      addRowBefore:
        () =>
          ({ state, dispatch }) =>
            addRowBefore(state, dispatch),
      addRowAfter:
        () =>
          ({ state, dispatch }) =>
            addRowAfter(state, dispatch),
      deleteRow:
        () =>
          ({ state, dispatch }) =>
            deleteRow(state, dispatch),
      deleteTable:
        () =>
          ({ state, dispatch }) =>
            deleteTable(state, dispatch),
      mergeCells:
        () =>
          ({ state, dispatch }) =>
            mergeCells(state, dispatch),
      splitCell:
        () =>
          ({ state, dispatch }) =>
            splitCell(state, dispatch),
    };
  },

  addProseMirrorPlugins() {
    return [tableEditing()];
  },
});

const TableRow = Node.create({
  name: "tableRow",
  content: "(tableCell | tableHeader)*",
  tableRole: "row",

  parseHTML() {
    return [{ tag: "tr" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["tr", mergeAttributes(HTMLAttributes), 0];
  },
});

const TableHeader = Node.create({
  name: "tableHeader",
  content: "block+",
  isolating: true,
  tableRole: "header_cell",

  addAttributes() {
    return {
      colspan: {
        default: 1,
      },
      rowspan: {
        default: 1,
      },
      colwidth: {
        default: null,
        parseHTML: (element) => {
          const width = element.getAttribute("data-colwidth");
          return width ? width.split(",").map((item) => Number(item)) : null;
        },
        renderHTML: (attributes) => (
          attributes.colwidth ? { "data-colwidth": attributes.colwidth.join(",") } : {}
        ),
      },
    };
  },

  parseHTML() {
    return [{ tag: "th" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["th", mergeAttributes(HTMLAttributes), 0];
  },
});

const TableCell = Node.create({
  name: "tableCell",
  content: "block+",
  isolating: true,
  tableRole: "cell",

  addAttributes() {
    return {
      colspan: {
        default: 1,
      },
      rowspan: {
        default: 1,
      },
      colwidth: {
        default: null,
        parseHTML: (element) => {
          const width = element.getAttribute("data-colwidth");
          return width ? width.split(",").map((item) => Number(item)) : null;
        },
        renderHTML: (attributes) => (
          attributes.colwidth ? { "data-colwidth": attributes.colwidth.join(",") } : {}
        ),
      },
    };
  },

  parseHTML() {
    return [{ tag: "td" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["td", mergeAttributes(HTMLAttributes), 0];
  },
});

function ToolbarButton({ active, disabled, onClick, children, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`word-editor-toolbar-button ${active ? "is-active" : ""}`}
    >
      {children}
    </button>
  );
}

export default function WordLikeEditor({
  initialContent = "<p></p>",
  title = "MOM Document",
  subtitle = "Write and format your minutes like Microsoft Word.",
  loading = false,
  saving = false,
  onSave,
  onUploadImage,
  onDetectedActionItems,
  onContentChange,
  autoSave = true,
  autoSaveDelay = 1400,
}) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentHtml, setCurrentHtml] = useState(initialContent);
  const [saveMessage, setSaveMessage] = useState("");
  const [editorReady, setEditorReady] = useState(false);
  const fileInputId = useId();
  const autosaveTimerRef = useRef(null);
  const lastLoadedContentRef = useRef(initialContent);
  const skipAutosaveRef = useRef(true);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({
        autolink: true,
        openOnClick: false,
        defaultProtocol: "https",
      }),
      Placeholder.configure({
        placeholder: "Start writing MOM...",
      }),
      TextStyle,
      FontFamily,
      FontSize,
      TextColor,
      TextAlign,
      ImageNode,
      Table,
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: "word-editor-content",
      },
    },
    onCreate: () => {
      setEditorReady(true);
    },
    onUpdate: ({ editor: activeEditor }) => {
      const html = activeEditor.getHTML();
      setCurrentHtml(html);
      setSaveMessage("Unsaved changes");
      
      if (onContentChange) {
        onContentChange(html);
      }
      
      if (onDetectedActionItems) {
        const text = stripHtml(html);
        const items = extractActionItemsFromText(text);
        onDetectedActionItems(items);
      }
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (initialContent === lastLoadedContentRef.current) return;

    lastLoadedContentRef.current = initialContent;
    skipAutosaveRef.current = true;
    editor.commands.setContent(initialContent || "<p></p>", false);
    setCurrentHtml(initialContent || "<p></p>");
  }, [editor, initialContent]);

  useEffect(() => {
    if (!editor || !editorReady || !autoSave || !onSave) return undefined;

    if (skipAutosaveRef.current) {
      skipAutosaveRef.current = false;
      return undefined;
    }

    window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(async () => {
      try {
        await onSave(editor.getHTML());
        setSaveMessage(`Auto-saved at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
      } catch {
        setSaveMessage("Auto-save failed");
      }
    }, autoSaveDelay);

    return () => {
      window.clearTimeout(autosaveTimerRef.current);
    };
  }, [autoSave, autoSaveDelay, currentHtml, editor, editorReady, onSave]);

  const activeTextStyle = editor?.getAttributes("textStyle") || {};
  const activeHeading = editor?.isActive("heading", { level: 1 })
    ? "h1"
    : editor?.isActive("heading", { level: 2 })
      ? "h2"
      : editor?.isActive("heading", { level: 3 })
        ? "h3"
        : "paragraph";

  const toolbarState = useMemo(
    () => ({
      fontFamily: activeTextStyle.fontFamily || FONT_FAMILIES[0].value,
      fontSize: activeTextStyle.fontSize || FONT_SIZES[1].value,
      color: activeTextStyle.color || "#0f172a",
      heading: activeHeading,
    }),
    [activeHeading, activeTextStyle.color, activeTextStyle.fontFamily, activeTextStyle.fontSize]
  );

  const handleInsertLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href || "";
    const url = window.prompt("Enter link URL", previousUrl);

    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().setLink({ href: url.trim() }).run();
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !editor || !onUploadImage) return;

    try {
      const uploaded = await onUploadImage(file);
      if (uploaded?.src) {
        editor.chain().focus().setImage({ src: uploaded.src, alt: file.name, title: file.name }).run();
      }
      setSaveMessage(`${file.name} uploaded`);
    } catch {
      setSaveMessage("Image upload failed");
    } finally {
      event.target.value = "";
    }
  };

  const handleManualSave = async () => {
    if (!editor || !onSave) return;
    try {
      await onSave(editor.getHTML(), true);
      setSaveMessage(`Saved at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
    } catch (err) {
      console.error("[WordLikeEditor] Manual save failed", err);
      setSaveMessage("Save failed");
    }
  };

  if (loading || !editor || !editorReady) {
    return (
      <div className="word-editor-loading">
        <div className="word-editor-loading-card">
          <div className="word-editor-spinner"></div>
          <h2 className="text-lg font-bold text-slate-900">Preparing editor</h2>
          <p className="text-sm text-slate-500">Loading your Microsoft Word style workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`word-editor-shell ${isDarkMode ? "is-dark" : ""}`}>
      <div className="word-editor-header">
        <div>
          <h1 className="text-2xl font-black tracking-tight">{title}</h1>
          <p className="text-sm opacity-70">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsDarkMode((value) => !value)}
            className="word-editor-utility-button"
          >
            {isDarkMode ? "Light mode" : "Dark mode"}
          </button>
          <button
            type="button"
            onClick={handleManualSave}
            disabled={saving}
            className="btn-primary !rounded-2xl !px-5 !py-3 text-sm"
          >
            {saving ? "Saving..." : "Save Document"}
          </button>
        </div>
      </div>

      <div className="word-editor-toolbar">
        <div className="word-editor-toolbar-group">
          <select
            value={toolbarState.heading}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "paragraph") {
                editor.chain().focus().setParagraph().run();
              } else {
                editor.chain().focus().setHeading({ level: Number(value.replace("h", "")) }).run();
              }
            }}
            className="word-editor-select"
          >
            <option value="paragraph">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>

          <select
            value={toolbarState.fontFamily}
            onChange={(event) => editor.chain().focus().setFontFamily(event.target.value).run()}
            className="word-editor-select"
          >
            {FONT_FAMILIES.map((family) => (
              <option key={family.value} value={family.value}>
                {family.label}
              </option>
            ))}
          </select>

          <select
            value={toolbarState.fontSize}
            onChange={(event) => editor.chain().focus().setFontSize(event.target.value).run()}
            className="word-editor-select"
          >
            {FONT_SIZES.map((size) => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
        </div>

        <div className="word-editor-toolbar-group">
          <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
            B
          </ToolbarButton>
          <ToolbarButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
            I
          </ToolbarButton>
          <ToolbarButton title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            U
          </ToolbarButton>
          <label className="word-editor-color-picker" title="Text color">
            <input
              type="color"
              value={toolbarState.color}
              onChange={(event) => editor.chain().focus().setTextColor(event.target.value).run()}
            />
          </label>
        </div>

        <div className="word-editor-toolbar-group">
          <ToolbarButton title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
            L
          </ToolbarButton>
          <ToolbarButton title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
            C
          </ToolbarButton>
          <ToolbarButton title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
            R
          </ToolbarButton>
        </div>

        <div className="word-editor-toolbar-group">
          <ToolbarButton title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            • List
          </ToolbarButton>
          <ToolbarButton title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            1. List
          </ToolbarButton>
          <ToolbarButton title="Add link" active={editor.isActive("link")} onClick={handleInsertLink}>
            Link
          </ToolbarButton>
        </div>

        <div className="word-editor-toolbar-group">
          <label htmlFor={fileInputId} className="word-editor-toolbar-button cursor-pointer">
            Image
          </label>
          <input id={fileInputId} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

          <ToolbarButton title="Insert table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
            Table
          </ToolbarButton>
          <ToolbarButton title="Add row" onClick={() => editor.chain().focus().addRowAfter().run()}>
            Row+
          </ToolbarButton>
          <ToolbarButton title="Add column" onClick={() => editor.chain().focus().addColumnAfter().run()}>
            Col+
          </ToolbarButton>
          <ToolbarButton title="Delete table" onClick={() => editor.chain().focus().deleteTable().run()}>
            Del Table
          </ToolbarButton>
        </div>
      </div>

      <div className="word-editor-statusbar">
        <span>{saveMessage || "Ready to edit"}</span>
        <span>{autoSave ? "Auto-save on" : "Auto-save off"}</span>
      </div>

      <div className="word-editor-page-wrap">
        <div className="word-editor-page">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
