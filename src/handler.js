const {parse} = require("url");
const {DEFAULT_HEADER} = require("./util/util.js");
const controller = require("./controller");
const {createReadStream} = require("fs");
const path = require("path");
const imageAndStyleRequests = [".png", ".jpeg", ".jpg", ".css"];

const allRoutes = {
  // GET: localhost:3000/
  "/:get": (request, response) => {
    controller.getHomePage(request, response);
  },
  // POST: localhost:3000/images
  "/upload:post": (request, response) => {
    controller.uploadImages(request, response);
  },
  // GET: localhost:3000/feed
  "/feed:get": (request, response) => {
    controller.getFeed(request, response);
  },
  // 404 routes
  default: (request, response) => {
    response.writeHead(404, DEFAULT_HEADER);
    createReadStream(path.join(__dirname, "views", "404.html"), "utf8").pipe(response);
  },
};

function handler(request, response) {
  const {url, method} = request;

  const {pathname} = parse(url, true);
  const ext = path.extname(pathname);

  const key = `${pathname}:${method.toLowerCase()}`;
  const chosen = allRoutes[key] || allRoutes.default;

  // Handle requests for images and CSS files
  if (imageAndStyleRequests.includes(ext)) {
    return Promise.resolve(controller.addStyles(request, response, pathname, ext)).catch(handlerError(response));
  }
  return Promise.resolve(chosen(request, response)).catch(handlerError(response));
}

function handlerError(response) {
  return (error) => {
    console.log("Something bad has  happened**", error.stack);
    response.writeHead(500, DEFAULT_HEADER);
    response.write(
      JSON.stringify({
        error: "internet server error!!",
      })
    );

    return response.end();
  };
}

module.exports = handler;
