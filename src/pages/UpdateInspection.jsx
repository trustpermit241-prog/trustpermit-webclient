export default function UpdateInspection() {
  return (
    <div style={{ padding: 30 }}>
      <h2>Update Inspection</h2>

      <form>
        <label>Inspection Status:</label>
        <select>
          <option>Pending</option>
          <option>Scheduled</option>
          <option>Completed</option>
        </select>

        <br /><br />
        <button>Update</button>
      </form>
    </div>
  );
}
