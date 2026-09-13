import CertificateDocument, { CertificateDetails, CertificateRecord } from "./CertificateDocument";

export default function EnvironmentalPermit({ data, ...actions }) {
	return <CertificateDocument data={data} className="environmental-template" {...actions}>
		<main className="environmental-body">
			<h1>{data.profile.title}</h1>
			<p className="environmental-subtitle">Issued pursuant to applicable environmental laws, ordinances, and inspection requirements.</p>
			<div className="environmental-grid"><b>BUSINESS NAME</b><strong>{data.businessName}</strong><b>BUSINESS ID / CONTROL NO.</b><strong>{data.certificateNumber}</strong><b>TYPE OF BUSINESS</b><span>{data.inspectionType}</span><b>ADDRESS</b><span>{data.address}</span><b>OWNER / OPERATOR</b><strong>{data.owner}</strong></div>
			<CertificateDetails data={data} />
			<div className="environmental-validity"><b>DATE ISSUED</b><span>{data.issueDate}</span><b>VALID UNTIL</b><span>{data.expiryDate}</span></div>
			<p className="environmental-warning">This permit may be revoked or suspended for violation of permit conditions and applicable environmental rules and regulations.</p>
			<CertificateRecord data={data} />
			<div className="certificate-signatures"><div>{data.inspector}<span>Environmental Inspector</span></div><div>{data.scheduledBy}<span>Permitting / Reviewing Officer</span></div></div>
		</main>
	</CertificateDocument>;
}
