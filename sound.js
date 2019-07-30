// 下载的单词按照目录数存在，通过 http://www.yingyudanci.com/voicefile/test.mp3 下载语音
const fs = require('fs');
const path = require('path');
const got = require("got");
const stream = require("stream");
const {
    promisify
} = require("util");
const pipeline = promisify(stream.pipeline);

const baseUrl = `http://www.yingyudanci.com/voicefile`;

let chars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

for (let index = 0; index < chars.length; index++) {
    const char = chars[index];
    let root = path.join(__dirname, 'out', char);
    console.log(root);
    if( fs.existsSync(root)){
        let words = fs.readdirSync(root);
        for (let index = 0; index < words.length; index++) {
            const word = words[index];
            if (word.startsWith('.')) {
                continue;
            }
            let url = `${baseUrl}/${word}.mp3`;
            console.log(url);
    
            pipeline(
                got.stream(url),
                fs.createWriteStream(`${root}/${word}/${word}.mp3`),
                (err => {
                    if (err) {
                        console.error('Pipeline failed.', err);
                    } else {
                        console.log('Pipeline succeeded.');
                    }
                })
            );   
        }
    }
}
