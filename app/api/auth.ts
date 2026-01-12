import jwt from "jsonwebtoken";

type DecodedToken = { id: string };

export async function decodeToken(token: string): Promise<DecodedToken | null> {
  try {
    if (!token || !process.env.SECRET_KEY) return null;

    const decoded = jwt.verify(token, process.env.SECRET_KEY) as DecodedToken;
    if (!decoded) return null;

    return decoded;
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      console.error("Token expired:", err);
      return null;
    }
    console.error("Error decoding token:", err);
    return null;
  }
}

