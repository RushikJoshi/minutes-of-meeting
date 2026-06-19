import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../../api/api";
import toast from "react-hot-toast";

export default function Organizations() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrganizations = async () => {
    try {
      const res = await API.get("/organizations");
      setOrganizations(res.data);
    } catch (err) {
      toast.error("Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleDeactivate = async (id) => {
    if (!window.confirm("Are you sure you want to deactivate this organization?")) return;
    try {
      await API.delete(`/organizations/${id}`);
      toast.success("Organization deactivated");
      fetchOrganizations();
    } catch (err) {
      toast.error("Failed to deactivate organization");
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading organizations...</div>;

  return (
    <div className="w-full fade-up">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
          <p className="mt-1 text-sm text-gray-500">Manage all registered organizations on the platform.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/super-admin/organizations/new"
            className="inline-flex items-center justify-center rounded-xl border border-transparent bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-all hover:-translate-y-0.5"
          >
            + Add Organization
          </Link>
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow-sm border border-slate-200 rounded-2xl">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="py-4 pl-4 pr-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider sm:pl-6">Company</th>
                    <th className="px-3 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Industry</th>
                    <th className="px-3 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                    <th className="px-3 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="relative py-4 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {organizations.map((org) => (
                    <tr key={org._id} className="hover:bg-slate-50 transition-colors">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                            {org.name.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="font-bold text-slate-900">{org.name}</div>
                            <div className="text-slate-500 text-xs mt-0.5 font-medium">Code: {org.organizationCode} | ID: {org._id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-slate-600">
                        {org.industry || "-"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <div className="font-medium text-slate-900">{org.email || "-"}</div>
                        <div className="text-slate-500">{org.phone || "-"}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${org.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {org.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex justify-end gap-3">
                          <Link to={`/super-admin/organizations/${org._id}`} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                            Edit
                          </Link>
                          {org.isActive && (
                            <button onClick={() => handleDeactivate(org._id)} className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
                              Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {organizations.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-12 text-center">
                        <div className="text-slate-400 mb-2">
                          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-slate-500">No organizations found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
