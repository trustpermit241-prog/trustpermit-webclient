import React from "react";

const ApplicationFormSection = ({
  appFormStep,
  setAppFormStep,
  applicationType,
  setApplicationType,
  firstName,
  setFirstName,
  middleName,
  setMiddleName,
  lastName,
  setLastName,
  suffixName,
  setSuffixName,
  gender,
  setGender,
  civilStatus,
  setCivilStatus,
  nationality,
  setNationality,
  contactNumber,
  setContactNumber,
  applicantEmail,
  setApplicantEmail,
  missingFields,
  setMissingFields,
  lineOfBusiness,
  setLineOfBusiness,
  ownershipType,
  setOwnershipType,
  businessArea,
  setBusinessArea,
  malePersonnel,
  setMalePersonnel,
  femalePersonnel,
  setFemalePersonnel,
  totalPersonnel,
  province,
  setProvince,
  city,
  setCity,
  barangay,
  setBarangay,
  subdivision,
  setSubdivision,
  street,
  setStreet,
  building,
  setBuilding,
  handleFileUpload,
  clearSignature,
  submitApplication,
  submittingApp,
  uploadedFiles
}) => (
  <div className="card form-card-wide">
    <h3>Application Forms</h3>
    <p style={{ color: "#4B5563", fontSize: "1.1rem", marginBottom: "15px" }}>Fill the form step-by-step. Click "Next" to continue.</p>
    {/* ...existing code for the form steps, copy from Account.jsx... */}
  </div>
);

export default ApplicationFormSection;
