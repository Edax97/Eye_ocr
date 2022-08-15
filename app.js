const express = require('express');
const https = require('https');
const fs = require('fs');
const sleep = require('util').promisify(setTimeout);
const ComputerVisionClient = require('@azure/cognitiveservices-computervision').ComputerVisionClient;
const ApiKeyCredentials = require('@azure/ms-rest-js').ApiKeyCredentials;

const createReadStream = require('fs').createReadStream;

// So we can upload the images
const multer = require('multer');
const upload = multer({dest: "uploads/"})

/*delay utility*/
const delay = ms => new Promise(res => setTimeout(res, ms));

/*Read text files*/
const readFileLines = filename =>{
  return fs.readFileSync(filename).toString('UTF8').split('\n');
}

/*Create your own file authentication. Then extract the key and endpoint.
key API
endpoint of API
*/
const [key, endpoint] = readFileLines(`${ __dirname }/authentication`);


const cvClient = new ComputerVisionClient(
  new ApiKeyCredentials({ inHeader: {'Ocp-Apim-Subscription-Key': key,} }), endpoint
)

/*Print Text from Read result into array*/
function printRecText(readResults) {
        let ocr_lines=[];
        for (const page in readResults) {

          if (readResults.length > 1) {
            ocr_lines.push(`==== Page: ${page}`);
          }
          const result = readResults[page];
          if (result.lines.length) {
            for (const line of result.lines) {
              ocr_lines.push(line.words.map(w => w.text).join(' '));
            }
          }
          else { ocr_lines.push('No recognized text.'); }
        }
        return ocr_lines;
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
  res.render('results', {textFound: ['No file selected'], imgPath: 'no image',});
})

app.get('/contact', (req,res)=>{
  res.render('contact');
})

app.listen(process.env.PORT || 3000, ()=>{
  console.log("Server starts on port 3000");
})
