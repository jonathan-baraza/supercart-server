import { NextFunction, Response, Request } from "express";
import { CustomRequest } from "../../../Types/Auth";
import axios from "axios";
import {
  AccessTokenType,
  StkPushRequestBodyType,
  StkPushUserRequestBodyType,
} from "../../../Types/Payments/Mpesa";
import {
  generateSTKPushPassword,
  getTimeStamp,
  getTokenPassword,
} from "../../../utils/payments/mpesa";
import { logData } from "../../../utils/logData";
import path from "path";

//Environment Variables
const BusinessShortCode = process.env.MPESA_BUSINESS_SHORTCODE!;
const PassKey = process.env.MPESA_PASSKEY!;
const CallBackURL = process.env.MPESA_CALLBACK_URL!;

//Generating the authorization token
export const generateAccessToken = async (
  next: NextFunction
): Promise<string | null> => {
  try {
    const mpesaEndpoint = process.env.MPESA_TOKEN_ENDPOINT;

    const encodedString = await getTokenPassword();

    const response = await axios({
      method: "get",
      url: mpesaEndpoint,
      headers: {
        Authorization: `Basic ${encodedString}`,
      },
    });

    const { access_token, expires_in }: AccessTokenType = response.data;
    return access_token;
  } catch (error) {
    next(error);
    return null;
  }
};

//sending the STK push
export const handleMpesaCheckout = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { Amount, PhoneNumber }: StkPushUserRequestBodyType = req.body;
    const mpesaEndpoint = process.env.MPESA_STKPUSH_ENDPOINT;
    const accessToken = await generateAccessToken(next);
    const Timestamp = await getTimeStamp();
    const Password = await generateSTKPushPassword({
      BusinessShortCode,
      PassKey,
      Timestamp,
    });

    const requestBody: StkPushRequestBodyType = {
      BusinessShortCode,
      Password,
      Timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount,
      PartyA: PhoneNumber,
      PartyB: BusinessShortCode,
      PhoneNumber,
      CallBackURL,
      AccountReference: "SuperCart online store payment",
      TransactionDesc: "SuperCart online store checkout",
    };

    const response: any = await axios({
      method: "POST",
      url: mpesaEndpoint,
      data: requestBody,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    res.status(200).json({
      responseCode: response?.data?.ResponseCode,
      MerchantRequestID: response?.data?.MerchantRequestID,
      CheckoutRequestID: response?.data?.CheckoutRequestID,
      message: response?.data?.ResponseDescription,
    });
  } catch (error) {
    next(error);
  }
};

//handling callback response from Mpesa
export const handleMpesaCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const CheckoutRequestID = req.body?.Body?.stkCallback?.CheckoutRequestID;
    const MerchantRequestID = req.body?.Body?.stkCallback?.MerchantRequestID;
    const ResultDesc = req.body?.Body?.stkCallback?.ResultDesc;
    const ResultCode = req.body?.Body?.stkCallback?.ResultCode;

    const filePath: string = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "logs",
      "payments",
      "file.txt"
    );

    if (ResultCode === 0) {
      const CallbackMetadata =
        req.body?.Body?.stkCallback?.CallbackMetadata?.Item;
      const Amount = CallbackMetadata[0].Value;
      const MpesaReceiptNumber = CallbackMetadata[1].Value;
      //unused
      const Balance = CallbackMetadata[2].Value;
      const TransactionDate = CallbackMetadata[3].Value;
      const PhoneNumber = CallbackMetadata[4].Value;

      console.log("Amount: ", Amount);
      console.log("MpesaReceiptNumber: ", MpesaReceiptNumber);
      console.log("TransactionDate: ", TransactionDate);
      console.log("PhoneNumber: ", PhoneNumber);

      const content = `Method:MPesa\nCheckoutRequestID: ${CheckoutRequestID}\nMerchantRequestID: ${MerchantRequestID}\nResult code: ${ResultCode}\nResult Description: ${ResultDesc}\nAmount: ${Amount}\nDate: ${TransactionDate}\n\n`;
      logData({ filePath, content });
      logData({ filePath, content: JSON.stringify(CallbackMetadata) });
    } else {
      const content = `Method:MPesa\nCheckoutRequestID: ${CheckoutRequestID}\nMerchantRequestID: ${MerchantRequestID}\nResult code: ${ResultCode}\nResult Description: ${ResultDesc}\n\n`;
      logData({ filePath, content });
    }
  } catch (error) {
    next(error);
  }
};
