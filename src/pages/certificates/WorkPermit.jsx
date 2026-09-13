import CertificateDocument, { CertificateDetails, CertificateRecord } from "./CertificateDocument";

export default function WorkPermit({ data, ...actions }) {
	return <CertificateDocument data={{ ...data, profile: { ...data.profile, title: "WORK PERMIT", office: "OFFICE OF THE PUNONG BARANGAY / BUSINESS PERMITS OFFICE" } }} className="work-template" {...actions}>
		<main className="work-body">
			<h1>WORK PERMIT</h1>
			<p className="certificate-salutation">TO WHOM IT MAY CONCERN:</p>
			<p>This is to certify that <strong>{data.owner}</strong> is authorized to work under the business or establishment identified below, subject to applicable rules and regulations.</p>
			<h2>{data.businessName}</h2>
			<CertificateDetails data={data} />
			<div className="certificate-validity"><b>ISSUED</b><span>{data.issueDate}</span><b>VALID UNTIL</b><span>{data.expiryDate}</span></div>
			<CertificateRecord data={data} />
			<div className="certificate-signatures"><div>{data.scheduledBy}<span>Barangay / Issuing Officer</span></div><div>{data.owner}<span>Worker / Permit Holder</span></div></div>
		</main>
	</CertificateDocument>;
}
