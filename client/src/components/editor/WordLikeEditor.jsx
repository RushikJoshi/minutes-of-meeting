import { useEffect, useId, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { Placeholder } from "@tiptap/extensions/placeholder";
import { Extension, Mark, Node, mergeAttributes } from "@tiptap/core";
import {
  Bold, Italic, Underline as UnderlineIcon, Type,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Link as LinkIcon,
  Image as ImageIcon, Table as TableIcon,
  Plus, Trash2, Moon, Sun, Save, CheckCircle2, AlertCircle
} from "lucide-react";
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
import { toast } from "react-hot-toast";

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
  const sentences = text
    .split(/[\n.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const extracted = [];
  const regex = /^\s*["']?([A-Za-z][A-Za-z.\- ]{1,50})["']?\s+will\s+(.+?)(?:\s+(?:by|before|on)\s+([A-Za-z0-9,\-/ ]+))?\s*["']?[.!?]?["']?\s*$/i;

  for (const sentence of sentences) {
    const match = sentence.match(regex);
    if (match) {
      const [, assignee, task, deadline] = match;
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
      class: { default: "word-editor-table" },
      style: {
        default: null,
        parseHTML: element => element.getAttribute("style"),
        renderHTML: attributes => (attributes.style ? { style: attributes.style } : {}),
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
      addColumnBefore: () => ({ state, dispatch }) => { 
        console.log("Command: addColumnBefore");
        return addColumnBefore(state, dispatch); 
      },
      addColumnAfter: () => ({ state, dispatch }) => { 
        let isInsideCell = false;
        const { $from } = state.selection;
        for (let d = $from.depth; d > 0; d--) {
          const node = $from.node(d);
          if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
            isInsideCell = true;
            break;
          }
        }
        if (!isInsideCell) return false;
        if (dispatch) return addColumnAfter(state, dispatch);
        return true;
      },
      deleteColumn: () => ({ state, dispatch }) => { 
        return deleteColumn(state, dispatch); 
      },
      addRowBefore: () => ({ state, dispatch }) => { 
        return addRowBefore(state, dispatch); 
      },
      addRowAfter: () => ({ state, dispatch }) => {
        let isInsideCell = false;
        const { $from } = state.selection;
        for (let d = $from.depth; d > 0; d--) {
          const node = $from.node(d);
          if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
            isInsideCell = true;
            break;
          }
        }
        if (!isInsideCell) return false;
        if (dispatch) return addRowAfter(state, dispatch);
        return true;
      },
      deleteRow: () => ({ state, dispatch }) => { 
        console.log("Command: deleteRow");
        return deleteRow(state, dispatch); 
      },
      deleteTable: () => ({ state, dispatch }) => { 
        console.log("Command: deleteTable");
        return deleteTable(state, dispatch); 
      },
      mergeCells: () => ({ state, dispatch }) => { return mergeCells(state, dispatch); },
      splitCell: () => ({ state, dispatch }) => { return splitCell(state, dispatch); },
    };
  },
  addProseMirrorPlugins() {
    return [tableEditing()];
  },
});

const TableRow = Node.create({
  name: "tableRow",
  content: "(tableCell | tableHeader)*",
  addAttributes() {
    return {
      style: {
        default: null,
        parseHTML: element => element.getAttribute("style"),
        renderHTML: attributes => (attributes.style ? { style: attributes.style } : {}),
      },
    };
  },
  parseHTML() { return [{ tag: "tr" }]; },
  renderHTML({ HTMLAttributes }) { return ["tr", mergeAttributes(HTMLAttributes), 0]; },
});

const TableHeader = Node.create({
  name: "tableHeader",
  content: "block+",
  isolating: true,
  tableRole: "header_cell",
  addAttributes() {
    return {
      colspan: { default: 1 },
      rowspan: { default: 1 },
      colwidth: {
        default: null,
        parseHTML: (element) => {
          const width = element.getAttribute("data-colwidth");
          return width ? width.split(",").map((item) => Number(item)) : null;
        },
        renderHTML: (attributes) => (attributes.colwidth ? { "data-colwidth": attributes.colwidth.join(",") } : {}),
      },
      style: {
        default: null,
        parseHTML: element => element.getAttribute("style"),
        renderHTML: attributes => (attributes.style ? { style: attributes.style } : {}),
      },
    };
  },
  parseHTML() { return [{ tag: "th" }]; },
  renderHTML({ HTMLAttributes }) { return ["th", mergeAttributes(HTMLAttributes), 0]; },
});

const TableCell = Node.create({
  name: "tableCell",
  content: "block+",
  isolating: true,
  tableRole: "cell",
  addAttributes() {
    return {
      colspan: { default: 1 },
      rowspan: { default: 1 },
      colwidth: {
        default: null,
        parseHTML: (element) => {
          const width = element.getAttribute("data-colwidth");
          return width ? width.split(",").map((item) => Number(item)) : null;
        },
        renderHTML: (attributes) => (attributes.colwidth ? { "data-colwidth": attributes.colwidth.join(",") } : {}),
      },
      style: {
        default: null,
        parseHTML: element => element.getAttribute("style"),
        renderHTML: attributes => (attributes.style ? { style: attributes.style } : {}),
      },
    };
  },
  parseHTML() { return [{ tag: "td" }]; },
  renderHTML({ HTMLAttributes }) { return ["td", mergeAttributes(HTMLAttributes), 0]; },
});

function ToolbarButton({ active, disabled, onClick, children, title }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        if (onClick) onClick(e);
      }}
      onMouseDown={(e) => e.preventDefault()}
      title={title}
      disabled={disabled}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 ${
        active 
          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110" 
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      } disabled:opacity-30 disabled:cursor-not-allowed`}
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
  const [saveStatus, setSaveStatus] = useState("ready"); // ready, saving, saved, error
  const [saveMessage, setSaveMessage] = useState("");
  const [editorReady, setEditorReady] = useState(false);
  const fileInputId = useId();
  const autosaveTimerRef = useRef(null);
  const lastLoadedContentRef = useRef(initialContent);
  const lastSavedHtmlRef = useRef(initialContent);
  const skipAutosaveRef = useRef(true);
  const dirtyRef = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({ autolink: true, openOnClick: false, defaultProtocol: "https" }),
      Placeholder.configure({ placeholder: "Start writing MOM..." }),
      TextStyle, FontFamily, FontSize, TextColor, TextAlign, ImageNode, Table, TableRow, TableHeader, TableCell,
    ],
    content: initialContent,
    editorProps: { attributes: { class: "word-editor-content focus:outline-none min-h-[700px] py-12 px-16" } },
    onCreate: () => setEditorReady(true),
    onUpdate: ({ editor: activeEditor, transaction }) => {
      if (transaction && !transaction.docChanged) return;
      const html = activeEditor.getHTML();
      setCurrentHtml(html);
      dirtyRef.current = true;
      setSaveStatus("dirty");
      setSaveMessage("Unsaved changes");
      if (onContentChange) onContentChange(html);
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
    lastSavedHtmlRef.current = initialContent;
    dirtyRef.current = false;
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
    if (!dirtyRef.current) return undefined;
    const htmlToSave = editor.getHTML();
    if (htmlToSave === lastSavedHtmlRef.current) {
      dirtyRef.current = false;
      return undefined;
    }

    window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(async () => {
      try {
        setSaveStatus("saving");
        const savingHtml = editor.getHTML();
        await onSave(savingHtml);
        lastSavedHtmlRef.current = savingHtml;
        dirtyRef.current = false;
        setSaveStatus("saved");
        setSaveMessage(`Last saved at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
      } catch {
        setSaveStatus("error");
        setSaveMessage("Auto-save failed");
      }
    }, autoSaveDelay);

    return () => window.clearTimeout(autosaveTimerRef.current);
  }, [autoSave, autoSaveDelay, currentHtml, editor, editorReady, onSave]);

  const activeTextStyle = editor?.getAttributes("textStyle") || {};
  const activeHeading = editor?.isActive("heading", { level: 1 }) ? "h1" : editor?.isActive("heading", { level: 2 }) ? "h2" : editor?.isActive("heading", { level: 3 }) ? "h3" : "paragraph";

  const toolbarState = useMemo(() => ({
    fontFamily: activeTextStyle.fontFamily || FONT_FAMILIES[0].value,
    fontSize: activeTextStyle.fontSize || FONT_SIZES[1].value,
    color: activeTextStyle.color || "#0f172a",
    heading: activeHeading,
  }), [activeHeading, activeTextStyle.color, activeTextStyle.fontFamily, activeTextStyle.fontSize]);

  const handleInsertLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href || "";
    const url = window.prompt("Enter link URL", previousUrl);
    if (url === null) return;
    if (!url.trim()) { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().setLink({ href: url.trim() }).run();
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !editor || !onUploadImage) return;
    try {
      const uploaded = await onUploadImage(file);
      if (uploaded?.src) editor.chain().focus().setImage({ src: uploaded.src, alt: file.name, title: file.name }).run();
    } catch { toast.error("Image upload failed"); } finally { event.target.value = ""; }
  };

  const handleManualSave = async () => {
    if (!editor || !onSave) return;
    try {
      setSaveStatus("saving");
      const html = editor.getHTML();
      await onSave(html, true);
      lastSavedHtmlRef.current = html;
      dirtyRef.current = false;
      setSaveStatus("saved");
      setSaveMessage(`Saved at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
    } catch { setSaveStatus("error"); setSaveMessage("Save failed"); }
  };

  if (loading || !editor || !editorReady) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="page-card flex w-full max-w-md flex-col items-center gap-3 p-8 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
          <h2 className="text-lg font-bold text-slate-900">Preparing Workspace</h2>
          <p className="text-sm text-slate-500">Loading your document editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`word-editor-shell flex flex-col min-h-[85vh] rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-[0_32px_80px_-20px_rgba(15,23,42,0.15)] bg-white ${isDarkMode ? "is-dark" : ""}`}>
      {/* Premium Header */}
      <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Save size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              {saveStatus === "saved" && <CheckCircle2 size={14} className="text-emerald-500" />}
              {saveStatus === "saving" && <div className="w-3 h-3 border-2 border-blue-500 border-r-transparent animate-spin rounded-full" />}
              {saveStatus === "error" && <AlertCircle size={14} className="text-red-500" />}
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{saveMessage || "Ready to edit"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-3 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={handleManualSave}
            disabled={saving}
            className="btn-primary !px-6 !py-3 flex items-center gap-2"
          >
            <Save size={18} />
            <span>{saving ? "Saving..." : "Save Template"}</span>
          </button>
        </div>
      </div>

      {/* Modern Toolbar */}
      <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center gap-6 overflow-x-auto no-scrollbar">
        {/* Style Group */}
        <div className="flex items-center gap-2 pr-6 border-r border-slate-200">
          <select
            value={toolbarState.heading}
            onChange={(e) => e.target.value === "paragraph" ? editor.chain().focus().setParagraph().run() : editor.chain().focus().setHeading({ level: Number(e.target.value.replace("h", "")) }).run()}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
          >
            <option value="paragraph">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>

          <select
            value={toolbarState.fontFamily}
            onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all min-w-[120px]"
          >
            {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>

        {/* Formatting Group */}
        <div className="flex items-center gap-1 pr-6 border-r border-slate-200">
          <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold size={18} />
          </ToolbarButton>
          <ToolbarButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic size={18} />
          </ToolbarButton>
          <ToolbarButton title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon size={18} />
          </ToolbarButton>
          <div className="relative group">
            <label className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer transition-all">
              <Type size={18} />
              <input type="color" className="absolute inset-0 opacity-0 cursor-pointer" value={toolbarState.color} onChange={(e) => editor.chain().focus().setTextColor(e.target.value).run()} />
            </label>
          </div>
        </div>

        {/* Alignment Group */}
        <div className="flex items-center gap-1 pr-6 border-r border-slate-200">
          <ToolbarButton active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
            <AlignLeft size={18} />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
            <AlignCenter size={18} />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
            <AlignRight size={18} />
          </ToolbarButton>
        </div>

        {/* Lists & Links Group */}
        <div className="flex items-center gap-1 pr-6 border-r border-slate-200">
          <ToolbarButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List size={18} />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered size={18} />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive("link")} onClick={handleInsertLink}>
            <LinkIcon size={18} />
          </ToolbarButton>
        </div>

        {/* Assets Group */}
        <div className="flex items-center gap-1">
          <label className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer transition-all">
            <ImageIcon size={18} />
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
          <ToolbarButton title="Insert Table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
            <TableIcon size={18} />
          </ToolbarButton>
          <ToolbarButton 
            title="Add Row" 
            onClick={() => {
              editor.commands.focus();
              const success = editor.commands.addRowAfter();
              if (!success) toast.error("Please click inside a table cell first");
            }}
          >
            <Plus size={18} className="rotate-90" />
          </ToolbarButton>
          <ToolbarButton 
            title="Add Column" 
            onClick={() => {
              editor.commands.focus();
              const success = editor.commands.addColumnAfter();
              if (!success) toast.error("Please click inside a table cell first");
            }}
          >
            <Plus size={18} />
          </ToolbarButton>
          <ToolbarButton 
            title="Delete Table" 
            onClick={() => {
              editor.commands.focus();
              const success = editor.commands.deleteTable();
              if (!success) toast.error("Please click inside a table cell first");
            }}
          >
            <Trash2 size={18} className="text-red-500" />
          </ToolbarButton>
        </div>
      </div>

      {/* Document Area */}
      <div className="flex-1 bg-slate-100 p-8 sm:p-12 overflow-y-auto no-scrollbar">
        <div className="max-w-[850px] mx-auto bg-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-sm min-h-full border border-slate-200 transition-all duration-300 hover:shadow-[0_30px_70px_rgba(0,0,0,0.08)]">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
