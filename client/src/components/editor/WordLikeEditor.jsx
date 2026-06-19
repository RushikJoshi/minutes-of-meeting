import { forwardRef, useEffect, useId, useImperativeHandle, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { Placeholder } from "@tiptap/extensions/placeholder";
import { Extension, Mark, Node, mergeAttributes } from "@tiptap/core";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import {
  Bold, Italic, Underline as UnderlineIcon, Type,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Link as LinkIcon,
  Image as ImageIcon, Table as TableIcon,
  Plus, Trash2, Moon, Sun, Save, CheckCircle2, AlertCircle,
  Layout, Maximize2, Minimize2, Settings2, Sparkles
} from "lucide-react";
import { toast } from "react-hot-toast";

const FONT_FAMILIES = [
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Outfit", value: "Outfit, sans-serif" },
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

function ToolbarButton({ active, disabled, onClick, children, title, variant = "default" }) {
  const baseClasses = "inline-flex items-center justify-center rounded-xl transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed";
  const sizeClasses = "h-9 min-w-[36px] px-2";
  
  let variantClasses = "";
  if (variant === "primary") {
    variantClasses = active 
      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105" 
      : "text-slate-600 hover:bg-blue-50 hover:text-blue-600";
  } else {
    variantClasses = active 
      ? "bg-slate-900 text-white shadow-lg scale-105" 
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900";
  }

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
      className={`${baseClasses} ${sizeClasses} ${variantClasses}`}
    >
      {children}
    </button>
  );
}

const WordLikeEditor = forwardRef(({
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
  hideHeader = false,
  fullWidth = false,
}, ref) => {
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
      TextStyle, FontFamily, FontSize, TextColor, TextAlign, ImageNode,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: initialContent,
    editorProps: { attributes: { class: "word-editor-content focus:outline-none min-h-[850px] py-16 px-6 sm:px-12 lg:px-20" } },
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

  useImperativeHandle(ref, () => ({
    getEditor: () => editor,
    insertText: (text) => {
      if (editor) {
        editor.chain().focus().insertContent(text).run();
      }
    },
    setContent: (content) => {
      if (editor) {
        editor.commands.setContent(content);
      }
    }
  }), [editor]);

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
        <div className="page-card flex w-full max-w-md flex-col items-center gap-3 p-8 text-center border-none shadow-none bg-transparent">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-[3px] border-blue-600/20 border-r-blue-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="text-blue-600 animate-pulse" size={20} />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-4">Crafting Your Organization</h2>
          <p className="text-sm text-slate-500">Fine-tuning the editor tools for you...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`word-editor-shell flex flex-col min-h-[90vh] rounded-[2.5rem] overflow-hidden border border-slate-200/60 shadow-[0_40px_100px_-20px_rgba(15,23,42,0.12)] bg-white transition-all duration-500 ${isDarkMode ? "is-dark" : ""}`}>
      {/* Premium Header */}
      {!hideHeader && (
        <div className="px-10 py-7 border-b border-slate-100 flex items-center justify-between bg-white/40 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="relative w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white">
                <Layout size={28} />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{title}</h1>
              <div className="flex items-center gap-2.5 mt-1">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  saveStatus === "saved" ? "bg-emerald-50 text-emerald-600" :
                  saveStatus === "saving" ? "bg-blue-50 text-blue-600" :
                  saveStatus === "error" ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-500"
                }`}>
                  {saveStatus === "saved" && <CheckCircle2 size={10} />}
                  {saveStatus === "saving" && <div className="w-2.5 h-2.5 border-2 border-blue-500 border-r-transparent animate-spin rounded-full" />}
                  {saveStatus === "error" && <AlertCircle size={10} />}
                  <span>{saveStatus === "dirty" ? "Unsaved Changes" : saveMessage || "Connected"}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">v2.0 Beta</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleManualSave}
              disabled={saving}
              className="group relative px-8 py-3.5 bg-slate-900 text-white font-bold rounded-2xl shadow-2xl shadow-slate-900/20 hover:shadow-slate-900/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50"
            >
              <div className="flex items-center gap-2.5">
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-r-white animate-spin rounded-full" />
                ) : (
                  <Save size={18} className="group-hover:scale-110 transition-transform" />
                )}
                <span>{saving ? "Syncing..." : "Save Template"}</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Modern High-End Toolbar */}
      <div className="px-10 py-5 bg-slate-50/40 border-b border-slate-100/60 flex flex-wrap items-center gap-8 overflow-x-auto no-scrollbar backdrop-blur-sm">
        {/* Style Group */}
        <div className="flex items-center gap-3 pr-8 border-r border-slate-200/60">
          <div className="relative">
            <select
              value={toolbarState.heading}
              onChange={(e) => e.target.value === "paragraph" ? editor.chain().focus().setParagraph().run() : editor.chain().focus().setHeading({ level: Number(e.target.value.replace("h", "")) }).run()}
              className="appearance-none bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-[11px] font-black text-slate-700 uppercase tracking-wider outline-none focus:ring-4 focus:ring-blue-50 transition-all cursor-pointer hover:border-blue-200"
            >
              <option value="paragraph">Text</option>
              <option value="h1">Title Lg</option>
              <option value="h2">Title Md</option>
              <option value="h3">Title Sm</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg size={12} fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          <div className="relative">
            <select
              value={toolbarState.fontFamily}
              onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
              className="appearance-none bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-[11px] font-black text-slate-700 uppercase tracking-wider outline-none focus:ring-4 focus:ring-blue-50 transition-all cursor-pointer hover:border-blue-200 min-w-[140px]"
            >
              {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg size={12} fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        {/* Formatting Group */}
        <div className="flex items-center gap-1.5 pr-8 border-r border-slate-200/60">
          <ToolbarButton variant="primary" title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold size={18} strokeWidth={2.5} />
          </ToolbarButton>
          <ToolbarButton variant="primary" title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic size={18} strokeWidth={2.5} />
          </ToolbarButton>
          <ToolbarButton variant="primary" title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon size={18} strokeWidth={2.5} />
          </ToolbarButton>
          <div className="relative group ml-1">
            <label className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-600 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-all border border-transparent hover:border-blue-100">
              <Type size={18} strokeWidth={2.5} />
              <input type="color" className="absolute inset-0 opacity-0 cursor-pointer" value={toolbarState.color} onChange={(e) => editor.chain().focus().setTextColor(e.target.value).run()} />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full" style={{ backgroundColor: toolbarState.color }}></div>
            </label>
          </div>
        </div>

        {/* Alignment Group */}
        <div className="flex items-center gap-1.5 pr-8 border-r border-slate-200/60">
          <ToolbarButton active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
            <AlignLeft size={18} strokeWidth={2.5} />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
            <AlignCenter size={18} strokeWidth={2.5} />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
            <AlignRight size={18} strokeWidth={2.5} />
          </ToolbarButton>
        </div>

        {/* Lists & Links Group */}
        <div className="flex items-center gap-1.5 pr-8 border-r border-slate-200/60">
          <ToolbarButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List size={18} strokeWidth={2.5} />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered size={18} strokeWidth={2.5} />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive("link")} onClick={handleInsertLink}>
            <LinkIcon size={18} strokeWidth={2.5} />
          </ToolbarButton>
        </div>

        {/* Assets & Tables Group */}
        <div className="flex items-center gap-1.5">
          <label className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer transition-all">
            <ImageIcon size={18} strokeWidth={2.5} />
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
          <div className="w-[1px] h-6 bg-slate-200 mx-2"></div>
          <ToolbarButton title="Insert Table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
            <TableIcon size={18} strokeWidth={2.5} />
          </ToolbarButton>
          <ToolbarButton 
            title="Add Row" 
            onClick={() => {
              const success = editor.chain().focus().addRowAfter().run();
              if (!success) toast.error("Please click inside a table cell first");
            }}
          >
            <div className="flex items-center gap-1.5 px-1">
              <Plus size={16} strokeWidth={3} />
              <span className="text-[10px] font-black uppercase tracking-wider">Row</span>
            </div>
          </ToolbarButton>
          <ToolbarButton 
            title="Add Column" 
            onClick={() => {
              const success = editor.chain().focus().addColumnAfter().run();
              if (!success) toast.error("Please click inside a table cell first");
            }}
          >
            <div className="flex items-center gap-1.5 px-1">
              <Plus size={16} strokeWidth={3} />
              <span className="text-[10px] font-black uppercase tracking-wider">Col</span>
            </div>
          </ToolbarButton>
          <ToolbarButton 
            title="Delete Table" 
            onClick={() => {
              const success = editor.chain().focus().deleteTable().run();
              if (!success) toast.error("Please click inside a table cell first");
            }}
          >
            <Trash2 size={18} className="text-red-500" strokeWidth={2.5} />
          </ToolbarButton>
        </div>
      </div>

      {/* Document Area */}
      <div className={`flex-1 bg-slate-100/80 ${fullWidth ? "p-0" : "p-10 sm:p-14"} overflow-y-auto no-scrollbar relative`}>
        <div className={`${fullWidth ? "w-full border-x-0" : "max-w-[900px] mx-auto rounded-sm border border-slate-200/50"} bg-white shadow-[0_30px_100px_-20px_rgba(0,0,0,0.06)] min-h-full transition-all duration-500 hover:shadow-[0_40px_120px_-20px_rgba(0,0,0,0.1)] relative z-10`}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <EditorContent editor={editor} />
        </div>
        
        {/* Visual Aids */}
        <div className="fixed bottom-10 right-10 flex flex-col gap-3 z-40">
           <div className="bg-white/80 backdrop-blur px-4 py-3 rounded-2xl border border-slate-200 shadow-xl flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Auto-Saving Enabled</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
});

WordLikeEditor.displayName = "WordLikeEditor";

export default WordLikeEditor;
