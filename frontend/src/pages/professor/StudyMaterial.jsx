import { useState } from "react";
import Modal from "../../components/common/Modal";
import FileUploader from "../../components/common/FileUploader";
import { formatDate, getFileIcon } from "../../utils/helpers";
import { professorService } from "../../services/professorService";
import toast from "react-hot-toast";

const mockSubjects = [
  { _id: "1", name: "Algorithms", code: "CS401" },
  { _id: "2", name: "Operating Systems", code: "CS402" },
];

const mockMaterials = {
  "1": [
    { _id: "m1", title: "Unit 1 - Sorting Algorithms", type: "notes", fileUrl: "#", fileName: "unit1-sorting.pdf", uploadedAt: new Date(Date.now() - 2 * 86400000), isArchived: false },
    { _id: "m2", title: "Lab Manual 2024", type: "lab-manual", fileUrl: "#", fileName: "lab-manual.pdf", uploadedAt: new Date(Date.now() - 7 * 86400000), isArchived: false },
  ],
  "2": [
    { _id: "m3", title: "Process Scheduling Notes", type: "notes", fileUrl: "#", fileName: "scheduling.pdf", uploadedAt: new Date(Date.now() - 5 * 86400000), isArchived: false },
  ],
};

const typeConfig = {
  notes:       { label: "Notes",       icon: "📄", color: "bg-blue-100 text-blue-700"   },
  "lab-manual":{ label: "Lab Manual",  icon: "🔬", color: "bg-green-100 text-green-700" },
  slides:      { label: "Slides",      icon: "📊", color: "bg-purple-100 text-purple-700"},
  reference:   { label: "Reference",   icon: "📚", color: "bg-amber-100 text-amber-700" },
};

const StudyMaterial = () => {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [uploadModal, setUploadModal]         = useState(false);
  const [saving, setSaving]                   = useState(false);
  const [file, setFile]                       = useState(null);
  const [form, setForm]                       = useState({ title: "", type: "notes", description: "" });

  const materials = selectedSubject ? (mockMaterials[selectedSubject._id] || []) : [];

  const handleUpload = async () => {
    if (!file || !form.title) { toast.error("Title and file required"); return; }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      await professorService.uploadStudyMaterial(selectedSubject._id, formData);
      toast.success("Material uploaded! 📚");
      setUploadModal(false);
      setFile(null);
      setForm({ title: "", type: "notes", description: "" });
    } catch { toast.error("Upload failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="page-title">Study Material</h1><p className="page-subtitle">Upload and manage study resources</p></div>
        {selectedSubject && <button onClick={() => setUploadModal(true)} className="btn-primary">➕ Upload Material</button>}
      </div>

      <div className="flex flex-wrap gap-3">
        {mockSubjects.map((sub) => (
          <button key={sub._id} onClick={() => setSelectedSubject(sub)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all
              ${selectedSubject?._id === sub._id ? "border-primary-500 bg-primary-50 text-primary-700" : "border-gray-200 bg-white text-gray-600 hover:border-primary-300"}`}>
            📚 {sub.name} <span className="font-mono text-xs">({sub.code})</span>
          </button>
        ))}
      </div>

      {selectedSubject ? (
        <div className="space-y-3">
          {materials.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-3">📭</div>
              <p className="font-medium text-gray-600">No materials uploaded yet</p>
              <button onClick={() => setUploadModal(true)} className="btn-primary mt-4 text-sm">Upload First Material</button>
            </div>
          ) : materials.map((material) => {
            const tConf = typeConfig[material.type] || typeConfig.notes;
            return (
              <div key={material._id} className="card flex items-center gap-4 py-4">
                <div className={`w-11 h-11 ${tConf.color} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>{tConf.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800 text-sm">{material.title}</p>
                    <span className={`badge text-[10px] ${tConf.color}`}>{tConf.label}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Uploaded {formatDate(material.uploadedAt)} · {getFileIcon(material.fileName.split(".").pop())} {material.fileName}</p>
                </div>
                <a href={material.fileUrl} className="btn-secondary text-xs py-1.5 px-3" download>📥</a>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center py-16"><div className="text-5xl mb-3">📚</div><p className="text-gray-500 font-medium">Select a subject to manage its study materials</p></div>
      )}

      <Modal isOpen={uploadModal} onClose={() => setUploadModal(false)} title="Upload Study Material" icon="📤"
        footer={<><button onClick={() => setUploadModal(false)} className="btn-secondary" disabled={saving}>Cancel</button><button onClick={handleUpload} className="btn-primary" disabled={saving || !file || !form.title}>{saving ? "Uploading..." : "📤 Upload"}</button></>}>
        <div className="space-y-4">
          <div><label className="label">Title *</label><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="e.g. Unit 3 Notes - Dynamic Programming" /></div>
          <div>
            <label className="label">Type</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(typeConfig).map(([key, conf]) => (
                <button key={key} onClick={() => setForm({ ...form, type: key })}
                  className={`p-2.5 rounded-xl border-2 text-center text-xs font-medium transition-all ${form.type === key ? "border-primary-400 bg-primary-50 text-primary-700" : "border-gray-100 text-gray-500 hover:border-gray-300"}`}>
                  <span className="block text-lg mb-0.5">{conf.icon}</span>{conf.label}
                </button>
              ))}
            </div>
          </div>
          <div><label className="label">Description (optional)</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field resize-none" rows={2} /></div>
          <FileUploader onFilesSelected={setFile} accept=".pdf,.pptx,.docx,.zip" allowedFormats={["pdf","pptx","docx","zip"]} maxSize={50} label="Upload file (PDF, PPTX, DOCX, ZIP)" />
        </div>
      </Modal>
    </div>
  );
};

export default StudyMaterial;