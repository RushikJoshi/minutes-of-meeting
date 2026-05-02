import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import API from "../api/api";
import WordLikeEditor from "../components/editor/WordLikeEditor";

const MOM_DEFAULT_HTML = `
  <h1 style="text-align: center;"><u>MEETING TITLE</u></h1>
  <br/>
  <div style="margin-bottom: 20px;">
    <p>📅 <strong>Date of Meeting :</strong> <span>[DATE]</span></p>
    <p>⏰ <strong>Time of Meeting :</strong> <span>[TIME]</span></p>
    <p>👤 <strong>From :</strong> <span>[CREATOR]</span></p>
    <p>👥 <strong>To :</strong> <span>[PARTICIPANTS]</span></p>
  </div>
  <br/>
  <p style="font-size: 12px; color: #94a3b8; margin-bottom: 8px;">
    (Tip: Click inside table cell → then use <strong>+</strong> buttons)
  </p>
  <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0;">
    <tr style="background-color: #f8fafc;">
      <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left; width: 50px;"><p>#</p></th>
      <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left;"><p>Discussion / Tasks</p></th>
      <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left; width: 150px;"><p>Complete Date</p></th>
      <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left; width: 150px;"><p>Responsible</p></th>
    </tr>
    <tr>
      <td style="border: 1px solid #e2e8f0; padding: 12px;"><p>1</p></td>
      <td style="border: 1px solid #e2e8f0; padding: 12px;"><p></p></td>
      <td style="border: 1px solid #e2e8f0; padding: 12px;"><p></p></td>
      <td style="border: 1px solid #e2e8f0; padding: 12px;"><p></p></td>
    </tr>
    <tr>
      <td style="border: 1px solid #e2e8f0; padding: 12px;"><p>2</p></td>
      <td style="border: 1px solid #e2e8f0; padding: 12px;"><p></p></td>
      <td style="border: 1px solid #e2e8f0; padding: 12px;"><p></p></td>
      <td style="border: 1px solid #e2e8f0; padding: 12px;"><p></p></td>
    </tr>
  </table>
  <br/>
  <div style="margin-top: 20px;">
    <p>📝 <strong>Additional Notes:</strong></p>
    <p><span>______________________________________________</span></p>
    <p><span>______________________________________________</span></p>
  </div>
  <br/><br/>
  <div style="display: flex; justify-content: space-between;">
    <p><strong>Prepared By :</strong> <span>______________________</span></p>
    <p><strong>Approved By :</strong> <span>______________________</span></p>
  </div>
  <p></p>
`;

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
    <div className="page-shell">
      <div className="page-container fade-up">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-800">MOM Template Builder</h2>
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to reset to the default template? This will overwrite your current changes.")) {
                setTemplate(prev => ({ ...prev, contentHtml: MOM_DEFAULT_HTML }));
              }
            }}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all"
          >
            Reset to Default
          </button>
        </div>
        <WordLikeEditor
          key={`${template?._id}-${template?.contentHtml?.length || 0}`}
          title={template?.title || "MOM Word Editor"}
          subtitle=""
          initialContent={initialEditorContent}
          loading={loading}
          saving={saving}
          onSave={saveTemplate}
          onUploadImage={handleUploadImage}
          autoSave
        />
      </div>
    </div>
  );
}
