import CertificateDocument, { CertificateDetails, CertificateRecord } from "./CertificateDocument";

export default function FireSafetyCertificate({ data, ...actions }) {
	return <CertificateDocument data={data} className="fire-safety-template" {...actions}>
		<main className="fire-safety-body">
			<h1>{data.profile.title}</h1>
			<p className="certificate-salutation">TO WHOM IT MAY CONCERN:</p>
			<p>By virtue of the provisions of the Fire Code of the Philippines, this certifies that the establishment below has undergone the required fire safety inspection.</p>
			<h2>{data.businessName}</h2>
			<p>This certificate is issued to <strong>{data.owner}</strong> after review of the recorded inspection and compliance requirements.</p>
			<CertificateDetails data={data} />
			<div className="certificate-validity"><b>VALID UNTIL</b><span>{data.expiryDate}</span><b>STATUS</b><span>{data.status}</span></div>
			<CertificateRecord data={data} />
			<div className="certificate-signatures"><div>{data.inspector}<span>Authorized Fire Safety Inspector</span></div><div>{data.scheduledBy}<span>Reviewing Officer</span></div></div>
		</main>
	</CertificateDocument>;
}
