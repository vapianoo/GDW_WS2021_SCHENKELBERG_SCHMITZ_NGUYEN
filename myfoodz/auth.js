const OktaJwtVerifier = require("@okta/jwt-verifier");

//Init verifier with ISSUER (auth-server) and CLIENT_ID
const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: process.env.ISSUER,
  clientId: process.env.CLIENT_ID,
});

module.exports = async (req, res, next) => {
  try {
    const { authorization } = req.headers;
    if (!authorization)
      throw new Error("You must send an Authorization header");

    const [authType, token] = authorization.trim().split(" ");
    if (authType !== "Bearer") throw new Error("Expected a Bearer token");

    const { claims } = await oktaJwtVerifier.verifyAccessToken(
      token,
      "api://default"
    );
    if (!claims.scp.includes(process.env.SCOPE)) {
      throw new Error("Could not verify scope");
    }
    next();
  } catch (error) {
    next(error.message);
  }
};
