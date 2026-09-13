import CertificateDocument, { CertificateDetails, CertificateRecord } from "./CertificateDocument";

export default function BarangayClearance({ data, ...actions }) {
	return <CertificateDocument data={{ ...data, profile: { ...data.profile, title: "BARANGAY BUSINESS CLEARANCE", office: "OFFICE OF THE PUNONG BARANGAY" } }} className="barangay-template" {...actions}>
		<main className="barangay-body">
			<h1>BARANGAY BUSINESS CLEARANCE</h1>
			<p>This is to certify that <strong>{data.owner}</strong>, with business address at <strong>{data.address}</strong>, has been granted this Barangay Business Clearance for the purpose of securing the necessary business permit and license.</p>
			<h2>{data.businessName}</h2>
			<CertificateDetails data={data} />
			<p className="barangay-notice">This clearance is non-transferable and shall be null and void upon failure of the applicant to comply with the conditions of this permit.</p>
			<div className="certificate-validity"><b>DATE ISSUED</b><span>{data.issueDate}</span><b>VALID UNTIL</b><span>{data.expiryDate}</span></div>
			<CertificateRecord data={data} />
			<div className="certificate-signatures"><div>{data.scheduledBy}<span>Punong Barangay / Issuing Officer</span></div></div>
			<p className="barangay-note">Note: Alterations or erasures invalidate this clearance.</p>
		</main>
	</CertificateDocument>;
}
