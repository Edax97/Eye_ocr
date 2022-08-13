const express = require('express');
const https = require('https');
const fs = require('fs');
const sleep = require('util').promisify(setTimeout);
const ComputerVisionClient = require('@azure/cognitiveservices-computervision').ComputerVisionClient;
const ApiKeyCredentials = require('@azure/ms-rest-js').ApiKeyCredentials;

const createReadStream = require('fs').createReadStream;

// So we can upload files
const multer = require('multer');
const upload = multer({dest: "uploads/"})

/*Authenticate*/
const key = '0290ba551cd140b183ad2751308903f9';
const endpoint = 'https://talaveraocr.cognitiveservices.azure.com/'
const cvClient = new ComputerVisionClient(
  new ApiKeyCredentials({ inHeader: {'Ocp-Apim-Subscription-Key': key,} }), endpoint
)
/**/
const delay = ms => new Promise(res => setTimeout(res, ms));

/*Print Text from Read result*/
function printRecText(readResults) {
        console.log('Recognized text:');
        for (const page in readResults) {
          if (readResults.length > 1) {
            console.log(`==== Page: ${page}`);
          }
          const result = readResults[page];
          if (result.lines.length) {
            for (const line of result.lines) {
              console.log(line.words.map(w => w.text).join(' '));
            }
          }
          else { console.log('No recognized text.'); }
        }
      }

// Perform read and await the result from local file
async function readTextFromLocal(client, path, res) {
  let post_successful = true;
  let result_post = await client.readInStream(()=> createReadStream(path))
    .then((result)=>{
      return result;
    })
    .catch((err)=>{
      res.sendFile(`${ __dirname }/failed.html`);
      post_successful = false;
    });
  if (!post_successful){ return 0; }

  // Operation ID is last path segment of operationLocation (a URL)
  let operation = result_post.operationLocation.split('/').slice(-1)[0];
  console.log(operation);

  // Wait for read recognition to complete
  while (true) {
    const read_result = await client.getReadResult(operation);
    console.log("STATUS", read_result.status);
    if (read_result.status == 'succeeded'){
      console.log(printRecText(read_result.analyzeResult.readResults));
      res.sendFile(`${ __dirname }/results.html`);
      break;
    }
    else if(read_result.status == 'failed'){
      res.sendFile(`${ __dirname }/failed.html`);
      break;
    }
    await delay(1000);
  }
}

app = express();
app.use(express.urlencoded({extended: true}));
app.use(express.static('public'));

app.get('/',(req, res)=>{
  res.sendFile(`${ __dirname }/index.html`);
})

app.post('/', upload.single("im_file"), (req,res)=>{
  console.log(`\n${req.method} ${req.url}`);
  console.log(req.headers);
  console.log(req.body);
  console.log(req.file);

  readTextFromLocal(cvClient, req.file.path, res);

})

app.get('/results', (req,res)=>{
  res.sendFile(`${ __dirname }/results.html`);
})

app.get('/contact', (req,res)=>{
  res.sendFile(`${ __dirname }/contact.html`);
})

app.listen(process.env.PORT || 3000, ()=>{
  console.log("Server starts on port 3000");
})
