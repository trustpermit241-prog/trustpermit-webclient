import React from "react";

const ProfileSection = ({
  profileImage,
  storedName,
  storedEmail,
  isEditingProfile,
  setIsEditingProfile,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  handleProfileImageChange
}) => {
  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 80, height: 80, borderRadius: 12, background: "#F3F4F6", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {profileImage ? (
            <img src={profileImage} alt="profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ fontSize: 28 }}>{storedName.charAt(0) || "U"}</div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0 }}>{storedName}</h3>
          <div style={{ color: "#6B7280" }}>{storedEmail}</div>
          {isEditingProfile ? (
            <div style={{ marginTop: 8 }}>
              <label style={{ display: "inline-block", cursor: "pointer" }}>
                <input type="file" accept="image/*" style={{ display: "inline-block" }} onChange={(e) => handleProfileImageChange(e.target.files)} />
              </label>
            </div>
          ) : null}
        </div>
      </div>

      <hr style={{ margin: "18px 0", borderColor: "#E5E7EB" }} />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {!isEditingProfile ? (
          <button className="btn" onClick={() => setIsEditingProfile(true)}>Edit Profile</button>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontWeight: 600 }}>Change Profile Image</label>
              <input type="file" accept="image/*" onChange={(e) => handleProfileImageChange(e.target.files)} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontWeight: 600 }}>Change Password</label>
              <input className="input" type="password" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              <input className="input" type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <input className="input" type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button className="btn" onClick={() => {
                if (newPassword && newPassword === confirmPassword) {
                  alert("Password changed (stub)");
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setIsEditingProfile(false);
                } else {
                  alert("New password and confirmation do not match.");
                }
              }}>Save</button>
              <button className="btn" onClick={() => setIsEditingProfile(false)}>Cancel</button>
            </div>
          </>
        )}
      </div>

      <h4 style={{ marginTop: 20 }}>Recent Activity</h4>
      <ul style={{ color: "#4B5563" }}>
        <li>Submitted application: Business Registration (Mar 02, 2026)</li>
        <li>Uploaded documents for Permit #1452 (Mar 01, 2026)</li>
        <li>Inspection scheduled: Site Visit (Feb 27, 2026)</li>
      </ul>
    </div>
  );
};

export default ProfileSection;
