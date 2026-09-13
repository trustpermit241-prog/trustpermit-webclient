import CertificateDocument, { CertificateDetails, CertificateRecord } from "./CertificateDocument";

export default function VeterinaryCertificate({ data, ...actions }) {
	return <CertificateDocument data={data} className="veterinary-template" {...actions}>
		<main className="veterinary-body">
			<h1>{data.profile.title}</h1>
			<div className="vhc-control">VHC CONTROL NUMBER: {data.certificateNumber}</div>
			<p>This is to certify that the animal, specimen, or veterinary-related establishment described below has been assessed by the City Veterinary Office under applicable animal health and welfare requirements.</p>
			<div className="veterinary-fields"><b>COMMODITIES / ESTABLISHMENT</b><span>{data.businessName}</span><b>ORIGIN / ADDRESS</b><span>{data.address}</span><b>DESTINATION / EMAIL</b><span>{data.email}</span><b>OWNER</b><span>{data.owner}</span><b>DATE ISSUED</b><span>{data.issueDate}</span><b>VALID UNTIL</b><span>{data.expiryDate}</span></div>
			<CertificateDetails data={data} />
			<CertificateRecord data={data} />
			<div className="certificate-signatures"><div>{data.inspector}<span>Veterinary Health Inspector</span></div><div>{data.scheduledBy}<span>City Veterinary Officer</span></div></div>
		</main>
	</CertificateDocument>;
}
