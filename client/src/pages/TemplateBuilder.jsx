import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import API from "../api/api";
import WordLikeEditor from "../components/editor/WordLikeEditor";

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

  return (
    <div className="page-shell">
      <div className="page-container fade-up">
        <WordLikeEditor
          title={template?.title || "MOM Word Editor"}
          subtitle=""
          initialContent={template?.contentHtml || "<p></p>"}
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
