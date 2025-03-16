// https://create-react-app.dev/docs/proxying-api-requests-in-development/
const { createProxyMiddleware } = require("http-proxy-middleware");
module.exports = function (app) {
  const isTest = process.env.REACT_APP_ENV === "test";

  app.use(
    "/api",
    createProxyMiddleware({
      target: isTest
        ? process.env.REACT_APP_API_TEST
        : process.env.REACT_APP_API,
      changeOrigin: true,
    })
  );
};
