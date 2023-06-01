import { Request, Response, NextFunction } from "express";
import verifyJWT from "../utils/jwt/verifyJWT";
import { Document, Types } from "mongoose";
import { CustomRequest, JWTPayloadType, UserType } from "../Types/Auth";
import User from "../Models/Auth/User";

const JWTGuard = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    //check if token is available
    const tokenString = req.headers.authorization || req.headers.Authorization;
    if (!tokenString) {
      return res.status(403).json({ message: "Unauthorized Request" });
    }

    const accessToken: string = String(tokenString).split(" ")[1];

    if (!accessToken) {
      return res.status(403).json({ message: "Unauthorized Request" });
    }

    const tokenSecret = process.env.JWT_SECRET!;

    const guardValidCheck: JWTPayloadType | null = await verifyJWT({
      token: accessToken,
      secret: tokenSecret,
    });

    console.log("guardvalidcheck");
    console.log(guardValidCheck);

    if (!guardValidCheck) {
      return res.status(403).json({ message: "Invalid Access Tokeniiii" });
    }

    const userExists: UserType | null = await User.findOne({
      email: guardValidCheck!.email,
    });

    if (!userExists) {
      return res.status(403).json({ message: "Invalid Access Token" });
    }
    req.user = {};

    req.user!.id = userExists._id.toString();
    req.user!.email = guardValidCheck!.email;
    console.log("they are here ");
    console.log(req.user);

    next();
  } catch (error) {
    next(error);
  }
};

export default JWTGuard;
