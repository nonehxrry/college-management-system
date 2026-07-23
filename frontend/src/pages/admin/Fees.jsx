import { useState } from "react";
import Table from "../../components/common/Table";
import Modal from "../../components/common/Modal";
import { formatDate, formatCurrency } from "../../utils/helpers";
import { adminService } from "../../services/adminService";
import toast from "react-hot-toast";

const MOCK_FEES = [
  { _id: "f1", student: "Aarav Sharma",  rollNumber: "CS40101", semester: 4, totalAmount: 45000, amountPaid: 45000, dueAmount: 0,     dueDate: new Date("2024-02-28"), status: "paid",    department: "CS" },
  { _id: "f2", student: "Priya Singh",   rollNumber: "CS40102", semester: 4, totalAmount: 45000, amountPaid: 30000, dueAmount: 15000, dueDate: new Date("2024-02-28"), status: "partial", department: "CS" },
  { _id: "f3", student: "Rahul Gupta",   rollNumber: "CS40103", semester: 4, totalAmount: 45000, amountPaid: 0,     dueAmount: 45000, dueDate: new Date("2024-01-31"), status: "overdue", department: "CS" },
  { _id: "f4", student: "Sneha Patel",   rollNumber: "CS40104", semester: 4, totalAmount: 45000, amountPaid: 0,     dueAmount: 45000, dueDate: new Date("2024-03-15"), status: "pending", department: "CS" },
  { _id: "f5", student: "Arjun Mehta",   rollNumber: "CS40105", semester: 4, totalAmount: 45000, amountPaid: 45000, dueAmount: 0,     dueDate: new Date("2024-02-28"), status: "paid",    department: "CS" },
];

const STATUS_CFG = {
  paid:    { label: "Paid",     badge: "badge-success", icon: "✅" },
  partial: { label: "Partial",  badge: "badge-warning", icon: "⚠️" },
  pending: { label: "Pending",  badge: "badge-info",    icon: "⏳" },
  overdue: { label: "Overdue",  badge: "badge-danger",  icon: "🚨" },
};

const FeeBreakdown = [
  { label: "Tuition Fee",   amount: 30000 },
  { label: "Exam Fee",      amount: 3000  },
  { label: "Development Fee",amount: 5000 },
  { label: "Library Fee",   amount: 2000  },
  { label: "Lab Fee",       amount: 3000  },
  { label: "Other",         amount: 2000  },
];

const Fees = () => {
  const [filterStatus, setFilterStatus] = useState("all");
  const [paymentModal, setPaymentModal]  = useState(false);
  const [createModal,  setCreateModal]   = useState(false);
  const [selected,     setSelected]      = useState(null);
  const [saving,       setSaving]        = useState(false);

  const [payment, setPayment] = useState({ amount: "", mode: "online", transactionId: "", remarks: "" });
  const [newFee,  setNewFee]  = useState({ studentId: "", semester: 4, academicYear: "2023-24" });

  const filtered = filterStatus === "all"
    ? MOCK_FEES
    : MOCK_FEES.filter((f) => f.status === filterStatus);

  const totalCollected  = MOCK_FEES.reduce((a, f) => a + f.amountPaid,  0);
  const totalDue        = MOCK_FEES.reduce((a, f) => a + f.dueAmount,   0);
  const totalAmount     = MOCK_FEES.reduce((a, f) => a + f.totalAmount, 0);
  const collectionRate  = Math.round((totalCollected / totalAmount) * 100);

  const handlePayment = async () => {
    if (!payment.amount || Number(payment.amount) <= 0) {
      toast.error("Enter a valid payment amount"); return;
    }
    if (Number(payment.amount) > selected.dueAmount) {
      toast.error(`Amount cannot exceed due amount (${formatCurrency(selected.dueAmount)})`); return;
    }
    setSaving(true);
    try {
      await adminService.updateFeePayment(selected._id, {
        amount:        Number(payment.amount),
        mode:          payment.mode,
        transactionId: payment.transactionId,
        remarks:       payment.remarks,
      });
      toast.success("Payment recorded successfully! ✅");
      setPaymentModal(false);
      setPayment({ amount: "", mode: "online", transactionId: "", remarks: "" });
    } catch { toast.error("Failed to record payment"); }
    finally { setSaving(false); }
  };

  const columns = [
    {
      header: "Student", accessor: "student", sortable: true,
      render: (val, row) => (
        <div>
          <p className="font-semibold text-gray-800 text-sm">{val}</p>
          <p className="text-xs text-gray-400">{row.rollNumber} · Sem {row.semester}</p>
        </div>
      ),
    },
    {
      header: "Total Fee", accessor: "totalAmount", sortable: true,
      render: (v) => <span className="font-semibold text-gray-700 text-sm">{formatCurrency(v)}</span>,
    },
    {
      header: "Paid / Due",
      render: (_, row) => (
        <div>
          <div className="flex gap-2 text-xs">
            <span className="text-emerald-600 font-semibold">{formatCurrency(row.amountPaid)}</span>
            <span className="text-gray-300">/</span>
            <span className="text-red-500 font-semibold">{formatCurrency(row.dueAmount)}</span>
          </div>
          <div className="w-24 bg-gray-100 rounded-full h-1.5 mt-1.5">
            <div
              className="h-1.5 rounded-full bg-emerald-500"
              style={{ width: `${(row.amountPaid / row.totalAmount) * 100}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      header: "Due Date", accessor: "dueDate", sortable: true,
      render: (v, row) => (
        <span className={`text-xs font-medium ${row.status === "overdue" ? "text-red-600" : "text-gray-600"}`}>
          {formatDate(v)}
        </span>
      ),
    },
    {
      header: "Status", accessor: "status",
      render: (v) => {
        const c = STATUS_CFG[v];
        return <span className={`badge ${c.badge} text-xs`}>{c.icon} {c.label}</span>;
      },
    },
    {
      header: "Actions",
      render: (_, row) =>
        row.status !== "paid" ? (
          <button
            onClick={() => { setSelected(row); setPaymentModal(true); }}
            className="btn-primary text-xs py-1.5 px-3"
          >
            💳 Record
          </button>
        ) : (
          <span className="text-xs text-gray-400 font-medium">Settled ✓</span>
        ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Fee Management</h1>
          <p className="page-subtitle">Track and manage student fee payments</p>
        </div>
        <button onClick={() => setCreateModal(true)} className="btn-primary text-sm py-2">
          ➕ Create Fee Record
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Billed",   value: formatCurrency(totalAmount),    color: "text-gray-700",     icon: "💰" },
          { label: "Collected",      value: formatCurrency(totalCollected), color: "text-emerald-600",  icon: "✅" },
          { label: "Outstanding",    value: formatCurrency(totalDue),       color: "text-red-600",      icon: "⚠️" },
          { label: "Collection Rate",value: `${collectionRate}%`,           color: "text-primary-600",  icon: "📊" },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="card text-center py-4">
            <div className="text-2xl mb-1">{icon}</div>
            <p className={`text-xl font-bold font-display ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Collection progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold text-gray-800 text-sm">Overall Collection Progress</p>
          <span className="text-sm font-bold text-primary-600">{collectionRate}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-primary-500 to-emerald-500 transition-all duration-700"
            style={{ width: `${collectionRate}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>₹0</span>
          <span>{formatCurrency(totalAmount)}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all",     label: "All",     count: MOCK_FEES.length },
          { key: "paid",    label: "✅ Paid",  count: MOCK_FEES.filter((f) => f.status === "paid").length    },
          { key: "partial", label: "⚠️ Partial",count: MOCK_FEES.filter((f) => f.status === "partial").length },
          { key: "pending", label: "⏳ Pending",count: MOCK_FEES.filter((f) => f.status === "pending").length },
          { key: "overdue", label: "🚨 Overdue",count: MOCK_FEES.filter((f) => f.status === "overdue").length },
        ].map(({ key, label, count }) => (
          <button key={key} onClick={() => setFilterStatus(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all
              ${filterStatus === key ? "bg-primary-600 text-white shadow-md" : "bg-white border border-gray-200 text-gray-600 hover:border-primary-300"}`}>
            {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${filterStatus === key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <Table columns={columns} data={filtered} searchable searchPlaceholder="Search students…" />
      </div>

      {/* ── Record Payment Modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={paymentModal}
        onClose={() => setPaymentModal(false)}
        title="Record Fee Payment"
        icon="💳"
        size="sm"
        footer={
          <>
            <button onClick={() => setPaymentModal(false)} className="btn-secondary" disabled={saving}>Cancel</button>
            <button onClick={handlePayment} className="btn-primary" disabled={saving || !payment.amount}>
              {saving ? "Recording…" : "✅ Confirm Payment"}
            </button>
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            {/* Student summary */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="font-semibold text-gray-900">{selected.student}</p>
              <p className="text-xs text-gray-500">{selected.rollNumber} · Semester {selected.semester}</p>
              <div className="flex gap-4 mt-2 text-xs">
                <span className="text-gray-500">Total: <strong className="text-gray-800">{formatCurrency(selected.totalAmount)}</strong></span>
                <span className="text-gray-500">Due: <strong className="text-red-600">{formatCurrency(selected.dueAmount)}</strong></span>
              </div>
            </div>

            <div>
              <label className="label">Amount (₹) *</label>
              <input type="number" value={payment.amount}
                onChange={(e) => setPayment({ ...payment, amount: e.target.value })}
                className="input-field text-xl font-bold"
                placeholder="0"
                min={1}
                max={selected.dueAmount}
              />
              <p className="text-xs text-gray-400 mt-1">Max: {formatCurrency(selected.dueAmount)}</p>
            </div>

            <div>
              <label className="label">Payment Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {["online", "cash", "cheque"].map((mode) => (
                  <button key={mode} type="button"
                    onClick={() => setPayment({ ...payment, mode })}
                    className={`py-2 rounded-xl border-2 text-xs font-semibold capitalize transition-all
                      ${payment.mode === mode ? "border-primary-400 bg-primary-50 text-primary-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                    {mode === "online" ? "💳" : mode === "cash" ? "💵" : "📝"} {mode}
                  </button>
                ))}
              </div>
            </div>

            {payment.mode !== "cash" && (
              <div>
                <label className="label">Transaction / Ref ID</label>
                <input type="text" value={payment.transactionId}
                  onChange={(e) => setPayment({ ...payment, transactionId: e.target.value })}
                  className="input-field" placeholder="TXN12345678" />
              </div>
            )}

            <div>
              <label className="label">Remarks (optional)</label>
              <input type="text" value={payment.remarks}
                onChange={(e) => setPayment({ ...payment, remarks: e.target.value })}
                className="input-field" placeholder="e.g. First instalment" />
            </div>

            {/* Fee breakdown */}
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs font-semibold text-gray-500 mb-2">Fee Breakdown</p>
              <div className="space-y-1.5">
                {FeeBreakdown.map(({ label, amount }) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium text-gray-700">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Create Fee Record Modal ───────────────────────────────────────────── */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="Create Fee Record"
        icon="💰"
        size="sm"
        footer={
          <>
            <button onClick={() => setCreateModal(false)} className="btn-secondary" disabled={saving}>Cancel</button>
            <button onClick={async () => {
              setSaving(true);
              try {
                await adminService.createFeeRecord(newFee);
                toast.success("Fee record created!");
                setCreateModal(false);
              } catch { toast.error("Failed"); }
              finally { setSaving(false); }
            }} className="btn-primary" disabled={saving}>
              {saving ? "Creating…" : "Create Record"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Student Roll Number</label>
            <input type="text" value={newFee.studentId}
              onChange={(e) => setNewFee({ ...newFee, studentId: e.target.value })}
              className="input-field" placeholder="CS40101" />
          </div>
          <div>
            <label className="label">Semester</label>
            <input type="number" value={newFee.semester} min={1} max={10}
              onChange={(e) => setNewFee({ ...newFee, semester: Number(e.target.value) })}
              className="input-field" />
          </div>
          <div>
            <label className="label">Academic Year</label>
            <select value={newFee.academicYear}
              onChange={(e) => setNewFee({ ...newFee, academicYear: e.target.value })}
              className="input-field">
              {["2022-23","2023-24","2024-25"].map((y) => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
            Fee structure will be auto-populated based on department and course configuration.
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Fees;