import CertificateDocument, { CertificateDetails, CertificateRecord } from "./CertificateDocument";

export default function ZoningClearance({ data, ...actions }) {
	return <CertificateDocument data={data} className="zoning-template" {...actions}>
		<main className="zoning-body">
			<h1>{data.profile.title}</h1>
			<p className="certificate-salutation">To whom it may concern:</p>
			<p>This is to certify that <strong>{data.owner}</strong> is hereby granted permission to operate the business identified below, subject to zoning laws, building codes, and land-use regulations.</p>
			<h2>{data.businessName}</h2>
			<p>This clearance further certifies that the stated activity is covered by the recorded locational inspection and review.</p>
			<CertificateDetails data={data} />
			<p className="zoning-issued">ISSUED on {data.issueDate} at the Office of the City Government of Antipolo.</p>
			<CertificateRecord data={data} />
			<div className="certificate-signatures"><div>{data.scheduledBy}<span>Authorized Issuing Officer</span></div></div>
			<p className="zoning-note">Note: Alterations or erasures invalidate this clearance.</p>
		</main>
	</CertificateDocument>;
}
