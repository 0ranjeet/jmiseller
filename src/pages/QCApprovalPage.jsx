import React from "react";
import { useNavigate } from "react-router-dom";
const QCApprovalPage = () => {
  const nav = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
      }}
    >
      <div
        style={{
          textAlign: "center",
          maxWidth: "350px",
          width: "100%",
          padding: "20px",
          borderRadius: "12px",
        }}
      >
        {/* Green circle with check */}
        <div
          style={{
            width: "100px",
            height: "100px",
            margin: "0 auto 20px",
            borderRadius: "50%",
            backgroundColor: "rgba(0, 200, 83, 0.1)", // light green circle
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              backgroundColor: "#00C853", // solid green
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: "36px",
                color: "white",
                fontWeight: "bold",
              }}
            >
              ✓
            </span>
          </div>
        </div>

        {/* Message */}
        <p
          style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "#000",
            marginBottom: "30px",
          }}
        >
          3 Products are sent to QC for Approval.
        </p>

        {/* Buttons */}
        <button
          style={{
            width: "100%",
            padding: "12px",
            border: "none",
            borderRadius: "6px",
            backgroundColor: "#B8860B", // golden brown
            color: "#fff",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            marginBottom: "15px",
          }}
          onClick={()=>nav("/productregistration")}

        >
          Register More Products
        </button>

        <button
          style={{
            width: "100%",
            padding: "12px",
            border: "2px solid #B8860B",
            borderRadius: "6px",
            backgroundColor: "transparent",
            color: "#B8860B",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
          }}
          onClick={()=>nav("/myregisteredproducts")}

        >
          View Registered Products
        </button>
      </div>
    </div>
  );
};

export default QCApprovalPage;
