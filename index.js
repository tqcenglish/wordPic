const crypto = require("crypto");
const readline = require("readline");
const fs = require("fs");
const got = require("got");
const rimraf = require("rimraf");
const logger = require("pino")({
  prettyPrint: {
    levelFirst: true
  }
});
const RedisSMQ = require("rsmq");
const rsmq = new RedisSMQ({ host: "127.0.0.1", port: 6379, ns: "rsmq" });
let total = 0;

rsmq.createQueue({ qname: "word-english" }, function(err, resp) {
  if (err) {
    console.error(err);
    return;
  }

  if (resp === 1) {
    console.log("queue created");
  }
});
const stream = require("stream");
const { promisify } = require("util");
const pipeline = promisify(stream.pipeline);

const baseUrl = "http://storage.wafour.com/images2/";

function sha1Result(word) {
  let sha1 = crypto.createHash("sha1");
  sha1.update(word);
  return sha1.digest("hex");
}

const readInterface = readline.createInterface({
  input: fs.createReadStream("./google-10000-english.txt")
});

readInterface.on("close", async function(line) {
  logger.info("close");
});
readInterface.on("line", async function(line) {
  if (line.length < 2) {
    return;
  }

  rsmq.sendMessage({ qname: "word-english", message: line }, function(
    err,
    resp
  ) {
    if (err) {
      logger.error(err);
      return;
    }
  });
});

function download() {
  rsmq.popMessage({ qname: "word-english" }, async function(err, rsp) {
    if (err) {
      logger.error(err);
      return;
    }
    let line = rsp.message;
    total++;
    logger.info('download %s, total %d', line, total);
    try {
      fs.mkdirSync(`./out/${line[0]}/${line}`, {recursive: true});
      await pipeline(
        got.stream(`${baseUrl}${sha1Result(line)}/0.pict`),
        fs.createWriteStream(`./out/${line[0]}/${line}/0.jpg`)
      );

      await pipeline(
        got.stream(`${baseUrl}${sha1Result(line)}/1.pict`),
        fs.createWriteStream(`./out/${line[0]}/${line}/1.jpg`)
      );

      await pipeline(
        got.stream(`${baseUrl}${sha1Result(line)}/2.pict`),
        fs.createWriteStream(`./out/${line[0]}/${line}/2.jpg`)
      );

      await pipeline(
        got.stream(`${baseUrl}${sha1Result(line)}/3.pict`),
        fs.createWriteStream(`./out/${line[0]}/${line}/3.jpg`)
      );
    } catch (error) {
      // logger.error(error);
      rimraf(`./out/${line[0]}/${line}`, error => {
        if (error) {
          logger.error(error);
        }
      });
    }
    download();
  });
}
logger.info("字典图片抓取");
setTimeout(download, 1000);
