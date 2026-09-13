import QRCode from "react-qr-code";
import antipoloLogo from "../../assets/antipolologo.jpg";

export default function CertificateDocument({ data, certificateRef, downloading, onDownload, onPrint, className, children }) {
  return (
    <div className={`certificate-page certificate-${data.profile.key}`}>
      <div className={`certificate-sheet ${className || ""}`} ref={certificateRef}>
        <header className="certificate-header">
          <div className="certificate-seal"><img src={antipoloLogo} alt="Antipolo City seal" /></div>
          <div className="certificate-government">
            <div>Republic of the Philippines</div>
            <strong>CITY GOVERNMENT OF ANTIPOLO</strong>
            <div className="certificate-office">{data.profile.office}</div>
            <small>Antipolo City, Rizal</small>
          </div>
          <div className="certificate-qr"><QRCode value={data.verificationUrl} size={86} /><span>SCAN TO VERIFY</span></div>
        </header>
        <div className="certificate-reference"><span>CONTROL NO. {data.certificateNumber}</span><span>DATE: {data.issueDate}</span></div>
        {children}
        <footer className="certificate-actions">
          <button type="button" onClick={onDownload} disabled={downloading}>{downloading ? "Preparing PDF..." : "Download Certificate"}</button>
          <button type="button" onClick={onPrint}>Print Certificate</button>
        </footer>
      </div>
    </div>
  );
}

export const CertificateDetails = ({ data }) => (
  <section className="certificate-details">
    <div><b>OWNER / APPLICANT</b><span>{data.owner}</span></div>
    <div><b>BUSINESS / ESTABLISHMENT</b><span>{data.businessName}</span></div>
    <div><b>ADDRESS</b><span>{data.address}</span></div>
    <div><b>APPLICANT EMAIL</b><span>{data.email}</span></div>
  </section>
);

export const CertificateRecord = ({ data }) => (
  <section className="certificate-record">
    <h3>Inspection Record</h3>
    <p><b>Inspection Type</b><span>{data.inspectionType}</span></p>
    <p><b>Inspection Date / Time</b><span>{data.inspectionDate} at {data.inspectionTime}</span></p>
    <p><b>Assigned Inspector</b><span>{data.inspector}</span></p>
    <p><b>Status</b><span>{data.status}</span></p>
    <p><b>Remarks</b><span>{data.remarks}</span></p>
  </section>
);
