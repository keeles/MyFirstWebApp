const {createReadStream} = require("fs");
const {JPEG_HEADER, CSS_HEADER, PNG_HEADER, DEFAULT_HEADER} = require("../util/util.js");
const path = require("path");
const fs = require("fs").promises;
const qs = require("querystring");
const util = require("util");
const ejs = require("ejs");
const renderFilePromise = util.promisify(ejs.renderFile);
const formidable = require("formidable");

const pathHome = path.join(__dirname, "..", "views", "home.ejs");
const pathToFeed = path.join(__dirname, "..", "views", "feed.ejs");
const pathToDatabase = path.join(__dirname, "..", "..", "database", "data.json");
const pathToPhotos = path.join(__dirname, "..", "photos");

// GET helper functions

async function homePageResponse() {
  const usersObj = await getDb();
  return await renderFilePromise(pathHome, {usersObj: usersObj});
}

async function feedResponse(request) {
  const username = await getUsernameFromQS(request.url);
  const usersObj = await getDb();
  return await renderFilePromise(pathToFeed, {usersObj: usersObj, username: username});
}

async function handleImage(request, response, pathname, ext) {
  const imagePath = path.join(__dirname, "..", pathname);
  if (ext === ".jpeg" || ext === ".jpg") {
    try {
      response.writeHead(200, JPEG_HEADER);
      createReadStream(imagePath).pipe(response);
      return;
    } catch {
      console.log(`Error: Could not find image ${imagePath}`);
    }
  }
  if (ext === ".png") {
    try {
      response.writeHead(200, PNG_HEADER);
      createReadStream(imagePath).pipe(response);
      return;
    } catch {
      console.log(`Error: Could not find image ${imagePath}`);
    }
  }
}

async function handleCSS(request, response, pathname, ext) {
  try {
    const cssPath = path.join(__dirname, "../styles", pathname);
    response.writeHead(200, CSS_HEADER);
    createReadStream(cssPath).pipe(response);
  } catch {
    console.log(`Error: Could not find stylesheet ${cssPath} `);
  }
}

// POST helper functions

async function getUsernameFromQS(url) {
  const query = url.split("?", 2);
  const queryObj = await qs.parse(query[1]);
  const username = queryObj.username;
  return username;
}

async function uploadImage(request, response, username) {
  const form = new formidable.IncomingForm();
  form.parse(request, async (err, fields, files) => {
    try {
      const oldFilepath = files.upload[0].filepath;
      const fileName = files.upload[0].originalFilename.replace(/\s+/g, "-");
      const newFilePath = path.join(pathToPhotos, username, fileName);
      await fs.rename(oldFilepath, newFilePath);
      appendDb(fileName, username);
      response.writeHead(200, DEFAULT_HEADER);
      return response.end(await homePageResponse());
    } catch (err) {
      console.log(err, "Error: No Image was uploaded");
      response.writeHead(200, DEFAULT_HEADER);
      return response.end(await homePageResponse());
    }
  });
}

// Helper functions only used in this module

async function getDb() {
  try {
    const database = await fs.readFile(path.join(__dirname, "..", "..", "database", "data.json"), "utf8");
    const usersObj = JSON.parse(database);
    return usersObj;
  } catch {
    console.log("Error: Database could not be found.");
  }
}

async function writeDb(object, fileName, username) {
  try {
    const newDb = pushValues(object, fileName, username);
    return await fs.writeFile(pathToDatabase, JSON.stringify(newDb));
  } catch {
    console.log("Error: Could not append database.");
  }
}

async function appendDb(fileName, username) {
  const databaseObj = await getDb();
  writeDb(databaseObj, fileName, username);
}

function pushValues(object, image, username) {
  for (const user of object) {
    if (user.username === username) {
      user.photos.push(image);
      user.stats.posts++;
    }
  }
  return object;
}

module.exports = {
  handleImage,
  handleCSS,
  homePageResponse,
  feedResponse,
  getUsernameFromQS,
  uploadImage,
};
