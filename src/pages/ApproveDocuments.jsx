export default function ApproveDocuments() {
  return (
    <div style={{ padding: 30 }}>
      <h2>For Approval</h2>

      <table border="1" width="100%" cellPadding="10">
        <thead>
          <tr>
            <th>Citizen Name</th>
            <th>Permit Type</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>Juan Dela Cruz</td>
            <td>Barangay Clearance</td>
            <td>Pending</td>
            <td>
              <button>Approve</button>
              <button style={{ marginLeft: 10 }}>Reject</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
