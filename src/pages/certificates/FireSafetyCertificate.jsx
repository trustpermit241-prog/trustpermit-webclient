import CertificateDocument, { CertificateDetails, CertificateRecord } from "./CertificateDocument";

export default function FireSafetyCertificate({ data, ...actions }) {
	return <CertificateDocument data={data} className="fire-safety-template" {...actions}>
		<main className="fire-safety-body">
			<div className="fire-safety-heading">
				<p>Republic of the Philippines</p>
				<p>DEPARTMENT OF THE INTERIOR AND LOCAL GOVERNMENT</p>
				<strong>BUREAU OF FIRE PROTECTION</strong>
				<span>{data.profile.office}</span>
			</div>
			<div className="fire-safety-reference"><span>FSIC NO. {data.certificateNumber}</span><span>{data.issueDate}</span></div>
			<h1>{data.profile.title}</h1>
			<strong className="fire-safety-subtitle">(FOR OCCUPANCY / BUSINESS PERMIT)</strong>
			<p className="certificate-salutation">TO WHOM IT MAY CONCERN:</p>
			<p>By virtue of the provisions of Republic Act No. 9514, otherwise known as the Fire Code of the Philippines of 2008, this certifies that the establishment identified below has undergone the required fire safety inspection.</p>
			<div className="fire-safety-parties">
				<div><span>Name of Establishment</span><strong>{data.businessName}</strong></div>
				<div><span>Owned and Managed By</span><strong>{data.owner}</strong></div>
				<div><span>Address</span><strong>{data.address}</strong></div>
			</div>
			<p>This certificate is issued for the purpose of securing the applicable permit, subject to the conditions and validity stated below.</p>
			<div className="fire-safety-validity"><div><span>Date Issued</span><strong>{data.issueDate}</strong></div><div><span>Valid Until</span><strong>{data.expiryDate}</strong></div><div><span>Status</span><strong>{data.status}</strong></div></div>
			<CertificateRecord data={data} />
			<div className="fire-safety-fees"><span>Fire Code Fees / Reference</span><strong>Inspection record: {data.certificateNumber}</strong></div>
			<div className="certificate-signatures"><div>{data.inspector}<span>Fire Safety Inspector</span></div><div>{data.scheduledBy}<span>Approving / Reviewing Officer</span></div></div>
			<p className="fire-safety-note"><strong>NOTE:</strong> This certificate does not take the place of any license required by law and is not transferable. Any change in ownership, use, or occupancy may require a new inspection.</p>
		</main>
	</CertificateDocument>;
}
