import { toast } from "react-hot-toast";
import { adminService } from "../../services/adminService";
import Table from "../common/Table";
import Modal from "../common/Modal";
import FileUploader from "../common/FileUploader";

const StudentsManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ page: 1, limit: 20 });
  const [pagination, setPagination] = useState({});
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    loadStudents();
  }, [filters]);

  const loadStudents = async () => {
    try {
      const response = await adminService.getStudents(filters);
      setStudents(response.data);
      setPagination(response.pagination);
    } catch (error) {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkImport = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setImporting(true);
    try {
      const result = await adminService.bulkImportStudents(formData);
      setImportResult(result.data);
      toast.success(`Imported ${result.data.successful} students successfully`);
      loadStudents(); // Refresh list
    } catch (error) {
      toast.error("Bulk import failed");
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  const columns = [
    { key: "user.name", label: "Name", sortable: true },
    { key: "rollNumber", label: "Roll Number", sortable: true },
    { key: "department.name", label: "Department" },
    { key: "course.name", label: "Course" },
    { key: "semester", label: "Semester" },
    { key: "section", label: "Section" },
    { key: "cgpa", label: "CGPA", render: (value) => value?.toFixed(2) || "N/A" },
    { key: "user.isActive", label: "Status", render: (value) => value ? "Active" : "Inactive" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="page-title">Students Management</h1>
          <p className="page-subtitle">Manage student records and bulk operations</p>
        </div>
        <button
          onClick={() => setShowBulkImport(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Bulk Import CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search by name or email"
            className="input"
            value={filters.search || ""}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
          />
          <select
            className="input"
            value={filters.department || ""}
            onChange={(e) => setFilters({ ...filters, department: e.target.value, page: 1 })}
          >
            <option value="">All Departments</option>
            {/* Add department options */}
          </select>
          <select
            className="input"
            value={filters.semester || ""}
            onChange={(e) => setFilters({ ...filters, semester: e.target.value, page: 1 })}
          >
            <option value="">All Semesters</option>
            {[1,2,3,4,5,6,7,8].map(sem => <option key={sem} value={sem}>{sem}</option>)}
          </select>
          <select
            className="input"
            value={filters.limit || 20}
            onChange={(e) => setFilters({ ...filters, limit: e.target.value, page: 1 })}
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="card">
        <Table
          columns={columns}
          data={students}
          loading={loading}
          pagination={pagination}
          onPageChange={(page) => setFilters({ ...filters, page })}
        />
      </div>

      {/* Bulk Import Modal */}
      <Modal
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        title="Bulk Import Students"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Upload a CSV file with student data. Required columns: name, email, password, rollNumber, department, course, semester, section
          </p>

          <FileUploader
            accept=".csv"
            onFileSelect={handleBulkImport}
            loading={importing}
            loadingText="Importing students..."
          />

          {importResult && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Import Results</h4>
              <p>Total processed: {importResult.total}</p>
              <p>Successful: {importResult.successful}</p>
              <p>Errors: {importResult.errors.length}</p>
              {importResult.errors.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-red-600">View Errors</summary>
                  <ul className="mt-2 space-y-1">
                    {importResult.errors.map((error, index) => (
                      <li key={index} className="text-sm text-red-600">
                        Row {error.row}: {error.error}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}

          <div className="text-xs text-gray-500">
            <p>CSV Format Example:</p>
            <pre className="bg-gray-100 p-2 rounded mt-1">
              name,email,password,rollNumber,department,course,semester,section
              John Doe,john@example.com,password123,CS001,Computer Science,B.Tech CS,1,A
            </pre>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudentsManagement;