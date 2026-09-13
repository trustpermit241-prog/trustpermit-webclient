import CertificateDocument, { CertificateDetails, CertificateRecord } from "./CertificateDocument";

export default function SanitaryCertificate({ data, ...actions }) {
	return <CertificateDocument data={data} className="sanitary-template" {...actions}>
		<main className="sanitary-body">
			<h1>{data.profile.title}</h1>
			<p className="certificate-salutation">TO WHOM IT MAY CONCERN:</p>
			<p>This is to certify that the establishment and operator named below have completed the recorded sanitation inspection and application review.</p>
			<div className="sanitary-fields"><b>BUSINESS NAME</b><strong>{data.businessName}</strong><b>OWNER / OPERATOR</b><span>{data.owner}</span><b>ADDRESS</b><span>{data.address}</span><b>INSPECTION TYPE</b><span>{data.inspectionType}</span></div>
			<CertificateDetails data={data} />
			<div className="certificate-validity"><b>ISSUED</b><span>{data.issueDate}</span><b>VALID UNTIL</b><span>{data.expiryDate}</span></div>
			<CertificateRecord data={data} />
			<div className="certificate-signatures"><div>{data.inspector}<span>Sanitation Inspector</span></div><div>{data.scheduledBy}<span>City Health Office</span></div></div>
		</main>
	</CertificateDocument>;
}
