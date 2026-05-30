import React, { useEffect, useState } from "react";
import API from "../api/api";
import { toast } from "react-hot-toast";

export default function PeopleSidebarDrawer({ open, onClose, onSelect }) {
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("contacts"); // "contacts" | "groups"

  useEffect(() => {
    if (!open) return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [contactsRes, groupsRes] = await Promise.all([
          API.get("/contacts"),
          API.get("/contacts/groups")
        ]);
        setContacts(contactsRes.data || []);
        setGroups(groupsRes.data || []);
      } catch (err) {
        toast.error("Failed to load directory");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [open]);

  const handleSelectGroup = (group) => {
    if (!group.members || group.members.length === 0) {
      toast.error("Group has no members");
      return;
    }
    group.members.forEach(member => {
      onSelect({ ...member, _source: "contact" });
    });
    toast.success(`Added ${group.members.length} members from ${group.groupName}`);
  };

  if (!open) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-[1px] z-[100] transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-white shadow-2xl z-[110] transform transition-transform flex flex-col border-l border-slate-200 animate-slide-in-right">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            People Directory
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex border-b border-slate-200 shrink-0">
          <button 
            className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'contacts' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            onClick={() => setActiveTab('contacts')}
          >
            Contacts
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'groups' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            onClick={() => setActiveTab('groups')}
          >
            Groups
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/30">
          {loading ? (
            <div className="text-center text-sm text-slate-500 py-10">Loading...</div>
          ) : activeTab === "contacts" ? (
            contacts.length > 0 ? (
              <div className="space-y-2">
                {contacts.map(c => (
                  <button 
                    key={c._id} 
                    onClick={() => {
                      onSelect({ ...c, _source: "contact" });
                      toast.success(`Added ${c.name}`);
                    }}
                    className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all text-left group"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 text-sm group-hover:text-indigo-700 transition-colors">{c.name}</div>
                      <div className="text-xs text-slate-500">{c.email}</div>
                    </div>
                    <svg className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center text-sm text-slate-500 py-10">No contacts found in directory.</div>
            )
          ) : (
            groups.length > 0 ? (
              <div className="space-y-2">
                {groups.map(g => (
                  <button 
                    key={g._id} 
                    onClick={() => handleSelectGroup(g)}
                    className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all text-left group"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 text-sm group-hover:text-indigo-700 transition-colors">{g.groupName}</div>
                      <div className="text-xs text-slate-500">{g.members?.length || 0} members</div>
                    </div>
                    <svg className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center text-sm text-slate-500 py-10">No contact groups found.</div>
            )
          )}
        </div>
      </div>
    </>
  );
}
