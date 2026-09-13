export const getCertificateProfile = (inspectionType = "") => {
	const type = String(inspectionType).toLowerCase();

	if (type.includes("sanitary")) {
		return { key: "sanitary", title: "SANITARY PERMIT TO OPERATE", office: "CITY HEALTH OFFICE / SANITATION INSPECTION UNIT", fileLabel: "Sanitary_Permit_to_Operate" };
	}
	if (type.includes("environment")) {
		return { key: "environmental", title: "ENVIRONMENTAL PERMIT TO OPERATE (E.P.O.)", office: "CITY ENVIRONMENT AND NATURAL RESOURCES OFFICE", fileLabel: "Environmental_Permit_to_Operate" };
	}
	if (type.includes("building") || type.includes("electrical")) {
		return { key: "building", title: "BUILDING AND ELECTRICAL INSPECTION CERTIFICATE", office: "CITY ENGINEERING OFFICE / BUILDING INSPECTION UNIT", fileLabel: "Building_and_Electrical_Certificate" };
	}
	if (type.includes("locational") || type.includes("zoning")) {
		return { key: "locational", title: "ZONING CLEARANCE", office: "OFFICE OF THE PUNONG BARANGAY / CITY PLANNING AND DEVELOPMENT OFFICE", fileLabel: "Locational_Zoning_Clearance" };
	}
	if (type.includes("veterinary") || type.includes("vet")) {
		return { key: "veterinary", title: "VETERINARY HEALTH CERTIFICATE", office: "CITY VETERINARY OFFICE / ANIMAL HEALTH UNIT", fileLabel: "Veterinary_Health_Certificate" };
	}
	return { key: "fire", title: "FIRE SAFETY INSPECTION CERTIFICATE", office: "CITY FIRE STATION / FIRE SAFETY INSPECTION UNIT", fileLabel: "Fire_Safety_Inspection_Certificate" };
};

export const buildCertificateData = ({ inspection, application, id, verificationUrl }) => {
	const formatAddress = (address) => {
		if (!address) return "N/A";
		return [address.street, address.houseNo || address.houseNumber, address.barangay, address.city, address.province, address.subdivision, address.building, address.block, address.lot, address.landmark]
			.filter(Boolean)
			.map((part) => String(part).trim())
			.join(", ") || "N/A";
	};

	const inspectionType = inspection?.type || "N/A";
	const issuedAt = inspection?.certificateIssuedAt || inspection?.updatedAt || inspection?.date || new Date().toISOString();
	const issueDate = new Date(issuedAt);
	const expiryDate = application?.expiryDate ? new Date(application.expiryDate) : new Date(new Date(issuedAt).setFullYear(issueDate.getFullYear() + 1));
	const date = (value) => new Date(value).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
	const owner = inspection?.citizenId?.fullName || application?.taxpayer?.registrantName || (application?.applicant?.firstName ? `${application.applicant.firstName} ${application.applicant.lastName || ""}`.trim() : null) || "N/A";
	const businessName = inspection?.businessName || application?.businessName || application?.businessInfo?.businessName || application?.businessDetails?.businessName || owner;

	return {
		profile: getCertificateProfile(inspectionType),
		owner,
		businessName,
		address: formatAddress(application?.address) || inspection?.businessAddress || inspection?.address || "N/A",
		email: inspection?.citizenId?.email || application?.applicant?.email || application?.contact?.email || "N/A",
		inspectionType,
		inspectionDate: inspection?.date ? date(inspection.date) : "N/A",
		inspectionTime: inspection?.date ? new Date(inspection.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : inspection?.time || "N/A",
		issueDate: date(issuedAt),
		expiryDate: date(expiryDate),
		certificateNumber: inspection?._id || id,
		status: inspection?.status || "Pending",
		remarks: inspection?.remarks || "No remarks provided.",
		inspector: inspection?.inspector || "N/A",
		scheduledBy: inspection?.scheduledBy?.fullName || inspection?.scheduledBy || "N/A",
		verificationUrl,
	};
};
