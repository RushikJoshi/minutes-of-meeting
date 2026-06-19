import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../../api/api";
import toast from "react-hot-toast";

export default function OrganizationForm() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    organizationCode: "",
    industry: "",
    email: "",
    phone: "",
    address: "",
    adminName: "",
    adminEmail: "",
  });
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      const fetchOrg = async () => {
        try {
          const res = await API.get(`/organizations/${id}`);
          const org = res.data;
          setFormData({
            name: org.name || "",
            organizationCode: org.organizationCode || "",
            industry: org.industry || "",
            email: org.email || "",
            phone: org.phone || "",
            address: org.address || "",
            adminName: "", // Can't edit initial admin info easily here
            adminEmail: "",
          });
        } catch (err) {
          toast.error("Failed to load organization details");
          navigate("/super-admin/organizations");
        } finally {
          setLoading(false);
        }
      };
      fetchOrg();
    }
  }, [id, isEditMode, navigate]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditMode) {
        await API.put(`/organizations/${id}`, {
          name: formData.name,
          organizationCode: formData.organizationCode,
          industry: formData.industry,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
        });
        toast.success("Organization updated successfully");
      } else {
        await API.post("/organizations", formData);
        toast.success("Organization created. Invite email logic triggered.");
      }
      navigate("/super-admin/organizations");
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{isEditMode ? "Edit Organization" : "Add Organization"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200 bg-white p-8 shadow rounded-lg border border-gray-100">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Organization Details</h3>
            <p className="mt-1 text-sm text-gray-500">Basic information about the company.</p>
          </div>

          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Company Name *</label>
              <div className="mt-1">
                <input required type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="organizationCode" className="block text-sm font-medium text-gray-700">Organization Code *</label>
              <div className="mt-1">
                <input required type="text" name="organizationCode" id="organizationCode" value={formData.organizationCode} onChange={handleChange} disabled={isEditMode} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border disabled:bg-gray-100 disabled:text-gray-500" placeholder="e.g. GT001" />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700">Industry</label>
              <div className="mt-1">
                <input type="text" name="industry" id="industry" value={formData.industry} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
              <div className="mt-1">
                <input type="text" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
              </div>
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Company Email</label>
              <div className="mt-1">
                <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
              </div>
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
              <div className="mt-1">
                <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
              </div>
            </div>
          </div>
        </div>

        {!isEditMode && (
          <div className="pt-8 space-y-6">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">Organization Admin</h3>
              <p className="mt-1 text-sm text-gray-500">This user will receive an invite to manage the organization.</p>
            </div>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="adminName" className="block text-sm font-medium text-gray-700">Admin Name *</label>
                <div className="mt-1">
                  <input required type="text" name="adminName" id="adminName" value={formData.adminName} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700">Admin Email *</label>
                <div className="mt-1">
                  <input required type="email" name="adminEmail" id="adminEmail" value={formData.adminEmail} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="pt-5">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/super-admin/organizations")}
              className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Organization"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
