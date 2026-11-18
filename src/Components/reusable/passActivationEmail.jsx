import React from "react";
import passImage from "../../assets/rcf mail1.png";
import "./passActivationEmail.css";

const PassActivationEmail = ({
  qrImageUrl,
  passNumber = "#0002",
  activationUrl = "https://event.areyoureporting.com/activate/RCF26-TU445NPP-0002",
}) => {
  const qrSrc =
    qrImageUrl ||
    `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(
      activationUrl
    )}`;

  return (
    <div className="wrapper">
      <div className="container">
        <div className="imageWrapper">
          <img src={passImage} alt="Pass" className="image" />
          <div className="qrWrapper">
            <img src={qrSrc} alt="Pass QR Code" className="qrCodeImage" />
          </div>
          <div className="passNumberWrapper">
            <div className="passNumber">{passNumber}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassActivationEmail;
