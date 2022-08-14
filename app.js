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
        let string_rec='';
        for (const page in readResults) {
          if (readResults.length > 1) {
            string_rec += `==== Page: ${page}`;
          }
          const result = readResults[page];
          if (result.lines.length) {
            for (const line of result.lines) {
              string_rec += line.words.map(w => w.text).join(' ');
            }
          }
          else { string_rec += 'No recognized text.'; }
        }
        return string_rec;
      }

// Perform read and await the result from local file
async function readTextFromLocal(client, path, res) {
  let post_successful = true;
  let result_post = await client.readInStream(()=> createReadStream(path))
    .then((result)=>{
      return result;
    })
    .catch((err)=>{
      res.render('failed');
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
      const textFound = printRecText(read_result.analyzeResult.readResults);
      console.log(textFound);
      res.render('results', {textFound: textFound, imgPath: path});
      break;
    }
    else if(read_result.status == 'failed'){
      res.render('failed');
      break;
    }
    await delay(1000);
  }
}

app = express();
app.use(express.urlencoded({extended: true}));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/',(req, res)=>{
  res.render('index');
})

app.post('/', upload.single("im_file"), (req,res)=>{
  console.log(`\n${req.method} ${req.url}`);
  console.log(req.headers);
  console.log(req.body);
  console.log(req.file);

  fs.copyFile(req.file.path, `public/${ req.file.path }`,(err)=>{
    if (err){throw err;}
    console.log(`succesful copy to ${ req.file.path }`)
  })

  readTextFromLocal(cvClient, req.file.path, res);

})

app.get('/results', (req,res)=>{
  res.render('results', {textFound: 'No file selected', imgPath: 'no image',});
})

app.get('/contact', (req,res)=>{
  res.render('contact');
})

app.listen(process.env.PORT || 3000, ()=>{
  console.log("Server starts on port 3000");
})
