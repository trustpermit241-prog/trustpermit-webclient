import CertificateDocument, { CertificateDetails, CertificateRecord } from "./CertificateDocument";

export default function BuildingElectricalCertificate({ data, ...actions }) {
  return (
    <CertificateDocument data={data} className="building-electrical-template" {...actions}>
      <main className="building-electrical-body">
        <div className="building-electrical-heading">
          <p>Republic of the Philippines</p>
          <strong>CITY GOVERNMENT OF ANTIPOLO</strong>
          <span>CITY ENGINEERING OFFICE / BUILDING INSPECTION UNIT</span>
        </div>
        <h1>{data.profile.title}</h1>
        <p className="certificate-salutation">TO WHOM IT MAY CONCERN:</p>
        <p>
          This certifies that the building or establishment identified below has undergone the recorded building and electrical inspection, subject to applicable building and safety regulations.
        </p>
        <CertificateDetails data={data} />
        <div className="certificate-validity">
          <b>DATE ISSUED</b><span>{data.issueDate}</span>
          <b>VALID UNTIL</b><span>{data.expiryDate}</span>
        </div>
        <CertificateRecord data={data} />
        <div className="certificate-signatures">
          <div>{data.inspector}<span>Building / Electrical Inspector</span></div>
          <div>{data.scheduledBy}<span>Authorized City Engineering Officer</span></div>
        </div>
      </main>
    </CertificateDocument>
  );
}
