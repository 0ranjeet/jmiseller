// utils/otpService.js
import { db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";
import bcrypt from "bcryptjs";

const OTP_LENGTH = 6;
const EXPIRY_MINUTES = 10;

// Map use-case to message template
const MESSAGE_TEMPLATES = {
  REGISTER: "Your JMI Seller registration OTP is: {{OTP}}. Valid for 10 minutes.",
  FORGOT_PASSWORD: "Your password reset OTP is: {{OTP}}. Do not share this code.",
  ORDER_PICKUP: "Pickup OTP: {{OTP}}. Show this to the delivery agent.",
  LOGIN: "Your login OTP is: {{OTP}}. Valid for 10 minutes.",
};

export const generateAndSaveOtp = async (mobile, useCase) => {
  if (!mobile || !useCase) throw new Error("Mobile and useCase required");

  const fullMobile = mobile.startsWith("+") ? mobile : `+91${mobile}`;
  const otpId = `${fullMobile}_${useCase.toUpperCase()}`; // Unique ID
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
  const hashedOtp = await bcrypt.hash(otp, 10);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + EXPIRY_MINUTES * 60 * 1000);

  const message = MESSAGE_TEMPLATES[useCase.toUpperCase()]?.replace("{{OTP}}", otp);

  if (!message) throw new Error(`No template found for use case: ${useCase}`);

  await setDoc(doc(db, "otps", otpId), {
    mobile: fullMobile,
    otp: hashedOtp,
    useCase: useCase.toUpperCase(),
    status: "pending", // Not yet sent
    createdAt: now,
    expiresAt,
    message, // Final message ready to send
    sentByAdmin: false,
  });

  return { otpId, otp, message, mobile: fullMobile }; // Return plain OTP only if used securely
};