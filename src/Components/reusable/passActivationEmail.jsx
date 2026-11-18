import React from "react";
import passImage from "../../assets/rcf mail1.png";
import "./passActivationEmail.css";

const PassActivationEmail = () => {
  return (
    <div className="wrapper">
      <div className="container">
        <div className="imageWrapper">
          <img src={passImage} alt="Pass" className="image" />
          <div className="noQrWrapper">
            <div className="noQrText">NO QR</div>
          </div>
          <div className="passNumberWrapper">
            <div className="passNumber">#0002</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassActivationEmail;
