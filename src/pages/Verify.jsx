import { useState } from "react";
import axios from "axios";

export default function Verify() {
  const [hash, setHash] = useState("");
  const [result, setResult] = useState(null);

  const verifyClearance = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/clearance/verify/${hash}`
      );
      setResult(res.data.valid ? "VALID CLEARANCE ✅" : "INVALID CLEARANCE ❌");
    } catch {
      setResult("INVALID CLEARANCE ❌");
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Verify Clearance</h1>

      <input
        placeholder="Enter clearance hash"
        value={hash}
        onChange={(e) => setHash(e.target.value)}
      />
      <br /><br />

      <button onClick={verifyClearance}>Verify</button>

      <br /><br />
      {result && <h3>{result}</h3>}
    </div>
  );
}
