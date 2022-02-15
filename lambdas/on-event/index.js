const https = require("https");
const AWS = require("aws-sdk");

async function getOpenSearchCredentials(secretId) {
  console.log("Getting OS credentials from Secrets Manager secret " + secretId);
  const client = new AWS.SecretsManager();
  const secret = await client
    .getSecretValue({
      SecretId: secretId,
    })
    .promise();

  return JSON.parse(secret["SecretString"]);
}

const osRequest = (url, method, credentials, data) => {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        auth: `${credentials.username}:${credentials.password}`,
        method,
        headers: { "Content-Type": "application/json" },
      },
      (res) => {
        res.on("error", (err) => reject(err));

        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          if (res.statusCode >= 400) {
            reject(
              new Error(`Received unexpected status code ${res.statusCode}`)
            );
          } else {
            resolve({
              statusCode: res.statusCode,
              data,
            });
          }
        });
      }
    );

    req.on("error", (err) => reject(err));

    if (data) {
      req.write(data);
    }

    console.log(`${method} ${url}`);
    req.end();
  });
};

module.exports.handler = async (event) => {
  console.log("Event received:", event);

  const secretId = event.ResourceProperties.OSCredentialsSecret;
  const creds = await getOpenSearchCredentials(secretId);

  const endpoint = event.ResourceProperties.OSEndpoint;
  const resourceType = event["ResourceProperties"]["resourceType"];
  const resourceId = event["ResourceProperties"]["resourceId"];

  const url = `https://${endpoint}/_plugins/_security/api/${resourceType}/${resourceId}`;

  if (event["RequestType"] === "Create") {
    const resourceBody = event["ResourceProperties"]["resourceBody"];
    const res = await osRequest(url, "PUT", creds, resourceBody);
    console.log(res.statusCode);
    console.log(res.data);
    if (res.statusCode !== 200 && res.statusCode !== 201) {
      throw new Error("Failed to create resource");
    }
    return {
      PhysicalResourceId: resourceId,
    };
  } else if (event["RequestType"] === "Update") {
    const resourceBody = event["ResourceProperties"]["resourceBody"];
    const res = await osRequest(url, "PUT", creds, resourceBody);
    console.log(res.statusCode);
    console.log(res.data);
    if (res.statusCode !== 200 && res.statusCode !== 201) {
      throw new Error("Failed to create resource");
    }
    return {
      PhysicalResourceId: event["PhysicalResourceId"],
    };
  } else if (event["RequestType"] === "Delete") {
    const res = await osRequest(url, "DELETE", creds);
    console.log(res.statusCode);
    console.log(res.data);
    if (res.statusCode !== 200) {
      throw new Error("Failed to delete resource");
    }
    return {
      PhysicalResourceId: event["PhysicalResourceId"],
    };
  } else {
    throw new Error("Unhandled event");
  }
};
