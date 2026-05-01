import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import API from "../api/api";
import { toast } from "react-hot-toast";

const emptyAttendee = () => ({ srNo: "", name: "", designation: "", department: "", status: "Present" });
const emptyAbsentee = () => ({ name: "", reason: "" });
const emptyAgenda = () => ({ itemNo: "", agendaTopic: "", owner: "" });
const emptyDiscussion = () => ({ agendaId: "", keyDiscussionPoints: "", decisionTaken: "" });
const emptyActionItem = () => ({ srNo: "", task: "", assignedTo: "", priority: "Medium", deadline: "", status: "Open" });
const emptyRisk = () => ({ srNo: "", risk: "", impact: "Medium", owner: "", resolutionPlan: "" });
const emptyApproval = () => ({ subject: "", approvedBy: "", date: "" });

export default function CreateMom() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [form, setForm] = useState({
    meetingTitle: "",
    meetingType: "",
    date: "",
    time: "",
    duration: "",
    venue: "",
    calledBy: "",
    chairedBy: "",
    preparedBy: "",
    referenceId: "",
    objective: "",
    nextMeetingDate: "",
    nextMeetingTime: "",
    nextMeetingPurpose: "",
    closingRemarks: "",
    signOffPreparedBy: "",
    signOffReviewedBy: "",
    signOffApprovedBy: ""
  });

  const [attendeesList, setAttendeesList] = useState([emptyAttendee()]);
  const [absenteesList, setAbsenteesList] = useState([]);
  const [agendaItemsList, setAgendaItemsList] = useState([emptyAgenda()]);
  const [discussionSummary, setDiscussionSummary] = useState([emptyDiscussion()]);
  const [actionItems, setActionItems] = useState([emptyActionItem()]);
  const [risks, setRisks] = useState([emptyRisk()]);
  const [approvals, setApprovals] = useState([emptyApproval()]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) return;
      try {
        const [meetingRes, momRes] = await Promise.all([
          API.get(`/meeting/${id}`).catch(() => null),
          API.get(`/mom/${id}`).catch(() => null)
        ]);
        
        if (cancelled) return;
        
        const m = meetingRes?.data;
        const existingMom = momRes?.data;
        
        if (m) setMeeting(m);

        if (existingMom) {
          // Load existing MOM
          setForm({
            meetingTitle: existingMom.meetingTitle || m?.title || "",
            meetingType: existingMom.meetingType || "",
            date: existingMom.date ? new Date(existingMom.date).toISOString().split('T')[0] : (m?.date ? new Date(m.date).toISOString().split('T')[0] : ""),
            time: existingMom.time || m?.startTime || "",
            duration: existingMom.duration || "",
            venue: existingMom.venue || m?.location || m?.platform || "",
            calledBy: existingMom.calledBy || "",
            chairedBy: existingMom.chairedBy || "",
            preparedBy: existingMom.preparedBy || "",
            referenceId: existingMom.referenceId || "",
            objective: existingMom.objective || "",
            nextMeetingDate: existingMom.nextMeetingDate ? new Date(existingMom.nextMeetingDate).toISOString().split('T')[0] : "",
            nextMeetingTime: existingMom.nextMeetingTime || "",
            nextMeetingPurpose: existingMom.nextMeetingPurpose || "",
            closingRemarks: existingMom.closingRemarks || "",
            signOffPreparedBy: existingMom.signOffPreparedBy || "",
            signOffReviewedBy: existingMom.signOffReviewedBy || "",
            signOffApprovedBy: existingMom.signOffApprovedBy || ""
          });

          if (existingMom.attendeesList?.length) setAttendeesList(existingMom.attendeesList);
          if (existingMom.absenteesList?.length) setAbsenteesList(existingMom.absenteesList);
          if (existingMom.agendaItemsList?.length) setAgendaItemsList(existingMom.agendaItemsList);
          if (existingMom.discussionSummary?.length) setDiscussionSummary(existingMom.discussionSummary);
          
          if (existingMom.actionItems?.length) {
            setActionItems(existingMom.actionItems.map(i => ({
              ...i,
              deadline: i.deadline ? new Date(i.deadline).toISOString().split('T')[0] : ""
            })));
          }
          if (existingMom.risks?.length) setRisks(existingMom.risks);
          if (existingMom.approvals?.length) {
            setApprovals(existingMom.approvals.map(i => ({
              ...i,
              date: i.date ? new Date(i.date).toISOString().split('T')[0] : ""
            })));
          }
          if (existingMom.attachments) setAttachments(existingMom.attachments);
          
        } else if (m) {
          // Pre-fill from Meeting
          setForm(prev => ({
            ...prev,
            meetingTitle: m.title || "",
            date: m.date ? new Date(m.date).toISOString().split('T')[0] : "",
            time: m.startTime || "",
            venue: m.location || m.platform || "",
            objective: m.agenda || "",
          }));

          if (m.participants?.length) {
            const mappedAttendees = m.participants.map((p, i) => ({
              srNo: String(i + 1),
              name: p.name || p.email,
              designation: "",
              department: "",
              status: p.status === "joined" ? "Present" : "Absent"
            }));
            setAttendeesList(mappedAttendees);
          }
          if (m.agendaItems?.length) {
             setAgendaItemsList(m.agendaItems.map((a, i) => ({
               itemNo: String(i+1), agendaTopic: a.title, owner: a.owner
             })));
          }
        }
      } catch (err) {
        if (!cancelled) setError("Failed to load meeting details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleArrayChange = (setter) => (idx, field, value) => {
    setter(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  
  const addRow = (setter, emptyFn) => setter(prev => [...prev, emptyFn()]);
  const removeRow = (setter) => (idx) => setter(prev => prev.filter((_, i) => i !== idx));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        meetingId: id,
        ...form,
        attendeesList,
        absenteesList,
        agendaItemsList,
        discussionSummary,
        actionItems,
        risks,
        approvals,
        attachmentIds: attachments.map(a => a._id)
      };

      await API.post("/create-mom", payload);
      toast.success("MOM Created Successfully!");
      navigate(`/meeting/${id}`);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create MOM.");
      toast.error("Failed to save MOM");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="page-shell bg-slate-50 min-h-screen py-8">
      <div className="page-container-compact fade-up">
        
        <div className="mb-6 flex items-center justify-between">
          <Link className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2" to={`/meeting/${id}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Meeting
          </Link>
          <button onClick={onSubmit} disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50">
            {saving ? "Saving..." : "Save MOM"}
          </button>
        </div>

        {error && <div className="mb-4 bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">{error}</div>}

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* Header */}
          <div className="bg-slate-900 text-white p-8 text-center border-b-4 border-blue-500">
            <h1 className="text-3xl font-semibold mb-2">Minutes of Meeting (MOM) Report</h1>
            <p className="text-slate-300 font-medium">Official Meeting Record</p>
          </div>

          <form onSubmit={onSubmit} className="p-8 space-y-10">
            
            {/* 1. Meeting Details */}
            <section>
              <h2 className="text-lg font-bold text-blue-900 mb-4 border-b pb-2">1. Meeting Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Meeting Title" name="meetingTitle" value={form.meetingTitle} onChange={handleFormChange} />
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Meeting Type</label>
                  <select name="meetingType" value={form.meetingType} onChange={handleFormChange} className="w-full border-slate-200 rounded-xl p-2.5 text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Select...</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Review">Review</option>
                    <option value="Strategy">Strategy</option>
                    <option value="Client">Client</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Board Meeting">Board Meeting</option>
                  </select>
                </div>
                <Input label="Date" type="date" name="date" value={form.date} onChange={handleFormChange} />
                <Input label="Time" type="time" name="time" value={form.time} onChange={handleFormChange} />
                <Input label="Duration (e.g., 1 Hr)" name="duration" value={form.duration} onChange={handleFormChange} />
                <Input label="Venue / Platform" name="venue" value={form.venue} onChange={handleFormChange} placeholder="Zoom / Conference Room" />
                <Input label="Meeting Called By" name="calledBy" value={form.calledBy} onChange={handleFormChange} />
                <Input label="Meeting Chaired By" name="chairedBy" value={form.chairedBy} onChange={handleFormChange} />
                <Input label="MOM Prepared By" name="preparedBy" value={form.preparedBy} onChange={handleFormChange} />
                <Input label="Reference ID" name="referenceId" value={form.referenceId} onChange={handleFormChange} placeholder="MOM-DEPT-DATE-001" />
              </div>
            </section>

            {/* 2. Attendees */}
            <section>
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-lg font-bold text-blue-900">2. Attendees</h2>
                <button type="button" onClick={() => addRow(setAttendeesList, emptyAttendee)} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">+ Add Attendee</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                    <tr>
                      <th className="p-3 w-16">Sr No</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Designation</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendeesList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2"><input value={item.srNo} onChange={e => handleArrayChange(setAttendeesList)(idx, 'srNo', e.target.value)} className="w-full p-2 border rounded" placeholder={idx+1}/></td>
                        <td className="p-2"><input value={item.name} onChange={e => handleArrayChange(setAttendeesList)(idx, 'name', e.target.value)} className="w-full p-2 border rounded" /></td>
                        <td className="p-2"><input value={item.designation} onChange={e => handleArrayChange(setAttendeesList)(idx, 'designation', e.target.value)} className="w-full p-2 border rounded" /></td>
                        <td className="p-2"><input value={item.department} onChange={e => handleArrayChange(setAttendeesList)(idx, 'department', e.target.value)} className="w-full p-2 border rounded" /></td>
                        <td className="p-2">
                          <select value={item.status} onChange={e => handleArrayChange(setAttendeesList)(idx, 'status', e.target.value)} className="w-full p-2 border rounded bg-white">
                            <option>Present</option><option>Absent</option><option>Excused</option>
                          </select>
                        </td>
                        <td className="p-2 text-center"><button type="button" onClick={() => removeRow(setAttendeesList)(idx)} className="text-red-400 hover:text-red-600">×</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Absentees */}
              <div className="mt-6 flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-slate-700">Absentees / Leave</h3>
                <button type="button" onClick={() => addRow(setAbsenteesList, emptyAbsentee)} className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">+ Add Absentee</button>
              </div>
              {absenteesList.length > 0 && (
                <table className="w-full text-sm text-left border rounded-xl overflow-hidden">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b">
                    <tr><th className="p-3 w-1/3">Name</th><th className="p-3">Reason</th><th className="p-3 w-10"></th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {absenteesList.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2"><input value={item.name} onChange={e => handleArrayChange(setAbsenteesList)(idx, 'name', e.target.value)} className="w-full p-2 border rounded" /></td>
                        <td className="p-2"><input value={item.reason} onChange={e => handleArrayChange(setAbsenteesList)(idx, 'reason', e.target.value)} className="w-full p-2 border rounded" /></td>
                        <td className="p-2 text-center"><button type="button" onClick={() => removeRow(setAbsenteesList)(idx)} className="text-red-400 hover:text-red-600">×</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {/* 3. Meeting Objective */}
            <section>
              <h2 className="text-lg font-bold text-blue-900 mb-4 border-b pb-2">3. Meeting Objective</h2>
              <textarea name="objective" value={form.objective} onChange={handleFormChange} className="w-full min-h-[100px] border-slate-200 rounded-xl p-4 text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Clearly mention the purpose of the meeting...&#10;Example:&#10;- Review current project progress&#10;- Discuss pending issues" />
            </section>

            {/* 4. Agenda Items */}
            <section>
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-lg font-bold text-blue-900">4. Agenda Items</h2>
                <button type="button" onClick={() => addRow(setAgendaItemsList, emptyAgenda)} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">+ Add Agenda</button>
              </div>
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                  <tr><th className="p-3 w-20">Item No</th><th className="p-3">Agenda Topic</th><th className="p-3 w-1/4">Owner</th><th className="p-3 w-10"></th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {agendaItemsList.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2"><input value={item.itemNo} onChange={e => handleArrayChange(setAgendaItemsList)(idx, 'itemNo', e.target.value)} className="w-full p-2 border rounded" placeholder={idx+1}/></td>
                      <td className="p-2"><input value={item.agendaTopic} onChange={e => handleArrayChange(setAgendaItemsList)(idx, 'agendaTopic', e.target.value)} className="w-full p-2 border rounded" /></td>
                      <td className="p-2"><input value={item.owner} onChange={e => handleArrayChange(setAgendaItemsList)(idx, 'owner', e.target.value)} className="w-full p-2 border rounded" /></td>
                      <td className="p-2 text-center"><button type="button" onClick={() => removeRow(setAgendaItemsList)(idx)} className="text-red-400 hover:text-red-600">×</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* 5. Discussion Summary */}
            <section>
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-lg font-bold text-blue-900">5. Discussion Summary</h2>
                <button type="button" onClick={() => addRow(setDiscussionSummary, emptyDiscussion)} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">+ Add Point</button>
              </div>
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                  <tr><th className="p-3 w-24">Agenda</th><th className="p-3">Key Discussion Points</th><th className="p-3 w-1/3">Decision Taken</th><th className="p-3 w-10"></th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {discussionSummary.map((item, idx) => (
                    <tr key={idx} className="align-top">
                      <td className="p-2"><input value={item.agendaId} onChange={e => handleArrayChange(setDiscussionSummary)(idx, 'agendaId', e.target.value)} className="w-full p-2 border rounded" placeholder="1"/></td>
                      <td className="p-2"><textarea value={item.keyDiscussionPoints} onChange={e => handleArrayChange(setDiscussionSummary)(idx, 'keyDiscussionPoints', e.target.value)} className="w-full p-2 border rounded min-h-[60px]" /></td>
                      <td className="p-2"><textarea value={item.decisionTaken} onChange={e => handleArrayChange(setDiscussionSummary)(idx, 'decisionTaken', e.target.value)} className="w-full p-2 border rounded min-h-[60px]" /></td>
                      <td className="p-2 text-center pt-4"><button type="button" onClick={() => removeRow(setDiscussionSummary)(idx)} className="text-red-400 hover:text-red-600">×</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* 6. Action Items Tracker */}
            <section>
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-lg font-bold text-blue-900">6. Action Items Tracker</h2>
                <button type="button" onClick={() => addRow(setActionItems, emptyActionItem)} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">+ Add Action</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[700px]">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                    <tr>
                      <th className="p-3 w-16">Sr No</th>
                      <th className="p-3 w-1/3">Task / Action Item</th>
                      <th className="p-3">Assigned To</th>
                      <th className="p-3 w-28">Priority</th>
                      <th className="p-3 w-36">Deadline</th>
                      <th className="p-3 w-32">Status</th>
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {actionItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2"><input value={item.srNo} onChange={e => handleArrayChange(setActionItems)(idx, 'srNo', e.target.value)} className="w-full p-2 border rounded" placeholder={idx+1}/></td>
                        <td className="p-2"><input value={item.task} onChange={e => handleArrayChange(setActionItems)(idx, 'task', e.target.value)} className="w-full p-2 border rounded" /></td>
                        <td className="p-2"><input value={item.assignedTo} onChange={e => handleArrayChange(setActionItems)(idx, 'assignedTo', e.target.value)} className="w-full p-2 border rounded" /></td>
                        <td className="p-2">
                          <select value={item.priority} onChange={e => handleArrayChange(setActionItems)(idx, 'priority', e.target.value)} className="w-full p-2 border rounded bg-white">
                            <option>High</option><option>Medium</option><option>Low</option>
                          </select>
                        </td>
                        <td className="p-2"><input type="date" value={item.deadline} onChange={e => handleArrayChange(setActionItems)(idx, 'deadline', e.target.value)} className="w-full p-2 border rounded" /></td>
                        <td className="p-2">
                          <select value={item.status} onChange={e => handleArrayChange(setActionItems)(idx, 'status', e.target.value)} className="w-full p-2 border rounded bg-white">
                            <option>Open</option><option>In Progress</option><option>Closed</option>
                          </select>
                        </td>
                        <td className="p-2 text-center"><button type="button" onClick={() => removeRow(setActionItems)(idx)} className="text-red-400 hover:text-red-600">×</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 7. Risks / Issues Raised */}
            <section>
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-lg font-bold text-blue-900">7. Risks / Issues Raised</h2>
                <button type="button" onClick={() => addRow(setRisks, emptyRisk)} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">+ Add Risk</button>
              </div>
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                  <tr>
                    <th className="p-3 w-16">Sr No</th>
                    <th className="p-3">Risk / Issue</th>
                    <th className="p-3 w-28">Impact</th>
                    <th className="p-3 w-1/4">Owner</th>
                    <th className="p-3 w-1/4">Resolution Plan</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {risks.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2"><input value={item.srNo} onChange={e => handleArrayChange(setRisks)(idx, 'srNo', e.target.value)} className="w-full p-2 border rounded" placeholder={idx+1}/></td>
                      <td className="p-2"><input value={item.risk} onChange={e => handleArrayChange(setRisks)(idx, 'risk', e.target.value)} className="w-full p-2 border rounded" /></td>
                      <td className="p-2">
                        <select value={item.impact} onChange={e => handleArrayChange(setRisks)(idx, 'impact', e.target.value)} className="w-full p-2 border rounded bg-white">
                          <option>High</option><option>Medium</option><option>Low</option>
                        </select>
                      </td>
                      <td className="p-2"><input value={item.owner} onChange={e => handleArrayChange(setRisks)(idx, 'owner', e.target.value)} className="w-full p-2 border rounded" /></td>
                      <td className="p-2"><input value={item.resolutionPlan} onChange={e => handleArrayChange(setRisks)(idx, 'resolutionPlan', e.target.value)} className="w-full p-2 border rounded" /></td>
                      <td className="p-2 text-center"><button type="button" onClick={() => removeRow(setRisks)(idx)} className="text-red-400 hover:text-red-600">×</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* 8. Approvals / Confirmations */}
            <section>
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-lg font-bold text-blue-900">8. Approvals / Confirmations</h2>
                <button type="button" onClick={() => addRow(setApprovals, emptyApproval)} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">+ Add Approval</button>
              </div>
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                  <tr><th className="p-3">Subject</th><th className="p-3 w-1/3">Approved By</th><th className="p-3 w-40">Date</th><th className="p-3 w-10"></th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {approvals.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2"><input value={item.subject} onChange={e => handleArrayChange(setApprovals)(idx, 'subject', e.target.value)} className="w-full p-2 border rounded" /></td>
                      <td className="p-2"><input value={item.approvedBy} onChange={e => handleArrayChange(setApprovals)(idx, 'approvedBy', e.target.value)} className="w-full p-2 border rounded" /></td>
                      <td className="p-2"><input type="date" value={item.date} onChange={e => handleArrayChange(setApprovals)(idx, 'date', e.target.value)} className="w-full p-2 border rounded" /></td>
                      <td className="p-2 text-center"><button type="button" onClick={() => removeRow(setApprovals)(idx)} className="text-red-400 hover:text-red-600">×</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* 9. Next Meeting Schedule */}
            <section>
              <h2 className="text-lg font-bold text-blue-900 mb-4 border-b pb-2">9. Next Meeting Schedule</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Next Meeting Date" type="date" name="nextMeetingDate" value={form.nextMeetingDate} onChange={handleFormChange} />
                <Input label="Time" type="time" name="nextMeetingTime" value={form.nextMeetingTime} onChange={handleFormChange} />
                <Input label="Purpose" name="nextMeetingPurpose" value={form.nextMeetingPurpose} onChange={handleFormChange} />
              </div>
            </section>

            {/* 10. Closing Remarks */}
            <section>
              <h2 className="text-lg font-bold text-blue-900 mb-4 border-b pb-2">10. Closing Remarks</h2>
              <textarea name="closingRemarks" value={form.closingRemarks} onChange={handleFormChange} className="w-full min-h-[80px] border-slate-200 rounded-xl p-4 text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Summarize final comments, commitments, and expectations..." />
            </section>

            {/* 11. Prepared & Approved By */}
            <section>
              <h2 className="text-lg font-bold text-blue-900 mb-4 border-b pb-2">11. Prepared & Approved By</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Prepared By</label>
                  <input className="w-full text-center border-b-2 border-slate-300 bg-transparent py-2 focus:border-blue-500 outline-none font-medium" name="signOffPreparedBy" value={form.signOffPreparedBy} onChange={handleFormChange} />
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Reviewed By</label>
                  <input className="w-full text-center border-b-2 border-slate-300 bg-transparent py-2 focus:border-blue-500 outline-none font-medium" name="signOffReviewedBy" value={form.signOffReviewedBy} onChange={handleFormChange} />
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Approved By</label>
                  <input className="w-full text-center border-b-2 border-slate-300 bg-transparent py-2 focus:border-blue-500 outline-none font-medium" name="signOffApprovedBy" value={form.signOffApprovedBy} onChange={handleFormChange} />
                </div>
              </div>
            </section>

            {/* 12. Confidentiality Note */}
            <section className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs text-center font-medium">
              <strong>12. Confidentiality Note:</strong> This MOM contains internal business discussions and confidential information. Unauthorized sharing is prohibited.
            </section>

            {/* Attachments Section (Bonus) */}
            <section>
              <h2 className="text-lg font-bold text-blue-900 mb-4 border-b pb-2">Attachments (Images/Files)</h2>
              <input
                type="file" multiple disabled={!id || uploading}
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  if (!files.length || !id) return;
                  setUploading(true);
                  try {
                    const uploaded = [];
                    for (const f of files) {
                      const fd = new FormData();
                      fd.append("file", f); fd.append("entityType", "mom"); fd.append("entityId", id);
                      const res = await API.post("/attachments", fd);
                      if (res.data?._id) uploaded.push(res.data);
                    }
                    setAttachments(prev => [...uploaded, ...prev]);
                    e.target.value = "";
                  } catch (err) {
                    toast.error("Failed to upload image.");
                  } finally {
                    setUploading(false);
                  }
                }}
                className="mb-4"
              />
              {uploading && <p className="text-xs text-blue-500 mb-2">Uploading...</p>}
              {attachments.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {attachments.map(a => (
                    <div key={a._id} className="relative group border rounded-xl overflow-hidden shadow-sm">
                      <img src={`${API.defaults.baseURL}${a.urlPath}`} alt={a.originalName} className="h-24 w-full object-cover" onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=File' }} />
                      <button type="button" onClick={() => setAttachments(prev => prev.filter(x => x._id !== a._id))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </form>
        </div>
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 mb-1">{label}</label>
      <input className="w-full border-slate-200 rounded-xl p-2.5 text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" {...props} />
    </div>
  );
}
