import { VerifyTokenType, JWTPayloadType } from "../../Types/Auth/index";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

const verifyJWT = async ({
  token,
  secret,
}: VerifyTokenType): Promise<null | JWTPayloadType> => {
  try {
    const isValid: any = jwt.verify(token, secret)!;
   
    if (isValid) {
      const { email } = isValid;

      const decodedData: JWTPayloadType = {
        email,
      };
      return decodedData;
    }

    return null;
  } catch (error: any) {
    return null;
  }
};

export default verifyJWT;
