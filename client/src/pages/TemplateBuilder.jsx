import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import API from "../api/api";
import WordLikeEditor from "../components/editor/WordLikeEditor";
import { 
  Info,
  RotateCcw
} from "lucide-react";

const MOM_DEFAULT_HTML = `
  <h1 style="text-align: center; text-decoration: underline;">[MEETING_TITLE]</h1>
  <br/>
  <div style="margin-bottom: 20px;">
    <p>📅 <strong>Date of Meeting :</strong> <span>[DATE]</span></p>
    <p>⏰ <strong>Time of Meeting :</strong> <span>[TIME]</span></p>
    <p>👤 <strong>From :</strong> <span>[CREATOR]</span></p>
    <p>👥 <strong>To :</strong> <span>[PARTICIPANTS]</span></p>
  </div>
  <br/>
  <p style="font-size: 12px; color: #94a3b8; margin-bottom: 8px;">
    (Tip: Click inside table cell → then use <strong>+</strong> buttons in toolbar)
  </p>
  <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; table-layout: auto;">
    <tr style="background-color: #f8fafc;">
      <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left; width: 40px; white-space: nowrap;"><p>#</p></th>
      <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left;"><p>Discussion / Tasks</p></th>
      <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left; width: 140px; white-space: nowrap;"><p>Complete Date</p></th>
      <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left; width: 140px; white-space: nowrap;"><p>Responsible</p></th>
    </tr>
    <tr>
      <td style="border: 1px solid #e2e8f0; padding: 12px; white-space: nowrap;"><p>1</p></td>
      <td style="border: 1px solid #e2e8f0; padding: 12px;"><p></p></td>
      <td style="border: 1px solid #e2e8f0; padding: 12px; white-space: nowrap;"><p></p></td>
      <td style="border: 1px solid #e2e8f0; padding: 12px; white-space: nowrap;"><p></p></td>
    </tr>
    <tr>
      <td style="border: 1px solid #e2e8f0; padding: 12px; white-space: nowrap;"><p>2</p></td>
      <td style="border: 1px solid #e2e8f0; padding: 12px;"><p></p></td>
      <td style="border: 1px solid #e2e8f0; padding: 12px; white-space: nowrap;"><p></p></td>
      <td style="border: 1px solid #e2e8f0; padding: 12px; white-space: nowrap;"><p></p></td>
    </tr>
    <tr>
      <td style="border: 1px solid #e2e8f0; padding: 12px; white-space: nowrap;"><p>3</p></td>
      <td style="border: 1px solid #e2e8f0; padding: 12px;"><p></p></td>
      <td style="border: 1px solid #e2e8f0; padding: 12px; white-space: nowrap;"><p></p></td>
      <td style="border: 1px solid #e2e8f0; padding: 12px; white-space: nowrap;"><p></p></td>
    </tr>
  </table>
  <br/>
  <div style="margin-top: 20px;">
    <p>📝 <strong>Additional Notes:</strong></p>
    <p><span>______________________________________________</span></p>
  </div>
  <br/><br/>
  <div style="display: flex; justify-content: space-between;">
    <p><strong>Prepared By :</strong> <span>______________________</span></p>
    <p><strong>Approved By :</strong> <span>______________________</span></p>
  </div>
  <p></p>
`;

const PLACEHOLDERS = [
  { label: "Date", value: "[DATE]" },
  { label: "Time", value: "[TIME]" },
  { label: "Title", value: "[MEETING_TITLE]" },
  { label: "Creator", value: "[CREATOR]" },
  { label: "Participants", value: "[PARTICIPANTS]" },
  { label: "Agenda", value: "[AGENDA]" },
];

function isContentBlank(html) {
  return !html || /^(\s|<p>|<\/p>|<br>)*$/i.test(html);
}

export default function TemplateBuilder() {
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadTemplate = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/editor-template");
      setTemplate(data);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load editor template");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  const saveTemplate = useCallback(
    async (contentHtml) => {
      if (!template?._id) return;
      setSaving(true);
      try {
        const { data } = await API.put("/editor-template", {
          title: template.title || "MOM Template",
          contentHtml,
          attachmentIds: Array.isArray(template.attachments) ? template.attachments.map((item) => item._id) : [],
        });
        setTemplate(data);
        return data;
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to save editor template");
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [template]
  );

  const handleUploadImage = useCallback(
    async (file) => {
      if (!template?._id) {
        throw new Error("Template is not ready yet");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityType", "editorTemplate");
      formData.append("entityId", template._id);

      const { data } = await API.post("/attachments", formData);
      setTemplate((current) => ({
        ...current,
        attachments: [data, ...(current?.attachments || [])],
      }));

      return {
        src: `${API.defaults.baseURL}${data.urlPath}`,
        attachment: data,
      };
    },
    [template]
  );

  const initialEditorContent = isContentBlank(template?.contentHtml) ? MOM_DEFAULT_HTML : template.contentHtml;

  return (
    <div className="w-full min-h-screen bg-slate-50">
      <div className="w-full space-y-6 fade-up p-4 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">MOM Template Designer</h2>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.confirm("Reset to default template? This will overwrite your current changes.")) {
                  setTemplate(prev => ({ ...prev, contentHtml: MOM_DEFAULT_HTML }));
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all"
            >
              <RotateCcw size={16} />
              <span>Reset Template</span>
            </button>
          </div>
        </div>


        <div className="relative">
          <WordLikeEditor
            key={template?._id || "loading"}
            title="MOM Master Editor"
            subtitle="Changes are automatically synced to your workspace."
            initialContent={initialEditorContent}
            loading={loading}
            saving={saving}
            onSave={saveTemplate}
            onUploadImage={handleUploadImage}
            autoSave
            fullWidth={true}
          />
        </div>
      </div>
    </div>
  );
}
