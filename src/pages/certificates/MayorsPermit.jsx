import CertificateDocument, { CertificateDetails, CertificateRecord } from "./CertificateDocument";

export default function MayorsPermit({ data, ...actions }) {
	return <CertificateDocument data={{ ...data, profile: { ...data.profile, title: "MAYOR'S PERMIT", office: "BUSINESS PERMITS AND LICENSING OFFICE" } }} className="mayors-template" {...actions}>
		<main className="mayors-body">
			<h1>MAYOR&apos;S PERMIT</h1>
			<p>This permit is issued to the permittee and business identified below upon completion of the application review and required inspections.</p>
			<CertificateDetails data={data} />
			<div className="certificate-validity"><b>DATE ISSUED</b><span>{data.issueDate}</span><b>VALID UNTIL</b><span>{data.expiryDate}</span></div>
			<CertificateRecord data={data} />
			<div className="certificate-signatures"><div>{data.scheduledBy}<span>Authorized City Hall Officer</span></div><div>{data.owner}<span>Permittee</span></div></div>
		</main>
	</CertificateDocument>;
}
