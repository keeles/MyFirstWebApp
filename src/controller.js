const helper = require("./scripts/helper.js");
const {DEFAULT_HEADER} = require("./util/util.js");

const controller = {
  getHomePage: async (request, response) => {
    response.writeHead(200, DEFAULT_HEADER);
    return response.end(await helper.homePageResponse());
  },
  getFeed: async (request, response) => {
    response.writeHead(200, DEFAULT_HEADER);
    return response.end(await helper.feedResponse(request));
  },
  uploadImages: async (request, response) => {
    const username = await helper.getUsernameFromQS(request.url);
    await helper.uploadImage(request, response, username);
  },
  addStyles: async (request, response, pathname, ext) => {
    if (ext === ".jpeg" || ext === ".png" || ext === ".jpg") {
      return helper.handleImage(request, response, pathname, ext);
    }
    if (ext === ".css") {
      return helper.handleCSS(request, response, pathname, ext);
    }
  },
};

module.exports = controller;
